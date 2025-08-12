const { SlashCommandBuilder } = require('discord.js');
const { getSeasonInfoFirstPage } = require('../domain/season.service');
const {
  buildSeasonTable,
  buildSeasonListEmbed,
  buildPagingRow,
  attachSeasonInfoPager,
} = require('../utils/ui/season');

const PER_PAGE = 10;
const COLLECTOR_MS = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('season-info')
    .setDescription('Lista las seasons del servidor (tabla con paginación).')
    .setDMPermission(false),

  async execute(interaction, ctx) {
    await interaction.deferReply(); 

    const guildId = interaction.guildId;
    const guildName = interaction.guild?.name || 'Unknown';
    const perPage = PER_PAGE;

    const bundle = await getSeasonInfoFirstPage({
      prisma: ctx.prisma,
      discordGuildIdStr: guildId,
      guildName,
      perPage,
    });

    if (bundle.total === 0) {
      return interaction.editReply({ content: 'ℹ️ Aún no hay seasons en este servidor.' });
    }

    const table = buildSeasonTable(bundle.rows);
    const embed = buildSeasonListEmbed({
      guild: bundle.guild,
      table,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });

    const components =
      bundle.totalPages > 1
        ? [buildPagingRow({ page: bundle.page, totalPages: bundle.totalPages, perPage })]
        : [];

    const msg = await interaction.editReply({ embeds: [embed], components });

    if (bundle.totalPages > 1) {
      attachSeasonInfoPager({
        message: msg,
        interaction,
        ctx,
        meta: { totalPages: bundle.totalPages, perPage, guildId, guildName },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};
