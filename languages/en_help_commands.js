module.exports = {
    createpool: {
        uso: '?createpool <name>',
        descripcion: 'Creates a new betting pool for this server.'
    },
    match: {
        uso: '?match <pool> <fight>',
        descripcion: 'Posts a match for users to bet on with emojis.'
    },
    result: {
        uso: '?result <messageID> <emoji>',
        descripcion: 'Sets the winning emoji for the match.'
    },
    finish: {
        uso: '?finish <pool>',
        descripcion: 'Finishes the betting pool, assigns points, and shows event ranking.'
    },
    ranking: {
        uso: '?ranking',
        descripcion: 'Displays the global ranking for the current season.'
    },
    help: {
        uso: '?help',
        descripcion: 'Shows this help message.'
    },
    rate: {
        uso: '?rate <match name>',
        descripcion: 'Creates a poll for users to rate a match from 1 to 5 stars.'
    },
    viewrating: {
        uso: '?viewrating',
        descripcion: 'Shows the average rating and number of votes for matches in the server.'
    },
    donate: {
        uso: '?donate',
        descripcion: 'Shows options to support the bot development with donations.'
    },
    poolstatus: {
        uso: '?poolstatus',
        descripcion: 'Shows the list of betting pools created in this server.'
    },
    finishseason: {
        uso: '?finishseason',
        descripcion: 'Ends the current season'
    },
    seasons: {
        uso: '?seasons',
        descripcion: 'Displays the list of winners for all seasons recorded in the server.'
    },
    global: {
        uso: '?global',
        descripcion: 'Displays the global ranking across all seasons.'
    }
};
