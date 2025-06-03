const Punto = require('../../models/Punto');
const ActiveSeason = require('../../models/ActiveSeason');
const { getSeasonIndex } = require('../../utils/seasonUtils');
const { sendRanking } = require('../../utils/rankingUtils');

module.exports = async (message) => {
    const activeSeasonDoc = await ActiveSeason.findOne({ guildID: message.guild.id });
    if (!activeSeasonDoc) {
        return message.reply('❗ No active season set. Use `?finishSeason <seasonName>` to start one.');
    }

    const seasonActual = activeSeasonDoc.currentSeason;
    const seasonIndex = getSeasonIndex(seasonActual);

    const usuarios = await Punto.find({ guildID: message.guild.id });

    const ranking = usuarios
        .map(u => ({
            _id: u._id,
            userID: u.userID,
            username: u.username,
            score: u.score[seasonIndex] || 0,
            lastPosition: u.lastPosition || null
        }))
        .sort((a, b) => b.score - a.score);

    if (ranking.length === 0 || ranking.every(r => r.score === 0)) {
        return message.reply(`📉 No scores yet for season **${seasonActual}**.`);
    }

    await sendRanking(message, ranking, `Ranking - Season: ${seasonActual}`, 'lastPosition');
};
