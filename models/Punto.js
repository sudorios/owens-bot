const { Schema, model } = require('mongoose');

const PuntoSchema = new Schema({
    userID: { type: String, required: true, unique: true },
    username: String,
    score: { type: Number, default: 0 }
});

module.exports = model('Punto', PuntoSchema);