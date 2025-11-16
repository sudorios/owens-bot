async function upsertUserByDiscordId(tx, userIdStr, username = 'Unknown') {
  const userIdBigInt = BigInt(userIdStr);
  return tx.user.upsert({
    where: { userId: userIdBigInt },
    update: { username },
    create: { userId: userIdBigInt, username },
    select: { id: true },
  });
}

module.exports = { upsertUserByDiscordId };
