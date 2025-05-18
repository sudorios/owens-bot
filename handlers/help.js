const { EmbedBuilder } = require('discord.js');
const comandos = require('../help_commands');

module.exports = async (message) => {
    const embed = new EmbedBuilder()
        .setColor(0x00AEFF)
        .setTitle('📘 Comandos disponibles')
        .setDescription('Aquí tienes todos los comandos actualizados del bot:')

    Object.keys(comandos).forEach(cmd => {
        embed.addFields({ name: `\`${comandos[cmd].uso}\``, value: comandos[cmd].descripcion });
    });

    embed.setFooter({ text: 'Bot Owens | Sistema de Quinielas ⚔️', iconURL: message.client.user.displayAvatarURL() });

    message.channel.send({ embeds: [embed] });
};
