const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    status: {
        type: String,
        enum: ['do zrobienia', 'w trakcie', 'zakończone'],
        default: 'do zrobienia'
    },
    priority: { 
        type: String, 
        enum: ['niski', 'średni', 'wysoki'], 
        default: 'średni' 
    },
    deadline: { 
        type: Date 
    },
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    milestones: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Milestone'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
