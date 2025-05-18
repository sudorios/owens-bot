// commands.js
const handleCrearQuiniela = require('./handlers/crearQuiniela');
const handleAgregarCombate = require('./handlers/agregarCombate');
const handleGuardarResultado = require('./handlers/guardarResultado');
const handleFinalizarQuiniela = require('./handlers/finalizarQuiniela');
const handleRanking = require('./handlers/ranking');
const handleHelp = require('./handlers/help');
const handleCalificar = require('./handlers/calificar');
const handleVerCalificacion = require('./handlers/vercalificacion');
const handleDonar = require('./handlers/donar');

module.exports = (quinielas, apuestas, resultados) => ({
    crearquiniela: (msg, langTexts) => handleCrearQuiniela(msg, quinielas, langTexts),
    combate: (msg, langTexts) => handleAgregarCombate(msg, quinielas, apuestas, langTexts),
    resultado: (msg, langTexts) => handleGuardarResultado(msg, quinielas, resultados, langTexts),
    finalizar: (msg, langTexts) => handleFinalizarQuiniela(msg, quinielas, apuestas, resultados, langTexts),
    ranking: (msg, langTexts) => handleRanking(msg, langTexts),
    help: (msg, langTexts) => handleHelp(msg, langTexts),
    calificar: (msg, langTexts) => handleCalificar(msg, langTexts),
    vercalificacion: (msg, langTexts) => handleVerCalificacion(msg, langTexts),
    donar: (msg, langTexts) => handleDonar(msg, langTexts),
});