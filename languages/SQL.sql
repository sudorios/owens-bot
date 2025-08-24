INSERT INTO "Question" (
  "eventId",
  "question",
  "answer",
  "points",
  "messageId",
  "channelId",
  "pollDurationHours",
  "pollEndsAt",
  "createdAt",
  "updatedAt"
) VALUES (
  13,
  '1- Lucha en equipos en jaula',
  NULL,
  1,
  '1408869125039587391',
  '1295172061014130823',
  24,
  NOW() + interval '24 hours',
  NOW(),
  NOW()
)
RETURNING "id";


INSERT INTO "QuestionOption" (
  "questionId",
  "index",
  "label") VALUES (
  12,
  0,
  'Omega, Ibushi, Darby, Tanahashi y Ospreay'
)
RETURNING "id";

INSERT INTO "QuestionOption" (
  "questionId",
  "index",
  "label") VALUES (
  12,
  0,
  'Castagnoli, Moxley, Kidd y los Young Bucks
'
)
RETURNING "id";