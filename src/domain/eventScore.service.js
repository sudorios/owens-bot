const { getEvent } = require('../data/event.repo');
const { countEventRanking, getEventRankingPage } = require('../data/eventScore.repo');

const MEDALS = ['🥇','🥈','🥉'];

function mention(discordId, fallback) {
  return discordId != null ? `<@${discordId.toString()}>` : fallback;
}

function buildPageText(list, page, perPage, total) {
  if (!list?.length) return 'No hay puntuaciones para este evento todavía.';
  const startRank = (page - 1) * perPage + 1;
  return list.map((e, idx) => {
    const rank = startRank + idx;
    const tag = rank <= 3 ? MEDALS[rank - 1] : `#${rank}`;
    return `${tag} ${mention(e.discordId, e.username)} — **${e.points}** pts`;
  }).join('\n');
}


async function getEventRankingFirstPage({ prisma, eventId, perPage }) {
  return prisma.$transaction(async (tx) => {
    const event = await getEvent(tx, eventId);
    if (!event) return { event: null };

    const total = await countEventRanking(tx, { eventId });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = 1;

    const list = await getEventRankingPage(tx, { eventId, perPage, page });
    const description = buildPageText(list, page, perPage, total);

    return { event, total, totalPages, page, perPage, description };
  });
}


async function getEventRankingBundle({ prisma, eventId, perPage, page }) {
  return prisma.$transaction(async (tx) => {
    const event = await getEvent(tx, eventId);
    if (!event) return { event: null };

    const total = await countEventRanking(tx, { eventId });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const list = await getEventRankingPage(tx, { eventId, perPage, page: safePage });
    const description = buildPageText(list, safePage, perPage, total);

    return { event, total, totalPages, page: safePage, perPage, description };
  });
}

module.exports = { getEventRankingFirstPage, getEventRankingBundle };
