const emojiRegex = require('emoji-regex');

module.exports = async (message, quinielas, apuestas) => {
    const partes = message.content.split(' ');
    const nombre = partes[1];
    const contenido = partes.slice(2).join(' ');
    const key = `${message.guild.id}:${nombre}`;

    message.delete().catch(() => { });

    if (!quinielas.has(key)) {
        return message.channel.send('❗ That betting pool does not exist on this server. Use `?createpool` first.')
            .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
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

        message.channel.send(`✅ Match added to the betting pool **${nombre}**`)
            .then(replyMsg => setTimeout(() => replyMsg.delete().catch(() => { }), 5000));
    } catch (err) {
        console.error('❌ Error publishing the match:', err);
        message.channel.send('There was an error adding the match.')
            .then(errMsg => setTimeout(() => errMsg.delete().catch(() => { }), 5000));
    }
};
