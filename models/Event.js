const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventSchema = new Schema({
    createdAt: Date,
    city: String,
    rest: {
        type: String,
        required: true,
        unique: true
    },
    going: {
        type: Array,
        required: true
    }
})

const Event = module.exports = mongoose.model("Event", eventSchema);