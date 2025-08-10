
async function getEventById(tx, eventId) {
  return tx.event.findUnique({ where: { id: Number(eventId) } });
}

async function findOpenDuplicateQuestion(tx, { eventId, text }) {
  return tx.question.findFirst({
    where: {
      eventId: Number(eventId),
      question: text.trim(),
      answer: null,
    },
    select: { id: true },
  });
}

async function createQuestion(tx, { eventId, text, points }) {
  return tx.question.create({
    data: {
      eventId: Number(eventId),
      question: text.trim(),
      points: Number.isFinite(points) ? Number(points) : 1,
    },
    select: {
      id: true,
      eventId: true,
      question: true,
      points: true,
      messageId: true,
      createdAt: true,
    },
  });
}

async function attachMessageId(tx, { questionId, messageId }) {
  return tx.question.update({
    where: { id: Number(questionId) },
    data: { messageId: String(messageId) },
    select: { id: true, messageId: true },
  });
}

module.exports = {
  getEventById,
  findOpenDuplicateQuestion,
  createQuestion,
  attachMessageId,
};
