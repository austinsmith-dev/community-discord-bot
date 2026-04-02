const { Schema, model } = require('mongoose');

const PerformanceMonitorSchema = new Schema({
    botId: {
        type: String,
        required: true,
        unique: true
    },
    messageId: {
        type: String,
        required: true
    },
});

module.exports = model('PerformanceMonitorState', PerformanceMonitorSchema);