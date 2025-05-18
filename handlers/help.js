const { EmbedBuilder } = require('discord.js');
const comandos = require('../languages/en_help_commands');

module.exports = async (message) => {
    const embed = new EmbedBuilder()
        .setColor(0x00AEFF)
        .setTitle('📘 Available Commands')
        .setDescription('Here is the updated list of commands for the bot:')

    Object.keys(comandos).forEach(cmd => {
        embed.addFields({ name: `\`${comandos[cmd].uso}\``, value: comandos[cmd].descripcion });
    });

    embed.setFooter({ text: 'Owens Bot | Betting Pool System ⚔️', iconURL: message.client.user.displayAvatarURL() });

    message.channel.send({ embeds: [embed] });
};
