const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const { permit, ROLES } = require('../middleware/roleMiddleware');

const EDIT_ACCESS = [ROLES.ADMIN, ROLES.DEVOPS, ROLES.DEVELOPER];

// --- Funkcja pomocnicza do czyszczenia danych o zespole ---
const sanitizeTeam = (team) => {
    if (!Array.isArray(team)) {
        return [];
    }
    return team.filter(id => id && mongoose.Types.ObjectId.isValid(id));
};

// GET /api/projects - Dostępny dla wszystkich zalogowanych
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await Project.find().populate('team', 'imie nazwisko');
        res.json(projects);
    } catch (err) {
        console.error('Błąd w GET /api/projects:', err.message);
        res.status(500).send('Błąd serwera');
    }
});

// POST /api/projects - Tylko dla uprawnionych ról
router.post('/', authMiddleware, permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const { name, description, deadline, status } = req.body;
        const team = sanitizeTeam(req.body.team);

        const newProject = new Project({ name, description, deadline, team, status });
        await newProject.save();
        
        const populatedProject = await Project.findById(newProject._id).populate('team', 'imie nazwisko');
        res.status(201).json(populatedProject);
    } catch (err) {
        console.error('Błąd zapisu projektu:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(400).json({ msg: 'Błąd podczas tworzenia projektu.' });
    }
});

// PUT /api/projects/:id - Tylko dla uprawnionych ról
router.put('/:id', authMiddleware, permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const { name, description, deadline, status } = req.body;
        const team = sanitizeTeam(req.body.team);

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { name, description, deadline, team, status },
            { new: true, runValidators: true }
        ).populate('team', 'imie nazwisko');
        
        if (!project) {
            return res.status(404).json({ msg: 'Projekt nie znaleziony' });
        }
        
        res.json(project);
    } catch (err) {
        console.error('Błąd aktualizacji projektu:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(400).json({ msg: 'Błąd podczas aktualizacji projektu.' });
    }
});
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('team', 'imie nazwisko');
        
        if (!project) {
            return res.status(404).json({ msg: 'Nie znaleziono projektu' });
        }
        
        res.json(project);
    } catch (err) {
        console.error('Błąd w GET /api/projects/:id:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Nie znaleziono projektu (nieprawidłowe ID)' });
        }
        res.status(500).send('Błąd serwera');
    }
});

// DELETE /api/projects/:id - Tylko dla uprawnionych ról (z kaskadowym usuwaniem)
router.delete('/:id', authMiddleware, permit(...EDIT_ACCESS), async (req, res) => {
    try {
        console.log(`Próba usunięcia projektu o ID: ${req.params.id}`);
        
        const project = await Project.findByIdAndDelete(req.params.id);
        
        if (!project) {
            return res.status(404).json({ msg: 'Projekt nie znaleziony' });
        }
        
        console.log(`Projekt "${project.name}" został usunięty wraz z zadaniami`);
        res.json({ msg: 'Projekt i wszystkie związane zadania zostały usunięte' });
        
    } catch (err) {
        console.error('Błąd usuwania projektu:', err);
        res.status(500).json({ msg: 'Błąd serwera podczas usuwania projektu' });
    }
});

module.exports = router;
