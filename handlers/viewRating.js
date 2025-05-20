const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

    const ITEMS_POR_PAGINA = 5;
    const totalPaginas = Math.ceil(resumen.length / ITEMS_POR_PAGINA);
    let paginaActual = 0;

    const generarContenido = (pagina) => {
        const inicio = pagina * ITEMS_POR_PAGINA;
        const fin = inicio + ITEMS_POR_PAGINA;
        return resumen.slice(inicio, fin).join('\n');
    };

    const crearBotones = () => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('anterior')
                .setLabel('⬅️ Anterior')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(paginaActual === 0),
            new ButtonBuilder()
                .setCustomId('siguiente')
                .setLabel('Siguiente ➡️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(paginaActual === totalPaginas - 1),
        );
    };

    const mensaje = await message.channel.send({
        content: `📊 **Ratings Page ${paginaActual + 1}/${totalPaginas}:**\n${generarContenido(paginaActual)}`,
        components: [crearBotones()]
    });

    const filter = (interaction) => {
        return ['anterior', 'siguiente'].includes(interaction.customId) && interaction.user.id === message.author.id;
    };

    const collector = mensaje.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'anterior' && paginaActual > 0) {
            paginaActual--;
        } else if (interaction.customId === 'siguiente' && paginaActual < totalPaginas - 1) {
            paginaActual++;
        }

        await interaction.update({
            content: `📊 **Ratings Page ${paginaActual + 1}/${totalPaginas}:**\n${generarContenido(paginaActual)}`,
            components: [crearBotones()]
        });
    });

    collector.on('end', async () => {
        if (!mensaje.deleted) {
            await mensaje.edit({
                components: [],
                content: mensaje.content + '\n\n⏰ Paginación finalizada.'
            }).catch(() => { });
        }
    });
};
