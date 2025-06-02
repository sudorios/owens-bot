const Punto = require('../../models/Punto');

module.exports = async (message) => {
    const rankingCompleto = await Punto.find({ guildID: message.guild.id }).sort({ score: -1 });

    if (rankingCompleto.length === 0) {
        return message.reply('📉 There are no recorded scores yet in this server.');
    }

    const rankingLines = rankingCompleto.map((p, i) => `#${i + 1} ${p.username} — ${p.score} pt${p.score > 1 ? 's' : ''}`);

    const CHUNKSIZE = 15;
    for (let i = 0; i < rankingLines.length; i += CHUNKSIZE) {
        const chunk = rankingLines.slice(i, i + CHUNKSIZE).join('\n');
        await message.channel.send(`📊 **Ranking:**\n${chunk}`);
    }
};
