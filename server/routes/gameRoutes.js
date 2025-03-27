const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticate } = require('../middleware/authenticate');

// Apply authentication middleware to all game routes
router.use(authenticate);

// Initialize a new game
router.post('/init', gameController.initGame);

// Get dialogue options for the current state
router.get('/session/:sessionId/options', gameController.getOptions);

// Get dialogue history
router.get('/session/:sessionId/history', gameController.getDialogueHistory);

// Select an option
router.post('/session/:sessionId/select', gameController.selectOption);

// Get player status
router.get('/session/:sessionId/status', gameController.getPlayerStatus);

// Add this line with your other routes
router.get('/session/:sessionId/characters', gameController.getCharacters);

// Add this route
router.get('/sessions', gameController.getUserSessions);

// Delete a session
router.delete('/session/:sessionId', gameController.deleteSession);

module.exports = router;