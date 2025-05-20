const Calificacion = require('../models/Calificacion');

module.exports = async (message) => {
    const pelea = message.content.slice('!rate'.length).trim();
    if (!pelea) return message.reply('❗ Use: `!rate <match name>`');

    try {
        const msg = await message.channel.send(`⭐ Rate this match:\n**${pelea}**`);

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

        setTimeout(() => {
            message.delete().catch(err => {
                console.error('No se pudo eliminar el mensaje:', err);
            });
        }, 3000);

    } catch (err) {
        console.error('❌ Error creating the rating:', err);
        message.reply('There was an error creating the rating.');
    }
};
