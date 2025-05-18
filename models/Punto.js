const { Schema, model } = require('mongoose');

const PuntoSchema = new Schema({
    guildID: { type: String, required: true },
    userID: { type: String, required: true },
    username: String,
    score: { type: Number, default: 0 }
});

PuntoSchema.index({ guildID: 1, userID: 1 }, { unique: true });

module.exports = model('Punto', PuntoSchema);