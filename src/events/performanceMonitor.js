const { EmbedBuilder, WebhookClient } = require('discord.js');
const sysinfo = require('systeminformation');
const v8 = require('v8');
const PerformanceMonitorSchema = require('../Schemas/performanceMonitorSchema');

// Configuration
const INTERVAL = 60000; 
const RAM_THRESHOLD = 50; 
const HEAP_THRESHOLD = 85; 

const PERFORMANCE_WEBHOOK_URL = process.env.PERFORMANCE_WEBHOOK_URL;
const OWNER_ID = process.env.OWNER; 
const BOT_NAME = process.env.NODE_ENV || 'Development';

const COLORS = {
    CRITICAL: 0xFF0000,
    WARNING: 0xFFA500,
    NORMAL: 0x00FF00,
};

const safeToFixed = (value, decimals = 2) => {
    return value !== null && typeof value !== 'undefined' && !isNaN(value) ? value.toFixed(decimals) : "N/A";
};

/**
 * Logic to ensure we only ever have ONE message per bot in the channel.
 */
async function updatePerformanceMessage(client, payload) {
    const webhookClient = new WebhookClient({ url: PERFORMANCE_WEBHOOK_URL });
    
    let data = await PerformanceMonitorSchema.findOne({ botId: client.user.id });
    
    if (data && data.messageId) {
        try {
            await webhookClient.editMessage(data.messageId, payload);
            return;
        } catch (error) {
            console.warn(`[Perf Monitor] Could not edit message ${data.messageId}. Likely deleted. Resetting...`);
            try {
                await webhookClient.deleteMessage(data.messageId).catch(() => {});
            } catch (e) {}
        }
    }

    const sentMessage = await webhookClient.send(payload);
    
    await PerformanceMonitorSchema.findOneAndUpdate(
        { botId: client.user.id },
        { messageId: sentMessage.id },
        { upsert: true, new: true }
    );
}

async function executePerformanceCheck(client) {
    if (!PERFORMANCE_WEBHOOK_URL) return;

    try {
        const osMem = await sysinfo.mem().catch(() => ({}));
        const heapStats = v8.getHeapStatistics();

        const totalMemGB = osMem.total ? osMem.total / Math.pow(1024, 3) : 0;
        const usedMemGB = osMem.used ? osMem.used / Math.pow(1024, 3) : 0;
        const memUsagePercent = osMem.total > 0 ? (osMem.used / osMem.total) * 100 : 0;

        const heapUsedGB = heapStats.used_heap_size / Math.pow(1024, 3);
        const heapLimitBytes = heapStats.heap_size_limit;
        const heapTotalGB = heapLimitBytes / Math.pow(1024, 3);
        const heapUsagePercent = (heapStats.used_heap_size / heapLimitBytes) * 100;

        let isCritical = memUsagePercent > RAM_THRESHOLD || heapUsagePercent > HEAP_THRESHOLD;
        let color = isCritical ? COLORS.CRITICAL : (memUsagePercent > RAM_THRESHOLD * 0.7 ? COLORS.WARNING : COLORS.NORMAL);

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${BOT_NAME} Performance Report`)
            .setColor(color)
            .setDescription(`**Status:** ${isCritical ? 'CRITICAL' : 'Operational'}\n`) //${leakMessage}
            .addFields(
                {
                    name: `💾 System RAM Used (Threshold: ${RAM_THRESHOLD}%)`,
                    value: `**${safeToFixed(usedMemGB)} GB** / ${safeToFixed(totalMemGB)} GB\n*(${safeToFixed(memUsagePercent)}%)*`,
                    inline: true
                },
                {
                    name: `🚀 Process Heap Used (Fixed Limit: ${HEAP_THRESHOLD}%)`,
                    value: `**${safeToFixed(heapUsedGB)} GB** / ${safeToFixed(heapTotalGB)} GB\n*(${safeToFixed(heapUsagePercent)}%)*`,
                    inline: true
                },
                {
                    name: '📦 Cache Size Heuristics',
                    value: `Users: \`${client.users.cache.size}\`\nGuilds: \`${client.guilds.cache.size}\`\nCommands: \`${client.commands.size}\``,
                    inline: true
                },
                {
                    name: '🌐 Discord Latency',
                    value: `Heartbeat: \`${client.ws.ping}ms\``,
                    inline: true
                },
                {
                    name: '⏱️ Uptime',
                    value: `<t:${Math.floor(client.readyTimestamp / 1000)}:R>`,
                    inline: true
                },
                {
                    name: '🗓️ Last Checked',
                    value: `<t:${Math.floor(Date.now() / 1000)}:T>`,
                    inline: true
                }
            )
            .setTimestamp();

        const payload = {
            content: isCritical && OWNER_ID ? `<@${OWNER_ID}> 🚨 **CRITICAL PERF ALERT**` : '',
            embeds: [embed]
        };

        await updatePerformanceMessage(client, payload);

    } catch (error) {
        console.error('[Perf Monitor] Critical Failure:', error);
    }
}

module.exports = {
    name: 'performanceMonitor',
    once: false,
    execute(client) {
        executePerformanceCheck(client);
        setInterval(() => executePerformanceCheck(client), INTERVAL);
    }
};