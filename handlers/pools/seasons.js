const SeasonWinner = require('../../models/seasonWinner');

module.exports = async (message) => {
    const winners = await SeasonWinner.find({ guildID: message.guild.id }).sort({ date: 1 });

    if (winners.length === 0) {
        return message.reply('📉 There are no recorded season winners in this server yet.');
    }

    const winnersList = winners.map(sw => `${sw.season}: ${sw.winner} (${sw.score} pts)`).join('\n');

    message.channel.send(`🏅 **Season Winners:**\n${winnersList}`);
};
