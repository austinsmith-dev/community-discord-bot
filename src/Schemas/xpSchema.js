const { model, Schema } = require("mongoose");

const xpSchema = new Schema({
    GuildID: { type: String, required: true },
    UserID: { type: String, required: true },
    XP: { type: Number, default: 0 },
    Level: { type: Number, default: 1 },
});

xpSchema.index({ GuildID: 1, UserID: 1 }, { unique: true });

module.exports = model("UserXP", xpSchema);