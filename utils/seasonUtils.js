const ActiveSeason = require('../models/ActiveSeason');

function getSeasonIndex(season) {
    if (!season || season === 'global') return 0;
    const match = season.match(/^global(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
}

function getSeasonNameByIndex(index) {
    return index === 0 ? 'global' : `global${index}`;
}

async function getOrCreateActiveSeason(guildID) {
    let activeSeason = await ActiveSeason.findOne({ guildID });
    if (!activeSeason) {
        activeSeason = await ActiveSeason.create({ guildID, currentSeason: 'global' });
    }
    return activeSeason.currentSeason;
}

module.exports = { getSeasonIndex, getSeasonNameByIndex, getOrCreateActiveSeason };
