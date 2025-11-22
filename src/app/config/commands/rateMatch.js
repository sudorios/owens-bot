const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate-match")
    .setDescription("Califica un match con estrellas (1-5)")
    .addStringOption((opt) =>
      opt.setName("match").setDescription("Nombre del match").setRequired(true)
    ),
  async execute(interaction) {
    const matchLabel = interaction.options.getString("match");

    const msg = await interaction.reply({
      content: `⭐ Lucha: **${matchLabel}**  
Reacciona con 1️⃣ - 5️⃣ para calificar.`,
      fetchReply: true,
    });

    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    for (const emoji of emojis) {
      await msg.react(emoji);
    }
  },
};
