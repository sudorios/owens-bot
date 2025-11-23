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

module.exports = {
  SYSTEM_USER_ID,
  AUDITED_MODELS,
};
