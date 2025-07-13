const Punto = require('../models/Punto');

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

        return `${currentPos}. ${p.username} ${p.score} pt${p.score !== 1 ? 's' : ''} ${trendEmoji}`;
    });

    for (let i = 0; i < ranking.length; i++) {
        await Punto.updateOne(
            { _id: ranking[i]._id },
            { [positionField]: i + 1 }
        );
    }

    for (let i = 0; i < rankingLines.length; i += CHUNKSIZE) {
        const chunk = rankingLines.slice(i, i + CHUNKSIZE).join('\n');
        if (i === 0) {
            await message.channel.send(` **${title}**\n${chunk}`);
        } else {
            await message.channel.send(chunk);
        }
    }
}

module.exports = { sendRanking };
