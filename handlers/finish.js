const Punto = require('../models/Punto');

module.exports = async (message, quinielas, apuestas, resultados) => {
    const partes = message.content.split(' ');
    const nombre = partes[1];
    if (!nombre) return message.reply('❗ Use: `!finish <pool_name>`');

    const key = `${message.guild.id}:${nombre}`;
    const combates = quinielas.get(key);
    if (!combates || combates.length === 0) {
        return message.reply('⚠️ That betting pool does not exist or has no matches.');
    }

    const resumen = [];
    const puntajeEvento = new Map();
    let combatesEvaluados = 0;

    for (const combate of combates) {
        const mensajeID = combate.mensajeID;
        const emojiGanador = resultados.get(mensajeID);
        const votos = apuestas.get(mensajeID);

        if (!emojiGanador) {
            resumen.push(`❓ Match ${mensajeID} has no result. Use \`!result ${mensajeID} <emoji>\``);
            continue;
        }

        if (!votos) {
            resumen.push(`🕳️ Match ${mensajeID} has no bets registered.`);
            continue;
        }

        let ganadores = [];

        for (const [userID, emoji] of votos.entries()) {
            if (emoji === emojiGanador) {
                await Punto.updateOne(
                    { guildID: message.guild.id, userID },
                    {
                        $set: { username: `<@${userID}>` },
                        $inc: { score: 1 }
                    },
                    { upsert: true }
                );

                const prev = puntajeEvento.get(userID) || 0;
                puntajeEvento.set(userID, prev + 1);

                ganadores.push(`<@${userID}> (+1 pt)`);
            }
        }

        apuestas.delete(mensajeID);
        combatesEvaluados++;

        resumen.push(
            ganadores.length === 0
                ? `🔚 Match ${mensajeID}: no one guessed correctly`
                : `🏆 Match ${mensajeID} - Winners: ${ganadores.join(', ')}`
        );
    }

    quinielas.delete(key);

    const rankingEvento = [...puntajeEvento.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([userID, pts], i) => `#${i + 1} <@${userID}> — ${pts} pt${pts > 1 ? 's' : ''}`);

    const resumenFinal = [
        `🎯 Betting pool **${nombre}** finished`,
        `📊 Matches evaluated: ${combatesEvaluados}/${combates.length}`,
        '',
        ...resumen,
        '',
        '🏅 **Event Ranking:**',
        rankingEvento.length > 0 ? rankingEvento.join('\n') : 'No correct guesses in this betting pool.'
    ];

    message.channel.send(resumenFinal.join('\n'))
        .then(sentMessage => {
            setTimeout(() => sentMessage.delete().catch(() => { }), 5000);
        });
};
