const { createCanvas, loadImage } = require("canvas");
const { AttachmentBuilder } = require("discord.js");

/**
 * Dibuja un ícono de trofeo simple usando paths de canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx Centro X
 * @param {number} cy Centro Y
 * @param {number} size Tamaño del ícono
 * @param {string} color Color de relleno
 */
function drawTrophyIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";

  // Copa del trofeo
  ctx.beginPath();
  ctx.moveTo(7, 2);
  ctx.lineTo(17, 2);
  ctx.lineTo(17, 8);
  ctx.bezierCurveTo(17, 12, 14, 14, 12, 14);
  ctx.bezierCurveTo(10, 14, 7, 12, 7, 8);
  ctx.closePath();
  ctx.fill();

  // Asas laterales
  ctx.beginPath();
  ctx.moveTo(7, 3);
  ctx.lineTo(3, 3);
  ctx.bezierCurveTo(3, 7, 5, 9, 7, 9);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(17, 3);
  ctx.lineTo(21, 3);
  ctx.bezierCurveTo(21, 7, 19, 9, 17, 9);
  ctx.stroke();

  // Base / pie
  ctx.beginPath();
  ctx.moveTo(12, 14);
  ctx.lineTo(12, 18);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(8, 18, 8, 2.5, 1);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(6, 20.5, 12, 2, 1);
  ctx.fill();

  ctx.restore();
}

/**
 * Genera un banner en imagen para el ganador del evento
 * @param {Object} event Datos del evento
 * @param {Object} winner Datos del ganador
 * @param {Object} interaction Interacción de discord para buscar el avatar
 * @returns {Promise<AttachmentBuilder>} Attachment con la imagen
 */
async function generateWinnerBanner(event, winner, interaction) {
  const WIDTH = 700;
  const HEIGHT = 250;
  const BG = "#181F2B";
  const ACCENT = "#38BDF8";
  const GOLD = "#FBBF24";
  const TEXT_MAIN = "#F1F5F9";
  const TEXT_MUTED = "#CBD5E1";

  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext("2d");

  // ---- Fondo sólido unificado ----
  context.fillStyle = BG;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  // ---- Panel lateral izquierdo (zona avatar) ----
  const panelWidth = 210;

  // Línea divisoria de acento
  context.fillStyle = ACCENT;
  context.fillRect(panelWidth, 0, 3, HEIGHT);

  // ---- Acentos en las esquinas ----
  const cornerSize = 24;
  context.strokeStyle = ACCENT;
  context.lineWidth = 3;
  const drawCorner = (x, y, dx, dy) => {
    context.beginPath();
    context.moveTo(x, y + dy * cornerSize);
    context.lineTo(x, y);
    context.lineTo(x + dx * cornerSize, y);
    context.stroke();
  };
  drawCorner(6, 6, 1, 1);
  drawCorner(WIDTH - 6, 6, -1, 1);
  drawCorner(6, HEIGHT - 6, 1, -1);
  drawCorner(WIDTH - 6, HEIGHT - 6, -1, -1);

  // ---- Título (con ícono de trofeo a cada lado) ----
  const titleY = 45;
  const titleText = "GANADOR DEL EVENTO";
  context.textAlign = "center";
  context.font = "bold 26px sans-serif";
  context.fillStyle = TEXT_MUTED;
  const titleWidth = context.measureText(titleText).width;
  const titleCx = (panelWidth + WIDTH) / 2;

  context.fillText(titleText, titleCx, titleY);
  drawTrophyIcon(context, titleCx - titleWidth / 2 - 26, titleY - 9, 24, GOLD);
  drawTrophyIcon(context, titleCx + titleWidth / 2 + 26, titleY - 9, 24, GOLD);

  // ---- Nombre del evento ----
  context.font = "bold 24px sans-serif";
  context.fillStyle = ACCENT;
  context.fillText(event.name.toUpperCase(), titleCx, 78);

  // Línea separadora bajo el header
  context.strokeStyle = "#33415580";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(panelWidth + 20, 92);
  context.lineTo(WIDTH - 20, 92);
  context.stroke();

  // ---- Avatar ----
  const avatarCx = panelWidth / 2;
  const avatarCy = HEIGHT / 2;
  const avatarR = 55;

  try {
    const dcUser = await interaction.client.users.fetch(winner.user_dc_id.toString()).catch(() => null);
    if (dcUser) {
      const avatarUrl = dcUser.displayAvatarURL({ extension: "png", size: 128 });
      const avatarImg = await loadImage(avatarUrl);

      context.save();
      context.beginPath();
      context.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();
      context.drawImage(avatarImg, avatarCx - avatarR, avatarCy - avatarR, avatarR * 2, avatarR * 2);
      context.restore();
    }
  } catch (e) {
    console.error("No se pudo cargar el avatar del ganador:", e);
  }

  context.beginPath();
  context.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2, true);
  context.strokeStyle = GOLD;
  context.lineWidth = 4;
  context.stroke();

  // ---- Username con auto-fit ----
  const nameX = panelWidth + 30;
  const nameMaxWidth = WIDTH - nameX - 30;
  let fontSize = 44;
  context.textAlign = "left";
  do {
    context.font = `bold ${fontSize}px sans-serif`;
    fontSize -= 2;
  } while (context.measureText(winner.username).width > nameMaxWidth && fontSize > 20);

  context.fillStyle = GOLD;
  context.fillText(winner.username, nameX, 145);

  // ---- Badge de puntos (pill) ----
  const pointsText = `Puntaje Total: ${winner.points} pts`;
  context.font = "bold 20px sans-serif";
  const pillPaddingX = 16;
  const pillHeight = 34;
  const textWidth = context.measureText(pointsText).width;
  const pillWidth = textWidth + pillPaddingX * 2;
  const pillY = 175;

  context.fillStyle = "rgba(255,255,255,0.08)";
  context.beginPath();
  context.roundRect(nameX, pillY, pillWidth, pillHeight, pillHeight / 2);
  context.fill();
  context.strokeStyle = ACCENT;
  context.lineWidth = 1.5;
  context.stroke();

  context.fillStyle = TEXT_MAIN;
  context.textBaseline = "middle";
  context.fillText(pointsText, nameX + pillPaddingX, pillY + pillHeight / 2 + 1);
  context.textBaseline = "alphabetic";

  return new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "winner-banner.png" });
}

module.exports = {
  generateWinnerBanner,
};