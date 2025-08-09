const Punto = require('../../models/Punto');
const { sendRanking } = require('../../src/utils/rankingUtils');

module.exports = async (message) => {
    const documentos = await Punto.find({ guildID: message.guild.id });

    if (documentos.length === 0) {
        return message.reply('No global scores recorded yet.');
    }

    const ranking = documentos
        .map(p => {
            const total = Array.isArray(p.score) ? p.score.reduce((sum, val) => sum + (val || 0), 0) : 0;
            return {
                _id: p._id,
                userID: p.userID,
                username: p.username,
                score: total,
                lastPosition: p.lastPosition || null,  
                position: p.position || null  
            };
        })
        .sort((a, b) => b.score - a.score); 

    for (let i = 0; i < ranking.length; i++) {
        ranking[i].position = i + 1;  
    }

    if (ranking.every(r => r.score === 0)) {
        return message.reply('No global points yet.');
    }

    for (let i = 0; i < ranking.length; i++) {
        await Punto.updateOne(
            { _id: ranking[i]._id },
            { 
                position: ranking[i].position  
            }
        );
    }

    await sendRanking(message, ranking, 'Global Ranking', 'lastPosition');
};
