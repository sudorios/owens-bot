async function countEventWinners(tx, { guildInternalId }) {
  return tx.eventWinner.count({
    where: { guildId: Number(guildInternalId) },
  });
}

async function getEventWinnersPage(tx, { guildInternalId, perPage, page }) {
  const take = Math.min(Math.max(perPage, 1), 50);
  const skip = Math.max(page - 1, 0) * take;

  return tx.eventWinner.findMany({
    where: { guildId: Number(guildInternalId) },
    select: {
      points: true,
      event: { select: { name: true } },
      user: { select: { username: true, userId: true } },
    },
    orderBy: [{ points: 'desc' }, { id: 'asc' }],
    take,
    skip,
  }).then(rows => rows.map(r => ({
    username: r.user?.username ?? `User#${r.userId}`,
    discordId: r.user?.userId ?? null,
    points: r.points,
    eventName: r.event?.name ?? 'Evento desconocido',
  })));
}


module.exports = { countEventWinners, getEventWinnersPage };
