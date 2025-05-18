const emojiRegex = require('emoji-regex');

module.exports = async (message, quinielas, apuestas) => {
    const partes = message.content.split(' ');
    const nombre = partes[1];
    const contenido = partes.slice(2).join(' ');
    const key = `${message.guild.id}:${nombre}`;

    if (!quinielas.has(key)) {
        return message.reply('❗ That betting pool does not exist on this server. Use `!createpool` first.');
    }

    const regex = emojiRegex();
    const emojis = [];
    let match;
    while ((match = regex.exec(contenido)) !== null) {
        emojis.push(match[0]);
    }

    try {
        const msg = await message.channel.send(`🥊 **Match of ${nombre}**\n${contenido}`);

        for (const emoji of emojis) {
            await msg.react(emoji);
        }

        const combate = { mensajeID: msg.id, emojis };
        quinielas.get(key).push(combate);
        apuestas.set(msg.id, new Map());

        message.reply(`✅ Match added to the betting pool **${nombre}**`);
    } catch (err) {
        console.error('❌ Error publishing the match:', err);
        message.reply('There was an error adding the match.');
    }
};
