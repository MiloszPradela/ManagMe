const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const ROLES = {
  ADMIN: 'admin',
  DEVOPS: 'devops',
  DEVELOPER: 'developer',
  READONLY: 'readonly', 
};

const userSchema = new mongoose.Schema({
    imie: { type: String, required: true },
    nazwisko: { type: String, required: false, default: '' },
    login: { type: String, required: true, unique: true }, 
    avatarUrl: { type: String, default: '' },
    password: { type: String, required: true,select: false },
    rola: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.READONLY,  
    },
    language: {
        type: String,
        default: 'pl', 
        enum: ['pl', 'en']
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES };
