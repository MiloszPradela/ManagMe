const express = require('express');
const router = express.Router();
const multer = require('multer');
const { User } = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// --- Konfiguracja Multer do obsługi plików ---
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, res, cb) => {
        cb(null, `${req.user._id}-${Date.now()}-${res.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Dozwolone są tylko pliki graficzne.'), false);
        }
    }
});

router.use(authMiddleware);

// GET /api/auth/me - Pobierz dane zalogowanego użytkownika
router.get('/', async (req, res) => {
    res.json(req.user);
});

// PUT /api/auth/me/settings - Zapisz ustawienia
router.put('/settings', async (req, res) => {
    const { language } = req.body;
    if (language && !['pl', 'en'].includes(language)) {
        return res.status(400).json({ msg: 'Nieprawidłowy język' });
    }
    await User.findByIdAndUpdate(req.user._id, { language });
    res.status(200).json({ msg: 'Ustawienia zapisane' });
});

// PUT /api/auth/me/profile - Zaktualizuj profil
router.put('/profile', async (req, res) => {
    const { imie, nazwisko } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { imie, nazwisko }, { new: true }).select('-password');
    res.json(user);
});

// POST /api/auth/me/avatar - Zmień zdjęcie profilowe
router.post('/avatar', upload.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'Nie wybrano pliku.' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl }, { new: true }).select('-password');
    res.json(user);
});

// DELETE /api/auth/me - Usuń konto
router.delete('/', async (req, res) => {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ msg: 'Konto zostało pomyślnie usunięte.' });
});

module.exports = router;
