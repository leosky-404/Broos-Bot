const { Schema, model } = require('mongoose');

const economySchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    bank: {
        type: Number,
        default: 0,
    },
    cash: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
    inventory: {
        type: Array,
        default: [],
    },
    lastDaily: {
        type: Date,
        default: null,
    },
    lastWorked: {
        type: Date,
        default: null,
    },
    lastCollected: {
        type: Date,
        default: null,
    },
    lastRobbed: {
        type: Date,
        default: null,
    }
});

module.exports = model('economy', economySchema);