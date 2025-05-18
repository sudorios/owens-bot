const Calificacion = require('../models/Calificacion');

module.exports = async (message) => {
    const calificaciones = await Calificacion.find({ guildID: message.guild.id });

    if (calificaciones.length === 0) {
        return message.reply('❗ There are no ratings recorded in this server.');
    }

    const resumen = calificaciones.map(c => {
        const votos = c.votos;
        if (votos.length === 0) return `${c.pelea}: No votes yet`;

        const suma = votos.reduce((acc, v) => acc + v.calificacion, 0);
        const promedio = (suma / votos.length).toFixed(2);

        return `${c.pelea}: ${promedio} ⭐ (${votos.length} votes)`;
    });

    message.channel.send('📊 **Ratings in this server:**\n' + resumen.join('\n'));
};
