const { closeActiveSeasonAndCreate } = require('../data/season.repo');

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

module.exports = { startNewSeason };
