const { closeActiveSeasonAndCreate, upsertGuildByDiscordId, countSeasonsForGuild, listSeasonsForGuildBasic } = require('../data/season.repo');

async function startNewSeason({ prisma, guildId, guildName, requestedName }) {
  if (!prisma) throw new Error('Prisma no inicializado');

  return prisma.$transaction(async (tx) => {
    const { closedSeason, newSeason } = await closeActiveSeasonAndCreate({
      tx,
      discordGuildIdStr: guildId, 
      guildName,                  
      requestedName,
    });
    return { closedSeason, newSeason };
  });
}

async function getSeasonInfoFirstPage({ prisma, discordGuildIdStr, guildName, perPage }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);

    const total = await countSeasonsForGuild(tx, guild.id);
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = 1;

    const rows = total > 0
      ? await listSeasonsForGuildBasic(tx, { guildInternalId: guild.id, skip: 0, take: perPage })
      : [];

    return { rows, total, totalPages, page, perPage, guild };
  });
}

async function getSeasonInfoBundle({ prisma, discordGuildIdStr, guildName, perPage, page }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);

    const total = await countSeasonsForGuild(tx, guild.id);
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const rows = total > 0
      ? await listSeasonsForGuildBasic(tx, {
          guildInternalId: guild.id,
          skip: (safePage - 1) * perPage,
          take: perPage,
        })
      : [];

    return { rows, total, totalPages, page: safePage, perPage, guild };
  });
}

module.exports = { startNewSeason, getSeasonInfoFirstPage, getSeasonInfoBundle };
