const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { User, ROLES } = require('../models/User'); 

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Krok 1: Wysłanie linku do resetu
router.post('/forgot', async (req, res) => {
    try {
        const user = await User.findOne({ login: req.body.login });
        if (!user) {
            return res.status(200).json({ msg: 'Jeśli użytkownik istnieje, link do resetu został wysłany.' });
        }
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 godzina
        await user.save();
        const resetLink = `${process.env.CLIENT_URL}/#reset-password?token=${token}`;
        await transporter.sendMail({
            to: user.login,
            from: process.env.EMAIL_USER,
            subject: 'ManagMe - Resetowanie hasła',
            text: `Aby zresetować hasło, kliknij w poniższy link (ważny 1 godzinę):\n\n${resetLink}`
        });
        res.status(200).json({ msg: 'Link do resetu został wysłany.' });
    } catch (err) {
        res.status(500).json({ msg: 'Błąd serwera' });
    }
});

// Krok 2: Ustawienie nowego hasła
router.post('/reset', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ msg: 'Token jest nieprawidłowy lub wygasł.' });
        }
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ msg: 'Hasło zostało pomyślnie zmienione.' });
    } catch (err) {
        res.status(500).json({ msg: 'Błąd serwera' });
    }
});

module.exports = router;
