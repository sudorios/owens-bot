const QuestionRepository = require("../repository/question.repo");
const GuildUserRepository = require("../../core/repository/guildUser.repo");
const EventRepository = require("../repository/event.repo");
const PredictionRepository = require("../../core/repository/prediction.repo");
const SeasonScoreRepository = require("../../core/repository/seasonScore.repo");

class QuestionService {
  constructor(prisma) {
    this.prisma = prisma;
    this.repo = new QuestionRepository(prisma);
    this.guildUserRepo = new GuildUserRepository(prisma);
    this.eventRepo = new EventRepository(prisma);
    this.predictionRepo = new PredictionRepository(prisma);
    this.seasonScoreRepo = new SeasonScoreRepository(prisma);
  }

  _sanitizeOptions(raw) {
    if (!raw) return ["Yes", "No"];
    const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const uniq = Array.from(new Set(arr));
    const cut = uniq.map((s) => s.slice(0, 55));
    if (cut.length < 2) return ["Yes", "No"];
    return cut.slice(0, 10);
  }

  _normalizeInput({ eventId, text, points, options, hours }) {
    const eid = Number(eventId);
    if (!Number.isInteger(eid) || eid <= 0) throw new Error("eventId debe ser entero positivo.");
    if (!text?.trim()) throw new Error("text es requerido.");
    const pts = points != null ? Number(points) : 1;
    if (!Number.isFinite(pts) || pts < 0) throw new Error("points debe ser ≥ 0.");
    const opts = this._sanitizeOptions(options);
    let hrs = hours != null ? Number(hours) : 24;
    if (!Number.isFinite(hrs) || hrs < 1) hrs = 24;
    if (hrs > 768) hrs = 768;
    return { eventId: eid, text: text.trim(), points: pts, options: opts, pollDurationHours: hrs };
  }

  _nowPlusHours(hours) {
    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) return null;
    const d = new Date();
    d.setHours(d.getHours() + h);
    return d;
  }

  async createQuestion({ guildIdStr, guildName, discordUserId, username, eventId, text, points, options, hours }) {
    const norm = this._normalizeInput({ eventId, text, points, options, hours });
    return this.prisma.$transaction(async (tx) => {
      await this.guildUserRepo.createGuildUser(tx, {
        guildIdStr,
        guildName,
        discordUserId,
        username,
      });
      const event = await this.eventRepo.getEvent(tx, norm.eventId);
      if (!event) throw new Error(`El evento con ID ${norm.eventId} no existe.`);
      const dup = await this.repo.findOpenDuplicateQuestion(tx, { eventId: norm.eventId, text: norm.text });
      if (dup) throw new Error(`Ya existe una pregunta igual abierta (ID ${dup.question_id}).`);
      const pollEndsAt = this._nowPlusHours(norm.pollDurationHours);
      const question = await this.repo.createQuestion(tx, {
        eventId: norm.eventId,
        text: norm.text,
        points: norm.points,
        pollDurationHours: norm.pollDurationHours,
        pollEndsAt,
        createdBy: username,
      });
      if (norm.options && norm.options.length > 0) {
        await this.repo.createOptions(tx, question.question_id, norm.options, username);
      }
      return { question, event, normalized: norm };
    });
  }

  async attachMessage({ questionId, messageId, channelId }) {
    return this.repo.attachMessageMeta(this.prisma, { questionId, messageId, channelId });
  }

  async resolveQuestion({ questionId, correctIndex }) {
    return this.prisma.$transaction(async (tx) => {
      const q = await this.repo._getQuestionTable(tx).findUnique({
        where: { question_id: Number(questionId) },
      });

      if (!q) throw new Error("Pregunta no encontrada.");
      if (q.answer) return { alreadyClosed: true, ansLabel: q.answer, questionId: q.question_id };

      const winningOpt = await this.repo.getOptionIdByIndex(tx, {
        questionId: q.question_id,
        index: correctIndex,
      });

      if (!winningOpt) throw new Error(`No existe la opción con índice ${correctIndex} para esta pregunta.`);

      const { winners } = await this.predictionRepo.updateAccuracy(tx, {
        questionId: q.question_id,
        winnerOptionId: winningOpt.question_option_id,
      });

      const delta = q.points;
      const seasonId = await this.eventRepo.getSeasonIdByEventId(tx, q.event_id);

      for (const w of winners) {
        await this.eventRepo.upsertEventScore(tx, {
          userId: w.userId,
          guildId: w.guildId,
          eventId: q.event_id,
          delta,
        });

        if (seasonId) {
          await this.seasonScoreRepo.upsertSeasonScore(tx, {
            userId: w.userId,
            guildId: w.guildId,
            seasonId,
            delta,
          });
        }
      }

      await this.repo.closeQuestion(tx, {
        questionId: q.question_id,
        answerLabel: winningOpt.label,
      });

      return {
        alreadyClosed: false,
        questionId: q.question_id,
        ansLabel: winningOpt.label,
        winners: winners.length,
        delta,
      };
    });
  }
}

module.exports = QuestionService;