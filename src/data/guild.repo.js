async function upsertGuildByDiscordId(tx, guildIdStr, guildName = 'Unknown') {
  const guildIdBigInt = BigInt(guildIdStr);
  return tx.guild.upsert({
    where: { guildId: guildIdBigInt },
    update: { name: guildName },
    create: { guildId: guildIdBigInt, name: guildName },
    select: { id: true },
  });
}

module.exports = { upsertGuildByDiscordId };
