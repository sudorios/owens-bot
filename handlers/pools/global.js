const Punto = require('../../models/Punto');
const { sendRanking } = require('../../utils/rankingUtils');

module.exports = async (message) => {
    const documentos = await Punto.find({ guildID: message.guild.id });

    if (documentos.length === 0) {
        return message.reply('📉 No global scores recorded yet.');
    }

    const ranking = documentos
        .map(p => {
            const total = Array.isArray(p.score) ? p.score.reduce((sum, val) => sum + (val || 0), 0) : 0;
            return {
                _id: p._id,
                userID: p.userID,
                username: p.username,
                score: total,
                lastPositionGlobal: p.lastPositionGlobal || null
            };
        })
        .sort((a, b) => b.score - a.score);

    if (ranking.every(r => r.score === 0)) {
        return message.reply('📉 No global points yet.');
    }

    await sendRanking(message, ranking, '📊 Global Ranking', 'lastPositionGlobal');
};
