const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User'); 

// Endpoint do rejestracji
router.post('/register', async (req, res) => {
    try {
        const { imie, nazwisko, login, password } = req.body; 

        if (await User.findOne({ login })) {
            return res.status(400).json({ msg: 'Użytkownik o tym loginie już istnieje' });
        }
        
        const userRole = (login === 'milosz.pradela1@gmail.com') ? ROLES.ADMIN : ROLES.READONLY;
        const newUser = new User({ 
            imie, 
            nazwisko, 
            login, 
            password: password, 
            rola: userRole
        });
        await newUser.save();
        res.status(201).json({ msg: 'Użytkownik zarejestrowany pomyślnie' });
    } catch (err) {
        console.error('Błąd w /register:', err);
        res.status(500).json({ msg: 'Błąd serwera', error: err.message });
    }
});


// Endpoint do logowania
router.post('/login', async (req, res) => {
    console.log('--- Rozpoczęto endpoint /login ---');
    try {
        const { login, password } = req.body;
        console.log(`Otrzymano login: ${login}, Otrzymano hasło: ${'*'.repeat(password.length)}`);

        if (!login || !password) {
            console.error('BŁĄD KRYTYCZNY: Brak loginu lub hasła w zapytaniu.');
            return res.status(400).json({ msg: 'Brak loginu lub hasła.' });
        }

        console.log('Krok 1: Wyszukiwanie użytkownika w bazie...');
        const user = await User.findOne({ login }).select('+password');

        if (!user) {
            console.error(`BŁĄD: Nie znaleziono użytkownika dla loginu: ${login}`);
            return res.status(400).json({ msg: 'Nieprawidłowe dane logowania' });
        }

        console.log('Krok 2: Znaleziono użytkownika. Sprawdzanie pola password...');
        console.log('Zawartość obiektu user z bazy:', user);
        console.log('Hasło z bazy (user.password):', user.password);

        if (!user.password) {
            console.error(`BŁĄD KRYTYCZNY: Użytkownik ${login} istnieje, ale nie ma zapisanego hasła w bazie!`);
            return res.status(400).json({ msg: 'Błąd konfiguracji konta, brak hasła.' });
        }
        
        console.log('Krok 3: Porównywanie haseł...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Wynik porównania (isMatch):', isMatch);

        if (!isMatch) {
            console.error(`BŁĄD: Hasła się nie zgadzają dla użytkownika: ${login}`);
            return res.status(400).json({ msg: 'Nieprawidłowe dane logowania' });
        }

        console.log('Krok 4: Hasła zgodne. Generowanie tokenu...');
        const payload = { user: { id: user.id, rola: user.rola } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('--- Zakończono endpoint /login pomyślnie ---');
        res.json({
            token,
            user: { id: user.id, imie: user.imie, rola: user.rola }
        });

    } catch (err) {
        console.error('--- KRYTYCZNY BŁĄD w /login ---');
        console.error(err);
        res.status(500).json({ msg: 'Wystąpił krytyczny błąd serwera.' });
    }
});

router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
}));

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL}/login`,
        session: false
    }),
    (req, res) => {
        const payload = { 
            user: { 
                id: req.user.id, 
                rola: req.user.rola 
            } 
        };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.redirect(`${process.env.CLIENT_URL}/#token=${token}`);
    }
);

module.exports = router;
