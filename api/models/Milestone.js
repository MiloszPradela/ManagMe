const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nazwa milestone jest wymagana']
    },
    description: {
        type: String
    },
    priority: {
        type: String,
        enum: ['niski', 'średni', 'wysoki'],
        default: 'średni'
    },
    status: {
        type: String,
        enum: ['todo', 'doing', 'done'],
        default: 'todo'
    },
    estimatedTime: {
        type: Number,
        min: 0,
        default: 0
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    startDate: {
        type: Date, 
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    story: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Milestone', MilestoneSchema);
