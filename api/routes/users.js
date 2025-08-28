const express = require('express');
const router = express.Router();
const { User, ROLES } = require('../models/User'); 
const Project = require('../models/Project');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const { permit } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const usersWithTaskCount = await User.aggregate([
            {
                $lookup: {
                    from: 'tasks',
                    localField: '_id',
                    foreignField: 'assignedTo',
                    as: 'userTasks'
                }
            },
            {
                $addFields: {
                    taskCount: { $size: '$userTasks' }
                }
            },
            {
                $project: {
                    userTasks: 0,
                    password: 0,
                    __v: 0,
                    resetPasswordToken: 0,
                    resetPasswordExpires: 0
                }
            }
        ]);
        
        res.json(usersWithTaskCount);
    } catch (err) {
        console.error("Błąd w GET /api/users (agregacja):", err.message);
        res.status(500).send('Błąd serwera');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const [user, projects, tasks] = await Promise.all([
            User.findById(userId).select('-password').lean(),
            Project.find({ team: userId }).lean(),
            Task.find({ assignedTo: userId }).populate('project', 'name').lean()
        ]);
        
        if (!user) {
            return res.status(404).json({ msg: 'Użytkownik nie znaleziony' });
        }
        
        res.json({ ...user, projects, tasks });
    } catch (err) {
        console.error("Błąd w GET /api/users/:id:", err.message);
        res.status(500).send('Błąd serwera');
    }
});

router.put('/:id/role', permit(ROLES.ADMIN), async (req, res) => {
    try {
        const { rola } = req.body;
        if (!rola || !Object.values(ROLES).includes(rola)) {
            return res.status(400).json({ msg: 'Nieprawidłowa rola.' });
        }
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ msg: 'Użytkownik nie znaleziony.' });
        }
        if (userToUpdate.login === 'milosz.pradela1@gmail.com' && rola !== ROLES.ADMIN) {
             return res.status(400).json({ msg: 'Nie można zmienić roli głównego administratora.' });
        }
        userToUpdate.rola = rola;
        await userToUpdate.save();
        res.json({ msg: 'Rola użytkownika została zaktualizowana.', user: userToUpdate });
    } catch (error) {
        console.error('Błąd podczas zmiany roli:', error);
        res.status(500).json({ msg: 'Błąd serwera.' });
    }
});

router.delete('/:id', permit(ROLES.ADMIN), async (req, res) => {
    console.log(`Próba usunięcia użytkownika o ID: ${req.params.id}`);
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ msg: 'Użytkownik nie znaleziony.' });
        }
        if (userToDelete.login === 'milosz.pradela1@gmail.com') {
            return res.status(400).json({ msg: 'Nie można usunąć konta głównego administratora.' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Użytkownik został pomyślnie usunięty.' });
    } catch (error) {
        console.error(`Błąd podczas usuwania użytkownika ${req.params.id}:`, error);
        res.status(500).json({ msg: 'Błąd serwera podczas usuwania użytkownika.' });
    }
});

module.exports = router;
