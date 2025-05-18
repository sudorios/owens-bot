const { EmbedBuilder } = require('discord.js');

module.exports = async (message) => {
    const embed = new EmbedBuilder()
        .setColor(0xFF5E5B)
        .setTitle('💖 Support Owens Bot on Ko-fi')
        .setDescription('If you like the bot and want to support me, you can do so through Ko-fi:')
        .addFields(
            { name: 'Ko-fi', value: '[Make your donation here!](https://ko-fi.com/danniel_)' }
        )
        .setFooter({ text: 'Thank you for your support! 🙏', iconURL: message.client.user.displayAvatarURL() });

    message.channel.send({ embeds: [embed] });
};
