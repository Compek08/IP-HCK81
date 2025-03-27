const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Changed from user to User

const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Extract the token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by id
        const foundUser = await User.findByPk(decoded.id); // Changed from user to User
        if (!foundUser) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Set user in request
        req.user = {
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

module.exports = { authenticate };