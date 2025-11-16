const { ensureGuildAndUser, createEvent, countEventsForSeason, listEventsForSeason } = require('../data/event.repo');
const { upsertGuildByDiscordId } = require('../data/guild.repo');
const { findActiveSeason, getSeasonNameById } = require('../data/season.repo');

async function createNewEvent({ prisma, guildIdStr, guildName, discordUserId, username, name, state }) {
  if (!prisma) throw new Error('Prisma no inicializado');

  return prisma.$transaction(async (tx) => {
    const { guildInternalId, userInternalId } = await ensureGuildAndUser(tx, {
      guildIdStr, guildName, discordUserId, username,
    });

    const seasonId = await findActiveSeason(tx, guildInternalId);
    if (!seasonId) throw new Error('No hay Season activa para este guild.');

    return createEvent(tx, {
      guildInternalId,
      userInternalId,
      name,
      state,
      seasonId,
    });
  });
}


async function getEventInfoFirstPage({ prisma, discordGuildIdStr, guildName, perPage }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);
    const seasonId = await findActiveSeason(tx, guild.id);
    if (!seasonId) return { season: null };

    const season = await getSeasonNameById(tx, seasonId);

    const total = await countEventsForSeason(tx, { seasonId, guildInternalId: guild.id });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = 1;

    const rows = await listEventsForSeason(tx, {
      seasonId, guildInternalId: guild.id, skip: 0, take: perPage,
    });

    return { season, rows, total, totalPages, page, perPage };
  });
}

async function getEventInfoBundle({ prisma, discordGuildIdStr, guildName, perPage, page }) {
  return prisma.$transaction(async (tx) => {
    const guild = await upsertGuildByDiscordId(tx, discordGuildIdStr, guildName);
    const seasonId = await findActiveSeason(tx, guild.id);
    if (!seasonId) return { season: null };

    const season = await getSeasonNameById(tx, seasonId);

    const total = await countEventsForSeason(tx, { seasonId, guildInternalId: guild.id });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(page, 1), totalPages);

    const rows = await listEventsForSeason(tx, {
      seasonId, guildInternalId: guild.id, skip: (safePage - 1) * perPage, take: perPage,
    });

    return { season, rows, total, totalPages, page: safePage, perPage };
  });
}

module.exports = { createNewEvent, getEventInfoBundle, getEventInfoFirstPage };
