const allpool = require('./handlers/pools/allpool');

const poolHandlers = {
    createPool: require('./handlers/pools/createPool'),
    createPool2: require('./handlers/pools/createpool2'),
    cerrarPool: require('./handlers/pools/cerrarPool'),
    allpool: require('./handlers/pools/allpool'),
    match: require('./handlers/pools/match'),
    result: require('./handlers/pools/result'),
    finish: require('./handlers/pools/finish'),
    poolStatus: require('./handlers/pools/poolstatus'),
    finishSeason: require('./handlers/pools/finishSeason'),
    seasons: require('./handlers/pools/seasons')
};

const rankingHandlers = {
    ranking: require('./handlers/pools/ranking'),
    global: require('./handlers/pools/global')
};

const rateHandlers = {
    rate: require('./handlers/rate/rate'),
    viewRating: require('./handlers/rate/viewRating')
};

const utilityHandlers = {
    help: require('./handlers/help'),
    donate: require('./handlers/donate')
};

module.exports = (quinielas, apuestas, resultados) => {
    const commands = {
        createpool: (msg) => poolHandlers.createPool(msg, quinielas),
        createpool2: (msg) => poolHandlers.createPool2(msg, quinielas),
        cerrarpool: (msg) => poolHandlers.cerrarPool(msg, quinielas, apuestas),
        allpool: (msg) => poolHandlers.allpool(msg),
        match: (msg) => poolHandlers.match(msg, quinielas, apuestas),
        result: (msg) => poolHandlers.result(msg, quinielas, resultados),
        finish: (msg) => poolHandlers.finish(msg, quinielas, apuestas, resultados),
        poolstatus: (msg) => poolHandlers.poolStatus(msg, quinielas),
        finishseason: (msg) => poolHandlers.finishSeason(msg),
        seasons: (msg) => poolHandlers.seasons(msg),
        
        ranking: (msg) => rankingHandlers.ranking(msg),
        global: (msg) => rankingHandlers.global(msg),
        
        rate: (msg) => rateHandlers.rate(msg),
        viewrating: (msg) => rateHandlers.viewRating(msg),
        
        help: (msg) => utilityHandlers.help(msg),
        donate: (msg) => utilityHandlers.donate(msg)
    };

    return commands;
};
