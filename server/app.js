require('dotenv').config();
const express = require('express');
const app = express();
const gameRoutes = require('./routes/gameRoutes');
const authRoutes = require('./routes/authRoutes');
const { sequelize } = require('./models');
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
//Compek