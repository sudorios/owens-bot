async function createGuild(tx, discordGuildIdStr, guildName = "Unknown", createdBy) {
  const guildId = BigInt(discordGuildIdStr);
  const existing = await tx.guild.findUnique({
    where: { guild_id: guildId },
  });
  if (existing) return existing;

  return tx.guild.create({
    data: {
      guild_id: guildId,
      name: guildName,
      created: new Date(),
      enabled: true,       
      created_by: createdBy || process.env.USER
    },
  });
}

async function getInternalGuildId(tx, discordGuildId) {
  const guild = await tx.guild.findUnique({
    where: { guildId: BigInt(discordGuildId) },
  });
  if (!guild)
    throw new Error(`Guild not found for Discord ID ${discordGuildId}`);
  return guild.id;
}

module.exports = { createGuild, getInternalGuildId };
