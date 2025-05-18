const Calificacion = require('../models/Calificacion');

module.exports = async (message) => {
    const pelea = message.content.slice('!calificar'.length).trim();
    if (!pelea) return message.reply('❗ Usa: `!calificar <nombre de la pelea>`');

    try {
        const msg = await message.channel.send(`⭐ Califica esta pelea:\n**${pelea}**`);

        const estrellas = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        for (const emoji of estrellas) {
            await msg.react(emoji);
        }

        const calificacion = new Calificacion({
            guildID: message.guild.id,
            mensajeID: msg.id,
            pelea,
            votos: []
        });
        await calificacion.save();

    } catch (err) {
        console.error('❌ Error al crear la calificación:', err);
        message.reply('Hubo un error al crear la calificación.');
    }
};
