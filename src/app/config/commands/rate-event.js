const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const EventRatingFacade = require("../facade/eventRating.facade");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rate-event")
    .setDescription("Crea botones para calificar un evento.")
    .addStringOption((o) =>
      o.setName("evento").setDescription("Nombre del evento (ej: WrestleMania)").setRequired(true)
    ),

  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");

    const eventName = interaction.options.getString("evento");
    const facade = new EventRatingFacade(ctx.prisma);
    const res = await facade.createRatingSummary({
      guildIdStr: interaction.guild.id,
      guildName: interaction.guild.name,
      discordUserId: interaction.user.id,
      username: interaction.user.username,
      eventName,
    });

    if (res.error) return interaction.reply(`❌ Error: ${res.message}`);
    const summaryId = res.data.event_rating_id;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`rate:${summaryId}:1`).setLabel("1 ⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`rate:${summaryId}:2`).setLabel("2 ⭐").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`rate:${summaryId}:3`).setLabel("3 ⭐").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`rate:${summaryId}:4`).setLabel("4 ⭐").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`rate:${summaryId}:5`).setLabel("5 ⭐").setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: `**Califica el evento: ${eventName}**\n¡Haz clic en los botones para dejar tu voto!`,
      components: [row],
    });
  },
};
