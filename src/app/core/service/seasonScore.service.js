//const { upsertGuildByDiscordId, findActiveSeason } = require('../repository/season.repo');
const { countSeasonRanking, getSeasonRankingPage, updateSeasonPositions } = require('../repository/seasonScore.repo');

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
function buildSeasonRankingText(list, page, perPage, total) {
  if (!list?.length) return 'No hay puntuaciones en esta season.';
  const startRank = (page - 1) * perPage + 1;
  return list.map((e, idx) => {
    const absRank = startRank + idx;
    const tag = absRank <= 3 ? MEDALS[absRank - 1] : `#${absRank}`;
    const mv = movementSymbol(e.position, e.lastPosition);
    return `${tag} ${mention(e.discordId, e.username)} — **${e.points}** pts ${mv}`;
  }).join('\n');
}

async function getSeasonRankingFirstPage({ prisma, discordGuildIdStr, guildName, perPage }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);
    const seasonId = await findActiveSeason(tx, guild.id); 
    if (!seasonId) return { season: null };

    const season = await tx.season.findUnique({ where: { id: seasonId }, select: { id: true, name: true } });

    await updateSeasonPositions(tx, { seasonId, guildInternalId: guild.id });

    const total = await countSeasonRanking(tx, { seasonId, guildInternalId: guild.id });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = 1;

    const list = await getSeasonRankingPage(tx, { seasonId, guildInternalId: guild.id, perPage, page });
    const description = buildSeasonRankingText(list, page, perPage, total);

    return { season, total, totalPages, page, perPage, list, description };
  });
}

async function getSeasonRankingBundle({ prisma, discordGuildIdStr, guildName, perPage, page }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);
    const seasonId = await findActiveSeason(tx, guild.id);
    if (!seasonId) return { season: null };

    const season = await tx.season.findUnique({ where: { id: seasonId }, select: { id: true, name: true } });

    await updateSeasonPositions(tx, { seasonId, guildInternalId: guild.id });

    const total = await countSeasonRanking(tx, { seasonId, guildInternalId: guild.id });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const list = await getSeasonRankingPage(tx, { seasonId, guildInternalId: guild.id, perPage, page: safePage });
    const description = buildSeasonRankingText(list, safePage, perPage, total);

    return { season, total, totalPages, page: safePage, perPage, list, description };
  });
}

module.exports = {
  getSeasonRankingFirstPage,
  getSeasonRankingBundle,
};
