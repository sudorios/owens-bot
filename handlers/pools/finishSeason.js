const Punto = require('../../models/Punto');
const SeasonWinner = require('../../models/seasonWinner');

module.exports = async (message) => {
    const args = message.content.split(' ');
    const seasonName = args[1];

    if (!seasonName) {
        return message.reply('❗ Please use: `?finishSeason <seasonName>` (e.g., Season1)');
    }

    const fullRanking = await Punto.find({ guildID: message.guild.id }).sort({ score: -1 });

    if (fullRanking.length === 0) {
        return message.reply('📉 There are no recorded scores in this server yet.');
    }

    const winner = fullRanking[0];

    await SeasonWinner.create({
        guildID: message.guild.id,
        season: seasonName,
        winner: winner.username,
        score: winner.score
    });

    message.channel.send(`🏆 Season **${seasonName}** finished. Winner: **${winner.username}** with ${winner.score} points.`);
};
