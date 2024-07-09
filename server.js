// Suggested code may be subject to a license. Learn more: ~LicenseLog:1529426007.
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { error } = require('console');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let latestSignal = null;
const signalFilePath = path.join(__dirname, 'latest-signal.json');

async function loadLatestSignal() {
    try {
      const data = await fs.readFile(signalFilePath);
      latestSignal = JSON.parse(data);
      console.log('Latest signal loaded from file');
    } catch (error) {
      console.error('Error loading latest signal:', error); // Log the specific error
    }
  }
  

loadLatestSignal();

app.post('/api/signal', async (req, res) => {
  const signal = req.body;
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

app.get('/api/signal', (req, res) => {
    if (latestSignal) {
        res.json(latestSignal);
    } else {
        res.status(404).json({ error: 'No signal found' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost: ${port}`);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});