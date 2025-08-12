async function upsertGuildUserPoints(tx, { userId, guildId, delta }) {
  const row = await tx.guildUser.findFirst({
    where: { userId, guildId },
    select: { id: true, points: true },
  });
  if (row) {
    return tx.guildUser.update({
      where: { id: row.id },
      data: { points: row.points + delta },
    });
  }
  return tx.guildUser.create({
    data: { userId, guildId, points: delta, role: "member" },
  });
}

async function countGuildRanking(tx, { guildInternalId }) {
  return tx.guildUser.count({
    where: { guildId: Number(guildInternalId) },
  });
}

async function getGuildRankingPage(tx, { guildInternalId, perPage = 10, page = 1 }) {
  const take = Math.min(Math.max(perPage, 1), 50);
  const skip = Math.max(page - 1, 0) * take;

  const rows = await tx.guildUser.findMany({
    where: { guildId: Number(guildInternalId) },
    select: {
      userId: true, guildId: true, points: true,
      position: true, lastPosition: true,
      user: { select: { username: true, userId: true } }, 
    },
    orderBy: [{ points: 'desc' }, { userId: 'asc' }], 
    take, skip,
  });

  return rows.map(r => ({
    userId: r.userId,
    guildId: r.guildId,
    points: r.points,
    position: r.position,
    lastPosition: r.lastPosition,
    username: r.user?.username ?? `User#${r.userId}`,
    discordId: r.user?.userId ?? null,
  }));
}

async function updateGuildPositions(tx, { guildInternalId }) {
  const gid = Number(guildInternalId);
  if (!Number.isInteger(gid)) throw new Error('guildInternalId inválido');

  const all = await tx.guildUser.findMany({
    where: { guildId: gid },
    select: { id: true, points: true, position: true },
    orderBy: [{ points: 'desc' }, { id: 'asc' }],
  });

  let updates = 0;
  let rank = 0;
  let prevPoints = null;

  for (let i = 0; i < all.length; i++) {
    const row = all[i];
    if (prevPoints === null || row.points !== prevPoints) {
      rank += 1;                   
      prevPoints = row.points;
    }
    if (row.position !== rank) {
      await tx.guildUser.update({
        where: { id: row.id },
        data: { lastPosition: row.position, position: rank },
      });
      updates++;
    }
  }
  return { updates, total: all.length };
}
module.exports = { upsertGuildUserPoints, updateGuildPositions, countGuildRanking, getGuildRankingPage };
