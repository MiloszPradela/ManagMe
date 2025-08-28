// src/routes/milestones.js
const express = require('express');
const router = express.Router();
const Milestone = require('../models/Milestone');
const authMiddleware = require('../middleware/authMiddleware');
const { permit, ROLES } = require('../middleware/roleMiddleware'); // Dodany import

router.use(authMiddleware);

// Zdefiniuj, kto ma uprawnienia do edycji
const EDIT_ACCESS = [ROLES.ADMIN, ROLES.DEVOPS, ROLES.DEVELOPER, ROLES.USER];

// --- Trasy GET (dostępne dla wszystkich) ---
router.get('/', async (req, res) => {
    try {
        const milestones = await Milestone.find().populate('story', 'name');
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: "Błąd serwera." });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id).populate('assignedTo', 'imie nazwisko');
        if (!milestone) return res.status(404).json({ message: 'Nie znaleziono kamienia milowego.' });
        res.json(milestone);
    } catch (error) {
        res.status(500).json({ message: "Błąd serwera." });
    }
});

// --- Trasy chronione (POST, PUT, DELETE) ---
router.post('/', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const newMilestone = new Milestone({ ...req.body, status: req.body.status || 'todo' });
        await newMilestone.save();
        res.status(201).json(newMilestone);
    } catch (error) {
        res.status(400).json({ message: "Błąd walidacji danych.", error: error.message });
    }
});

router.put('/:id', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const updatedMilestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMilestone) return res.status(404).json({ message: 'Nie znaleziono kamienia milowego.' });
        res.json(updatedMilestone);
    } catch (error) {
        res.status(400).json({ message: "Błąd aktualizacji.", error: error.message });
    }
});

router.delete('/:id', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        await Milestone.findByIdAndDelete(req.params.id);
        res.json({ message: 'Kamień milowy usunięty pomyślnie.' });
    } catch (error) {
        res.status(500).json({ message: "Błąd serwera przy usuwaniu." });
    }
});

router.post('/:id/assign', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const { userId } = req.body;
        const milestone = await Milestone.findByIdAndUpdate(req.params.id, 
            { assignedTo: userId, status: 'doing', startDate: new Date() },
            { new: true }
        );
        if (!milestone) return res.status(404).json({ message: "Nie znaleziono kamienia milowego" });
        res.json(milestone);
    } catch (error) {
        res.status(500).json({ message: "Błąd przypisywania użytkownika." });
    }
});

router.post('/:id/complete', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const milestone = await Milestone.findByIdAndUpdate(req.params.id, 
            { status: 'done', endDate: new Date() },
            { new: true }
        );
        if (!milestone) return res.status(404).json({ message: "Nie znaleziono kamienia milowego" });
        res.json(milestone);
    } catch (error) {
        res.status(500).json({ message: "Błąd przy oznaczaniu jako zakończony." });
    }
});

module.exports = router;
