const Punto = require('../../models/Punto');
const SeasonWinner = require('../../models/seasonWinner');
const ActiveSeason = require('../../models/ActiveSeason');

module.exports = async (message) => {
    const args = message.content.split(' ');
    const seasonName = args[1];

    if (!seasonName) {
        return message.reply('❗ Please use: `?finishSeason <seasonName>` (e.g., Season1)');
    }

    if (!seasonName || seasonName.toLowerCase() === 'global') {
        return message.reply('❗ The season name "global" is reserved and cannot be used. Please choose another name.');
    }

    const fullRanking = await Punto.find({ guildID: message.guild.id, season: seasonName }).sort({ score: -1 });

    if (fullRanking.length === 0) {
        return message.reply(`📉 There are no recorded scores for season **${seasonName}** in this server yet.`);
    }

    const winner = fullRanking[0];

    await SeasonWinner.create({
        guildID: message.guild.id,
        season: seasonName,
        winner: winner.username,
        score: winner.score
    });

    await ActiveSeason.findOneAndUpdate(
        { guildID: message.guild.id },
        { currentSeason: seasonName },
        { upsert: true }
    );

    message.channel.send(`🏆 Season **${seasonName}** finished. Winner: **${winner.username}** with ${winner.score} points.\n` +
        `📢 Ranking now based on season **${seasonName}**.`);
};
