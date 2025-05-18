const Calificacion = require('../models/Calificacion');

module.exports = async (message) => {
    const calificaciones = await Calificacion.find({ guildID: message.guild.id });

    if (calificaciones.length === 0) {
        return message.reply('❗ No hay calificaciones registradas en este servidor.');
    }

    const resumen = calificaciones.map(c => {
        const votos = c.votos;
        if (votos.length === 0) return `${c.pelea}: Sin votos aún`;

        const suma = votos.reduce((acc, v) => acc + v.calificacion, 0);
        const promedio = (suma / votos.length).toFixed(2);

        return `${c.pelea}: ${promedio} ⭐ (${votos.length} votos)`;
    });

    message.channel.send('📊 **Calificaciones en este servidor:**\n' + resumen.join('\n'));
};
