module.exports = (message, quinielas) => {
    const nombre = message.content.split(' ')[1];
    if (!nombre) return message.reply('❗ Usa: `!crearquiniela <nombre>`');
    if (quinielas.has(nombre)) {
        return message.reply('⚠️ Ya existe una quiniela con ese nombre.');
    }
    quinielas.set(nombre, []);
    return message.reply(`🗂️ Quiniela **${nombre}** creada. Ahora agrega combates con \`!combate ${nombre} <pelea>\``);
};