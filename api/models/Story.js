const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    nazwa: { type: String, required: true },
    opis: { type: String, required: true },
    priorytet: { type: String, enum: ['niski', 'średni', 'wysoki'], required: true },
    projekt: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    dataUtworzenia: { type: Date, default: Date.now },
    stan: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
    wlasciciel: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Story', storySchema);
