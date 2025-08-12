
function nowPlusHours(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return null;
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d;
}

async function getEventById(tx, eventId) {
  return tx.event.findUnique({ where: { id: Number(eventId) } });
}

async function findOpenDuplicateQuestion(tx, { eventId, text }) {
  return tx.question.findFirst({
    where: { eventId: Number(eventId), question: text.trim(), answer: null },
    select: { id: true },
  });
}

async function createQuestionWithOptions(tx, {
  eventId,
  text,
  points,
  options,
  pollDurationHours,
}) {
  const pollEndsAt = pollDurationHours ? nowPlusHours(pollDurationHours) : null;
  const safePoints = Math.max(1, Number(points) || 1); 

  const question = await tx.question.create({
    data: {
      eventId: Number(eventId),
      question: text.trim(),
      points: safePoints, 
      pollDurationHours: pollDurationHours ?? null,
      pollEndsAt,
    },
    select: { id: true, eventId: true, question: true, points: true, pollDurationHours: true, pollEndsAt: true }
  });

  for (let i = 0; i < options.length; i++) {
    const label = options[i];
    await tx.questionOption.create({
      data: { questionId: question.id, index: i, label },
    });
  }

  return question;
}

async function attachMessageMeta(tx, { questionId, messageId, channelId }) {
  return tx.question.update({
    where: { id: Number(questionId) },
    data: {
      messageId: String(messageId),
      channelId: channelId ? String(channelId) : null,
    },
    select: { id: true, messageId: true, channelId: true },
  });
}

async function findQuestionByMessageId(tx, { messageId }) {
  return tx.question.findFirst({
    where: { messageId: String(messageId) },
    include: { event: true, options: true, predictions: true },
  });
}

async function getOptionIdByIndex(tx, { questionId, index }) {
  const opt = await tx.questionOption.findUnique({
    where: { questionId_index: { questionId, index } },
    select: { id: true },
  });
  return opt?.id || null;
}

async function findWinningPredictions(tx, { questionId, optionId }) {
  return tx.prediction.findMany({
    where: { questionId, optionId },
    select: { id: true, userId: true, guildId: true, eventId: true },
  });
}
async function closeQuestionWithAnswer(tx, { questionId, answer }) {
  return tx.question.update({ where: { id: questionId }, data: { answer } });
}

module.exports = {
  getEventById,
  findOpenDuplicateQuestion,
  createQuestionWithOptions,
  attachMessageMeta,
  findQuestionByMessageId,
  getOptionIdByIndex,
  findWinningPredictions,
  closeQuestionWithAnswer,
};
