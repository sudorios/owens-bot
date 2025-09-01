const { SlashCommandBuilder } = require("discord.js");
const { ensureGuildAndUser } = require("../data/event.repo.js");
const { getMatchRatingsBundle } = require("../domain/matchRating.service.js");
const {
  buildRatingsEmbed,
  buildPagingRowRatings,
  attachMatchRatingsPager,
} = require("../utils/ui/match-ratings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("match-ratings")
    .setDescription("Muestra las luchas calificadas en este servidor")
    .addIntegerOption(opt =>
      opt.setName("por-pagina")
        .setDescription("Cantidad de luchas por página (default: 5)")
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute(interaction, ctx) {
    try {
      const { guildInternalId } = await ensureGuildAndUser(ctx.prisma, {
        guildIdStr: interaction.guild.id,
        guildName: interaction.guild.name,
        discordUserId: interaction.user.id,
        username: interaction.user.username,
      });

      const perPage = interaction.options.getInteger("por-pagina") || 5;

      const bundle = await getMatchRatingsBundle({
        prisma: ctx.prisma,
        guildId: guildInternalId,
        perPage,
        page: 1,
      });

      if (bundle.total === 0) {
        return interaction.reply("ℹ️ Aún no hay luchas calificadas en este servidor.");
      }

      const embed = buildRatingsEmbed({
        description: bundle.description,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowRatings({
        perPage,
        page: bundle.page,
        totalPages: bundle.totalPages,
      });

      const reply = await interaction.reply({
        embeds: [embed],
        components: bundle.totalPages > 1 ? [row] : [],
        fetchReply: true,
      });

      attachMatchRatingsPager({
        message: reply,
        interaction,
        ctx,
        meta: bundle,
        guildId: guildInternalId,
      });
    } catch (err) {
      console.error("[/match-ratings] ERROR:", err);
      await interaction.reply("❌ Ocurrió un error al mostrar las luchas calificadas.");
    }
  },
};
