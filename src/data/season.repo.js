
async function upsertGuildByDiscordId(tx, discordGuildIdStr, guildName = 'Unknown') {
  const guildIdBigInt = BigInt(discordGuildIdStr); 
  return tx.guild.upsert({
    where: { guildId: guildIdBigInt }, 
    update: {
      name: guildName,
    },
    create: {
      guildId: guildIdBigInt,
      name: guildName,
    },
  });
}

async function findActiveSeason(tx, guildInternalId) {
  return tx.season.findFirst({
    where: { guildId: guildInternalId, active: true },
    orderBy: { startDate: 'desc' },
  });
}

async function closeSeason(tx, seasonId) {
  const now = new Date();
  return tx.season.update({
    where: { id: seasonId },
    data: { active: false, endDate: now },
  });
}

async function createSeason(tx, { guildInternalId, name }) {
  const now = new Date();
  return tx.season.create({
    data: {
      guildId: guildInternalId,
      name,
      startDate: now,
      active: true,
    },
  });
}

async function closeActiveSeasonAndCreate({ tx, discordGuildIdStr, guildName, requestedName }) {
  const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);
  let closedSeason = null;
  const active = await findActiveSeason(tx, guild.id); 
  if (active) {
    closedSeason = await closeSeason(tx, active.id);
  }
  const name = requestedName || `Season ${new Date().toISOString().slice(0, 10)}`;
  const newSeason = await createSeason(tx, {
    guildInternalId: guild.id,
    name,
  });

  return { closedSeason, newSeason };
}

module.exports = {
  upsertGuildByDiscordId,
  findActiveSeason,
  closeSeason,
  createSeason,
  closeActiveSeasonAndCreate,
};
