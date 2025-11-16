const { SYSTEM_USER_ID, AUDITED_MODELS } = require("../../utils/constants");

function register(prisma) {
  prisma.$use(async (params, next) => {
    const { model, action } = params;

    if (!AUDITED_MODELS.includes(model)) return next(params);

    const now = new Date();

    if (action === "create") {
      params.args.data.created ??= now;
      params.args.data.enabled ??= true; // <-- ajustado al typo de tu modelo
      params.args.data.created_by ??= SYSTEM_USER_ID;
    }

    if (action === "update") {
      params.args.data.updated ??= now;
      params.args.data.updated_by ??= SYSTEM_USER_ID;
    }

    return next(params);
  });
}

module.exports = { register };
