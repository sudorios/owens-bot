async function upsertGuildByDiscordId(tx, guildIdStr, guildName = 'Unknown') {
  const guildIdBigInt = BigInt(guildIdStr);
  return tx.guild.upsert({
    where: { guildId: guildIdBigInt },
    update: { name: guildName },
    create: { guildId: guildIdBigInt, name: guildName },
    select: { id: true },
  });
}

async function getInternalGuildId(tx, discordGuildId) {
  const guild = await tx.guild.findUnique({
    where: { guildId: BigInt(discordGuildId) }, 
  });
  if (!guild) throw new Error(`Guild not found for Discord ID ${discordGuildId}`);
  return guild.id; 
}

module.exports = { upsertGuildByDiscordId, getInternalGuildId };
