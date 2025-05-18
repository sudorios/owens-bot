const { Schema, model } = require('mongoose');

const CalificacionSchema = new Schema({
    guildID: { type: String, required: true },
    mensajeID: { type: String, required: true, unique: true },
    pelea: { type: String, required: true },
    votos: [
        {
            userID: String,
            calificacion: Number
        }
    ]
});

module.exports = model('Calificacion', CalificacionSchema);
