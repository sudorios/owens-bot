const { EmbedBuilder } = require("discord.js");
const EventFacade = require("../../app/config/facade/event.facade");
const { pad, makeCollector, parseCid, clamp, buildPagingRowGeneric } = require("./shared");

const EV_PREFIX = "evinfo";

function buildEventInfoTable(rows) {
  const headers = [pad("ID", 4), pad("ST", 6), pad("NOMBRE", 20)];
  const sep = "-".repeat(34);

  const lines = rows.map((r) => {
    const id = pad(r.id, 4);
    const state = pad((r.state_code || "-").substring(0, 6), 6);
    const name = pad((r.name || "-").substring(0, 20), 20);
    return [id, state, name].join(" | ");
  });

  return "```text\n" + headers.join(" | ") + "\n" + sep + "\n" + (lines.join("\n") || "Sin eventos") + "\n```";
}

function buildEventInfoEmbed({ season, table, page, totalPages, total }) {
  return new EmbedBuilder()
    .setTitle(`📅 Eventos: ${season.name}`)
    .setDescription(table)
    .setFooter({ text: `Página ${page}/${totalPages} • Total eventos: ${total}` })
    .setColor(0x3498db)
    .setTimestamp(new Date());
}

function buildPagingRowEventInfo({ page, totalPages, perPage }) {
  return buildPagingRowGeneric(
    EV_PREFIX,
    ["prev", page, perPage],
    ["next", page, perPage],
    page <= 1,
    page >= totalPages
  );
}

function attachEventInfoPager({ message, interaction, ctx, meta, ttlMs = 60_000 }) {
  return makeCollector({
    message,
    interaction,
    prefix: EV_PREFIX,
    ttlMs,
    onCollect: async (i) => {
      const parts = parseCid(i.customId, EV_PREFIX, 3);
      if (!parts) return i.deferUpdate().catch(() => {});

      const [dir, pageStr, perStr] = parts;
      const cur = Number(pageStr);
      const per = Number(perStr);

      const nextPage = clamp(dir === "prev" ? cur - 1 : cur + 1, 1, meta.totalPages);

      const facade = new EventFacade(ctx.prisma);

      const bundle = await facade.getEventsPage({
        guildIdStr: meta.guildId,
        guildName: meta.guildName,
        perPage: per,
        page: nextPage,
      });

      if (!bundle || !bundle.season) {
        return i.followUp({ content: "❌ La season ya no está activa o ocurrió un error.", ephemeral: true });
      }

      const table = buildEventInfoTable(bundle.rows);

      const embed = buildEventInfoEmbed({
        season: bundle.season,
        table,
        page: bundle.page,
        totalPages: bundle.totalPages,
        total: bundle.total,
      });

      const row = buildPagingRowEventInfo({
        page: bundle.page,
        totalPages: bundle.totalPages,
        perPage: per,
      });

      await i.update({
        embeds: [embed],
        components: bundle.totalPages > 1 ? [row] : [],
      });
    },
  });
}

module.exports = {
  buildEventInfoTable,
  buildEventInfoEmbed,
  buildPagingRowEventInfo,
  attachEventInfoPager,
};
