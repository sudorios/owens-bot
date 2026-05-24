const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const MatchRatingFacade = require("../facade/matchRating.facade");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate-match")
    .setDescription("Crea una votación para calificar una lucha.")
    .addStringOption((opt) =>
      opt.setName("match").setDescription("Nombre del match (ej: Cena vs Rock)").setRequired(true)
    ),

  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");

    const matchName = interaction.options.getString("match");
    const facade = new MatchRatingFacade(ctx.prisma);

    const res = await facade.createMatchPoll({
      guildIdStr: interaction.guild.id,
      guildName: interaction.guild.name,
      discordUserId: interaction.user.id,
      username: interaction.user.username,
      matchName,
    });

    if (res.error) return interaction.reply(`❌ Error: ${res.message}`);

    const summaryId = res.data.match_rating_id;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ratematch:${summaryId}:1`).setLabel("1 ⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ratematch:${summaryId}:2`).setLabel("2 ⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ratematch:${summaryId}:3`).setLabel("3 ⭐").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ratematch:${summaryId}:4`).setLabel("4 ⭐").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ratematch:${summaryId}:5`).setLabel("5 ⭐").setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: `🤼 **Califica la Lucha: ${matchName}**\n¡Usa los botones para votar!`,
      components: [row],
    });
  },
};
