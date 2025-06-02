module.exports = {
    crearquiniela: {
        uso: '?createpool <name>',
        descripcion: 'Creates a new betting pool for this server.'
    },
    combate: {
        uso: '?match <pool> <fight>',
        descripcion: 'Posts a match for users to bet on with emojis.'
    },
    resultado: {
        uso: '?result <messageID> <emoji>',
        descripcion: 'Sets the winning emoji for the match.'
    },
    finalizar: {
        uso: '?finish <pool>',
        descripcion: 'Finishes the betting pool, assigns points, and shows event ranking.'
    },
    ranking: {
        uso: '?ranking',
        descripcion: 'Shows the global ranking for the current server.'
    },
    help: {
        uso: '?help',
        descripcion: 'Shows this help message.'
    },
    calificar: {
        uso: '?rate <match name>',
        descripcion: 'Creates a poll for users to rate a match from 1 to 5 stars.'
    },
    vercalificacion: {
        uso: '?viewrating',
        descripcion: 'Shows the average rating and number of votes for matches in the server.'
    },
    donar: {
        uso: '?donate',
        descripcion: 'Shows options to support the bot development with donations.'
    },
    poolstatus: {
        uso: '?poolstatus',
        descripcion: 'Shows the list of betting pools created in this server.'
    },
    finishSeason: {
        uso: '?finishseason <seasonName>',
        descripcion: 'Ends the current season, saves the winner and the season name.'
    },
    seasons: {
        uso: '?seasons',
        descripcion: 'Displays the list of winners for all seasons recorded in the server.'
    }
};
