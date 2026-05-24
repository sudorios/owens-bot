const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Responde con Pong!"),
  async execute(interaction, ctx) {
    await interaction.reply({
      content: "Pong! 🏓",
      flags: MessageFlags.Ephemeral,
    });
  },
};
