const Punto = require('../../models/Punto');
const { sendRanking } = require('../utils/rankingUtils');

module.exports = async (message) => {
    const ranking = await Punto.find({ guildID: message.guild.id }).sort({ score: -1 });
    if (ranking.length === 0) {
        return message.reply('📉 No global scores recorded yet.');
    }

    await sendRanking(message, ranking, 'Global Ranking', 'lastPositionGlobal');
};
