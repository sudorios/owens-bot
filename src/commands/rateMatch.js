const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate-match')
    .setDescription('Califica un match con estrellas (1-5)')
    .addStringOption(opt =>
      opt.setName('match')
        .setDescription('Nombre del match')
        .setRequired(true)
    ),
  async execute(interaction) {
    const matchLabel = interaction.options.getString('match');

    const msg = await interaction.reply({
      content: `🎮 Califica el match **${matchLabel}** reaccionando con 1-5 estrellas.`,
      fetchReply: true,
    });

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    for (const emoji of emojis) {
      await msg.react(emoji);
    }
  },
};
