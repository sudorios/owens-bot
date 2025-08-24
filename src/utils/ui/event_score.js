const { EmbedBuilder } = require('discord.js');
const { getEventRankingBundle } = require('../../domain/eventScore.service');
const { makeCollector, parseCid, clamp, buildPagingRowGeneric } = require('./shared');

const PREFIX = 'evrank';

function buildRankingEmbed({ event, description, page, totalPages, total }) {
    return new EmbedBuilder()
        .setTitle(`🏆 Ranking del Evento #${event.id}${event.name ? ` — ${event.name}` : ''}`)
        .setDescription(description)
        .setFooter({ text: `Página ${page}/${totalPages} • Participantes: ${total}` })
        .setColor(0xF1C40F)
        .setTimestamp(new Date());
}

function buildPagingRowRank({ eventId, perPage, page, totalPages }) {
    return buildPagingRowGeneric(
        PREFIX,
        ['prev', eventId, page, perPage],  
        ['next', eventId, page, perPage], 
        page <= 1,
        page >= totalPages
    );
}

function attachEventRankingPager({ message, interaction, ctx, meta, eventId, ttlMs = 60_000 }) {
    return makeCollector({
        message,
        interaction,
        prefix: PREFIX,
        ttlMs,
        onCollect: async (i) => {
            const parts = parseCid(i.customId, PREFIX, 4);
            if (!parts) return i.deferUpdate().catch(() => {});

            const [dir, evStr, pageStr, perStr] = parts;  
            const ev = Number(evStr);
            const per = Number(perStr);
            const cur = Number(pageStr);
            
            const nextPage = clamp(
                dir === 'prev' ? cur - 1 : cur + 1, 
                1, 
                meta.totalPages || 999  
            );

            try {
                const bundle = await getEventRankingBundle({
                    prisma: ctx.prisma,
                    eventId: ev,
                    perPage: per,
                    page: nextPage,
                });

                const newEmbed = buildRankingEmbed({
                    event: bundle.event,
                    description: bundle.description,
                    page: bundle.page,
                    totalPages: bundle.totalPages,
                    total: bundle.total,
                });

                const newRow = buildPagingRowRank({
                    eventId: ev,
                    perPage: per,
                    page: bundle.page,
                    totalPages: bundle.totalPages,
                });

                await i.update({
                    embeds: [newEmbed],
                    components: bundle.totalPages > 1 ? [newRow] : []
                });
            } catch (error) {
                console.error('Error updating event ranking:', error);
                await i.deferUpdate().catch(() => {});
            }
        },
    });
}

module.exports = {
    buildRankingEmbed,
    buildPagingRowRank,
    attachEventRankingPager,
};