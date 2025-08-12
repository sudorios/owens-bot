const { upsertGuildByDiscordId } = require('../data/guild.repo');
const { upsertUserByDiscordId } = require('../data/user.repo');
const { findQuestionByMessageId } = require('../data/question.repo');

async function ingestPollVotes({ prisma, guild, message }) {
  if (!message.poll) return { saved: 0, questionId: null, eventId: null, pollAnswers: [] };

  const pollAnswers = Array.from(message.poll.answers.values());
  const votes = [];
  for (let i = 0; i < pollAnswers.length; i++) {
    const voters = await pollAnswers[i].fetchVoters().catch(() => null);
    if (!voters) continue;
    for (const voter of voters.values()) {
      if (voter.bot) continue; 
      votes.push({
        index: i,
        label: (pollAnswers[i]?.text || '').trim(),
        userIdStr: voter.id,
        username: voter.username ?? voter.tag ?? voter.id,
      });
    }
  }

  return prisma.$transaction(async (tx) => {
    const q = await findQuestionByMessageId(tx, { messageId: message.id });
    if (!q) throw new Error('Question no encontrada por messageId');

    if (q.answer) {
      return { saved: 0, questionId: q.id, eventId: q.eventId, pollAnswers, alreadyClosed: true };
    }

    const g = await upsertGuildByDiscordId(tx, guild.id, guild.name);

    let saved = 0, resolvedByLabel = 0, resolvedByIndex = 0;
    for (const v of votes) {
      const u = await upsertUserByDiscordId(tx, v.userIdStr, v.username);

      let opt = null;
      if (v.label) {
        opt = await tx.questionOption.findFirst({
          where: { questionId: q.id, label: { equals: v.label, mode: 'insensitive' } },
          select: { id: true },
        });
        if (opt?.id) resolvedByLabel++;
      }

      if (!opt?.id) {
        opt = await tx.questionOption.findUnique({
          where: { questionId_index: { questionId: q.id, index: v.index } },
          select: { id: true },
        });
        if (opt?.id) resolvedByIndex++;
      }

      if (!opt?.id) continue;

      await tx.prediction.upsert({
        where: { questionId_userId: { questionId: q.id, userId: u.id } },
        update: { optionId: opt.id, eventId: q.eventId, guildId: g.id },
        create: { userId: u.id, guildId: g.id, eventId: q.eventId, questionId: q.id, optionId: opt.id, accuracy: 0 },
      });
      saved++;
    }

    return { saved, questionId: q.id, eventId: q.eventId, pollAnswers, resolvedByLabel, resolvedByIndex };
  });
}

module.exports = { ingestPollVotes };
