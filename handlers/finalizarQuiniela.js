module.exports = (message, quinielas, apuestas, resultados, puntos) => {
    const partes = message.content.split(' ');
    const nombre = partes[1];
    if (!nombre) return message.reply('❗ Usa: `!finalizar <nombre_quiniela>`');
    const combates = quinielas.get(nombre);
    if (!combates || combates.length === 0) {
        return message.reply('⚠️ Esa quiniela no existe o no tiene combates.');
    }
    const resumen = [];
    const puntajeEvento = new Map();
    let combatesEvaluados = 0;
    for (const combate of combates) {
        const mensajeID = combate.mensajeID;
        const emojiGanador = resultados.get(mensajeID);
        const votos = apuestas.get(mensajeID);
        if (!emojiGanador) {
            resumen.push(`❓ Combate ${mensajeID} sin resultado. Usa \`!resultado ${mensajeID} <emoji>\``);
            continue;
        }
        if (!votos) {
            resumen.push(`🕳️ Combate ${mensajeID} sin apuestas registradas.`);
            continue;
        }
        let ganadores = [];
        for (const [userID, emoji] of votos.entries()) {
            if (emoji === emojiGanador) {
                const total = puntos.get(userID) || 0;
                puntos.set(userID, total + 1);
                const prev = puntajeEvento.get(userID) || 0;
                puntajeEvento.set(userID, prev + 1);
                ganadores.push(`<@${userID}> (+1 pt)`);
            }
        }
        apuestas.delete(mensajeID);
        combatesEvaluados++;
        resumen.push(ganadores.length === 0
            ? `🔚 Combate ${mensajeID}: nadie acertó`
            : `🏆 Combate ${mensajeID} - Ganadores: ${ganadores.join(', ')}`);
    }
    quinielas.delete(nombre);
    const rankingEvento = [...puntajeEvento.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([userID, pts], i) => `#${i + 1} <@${userID}> — ${pts} pt${pts > 1 ? 's' : ''}`);
    const resumenFinal = [
        `🎯 Quiniela **${nombre}** finalizada`,
        `📊 Combates evaluados: ${combatesEvaluados}/${combates.length}`,
        '',
        ...resumen,
        '',
        '🏅 **Ranking del Evento:**',
        rankingEvento.length > 0 ? rankingEvento.join('\n') : 'Sin aciertos en esta quiniela.'
    ];
    message.channel.send(resumenFinal.join('\n'));
};
