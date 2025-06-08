module.exports = async (message, quinielas, apuestas, resultados) => {
    const partes = message.content.split(' ');
    const nombre = partes[1];
    if (!nombre) return message.reply('Use: `?finish <pool_name>`');

    const key = `${message.guild.id}:${nombre}`;
    const combates = quinielas.get(key);
    if (!combates || combates.length === 0) {
        return message.reply('That betting pool does not exist or has no matches.');
    }

    const puntajeEvento = new Map();
    let combatesEvaluados = 0;

    for (const combate of combates) {
        const mensajeID = combate.mensajeID;
        const emojiGanador = resultados.get(mensajeID);
        const votos = apuestas.get(mensajeID);

        if (!emojiGanador || !votos) continue;

        for (const [userID, emoji] of votos.entries()) {
            if (emoji === emojiGanador) {
                const prev = puntajeEvento.get(userID) || 0;
                puntajeEvento.set(userID, prev + 1);
            }
        }

        apuestas.delete(mensajeID);
        combatesEvaluados++;
    }

    quinielas.delete(key);

    const rankingEvento = [...puntajeEvento.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([userID, pts], i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
            return `${medal} <@${userID}> — ${pts} pt${pts > 1 ? 's' : ''}`;
        });

    const resumenFinal = [
        `Betting pool **${nombre}** finished`,
        `Matches evaluated: ${combatesEvaluados}/${combates.length}`,
        '',
        '**Event Ranking:**',
        rankingEvento.length > 0
            ? rankingEvento.join('\n')
            : 'No correct guesses in this betting pool.'
    ];

    const mensajeFinal = resumenFinal.join('\n');

    message.channel.send(mensajeFinal);
};
