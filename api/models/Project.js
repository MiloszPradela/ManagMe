const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date },
    team: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['planowany', 'w trakcie', 'zakończony'],
        default: 'planowany'
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
