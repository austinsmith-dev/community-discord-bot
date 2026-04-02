const UserXP = require('../Schemas/xpSchema');

/**
 * Calculates level based on total XP.
 * 3000 XP per level
 */
const getLevel = (xp) => Math.floor(xp / 3000) + 1;

/**
 * Calculates total XP required to reach a specific level.
 */
const getNextLevelXP = (level) => (level) * 3000;

module.exports = {
    getLevel,
    getNextLevelXP,

    async getUserXP(guildId, userId) {
        const data = await UserXP.findOne({ GuildID: guildId, UserID: userId });
        return data ? data.XP : 0;
    },

    async addUserXP(guildId, userId, amount) {
        const data = await UserXP.findOneAndUpdate(
            { GuildID: guildId, UserID: userId },
            { $inc: { XP: amount } },
            { upsert: true, new: true }
        );

        const oldLevel = data.Level;
        const newLevel = getLevel(data.XP);

        if (newLevel > oldLevel) {
            data.Level = newLevel;
            await data.save();
            return { newLevel, oldLevel, leveledUp: true };
        }

        return { newLevel, oldLevel, leveledUp: false };
    },

    async setUserXP(guildId, userId, amount) {
        await UserXP.findOneAndUpdate(
            { GuildID: guildId, UserID: userId },
            { XP: Math.max(0, amount), Level: getLevel(amount) },
            { upsert: true }
        );
    },

    async getLeaderboard(guildId) {
        return await UserXP.find({ GuildID: guildId })
            .sort({ XP: -1 })
            .limit(10);
    }
};