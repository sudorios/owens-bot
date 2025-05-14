const emojiRegex = require('emoji-regex');
module.exports = async (message, quinielas, apuestas) => {
    const partes = message.content.split(' ');
    const nombre = partes[1];
    const contenido = partes.slice(2).join(' ');
    if (!quinielas.has(nombre)) {
        return message.reply('❗ Esa quiniela no existe. Usa `!crearquiniela` primero.');
    }
    const regex = emojiRegex();
    const emojis = [];
    let match;
    while ((match = regex.exec(contenido)) !== null) {
        emojis.push(match[0]);
    }
    try {
        const msg = await message.channel.send(`🥊 **Combate de ${nombre}**\n${contenido}`);
        for (const emoji of emojis) {
            await msg.react(emoji);
        }
        const combate = { mensajeID: msg.id, emojis };
        quinielas.get(nombre).push(combate);
        apuestas.set(msg.id, new Map());
        message.reply(`✅ Combate agregado a la quiniela **${nombre}**`);
    } catch (err) {
        console.error('❌ Error al publicar el combate:', err);
        message.reply('Hubo un error al agregar el combate.');
    }
};