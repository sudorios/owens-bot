const Punto = require('../../models/Punto');
const ActiveSeason = require('../../models/ActiveSeason');
const { sendRanking } = require('../../utils/rankingUtils');

module.exports = async (message) => {
    const activeSeasonDoc = await ActiveSeason.findOne({ guildID: message.guild.id });
    if (!activeSeasonDoc) {
        return message.reply('❗ No active season set. Use `?finishSeason <seasonName>` to start one.');
    }
    const seasonActual = activeSeasonDoc.currentSeason;

    const ranking = await Punto.find({ guildID: message.guild.id, season: seasonActual }).sort({ score: -1 });
    if (ranking.length === 0) {
        return message.reply(`📉 No scores yet for season **${seasonActual}**.`);
    }

    await sendRanking(message, ranking, `Ranking - Season: ${seasonActual}`, 'lastPosition');
};
