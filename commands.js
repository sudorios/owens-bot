// commands.js
const handleCrearQuiniela = require('./handlers/createPool');
const handlePoolStatus = require('./handlers/poolstatus');
const handleAgregarCombate = require('./handlers/match');
const handleGuardarResultado = require('./handlers/result');
const handleFinalizarQuiniela = require('./handlers/finish');
const handleRanking = require('./handlers/ranking');
const handleHelp = require('./handlers/help');
const handleCalificar = require('./handlers/rate');
const handleVerCalificacion = require('./handlers/viewRating');
const handleDonar = require('./handlers/donate');

module.exports = (quinielas, apuestas, resultados) => ({
    createpool: (msg) => handleCrearQuiniela(msg, quinielas),
    match: (msg) => handleAgregarCombate(msg, quinielas, apuestas),
    result: (msg) => handleGuardarResultado(msg, quinielas, resultados),
    finish: (msg) => handleFinalizarQuiniela(msg, quinielas, apuestas, resultados),
    ranking: (msg) => handleRanking(msg),
    help: (msg) => handleHelp(msg),
    rate: (msg) => handleCalificar(msg),
    viewrating: (msg) => handleVerCalificacion(msg),
    donate: (msg) => handleDonar(msg),
    poolstatus: (msg) => handlePoolStatus(msg, quinielas),
});
