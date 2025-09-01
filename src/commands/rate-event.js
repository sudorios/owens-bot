const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate-event')
    .setDescription('Califica un evento con estrellas (1-5)')
    .addStringOption(opt =>
      opt.setName('evento').setDescription('Nombre del evento').setRequired(true)
    ),
  async execute(interaction) {
    const eventLabel = interaction.options.getString('evento');

    const msg = await interaction.reply({
      content: `⭐ Califica el evento **${eventLabel}** reaccionando con 1-5 estrellas.`,
      fetchReply: true,
    });

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    for (const emoji of emojis) {
      await msg.react(emoji);
    }
  },
};
