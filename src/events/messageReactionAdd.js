const { addEventVote } = require("../domain/eventRating.service");
const { addMatchVote } = require("../domain/matchRating.service");
const { prisma } = require("../lib/prisma.js");
const { ensureGuildAndUser } = require("../data/event.repo.js");

const emojiToRating = {
  "1️⃣": 1,
  "2️⃣": 2,
  "3️⃣": 3,
  "4️⃣": 4,
  "5️⃣": 5,
};

module.exports = {
  name: "messageReactionAdd",
  async execute(reaction, user) {
    if (user.bot) return;

    const message = reaction.message;
    const content = message.content;

    let type, label;
    if (content.startsWith("⭐ Califica el evento")) {
      type = "event";
      const match = content.match(/\*\*(.+)\*\*/);
      if (!match) return;
      label = match[1];
    } else if (content.startsWith("🎮 Califica el match")) {
      type = "match";
      const match = content.match(/\*\*(.+)\*\*/);
      if (!match) return;
      label = match[1];
    } else {
      return;
    }

    const emoji = reaction.emoji.name;
    const rating = emojiToRating[emoji];
    if (!rating) return;

    if (!message.guild || !message.guild.id) {
      console.warn("[rate] Guild o guild.id indefinido, ignorando reacción.");
      return;
    }

    try {
      const { guildInternalId, userInternalId } = await ensureGuildAndUser(prisma, {
        guildIdStr: message.guild.id,
        guildName: message.guild.name,
        discordUserId: user.id,
        username: user.username,
      });

      if (type === "event") {
        const existingVote = await prisma.eventRatingDetail.findUnique({
          where: {
            guildId_userId_event: { guildId: guildInternalId, userId: userInternalId, event: label },
          },
        });

        if (existingVote) {
          const userReactions = message.reactions.cache.filter(
            r => r.users.cache.has(user.id) && r.emoji.name !== emoji
          );
          for (const r of userReactions.values()) {
            await r.users.remove(user.id);
          }
        }

        await addEventVote({
          prisma,
          guildId: guildInternalId,
          userId: userInternalId,
          event: label,
          rating,
        });

      } else if (type === "match") {
        const matchRating = await prisma.matchRating.findUnique({
          where: { guildId_match: { guildId: guildInternalId, match: label } }
        });

        const existingVote = matchRating
          ? await prisma.matchRatingDetail.findUnique({
              where: { userId_matchRatingId: { userId: userInternalId, matchRatingId: matchRating.id } }
            })
          : null;

        if (existingVote) {
          const userReactions = message.reactions.cache.filter(
            r => r.users.cache.has(user.id) && r.emoji.name !== emoji
          );
          for (const r of userReactions.values()) {
            await r.users.remove(user.id);
          }
        }

        await addMatchVote({
          prisma,
          guildId: guildInternalId,
          userId: userInternalId,
          match: label,
          rating,
        });
      }

    } catch (err) {
      console.error("Error al registrar la calificación:", err);
    }
  },
};