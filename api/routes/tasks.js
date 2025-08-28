// src/routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const authMiddleware = require('../middleware/authMiddleware');
const { permit, ROLES } = require('../middleware/roleMiddleware'); // Dodany import

// Zastosuj middleware autoryzacji do wszystkich tras w tym pliku
router.use(authMiddleware);

// Zdefiniuj, kto ma uprawnienia do edycji (wszyscy oprócz readonly)
const EDIT_ACCESS = [ROLES.ADMIN, ROLES.DEVOPS, ROLES.DEVELOPER, ROLES.USER];

// --- Trasy GET (dostępne dla wszystkich) ---
router.get('/', async (req, res) => {
    try {
        const query = req.query.projectId ? { project: req.query.projectId } : {};
        const tasks = await Task.find(query)
            .populate('assignedTo', 'imie nazwisko')
            .populate('project', 'name');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'imie nazwisko')
            .populate('project', 'name')
            .populate({
                path: 'milestones',
                populate: { path: 'assignedTo', model: 'User', select: 'imie nazwisko' }
            });
        if (!task) return res.status(404).json({ message: 'Nie znaleziono zadania' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
});

router.get('/:taskId/milestones', async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate({
            path: 'milestones',
            populate: { path: 'assignedTo', select: 'imie nazwisko' }
        });
        if (!task) return res.status(404).json({ message: 'Nie znaleziono zadania' });
        res.json(task.milestones);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
});

// --- Trasy chronione (POST, PUT, DELETE) ---
router.post('/', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ message: 'Błąd walidacji danych', error: error.message });
    }
});

router.put('/:id', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedTask) return res.status(404).json({ message: 'Nie znaleziono zadania' });
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: 'Błąd walidacji danych', error: error.message });
    }
});

router.delete('/:id', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
});

router.post('/:taskId/milestones', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ message: 'Nie znaleziono zadania.' });
        const newMilestone = new Milestone({ ...req.body, story: task.project });
        await newMilestone.save();
        task.milestones.push(newMilestone._id);
        await task.save();
        const populatedMilestone = await Milestone.findById(newMilestone._id).populate('assignedTo', 'imie nazwisko');
        res.status(201).json(populatedMilestone);
    } catch (err) {
        res.status(500).json({ message: 'Błąd serwera', error: err.message });
    }
});

router.delete('/:taskId/milestones/:milestoneId', permit(...EDIT_ACCESS), async (req, res) => {
    try {
        await Milestone.findByIdAndDelete(req.params.milestoneId);
        await Task.findByIdAndUpdate(req.params.taskId, { $pull: { milestones: req.params.milestoneId } });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Błąd podczas usuwania kamienia milowego', error: err.message });
    }
});

module.exports = router;
