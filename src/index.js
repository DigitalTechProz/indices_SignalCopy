import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import { promises as fs } from 'fs';
import portfinder from 'portfinder';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import pool from './db.js'; // Make sure the path is correct
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_KEY || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(express.static(path.join(__dirname, 'public')));
const signalFilePath = path.join(__dirname, 'latest-signal.json');
let latestSignal = null;
async function loadLatestSignal() {
    try {
        const data = await fs.readFile(signalFilePath, 'utf8');
        latestSignal = JSON.parse(data);
        console.log('Latest signal loaded from file');
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Warning: latest-signal.json not found. Starting with no initial signal.');
            latestSignal = null;
        }
        else {
            console.error('Error loading latest signal:', error);
        }
    }
}
await loadLatestSignal();
app.get('/api/check-auth', (req, res) => {
    res.json({ authenticated: req.session.authenticated || false });
});
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        req.session.authenticated = true;
        res.json({ success: true });
    }
    else {
        res.json({ success: false });
    }
});
app.post('/api/logout', (req, res) => {
    req.session.authenticated = false;
    res.json({ success: true });
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/api/signals', async (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const signal = req.body;
    if (!signal.symbol || !signal.orderType || !signal.volume) {
        return res.status(400).json({ error: 'Invalid signal data' });
    }
    signal.id = Date.now().toString();
    signal.timestamp = new Date().toISOString();
    latestSignal = signal;
    try {
        await fs.writeFile(signalFilePath, JSON.stringify(signal, null, 2));
        console.log('Signal saved to file');
        // Save signal to database
        const query = 'INSERT INTO signals(id, symbol, order_type, volume, timestamp) VALUES($1, $2, $3, $4, $5)';
        const values = [signal.id, signal.symbol, signal.orderType, signal.volume, signal.timestamp];
        await pool.query(query, values);
        console.log('Signal saved to database');
        res.json({ message: 'Signal received', id: signal.id });
    }
    catch (err) {
        console.error('Error saving signal:', err);
        res.status(500).json({ error: 'Error saving signal' });
    }
});
app.get('/api/latest-signal', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM signals ORDER BY timestamp DESC LIMIT 1');
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ error: 'No signal found' });
        }
    }
    catch (err) {
        console.error('Error fetching latest signal:', err);
        res.status(500).json({ error: 'Error fetching latest signal' });
    }
});
// Database connection test
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.send(`Database connected: ${result.rows[0].now}`);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error: error connecting to database');
    }
});
const port = await portfinder.getPortPromise();
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
