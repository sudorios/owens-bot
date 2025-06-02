const handleCrearQuiniela = require('./handlers/pools/createPool');
const handlePoolStatus = require('./handlers/pools/poolstatus');
const handleAgregarCombate = require('./handlers/pools/match');
const handleGuardarResultado = require('./handlers/pools/result');
const handleFinalizarQuiniela = require('./handlers/pools/finish');
const handleRanking = require('./handlers/pools/ranking');
const handleHelp = require('./handlers/help');
const handleCalificar = require('./handlers/rate/rate');
const handleVerCalificacion = require('./handlers/rate/viewRating');
const handleDonar = require('./handlers/donate');

const handleFinishSeason = require('./handlers/pools/finishSeason');
const handleSeasons = require('./handlers/pools/seasons');

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
    finishSeason: (msg) => handleFinishSeason(msg),
    seasons: (msg) => handleSeasons(msg)
});
