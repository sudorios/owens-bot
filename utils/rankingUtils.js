const ActiveSeason = require('../models/ActiveSeason');

const CHUNKSIZE = 15;

async function sendRanking(message, ranking, title = 'Ranking', positionField = 'lastPosition') {
    const rankingLines = ranking.map((p, i) => {
        const currentPos = i + 1;
        const lastPos = p[positionField];

        let trendEmoji = '➡️';
        if (lastPos !== null && lastPos !== undefined) {
            if (currentPos < lastPos) trendEmoji = '⬆️';
            else if (currentPos > lastPos) trendEmoji = '⬇️';
        }

        return `${p.username} ${p.score} pt${p.score !== 1 ? 's' : ''} ${trendEmoji}`;
    });

    for (let i = 0; i < ranking.length; i++) {
        ranking[i][positionField] = i + 1;
        await ranking[i].save();
    }

    for (let i = 0; i < rankingLines.length; i += CHUNKSIZE) {
        const chunk = rankingLines.slice(i, i + CHUNKSIZE).join('\n');
        await message.channel.send(`📊 **${title}**\n${chunk}`);
    }
}

async function getOrCreateActiveSeason(guildID) {
    let activeSeason = await ActiveSeason.findOne({ guildID });
    if (!activeSeason) {
        activeSeason = await ActiveSeason.create({ guildID, currentSeason: 'global' });
    }
    return activeSeason.currentSeason;
}


module.exports = { sendRanking, getOrCreateActiveSeason };
