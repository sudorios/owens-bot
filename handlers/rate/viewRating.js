const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Calificacion = require('../../models/Calificacion');

module.exports = async (message) => {
    const ratings = await Calificacion.find({ guildID: message.guild.id });

    if (ratings.length === 0) {
        return message.reply('❗ There are no ratings recorded in this server.');
    }

    const summary = ratings.map(r => {
        const votes = r.votos;
        if (votes.length === 0) return `${r.pelea}: No votes yet`;

        const sum = votes.reduce((acc, v) => acc + v.calificacion, 0);
        const average = (sum / votes.length).toFixed(2);

        return `${r.pelea}: ${average} ⭐ (${votes.length} votes)`;
    });

    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(summary.length / ITEMS_PER_PAGE);
    let currentPage = 0;

    const generateContent = (page) => {
        const start = page * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return summary.slice(start, end).join('\n');
    };

    const createButtons = () => {
        if (totalPages <= 1) return [];
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('⬅️ Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next ➡️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1),
        );
    };

    const sentMessage = await message.channel.send({
        content: `📊 **Ratings Page ${currentPage + 1}/${totalPages}:**\n${generateContent(currentPage)}`,
        components: createButtons()
    });

    const filter = (interaction) => {
        return ['previous', 'next'].includes(interaction.customId) && interaction.user.id === message.author.id;
    };

    const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'previous' && currentPage > 0) {
            currentPage--;
        } else if (interaction.customId === 'next' && currentPage < totalPages - 1) {
            currentPage++;
        }

        await interaction.update({
            content: `📊 **Ratings Page ${currentPage + 1}/${totalPages}:**\n${generateContent(currentPage)}`,
            components: createButtons()
        });
    });

    collector.on('end', async () => {
        if (!sentMessage.deleted) {
            await sentMessage.edit({
                components: [],
                content: sentMessage.content + '\n\n⏰ Pagination ended.'
            }).catch(() => { });
        }
    });
};
