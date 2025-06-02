const Punto = require('./models/Punto');
const connectDB = require('./db');

async function migrateSeasonField() {
    await connectDB();

    const result = await Punto.updateMany(
        { season: { $exists: false } },
        { $set: { season: 'global' } }
    );

    console.log(`✅ Migrated ${result.modifiedCount} documents by adding 'season' field.`);
    process.exit();
}

migrateSeasonField();
