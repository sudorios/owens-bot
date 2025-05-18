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
    crearquiniela: (msg) => handleCrearQuiniela(msg, quinielas),
    combate: (msg) => handleAgregarCombate(msg, quinielas, apuestas),
    resultado: (msg) => handleGuardarResultado(msg, quinielas, resultados),
    finalizar: (msg) => handleFinalizarQuiniela(msg, quinielas, apuestas, resultados),
    ranking: (msg) => handleRanking(msg),
    help: (msg) => handleHelp(msg),
    calificar: (msg) => handleCalificar(msg),
    vercalificacion: (msg) => handleVerCalificacion(msg),
    donar: (msg) => handleDonar(msg),
});
