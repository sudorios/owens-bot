const { SlashCommandBuilder } = require("discord.js");
const { ensureGuildAndUser } = require("../data/event.repo.js");
const { getEventRatingsBundle } = require("../domain/eventRating.service");
const { buildRatingsEmbed, buildPagingRowRatings, attachEventRatingsPager } = require("../utils/ui/event-ratings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("event-ratings")
    .setDescription("Muestra los eventos rateados en este servidor"),

  async execute(interaction, ctx) {
    try {
      const { guildInternalId } = await ensureGuildAndUser(ctx.prisma, {
        guildIdStr: interaction.guild.id,
        guildName: interaction.guild.name,
        discordUserId: interaction.user.id,
        username: interaction.user.username,
      });

      const bundle = await getEventRatingsBundle({
        prisma: ctx.prisma,
        guildId: guildInternalId,
        perPage: 5,
        page: 1,
      });

      const embed = buildRatingsEmbed({
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowRatings({
        perPage: 5,
        page: bundle.page,
        totalPages: bundle.totalPages,
      });

      const reply = await interaction.reply({
        embeds: [embed],
        components: bundle.totalPages > 1 ? [row] : [],
        fetchReply: true,
      });

      attachEventRatingsPager({
        message: reply,
        interaction,
        ctx,
        meta: bundle,
        guildId: guildInternalId,
      });
    } catch (err) {
      console.error("[/event-ratings] ERROR:", err);
      await interaction.reply("❌ Ocurrió un error al mostrar los ratings.");
    }
  },
};
