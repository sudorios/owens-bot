const { ensureGuildAndUser, createEvent } = require('../data/event.repo');
const { findActiveSeason } = require('../data/season.repo');

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

module.exports = { createNewEvent };
