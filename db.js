const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('🔍 ENV URI:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB Atlas');
    } catch (err) {
        console.error('❌ Error de conexión a MongoDB:', err);
    }
};

module.exports = connectDB;
