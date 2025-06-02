const mongoose = require('mongoose');

const seasonWinnerSchema = new mongoose.Schema({
    guildID: { type: String, required: true },
    season: { type: String, required: true },
    winner: { type: String, required: true },
    score: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SeasonWinner', seasonWinnerSchema);
