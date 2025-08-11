async function getSeasonIdByEventId(tx, eventId) {
  const ev = await tx.event.findUnique({ where: { id: eventId }, select: { seasonId: true } });
  return ev?.seasonId || null;
}

async function upsertEventScore(tx, { userId, guildId, eventId, delta }) {
  const row = await tx.eventScore.findFirst({
    where: { userId, guildId, eventId },
    select: { id: true, points: true },
  });
  if (row) {
    return tx.eventScore.update({ where: { id: row.id }, data: { points: row.points + delta } });
  }
  return tx.eventScore.create({ data: { userId, guildId, eventId, points: delta } });
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

async function upsertGuildUserPoints(tx, { userId, guildId, delta }) {
  const row = await tx.guildUser.findFirst({
    where: { userId, guildId },
    select: { id: true, points: true },
  });
  if (row) {
    return tx.guildUser.update({ where: { id: row.id }, data: { points: row.points + delta } });
  }
  return tx.guildUser.create({ data: { userId, guildId, points: delta, role: 'member' } });
}

module.exports = { getSeasonIdByEventId, upsertEventScore, upsertSeasonScore, upsertGuildUserPoints };
