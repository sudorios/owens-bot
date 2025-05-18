module.exports = (message, quinielas) => {
    const nombre = message.content.split(' ')[1];
    if (!nombre) return message.reply('❗ Usa: `!crearquiniela <nombre>`');
    const key = `${message.guild.id}:${nombre}`;
    if (quinielas.has(key)) {
        return message.reply('⚠️ Ya existe una quiniela con ese nombre en este servidor.');
    }
    quinielas.set(key, []);
    return message.reply(`🗂️ Quiniela **${nombre}** creada. Ahora agrega combates con \`!combate ${nombre} <pelea>\``);
};