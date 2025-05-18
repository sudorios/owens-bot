const { EmbedBuilder } = require('discord.js');

module.exports = async (message) => {
    const embed = new EmbedBuilder()
        .setColor(0xFF5E5B)
        .setTitle('💖 Apoya el Bot Owens en Ko-fi')
        .setDescription('Si te gusta el bot y quieres apoyarme, puedes hacerlo a través de Ko-fi:')
        .addFields(
            { name: 'Ko-fi', value: '[¡Haz tu donación aquí!](https://ko-fi.com/danniel_' }
        )
        .setFooter({ text: '¡Gracias por tu apoyo! 🙏', iconURL: message.client.user.displayAvatarURL() });

    message.channel.send({ embeds: [embed] });
};
