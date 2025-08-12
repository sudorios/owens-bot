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

module.exports = { upsertGuildUserPoints };
