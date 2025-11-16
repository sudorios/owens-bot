const { upsertGuildByDiscordId } = require('../data/season.repo'); 
const { countGuildRanking, getGuildRankingPage, updateGuildPositions } = require('../data/guildUser.repo');

const MEDALS = ['🥇','🥈','🥉'];

function movementSymbol(pos, last) {
  if (!last || last === 0) return '•';
  if (pos < last) return `▲${last - pos}`;
  if (pos > last) return `▼${pos - last}`;
  return '=';
}
function mention(discordId, fallback) {
  return discordId != null ? `<@${discordId.toString()}>` : fallback;
}

function buildGuildRankingText(list, page, perPage, total) {
  if (!list?.length) return 'No hay puntuaciones globales todavía.';
  const startRank = (page - 1) * perPage + 1;
  return list.map((e, idx) => {
    const abs = startRank + idx;
    const tag = abs <= 3 ? MEDALS[abs - 1] : `#${abs}`;
    const mv = movementSymbol(e.position, e.lastPosition);
    return `${tag} ${mention(e.discordId, e.username)} — **${e.points}** pts ${mv}`;
  }).join('\n');
}

async function getGuildRankingFirstPage({ prisma, discordGuildIdStr, guildName, perPage }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);

    await updateGuildPositions(tx, { guildInternalId: guild.id });

    const total = await countGuildRanking(tx, { guildInternalId: guild.id });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = 1;

    const list = await getGuildRankingPage(tx, { guildInternalId: guild.id, perPage, page });
    const description = buildGuildRankingText(list, page, perPage, total);

    return { guild, total, totalPages, page, perPage, list, description };
  });
}

async function getGuildRankingBundle({ prisma, discordGuildIdStr, guildName, perPage, page }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);

    await updateGuildPositions(tx, { guildInternalId: guild.id });

    const total = await countGuildRanking(tx, { guildInternalId: guild.id });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const list = await getGuildRankingPage(tx, { guildInternalId: guild.id, perPage, page: safePage });
    const description = buildGuildRankingText(list, safePage, perPage, total);

    return { guild, total, totalPages, page: safePage, perPage, list, description };
  });
}

module.exports = {
  getGuildRankingFirstPage,
  getGuildRankingBundle,
};
