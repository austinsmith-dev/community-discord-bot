const { WebhookClient, EmbedBuilder, Events, DiscordAPIError, } = require("discord.js");
const Bottleneck = require('bottleneck');

class DiscordBotErrorHandler {
  constructor(config) {
     this.config = {
        webhookUrl: process.env.FALLBACK_WEBHOOK_URL,
        environment: process.env.NODE_ENV || 'development',
        maxCacheSize: 100,
        retryAttempts: 3,
        retryDelay: 1000,
        rateLimit: { maxConcurrent: 1, minTime: 2000 },
        clientName: process.env.BOTNAME,
        ...config,
     };

     if (!process.env.ERROR_WEBHOOK_URL) {
        console.warn(
           '⚠️ [Error Handler] ERROR_WEBHOOK_URL not set. Errors will be logged to console only.'
        );
        this.webhookClient = null;
     } else {
        this.webhookClient = new WebhookClient({
           url: process.env.ERROR_WEBHOOK_URL,
        });
     }

     this.errorCache = new Map();
     this.errorQueue = [];
     this.processingQueue = false;

     this.limiter = new Bottleneck(this.config.rateLimit);
  }

  /**
   * Initializes the handler with the Discord client and sets up event listeners.
   * @param {import('discord.js').Client} client 
   */
  initialize(client) {
     this.client = client;
     if (!this.client) {
        console.error('[Error Handler] Discord client is not provided');
        return;
     }
     this.config.clientName = this.client.user?.username || this.config.clientName;
     this.setupEventListeners();
     
     this.client.on(Events.Error, (error) => this.handleError(error, { type: 'clientError' }));
     this.client.on(Events.Warn, (info) => this.handleError(new Error(info), { type: 'clientWarning', severity: 'Warning' }));
     
     process.on('unhandledRejection', (reason) => this.handleError(reason, { type: 'unhandledRejection' }));
     process.on('uncaughtException', (error) => {
        this.handleError(error, { type: 'uncaughtException' });
     });
     this.client.ws.on('error', this.handleWebSocketError.bind(this));
  }

  setupEventListeners() {
    // Event listeners are initialized in the initialize method.
  }

  handleWebSocketError(error) {
     this.handleError(error, { type: 'webSocketError' });
  }

  async handleError(error, context = {}) {
     const errObject = error instanceof Error ? error : new Error(String(error));
     
     console.error(`[CRASH HANDLER] ${context.type || 'Error'} detected:`, errObject);

     try {
        const errorDetails = await this.formatErrorDetails(errObject, context);
        await this.processError(errorDetails);
     } catch (err) {
        console.error('Failed to handle error:', err);
     }
  }

  cleanStackTrace(error, limit = 10) {
     const stack = (error.stack || '')
        .split('\n')
        .filter(
           (line) =>
              !line.includes('node_modules') && !line.includes('timers.js')
        )
        .slice(0, limit)
        .join('\n');

     return stack;
  }
  
  async captureContext(providedContext) {
     const guildContext = await this.getGuildContext(providedContext.guildId);
     const userContext = await this.getUserContext(providedContext.userId);
     return { ...providedContext, guild: guildContext, user: userContext };
  }

  async getGuildContext(guildId) {
     if (guildId && this.client) {
        try {
           const guild = await this.client.guilds.fetch(guildId);
           return {
              id: guild.id,
              name: guild.name,
              memberCount: guild.memberCount,
           };
        } catch (error) {
           return null;
        }
     }
     return null;
  }

  async getUserContext(userId) {
     if (userId && this.client) {
        try {
           const user = await this.client.users.fetch(userId);
           return { id: user.id, tag: user.tag, createdAt: user.createdAt };
        } catch (error) {
           return null;
        }
     }
     return null;
  }

  determineErrorCategory(error) {
     const message = error.message.toLowerCase();
     if (error instanceof DiscordAPIError) return 'Discord API Error';
     if (message.includes('permission')) return 'Permission Error';
     if (message.includes('rate limit')) return 'Rate Limit Error';
     if (message.includes('database') || message.includes('mongo')) return 'Database Error';
     if (message.includes('not found')) return 'Not Found Error';
     return 'Runtime Error';
  }

  determineErrorSeverity(error) {
     if (error instanceof DiscordAPIError) {
        if ([50013, 50001].includes(error.code)) return 'Critical';
        return 'Moderate';
     }
     if (error instanceof TypeError) return 'Warning';
     if (error.message.includes('rate limit')) return 'Major';
     return 'Moderate';
  }

  async capturePerformanceMetrics() {
     if (!this.client) return {};

     const memoryUsage = process.memoryUsage();
     return {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        guildCount: this.client.guilds?.cache?.size || 0,
        userCount: this.client.users?.cache?.size || 0,
     };
  }

  async processError(errorDetails) {
     const errorKey = `${errorDetails.category}:${errorDetails.message}`;
     
     if (this.errorCache.has(errorKey)) {
        this.updateErrorFrequency(errorKey);
     } else {
        this.errorCache.set(errorKey, { count: 1, lastOccurrence: new Date() });
        this.errorQueue.push(errorDetails);
     }

     if (!this.processingQueue) {
        this.processingQueue = true;
        await this.processErrorQueue();
     }
  }

  async processErrorQueue() {
     while (this.errorQueue.length > 0) {
        const errorDetails = this.errorQueue.shift();
        if (this.webhookClient) {
            await this.limiter.schedule(() => this.sendErrorToWebhook(errorDetails));
        }
     }
     this.processingQueue = false;
  }

async sendErrorToWebhook(errorDetails) {
     for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
        try {
            const stackTraceValue = errorDetails.stackTrace || 'No stack trace available';
            const contextValue = JSON.stringify(errorDetails.context, null, 2) || '{}';
            const performanceValue = JSON.stringify(await this.capturePerformanceMetrics(), null, 2) || '{}';
            
            const specialErrors = ["other side closed", "Connect Timeout Error"];
            const errorMessage = errorDetails.message || '';
            
            const isSpecialError = specialErrors.some(specialError => 
               errorMessage.toLowerCase().includes(specialError.toLowerCase())
            );

            let contentMessage;
            
            if (isSpecialError) {
               contentMessage = "Chef I see you are downloading things again";
            } else {
               contentMessage = `<@${process.env.OWNER}> New **${errorDetails.severity}** error reported in **${errorDetails.environment.environment}**`;
            }

            const embed = new EmbedBuilder()
               .setColor(this.getColorForSeverity(errorDetails.severity))
               .setTitle(`[${errorDetails.environment.clientName}] ${errorDetails.category} - ${errorDetails.severity}`)
               .setDescription(`**Message:** \`${errorDetails.message || 'Error message not found'}\``)
               .addFields(
                  {
                     name: 'Stack Trace',
                     value: `\`\`\`js\n${stackTraceValue.substring(0, 950)}\n\`\`\``, 
                     inline: false,
                  },
                  {
                     name: 'Context',
                     value: `\`\`\`json\n${contextValue.substring(0, 950)}\n\`\`\``,
                     inline: true,
                  },
                  {
                     name: 'Performance',
                     value: `\`\`\`json\n${performanceValue.substring(0, 950)}\n\`\`\``,
                     inline: true,
                  }
               )
               .setTimestamp(new Date(errorDetails.timestamp))
               .setFooter({
                 text: `Env: ${errorDetails.environment.nodeVersion} | Count: ${this.errorCache.get(`${errorDetails.category}:${errorDetails.message}`)?.count || 1}`,
               });

           await this.webhookClient.send({
              content: contentMessage,
              embeds: [embed],
           });
           return;
        } catch (err) {
           console.error(
              `[Error Handler] Failed to send error to webhook (attempt ${attempt + 1}):`,
              err
           );
           if (attempt < this.config.retryAttempts - 1) {
              await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
           }
        }
     }
  }

  getColorForSeverity(severity) {
     const colors = {
        Minor: 0xffa500,
        Moderate: 0xff4500,
        Major: 0xff0000,
        Critical: 0x8b0000,
        Warning: 0xffff00,
     };
     return colors[severity] || 0x000000;
  }

  updateErrorFrequency(errorKey) {
     const errorInfo = this.errorCache.get(errorKey);
     errorInfo.count += 1;
     errorInfo.lastOccurrence = new Date();
     this.errorCache.set(errorKey, errorInfo);
  }

  async formatErrorDetails(error, context) {
    const fullContext = await this.captureContext(context);
    return {
      message: error.message || 'Unknown error',
      stackTrace: error.stack || 'No stack trace available',
      category: this.determineErrorCategory(error),
      severity: this.determineErrorSeverity(error),
      context: fullContext,
      performance: await this.capturePerformanceMetrics(),
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        clientName: this.config.clientName,
        environment: this.config.environment,
      },
    };
  }
}

/**
 * Global function to initialize the error handler.
 * @param {import('discord.js').Client} client 
 * @param {object} config 
 */
const errorHandler = (client, config = {}) => {
  const handler = new DiscordBotErrorHandler(config);
  handler.initialize(client);
};

module.exports = { errorHandler };