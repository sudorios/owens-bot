class QuestionRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  _getQuestionTable(db) {
    return db.question || db.Question;
  }
  
  _getOptionTable(db) {
    return db.question_option || db.QuestionOption || db.questionOption;
  }

  async findOpenDuplicateQuestion(tx, { eventId, text }) {
    const db = tx || this.prisma;
    return this._getQuestionTable(db).findFirst({
      where: { 
          event_id: Number(eventId), 
          question: text.trim(),     
          answer: null               
      },
      select: { question_id: true }, 
    });
  }

  async createQuestion(tx, { eventId, text, points, pollDurationHours, pollEndsAt, createdBy }) {
    const db = tx || this.prisma;
    const safePoints = Math.max(1, Number(points) || 1);

    return this._getQuestionTable(db).create({
      data: {
        event_id: Number(eventId),
        question: text.trim(),
        points: safePoints,
        created: new Date(),
        created_by: createdBy,                
        updated: new Date(), 
      },
    });
  }

  async createOptions(tx, questionId, options, createdBy) {
    const db = tx || this.prisma;
    const optTable = this._getOptionTable(db);
    
    const data = options.map((label, index) => ({
       question_id: Number(questionId),
       index: index,
       label: label,
       created: new Date(),
       created_by: createdBy,
       enabled: true
    }));

    if (optTable.createMany) {
        await optTable.createMany({ data });
    } else {
        for (const d of data) await optTable.create({ data: d });
    }
  }

  async attachMessageMeta(tx, { questionId, messageId, channelId }) {
    const db = tx || this.prisma;
    return this._getQuestionTable(db).update({
      where: { question_id: Number(questionId) },
      data: {
        message_id: String(messageId),
        channel_id: channelId ? String(channelId) : null,
      },
    });
  }

  async findQuestionByMessageId(tx, messageId) {
    const db = tx || this.prisma;
    return this._getQuestionTable(db).findFirst({
      where: { message_id: String(messageId) },
      include: {
        question_options: { 
          orderBy: { index: 'asc' } 
        }
      }
    });
  }

  async getOptionIdByIndex(tx, { questionId, index }) {
    const db = tx || this.prisma;
    const optTable = this._getOptionTable(db);
    
    return optTable.findFirst({
      where: { 
        question_id: Number(questionId), 
        index: Number(index) 
      },
      select: { question_option_id: true, label: true } 
    });
  }

  async closeQuestion(tx, { questionId, answerLabel }) {
    const db = tx || this.prisma;
    return this._getQuestionTable(db).update({
      where: { question_id: Number(questionId) },
      data: { 
        answer: answerLabel, 
        updated: new Date() 
      }
    });
  }
}

module.exports = QuestionRepository;