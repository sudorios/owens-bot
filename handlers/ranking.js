const Punto = require('../models/Punto');
module.exports = async (message) => {
    const top = await Punto.find({ guildID: message.guild.id }).sort({ score: -1 }).limit(10);
    if (top.length === 0) {
        return message.reply('📉 Aún no hay puntuaciones registradas en este servidor.');
    }
    const ranking = top.map((p, i) => `#${i + 1} ${p.username} — ${p.score} pt${p.score > 1 ? 's' : ''}`);
    message.channel.send({
        content: `📊 **Ranking General de Apuestas:**\n${ranking.join('\n')}`
    });
};