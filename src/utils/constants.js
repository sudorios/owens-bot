const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || "system";

const AUDITED_MODELS = [
  "Guild",
  "Season",
  "Event",
  "Prediction",
  "EventScore",
  "SeasonScore",
  "MatchRating",
  "EventRating",
  "User",
  "Question",
];

const CATALOGO = {
  STATE_EVENT: "STATE_EVENT",
};

const STATE_EVENT = {
  ACTIVE: "STEV001",
  FINISHED: "STEV002",
};

const STATE_LABELS_SPANISH = {
  [STATE_EVENT.ACTIVE]: "ACTIVO",
  [STATE_EVENT.FINISHED]: "TERMINADO"
};

module.exports = {
  SYSTEM_USER_ID,
  AUDITED_MODELS,
  CATALOGO,
  STATE_EVENT,
  STATE_LABELS_SPANISH
};