import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Import the analyze handler
import analyzeHandler from './api/analyze.js';

// Add the analyze route
app.post('/api/analyze', analyzeHandler);

app.listen(PORT, () => {
  console.log(`PlanetSight server running at http://localhost:${PORT}`);
});