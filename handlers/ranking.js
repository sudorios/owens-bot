module.exports = (message, puntos) => {
    if (puntos.size === 0) {
        return message.reply('📉 Aún no hay puntuaciones registradas.');
    }
    const ranking = [...puntos.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([userID, pts], i) => `#${i + 1} <@${userID}> — ${pts} pt${pts > 1 ? 's' : ''}`)
        .slice(0, 10);

    message.channel.send({
        content: `📊 **Ranking General de Apuestas:**\n${ranking.join('\n')}`
    });
};