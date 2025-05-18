module.exports = (message, quinielas, resultados) => {
    const [_, mensajeID, emojiGanador] = message.content.split(' ');

    if (!mensajeID || !emojiGanador) {
        return message.reply('❗ Use: `!result <messageID> <emoji>`');
    }

    const combates = [...quinielas.values()].flat();
    const existe = combates.find(c => c.mensajeID === mensajeID);

    if (!existe) {
        return message.reply('❌ That message does not belong to any registered match.');
    }

    resultados.set(mensajeID, emojiGanador);

    message.reply(`✅ Result saved for match ${mensajeID}: winner ${emojiGanador}`);
};
