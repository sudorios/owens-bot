
async function upsertGuildByDiscordId(tx, guildIdStr, guildName = 'Unknown') {
  const guildIdBigInt = BigInt(guildIdStr);
  return tx.guild.upsert({
    where: { guildId: guildIdBigInt },
    update: { name: guildName },   
    create: { guildId: guildIdBigInt, name: guildName },
  });
}

async function upsertUserByDiscordId(tx, discordUserIdStr, username = 'Unknown') {
  const userIdBigInt = BigInt(discordUserIdStr);
  return tx.user.upsert({
    where: { userId: userIdBigInt },  
    update: { username },             
    create: { userId: userIdBigInt, username },
  });
}


async function ensureGuildAndUser(tx, { guildIdStr, guildName, discordUserId, username }) {
  const guild = await upsertGuildByDiscordId(tx, guildIdStr, guildName);
  const user  = await upsertUserByDiscordId(tx, discordUserId, username);
  return { guildInternalId: guild.id, userInternalId: user.id };
}

async function createEvent(tx, { guildInternalId, userInternalId, name, state }) {
  return tx.event.create({
    data: {
      guildId: guildInternalId,
      userId: userInternalId,
      name,
      state, 
    },
  });
}

module.exports = {
  ensureGuildAndUser,
  createEvent,
};
