const { addEventVote } = require("../domain/eventRating.service");
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
    if (!message.content.startsWith("⭐ Califica el evento")) return;

    const eventMatch = message.content.match(/\*\*(.+)\*\*/);
    if (!eventMatch) return;
    const eventLabel = eventMatch[1];

    const emoji = reaction.emoji.name;
    const rating = emojiToRating[emoji];
    if (!rating) return;

    if (!message.guild || !message.guild.id) {
      console.warn("[rate-event] Guild o guild.id indefinido, ignorando reacción.");
      return;
    }

    try {
      const { guildInternalId, userInternalId } = await ensureGuildAndUser(prisma, {
        guildIdStr: message.guild.id,
        guildName: message.guild.name,
        discordUserId: user.id,
        username: user.username,
      });

      const existingVote = await prisma.eventRatingDetail.findUnique({
        where: {
          guildId_userId_event: {
            guildId: guildInternalId,
            userId: userInternalId,
            event: eventLabel,
          },
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

      const avg = await addEventVote({
        prisma,
        guildId: guildInternalId,
        userId: userInternalId,
        event: eventLabel,
        rating,
      });

      try {
        await user.send(
          `✅ Has calificado **${eventLabel}** con **${rating} estrellas**. Promedio actual: ${avg.toFixed(2)}`
        );
      } catch (err) {
        console.error("No se pudo enviar DM", err);
      }

    } catch (err) {
      console.error("Error al registrar la calificación:", err);
    }
  },
};
