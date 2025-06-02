module.exports = (message, quinielas) => {
    message.delete().catch(() => { });

    const nombre = message.content.split(' ')[1];

    if (!nombre) {
        return message.channel.send('❗ Use: `?createpool <name>`')
            .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
    }

    const key = `${message.guild.id}:${nombre}`;
    if (quinielas.has(key)) {
        return message.channel.send('⚠️ A betting pool with that name already exists on this server.')
            .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
    }

    quinielas.set(key, []);
    return message.channel.send(`🗂️ Betting pool **${nombre}** created. Now add matches with \`!match ${nombre} <fight>\``)
        .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
};
