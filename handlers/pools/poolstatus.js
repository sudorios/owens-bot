module.exports = (message, quinielas) => {
    const guildID = message.guild.id;

    const poolsDelServidor = [...quinielas.keys()]
        .filter(key => key.startsWith(`${guildID}:`))
        .map(key => key.split(':')[1]);

    if (poolsDelServidor.length === 0) {
        return message.channel.send('⚠️ No betting pools have been created in this server yet.')
            .then(msg => setTimeout(() => msg.delete().catch(() => { }), 5000));
    }

    const listaPools = poolsDelServidor
        .map((nombre, i) => `#${i + 1} - **${nombre}**`)
        .join('\n');

    return message.channel.send(`🎲 **Betting Pools in this server:**\n${listaPools}`)
        .then(msg => setTimeout(() => msg.delete().catch(() => { }), 10000));
};
