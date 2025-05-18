module.exports = (message, quinielas) => {
    const nombre = message.content.split(' ')[1];
    if (!nombre) return message.reply('❗ Use: `!createpool <name>`');
    const key = `${message.guild.id}:${nombre}`;
    if (quinielas.has(key)) {
        return message.reply('⚠️ A betting pool with that name already exists on this server.');
    }
    quinielas.set(key, []);
    return message.reply(`🗂️ Betting pool **${nombre}** created. Now add matches with \`!match ${nombre} <fight>\``);
};
