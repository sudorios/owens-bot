const { SlashCommandBuilder } = require('discord.js');
const { getSeasonRankingFirstPage } = require('../domain/seasonScore.service');
const { buildSeasonRankingEmbed, buildPagingRowSeasonRank, attachSeasonRankingPager } = require('../utils/ui/season_score');

const PER_PAGE = 10;
const COLLECTOR_MS = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('season-ranking')
    .setDescription('Muestra el ranking de la season activa en este servidor.')
    .setDMPermission(false),

  async execute(interaction, ctx) {
    await interaction.deferReply(); 

    const guildId = interaction.guildId;
    const guildName = interaction.guild?.name || 'Unknown';
    const perPage = PER_PAGE;

    const bundle = await getSeasonRankingFirstPage({
      prisma: ctx.prisma,
      discordGuildIdStr: guildId,
      guildName,
      perPage,
    });

    if (!bundle.season) {
      return interaction.editReply({ content: 'ℹ️ No hay una season activa en este servidor.' });
    }

    const embed = buildSeasonRankingEmbed({
      season: bundle.season,
      description: bundle.description,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });

    const components =
      bundle.totalPages > 1
        ? [buildPagingRowSeasonRank({ page: bundle.page, totalPages: bundle.totalPages, perPage })]
        : [];

    const msg = await interaction.editReply({ embeds: [embed], components });

    if (bundle.totalPages > 1) {
      attachSeasonRankingPager({
        message: msg,
        interaction,
        ctx,
        meta: { totalPages: bundle.totalPages, perPage, guildId, guildName },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};
