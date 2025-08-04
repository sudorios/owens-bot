const Punto = require('../models/Punto');

const CHUNKSIZE = 15;

async function sendRanking(message, ranking, title = 'Ranking', positionField = 'lastPosition') {
    const rankingLines = ranking.map((p, i) => {
        const currentPos = i + 1;
        const lastPos = p[positionField]; 

        let trendEmoji = '➡️';
        let positionChange = '-'; 

        if (lastPos !== null && lastPos !== undefined) {
            if (currentPos < lastPos) {
                trendEmoji = '⬆️'; 
                positionChange = `+${lastPos - currentPos}`;  
            } else if (currentPos > lastPos) {
                trendEmoji = '⬇️';  
                positionChange = `-${currentPos - lastPos}`; 
            }
        }

        return `${currentPos}. ${p.username} ${p.score} pt${p.score !== 1 ? 's' : ''} ${trendEmoji} ${positionChange}`;
    });

    for (let i = 0; i < ranking.length; i++) {
        await Punto.updateOne(
            { _id: ranking[i]._id },
            { 
                position: i + 1  
            }
        );
    }

    for (let i = 0; i < rankingLines.length; i += CHUNKSIZE) {
        const chunk = rankingLines.slice(i, i + CHUNKSIZE).join('\n');
        if (i === 0) {
            await message.channel.send(`**${title}**\n${chunk}`);
        } else {
            await message.channel.send(chunk);
        }
    }
}

module.exports = { sendRanking };
