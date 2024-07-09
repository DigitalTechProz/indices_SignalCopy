// Suggested code may be subject to a license. Learn more: ~LicenseLog:1529426007.
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const session = require('express-session');
const path = require('path');
const { error } = require('console');
const portfinder = require('portfinder');

const app = express();

app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(express.static(path.join(__dirname, 'public')));

// Check authentication status
app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: req.session.authenticated || false });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // In a real application, you would check these credentials against a database
  if (username === 'admin' && password === 'password') {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.authenticated = false;
  res.json({ success: true });
});


let latestSignal = null;
const signalFilePath = path.join(__dirname, 'latest-signal.json');

async function loadLatestSignal() {
    try {
        const data = await fs.readFile(signalFilePath, 'utf8');
        latestSignal = JSON.parse(data);
        console.log('Latest signal loaded from file');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('Warning: latest-signal.json not found. Starting with no initial signal.');
            latestSignal = null; // Or initialize with a default value
        } else {
            console.error('Error loading latest signal:', error); 
        }
    }
}
  

loadLatestSignal();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/signals', async (req, res) => {
  const signal = req.body;
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  } else
    if(!signal.symbol || !signal.orderType || !signal.volume) {
        return res.status(400).json({ error: 'Invalid signal data' });
    }
    signal.id = Date.now().toString();
    signal.timestamp = new Date().toISOString();

    latestSignal = signal;

    try {
        await fs.writeFile(signalFilePath, JSON.stringify(signal, null, 2));
        console.log('signal saved to file');
    } catch (err) {
        console.error('Error writing signal to file:', err);
    }
    res.json({ message: 'Signal received', id: signal.id });
});

app.get('/api/latest-signal', (req, res) => {
    if (latestSignal) {
        res.json(latestSignal);
    } else {
        res.status(404).json({ error: 'No signal found' });
    }
});

portfinder.getPortPromise().then(port => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

}).catch(err => {
    console.error('Error finding a port:', err);
});

