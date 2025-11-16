

async function countEventRanking(tx, { eventId }) {
  const distinctUsers = await tx.eventScore.findMany({
    where: { eventId: Number(eventId) },
    distinct: ['userId'],
    select: { userId: true },
  });
  return distinctUsers.length;
}

async function getEventRankingPage(tx, { eventId, perPage = 10, page = 1 }) {
  const take = Math.min(Math.max(perPage, 1), 50);
  const skip = Math.max(page - 1, 0) * take;

  const grouped = await tx.eventScore.groupBy({
    by: ['userId', 'guildId', 'eventId'],
    where: { eventId: Number(eventId) },
    _sum: { points: true },
    orderBy: [{ _sum: { points: 'desc' } }, { userId: 'asc' }],
    take,
    skip,
  });

  if (!grouped.length) return [];

  const userIds = grouped.map(g => g.userId);
  const users = await tx.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, userId: true }, 
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  return grouped.map(g => {
    const u = userMap.get(g.userId);
    return {
      userId: g.userId,
      guildId: g.guildId,
      eventId: g.eventId,
      points: g._sum.points || 0,
      username: u?.username ?? `User#${g.userId}`,
      discordId: u?.userId ?? null, 
    };
  });
}

module.exports = { countEventRanking, getEventRankingPage };
