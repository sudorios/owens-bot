const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const KO_FI_URL = 'https://ko-fi.com/danniel_'; 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Muestra cómo apoyar el desarrollo de Owens Bot.')
    .setDMPermission(false),

  async execute(interaction) {
    const botAvatar = interaction.client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setColor(0xFF5E5B)
      .setTitle('💖 Apoya a Owens Bot en Ko-fi')
      .setDescription('Si te gusta el bot y quieres apoyar su desarrollo, puedes invitarme un cafecito:')
      .addFields({ name: 'Ko-fi', value: `👉 [¡Haz tu donación aquí!](${KO_FI_URL})` })
      .setThumbnail(botAvatar)
      .setFooter({ text: '¡Gracias por tu apoyo! 🙏' })
      .setTimestamp(new Date());

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(KO_FI_URL).setLabel('☕ Ko-fi')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
