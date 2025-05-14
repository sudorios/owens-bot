module.exports = (message, quinielas, resultados) => {
    const [_, mensajeID, emojiGanador] = message.content.split(' ');
    if (!mensajeID || !emojiGanador) {
        return message.reply('❗ Usa: `!resultado <mensajeID> <emoji>`');
    }
    const combates = [...quinielas.values()].flat();
    const existe = combates.find(c => c.mensajeID === mensajeID);
    if (!existe) {
        return message.reply('❌ Ese mensaje no pertenece a ningún combate registrado.');
    }
    resultados.set(mensajeID, emojiGanador);
    message.reply(`✅ Resultado guardado para el combate ${mensajeID}: ganador ${emojiGanador}`);
};