// utils/GenericUtil.js

const GenericUtil = {
  // ============================================================
  // Validaciones básicas
  // ============================================================

  isNull(value) {
    return value === null || value === undefined;
  },

  isNotNull(value) {
    return !this.isNull(value);
  },

  isEmpty(value) {
    if (this.isNull(value)) return true;

    if (typeof value === "string") return value.length === 0;

    if (Array.isArray(value)) return value.length === 0;

    if (value instanceof Map || value instanceof Set) return value.size === 0;

    if (typeof value === "object")
      return Object.keys(value).length === 0;

    return false;
  },

  isNotEmpty(value) {
    return !this.isEmpty(value);
  },

  isEmptyTrim(str) {
    return this.isNull(str) || (typeof str === "string" && str.trim().length === 0);
  },

  emptyIfNull(str) {
    return this.isEmpty(str) ? "" : str;
  },

  // ============================================================
  // Base64
  // ============================================================

  decodeBase64(base64) {
    if (!this.isEmptyTrim(base64)) {
      const parts = base64.split(",");
      const raw = parts.length > 1 ? parts[1] : parts[0];

      try {
        return Buffer.from(raw, "base64");
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  toBase64(text) {
    if (this.isNull(text)) return "";
    return Buffer.from(String(text), "utf8").toString("base64");
  },

  // ============================================================
  // Helpers numéricos
  // ============================================================

  fillZero(number, length) {
    return String(number).padStart(length, "0");
  },

  getToken() {
    return Math.floor(Math.random() * 900000) + 100000;
  },

  getClaveSMS(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // ============================================================
  // Strings
  // ============================================================

  truncate(text, length) {
    if (this.isNull(text)) return "";
    const s = String(text);
    return s.length <= length ? s : s.substring(0, length);
  },

  trim(text) {
    if (this.isNull(text)) return "";
    return String(text)
      .normalize("NFD")
      .replace(/[\p{Diacritic}]/gu, "")
      .replace(/\s+/g, "_")
      .replace(/[\\/:*?"<>|]/g, "");
  },

  replaceSpaces(str) {
    if (this.isNull(str)) return null;
    return String(str).replace(/ /g, "_");
  },

  // ============================================================
  // Colecciones
  // ============================================================

  distinctByKey(keyFn) {
    const seen = new Set();
    return (item) => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    };
  },

  // ============================================================
  // Validaciones numéricas estilo BigDecimal
  // ============================================================

  isGreaterThanZero(value) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0;
  },

  // ============================================================
  // Transformaciones de objetos
  // ============================================================

  toUpperCase(obj) {
    if (this.isNull(obj) || typeof obj !== "object") return;

    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === "string" && val.trim() !== "") {
        obj[key] = val.toUpperCase();
      }
    }
  },

  // ============================================================
  // Mensajes comunes
  // ============================================================

  fillMessageError(index, message) {
    return `${message} -> fila ${index + 1}`;
  },
};

module.exports = GenericUtil;
