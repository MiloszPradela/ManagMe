const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

module.exports = async function(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Brak autoryzacji, token nie znaleziony' });
    }
    
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.user.id).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'Użytkownik nie znaleziony' });
        }
        
        req.user = user; // Przypisujemy cały obiekt użytkownika do `req.user`
        next();

    } catch (err) {
        res.status(401).json({ msg: 'Token nieprawidłowy' });
    }
};
