const { upsertGuildByDiscordId } = require("./guild.repo");
const { upsertUserByDiscordId } = require("./user.repo");
const { findActiveSeason } = require("./season.repo");

async function ensureGuildAndUser(
  tx,
  { guildIdStr, guildName, discordUserId, username }
) {
  const guild = await upsertGuildByDiscordId(tx, guildIdStr, guildName);
  const user = await upsertUserByDiscordId(tx, discordUserId, username);
  return { guildInternalId: guild.id, userInternalId: user.id };
}

async function createEvent(
  tx,
  { guildInternalId, userInternalId, name, state, seasonId }
) {
  const seasonIdToUse =
    seasonId ?? (await findActiveSeason(tx, guildInternalId));
  if (!seasonIdToUse) throw new Error("No hay Season activa para este guild.");

  return tx.event.create({
    data: {
      guildId: guildInternalId,
      userId: userInternalId,
      seasonId: seasonIdToUse,
      name,
      state,
    },
  });
}

async function getSeasonIdByEventId(tx, eventId) {
  const ev = await tx.event.findUnique({ where: { id: eventId }, select: { seasonId: true } });
  return ev?.seasonId || null;
}

async function upsertEventScore(tx, { userId, guildId, eventId, delta }) {
  const row = await tx.eventScore.findFirst({
    where: { userId, guildId, eventId },
    select: { id: true, points: true },
  });
  if (row) {
    return tx.eventScore.update({ where: { id: row.id }, data: { points: row.points + delta } });
  }
  return tx.eventScore.create({ data: { userId, guildId, eventId, points: delta } });
}


module.exports = {
  ensureGuildAndUser,
  createEvent,
  getSeasonIdByEventId,
  upsertEventScore
};
