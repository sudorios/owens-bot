module.exports = (message, quinielas, lang) => {
    const nombre = message.content.split(' ')[1];

    if (!nombre) {
        return message.reply(lang.crearquiniela?.uso || '❗ Usa: `!crearquiniela <nombre>`');
    }

    if (quinielas.has(nombre)) {
        return message.reply(lang.crearquiniela?.yaExiste || '⚠️ Ya existe una quiniela con ese nombre.');
    }

    quinielas.set(nombre, []);

    const mensajeCreada = (lang.crearquiniela?.mensajeCreada || `🗂️ Quiniela **${nombre}** creada.`)
        .replace('{nombre}', nombre);

    return message.reply(mensajeCreada);
};
