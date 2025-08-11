const { ensureGuildAndUser, createEvent } = require('../data/event.repo');

async function createNewEvent({ prisma, guildIdStr, guildName, discordUserId, username, name, state }) {
  if (!prisma) throw new Error('Prisma no inicializado');

  return prisma.$transaction(async (tx) => {
    const { guildInternalId, userInternalId } = await ensureGuildAndUser(tx, {
      guildIdStr, guildName, discordUserId, username,
    });

    return createEvent(tx, {
      guildInternalId,
      userInternalId,
      name,
      state,
    });
  });
}

module.exports = { createNewEvent };
