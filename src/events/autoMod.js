const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const config = require('../autoMod.json');

const staffNotify = require('./staffNotify');

const messageCache = new Map();
const timeoutSet = new Set();
const automodWarnings = new Map();

module.exports = {
    name: "messageCreate",

    async execute(message) {
        if (!message.guild || message.author.bot) return;

        if (message.member.roles.cache.has(process.env.STAFF_ROLE_ID)) return;

        const removeSymbols = (str) => {
            return str.replace(/[!#$%^&*()_+\[\]{}\\|;:'",.<>?/`~=-]/g, '').toLowerCase();
        };

        const now = Date.now();
        const userMessages = messageCache.get(message.author.id) || [];
        userMessages.push({ timestamp: now, message });

        const recentMessages = userMessages.filter(msg => now - msg.timestamp < 7000);
        messageCache.set(message.author.id, recentMessages);

        if (recentMessages.length > 3 && !timeoutSet.has(message.author.id)) {
            timeoutSet.add(message.author.id);

            try {
                await message.member.timeout(60000, 'Spamming messages');
            } catch (error) {
                console.error(`Failed to timeout user: ${message.author.id}`, error);
            }

            const embed = new EmbedBuilder()
                .setTitle("Auto Moderation System")
                .setColor(process.env.SERVER_COLOR)
                .setTimestamp()
                .setThumbnail('attachment://bot_icon.jpg')
                .setDescription(`${message.author}, you have been timed out for spamming. Please refrain from sending messages too quickly.`);

            const sentMessage = await message.channel.send({
                embeds: [embed],
                files: [new AttachmentBuilder('./assets/bot_icon.jpg')],
                allowedMentions: {
                    users: [message.author.id],
                    roles: [process.env.STAFF_ROLE_ID]
                }
            });

            setTimeout(() => {
                timeoutSet.delete(message.author.id);  // Clear the timeout set after the timeout ends
                sentMessage.delete().catch(console.error);
            }, 60000);

            for (const msg of recentMessages) {
                try {
                    await msg.message.delete();
                } catch (error) {
                    if (error.code === 10008) {
                        console.warn(`Message already deleted: ${msg.message.id}`);
                    } else {
                        console.error(`Failed to delete message: ${msg.message.id}`, error);
                    }
                }
            }

            staffNotify.execute(message.member, { message: message, length: 600000 }, 'Spamming messages', true);
            return;
        }

        // Check for @here and @everyone explicitly
        const originalContent = message.content.toLowerCase();

        if (originalContent.includes('@here') || originalContent.includes('@everyone')) {
            await handleAutomodViolation(message, 'mentioning @here or @everyone');
            return;
        }

        // Check for automod violations in cleaned content
        const cleanedContent = removeSymbols(message.content);

        const containsFilteredWord = (messageContent, filteredWords) => {
            return filteredWords.some(filteredWord => {
                const cleanFilteredWord = removeSymbols(filteredWord);
                const regex = new RegExp(`\\b${filteredWord}\\b`, 'i');
                const combinedWordCheck = messageContent.includes(cleanFilteredWord);

                return regex.test(messageContent) || combinedWordCheck;
            });
        };

        const filteredWords = config.moderationWords.map(word => word.toLowerCase());

        const detectedInCleanedContent = containsFilteredWord(cleanedContent, filteredWords);
        const detectedInOriginalContent = containsFilteredWord(originalContent, filteredWords);

        if (detectedInCleanedContent || detectedInOriginalContent) {
            await handleAutomodViolation(message, 'content against our server rules');
        }
    }
};

// Helper function to handle automod violations
async function handleAutomodViolation(message, violationReason) {
    try {
        await message.delete();
    } catch (error) {
        if (error.code === 10008) {
            console.warn(`Message already deleted: ${message.id}`);
        } else {
            console.error(`Failed to delete message: ${message.id}`, error);
        }
    }

    const embed = new EmbedBuilder()
        .setTitle("Auto Moderation System")
        .setColor(process.env.SERVER_COLOR)
        .setTimestamp()
        .setThumbnail('attachment://bot_icon.jpg')
        .setDescription(`${message.author}, your message has been deleted as it contains ${violationReason}.`);

    const sentMessage = await message.channel.send({
        embeds: [embed],
        files: [new AttachmentBuilder('./assets/bot_icon.jpg')],
        allowedMentions: {
            users: [message.author.id],
            roles: [process.env.STAFF_ROLE_ID]
        }
    });

    setTimeout(() => {
        sentMessage.delete().catch(console.error);
    }, 10000);

    const now = Date.now();
    const userWarnings = automodWarnings.get(message.author.id) || [];
    userWarnings.push(now);
    const recentWarnings = userWarnings.filter(timestamp => now - timestamp < 3600000); // 1 hour
    automodWarnings.set(message.author.id, recentWarnings);

    if (recentWarnings.length >= 3) {
        try {
            await message.member.timeout(3600000, 'Multiple automod violations');
        } catch (error) {
            console.error(`Failed to timeout user: ${message.author.id}`, error);
        }

        const timeoutEmbed = new EmbedBuilder()
            .setTitle("Auto Moderation System")
            .setColor(process.env.SERVER_COLOR)
            .setTimestamp()
            .setThumbnail('attachment://bot_icon.jpg')
            .setDescription(`${message.author}, you have been timed out for repeated violations of our server rules. Please adhere to the guidelines.`);

        const timeoutMessage = await message.channel.send({
            embeds: [timeoutEmbed],
            files: [new AttachmentBuilder('./assets/bot_icon.jpg')],
            allowedMentions: {
                users: [message.author.id],
                roles: [process.env.STAFF_ROLE_ID]
            }
        });

        setTimeout(() => {
            timeoutMessage.delete().catch(console.error);
        }, 10000);

        staffNotify.execute(message.member, { message: message, length: 3600000 }, 'Multiple automod violations', true);
    }
}
