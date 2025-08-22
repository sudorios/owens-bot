const { countEventWinners, getEventWinnersPage } = require('../data/eventWinner.repo');

function mention(discordId, fallback) {
  return discordId != null ? `<@${discordId.toString()}>` : fallback;
}

function buildWinnerPageText(list, page, perPage, total) {
  if (!list?.length) return 'No hay ganadores registrados todavía.';
  const startRank = (page - 1) * perPage + 1;
  return list.map((w, idx) => {
    const rank = startRank + idx;
    return `#${rank} ${mention(w.discordId, w.username)} — *(Evento: ${w.eventName})*`;
  }).join('\n');
}

async function getEventWinnersFirstPage({ prisma, guildInternalId, perPage }) {
  return prisma.$transaction(async (tx) => {
    const total = await countEventWinners(tx, { guildInternalId });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = 1;

    const list = await getEventWinnersPage(tx, { guildInternalId, perPage, page });
    const description = buildWinnerPageText(list, page, perPage, total);

    return { total, totalPages, page, perPage, description, list };
  });
}

async function getEventWinnersBundle({ prisma, guildInternalId, perPage, page }) {
  return prisma.$transaction(async (tx) => {
    const total = await countEventWinners(tx, { guildInternalId });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const list = await getEventWinnersPage(tx, { guildInternalId, perPage, page: safePage });
    const description = buildWinnerPageText(list, safePage, perPage, total);

    return { total, totalPages, page: safePage, perPage, description, list };
  });
}

module.exports = { 
  getEventWinnersFirstPage, 
  getEventWinnersBundle 
};
