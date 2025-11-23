const { SlashCommandBuilder } = require('discord.js');
const EventRankingFacade = require('../facade/eventRanking.facade');
const { buildRankingEmbed, buildPagingRowRank, attachEventRankingPager } = require('../../../utils/ui/event_score');

const PER_PAGE = 10;
const COLLECTOR_MS = 60_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-ranking')
    .setDescription('Muestra el ranking del evento (público, con paginación).')
    .addIntegerOption(o =>
      o.setName('event_id').setDescription('ID del evento').setRequired(true)
    ),
  async execute(interaction, ctx) {
    if (!ctx?.prisma) return interaction.reply("❌ Error DB.");
    
    const eventId = interaction.options.getInteger('event_id', true);
    const perPage = PER_PAGE;

    await interaction.deferReply();

    const facade = new EventRankingFacade(ctx.prisma);

    const bundle = await facade.getRankingPage({
      eventId,
      perPage,
      page: 1
    });

    if (!bundle.event) {
      return interaction.editReply({ content: '❌ Ese evento no existe o no se encontró.' });
    }

    const embed = buildRankingEmbed({
      event: bundle.event,
      description: bundle.description,
      page: bundle.page,
      totalPages: bundle.totalPages,
      total: bundle.total,
    });

    const components = bundle.totalPages > 1
      ? [buildPagingRowRank({ eventId, perPage, page: bundle.page, totalPages: bundle.totalPages })]
      : [];

    const msg = await interaction.editReply({ embeds: [embed], components });

    if (bundle.totalPages > 1) {
      attachEventRankingPager({
        message: msg,
        interaction,  
        ctx,
        meta: { 
          invokerId: interaction.user.id, 
          totalPages: bundle.totalPages,
          eventId 
        },
        ttlMs: COLLECTOR_MS,
      });
    }
  },
};