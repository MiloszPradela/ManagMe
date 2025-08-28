const { ROLES } = require('../models/User');

const permit = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user ? req.user.rola : null;

        if (userRole && allowedRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ message: 'Brak uprawnień. Dostęp zabroniony.' });
        }
    };
};

module.exports = { permit, ROLES };
