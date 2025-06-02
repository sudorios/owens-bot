const { Schema, model } = require('mongoose');

const ActiveSeasonSchema = new Schema({
    guildID: { type: String, required: true, unique: true },
    currentSeason: { type: String, required: true }
});

module.exports = model('ActiveSeason', ActiveSeasonSchema);
