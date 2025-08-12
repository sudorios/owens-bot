
async function countSeasonRanking(tx, { seasonId, guildInternalId }) {
  return tx.seasonScore.count({
    where: { seasonId: Number(seasonId), guildId: Number(guildInternalId) },
  });
}

async function getSeasonRankingPage(tx, { seasonId, guildInternalId, perPage = 10, page = 1 }) {
  const take = Math.min(Math.max(perPage, 1), 50);
  const skip = Math.max(page - 1, 0) * take;

  const rows = await tx.seasonScore.findMany({
    where: { seasonId: Number(seasonId), guildId: Number(guildInternalId) },
    select: { userId: true, guildId: true, seasonId: true, totalPoints: true, position: true, lastPosition: true, user: { select: { username: true, userId: true } } },
    orderBy: [{ totalPoints: 'desc' }, { userId: 'asc' }], 
    take, skip,
  });

  return rows.map(r => ({
    userId: r.userId,
    guildId: r.guildId,
    seasonId: r.seasonId,
    points: r.totalPoints,
    position: r.position,
    lastPosition: r.lastPosition,
    username: r.user?.username ?? `User#${r.userId}`,
    discordId: r.user?.userId ?? null, 
  }));
}

async function updateSeasonPositions(tx, { seasonId, guildInternalId }) {
  const sid = Number(seasonId);
  const gid = Number(guildInternalId);
  if (!Number.isInteger(sid)) throw new Error('seasonId inválido');
  if (!Number.isInteger(gid)) throw new Error('guildInternalId inválido');

  const all = await tx.seasonScore.findMany({
    where: { seasonId: sid, guildId: gid },
    select: { id: true, totalPoints: true, position: true },
    orderBy: [{ totalPoints: 'desc' }, { id: 'asc' }],
  });

  let updates = 0;
  let rank = 0;
  let prevPoints = null;

  for (let i = 0; i < all.length; i++) {
    const row = all[i];
    if (prevPoints === null || row.totalPoints !== prevPoints) {
      rank += 1; 
      prevPoints = row.totalPoints;
    }
    if (row.position !== rank) {
      await tx.seasonScore.update({
        where: { id: row.id },
        data: { lastPosition: row.position, position: rank },
      });
      updates++;
    }
  }
  return { updates, total: all.length };
}

async function upsertSeasonScore(tx, { userId, guildId, seasonId, delta }) {
  const row = await tx.seasonScore.findFirst({
    where: { userId, guildId, seasonId },
    select: { id: true, totalPoints: true },
  });
  if (row) {
    return tx.seasonScore.update({ where: { id: row.id }, data: { totalPoints: row.totalPoints + delta } });
  }
  return tx.seasonScore.create({ data: { userId, guildId, seasonId, totalPoints: delta } });
}

module.exports = {
  countSeasonRanking,
  getSeasonRankingPage,
  updateSeasonPositions,
  upsertSeasonScore
};
