const { model, Schema } = require('mongoose');
 
const roleButtonSchema = new Schema({
    ButtonLabel: { type: String, required: true },
    RoleID: { type: String, required: true },
    EmojiID: { type: String, required: false }, // Store the ID of the custom emoji
    CustomID: { type: String, required: true }, // e.g., 'rr-roleID' for easy lookup
});

const roleSchema = new Schema({
    Guild: { type: String, required: true, unique: true },
    ChannelID: { type: String, required: true },
    MessageID: { type: String, required: true, unique: true },
    Title: String,
    Description: String,
    Image: String,
    Thumbnail: String,
    
    Buttons: [roleButtonSchema]
});
 
module.exports = model('roleSchema', roleSchema);
