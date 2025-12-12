const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase } = require('./database/init');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// API routes
app.use('/api', apiRoutes);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Initialize database and start server
initDatabase()
    .then((db) => {
        console.log('Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`Kanban app running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });