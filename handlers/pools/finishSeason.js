const Punto = require('../../models/Punto');
const SeasonWinner = require('../../models/seasonWinner');
const ActiveSeason = require('../../models/ActiveSeason');
const { getSeasonIndex, getSeasonNameByIndex } = require('../../utils/seasonUtils');

module.exports = async (message) => {
    const guildID = message.guild.id;

    let activeSeasonDoc = await ActiveSeason.findOne({ guildID });
    if (!activeSeasonDoc) {
        activeSeasonDoc = await ActiveSeason.create({ guildID, currentSeason: 'global' });
    }

    const seasonActual = activeSeasonDoc.currentSeason;
    const seasonIndex = getSeasonIndex(seasonActual);

    const usuarios = await Punto.find({ guildID });

    const ranking = usuarios
        .map(u => ({
            username: u.username,
            score: u.score[seasonIndex] || 0
        }))
        .sort((a, b) => b.score - a.score);

    if (ranking.length === 0 || ranking.every(r => r.score === 0)) {
        return message.reply(`📉 No scores found for season **${seasonActual}**.`);
    }

    const winner = ranking[0];

    await SeasonWinner.create({
        guildID,
        season: seasonActual,
        winner: winner.username,
        score: winner.score
    });

    const nuevaSeasonIndex = seasonIndex + 1;
    const nuevaSeasonName = getSeasonNameByIndex(nuevaSeasonIndex);

    await ActiveSeason.findOneAndUpdate(
        { guildID },
        { currentSeason: nuevaSeasonName },
        { upsert: true }
    );

    message.channel.send(
        `🏁 Season **${seasonActual}** ended!\n` +
        `🏆 Winner: **${winner.username}** with ${winner.score} pts.\n` +
        `📢 New season **${nuevaSeasonName}** has started.`
    );
};
