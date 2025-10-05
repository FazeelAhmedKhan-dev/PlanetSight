import express from 'express';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function trainLogReg(X, y, { lr = 0.1, epochs = 300 } = {}) {
  const n = X.length;
  const d = X[0].length;
  let w = new Array(d).fill(0);
  let b = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    let dw = new Array(d).fill(0);
    let db = 0;
    for (let i = 0; i < n; i++) {
      const z = b + dot(w, X[i]);
      const a = sigmoid(z);
      const diff = a - y[i];
      for (let j = 0; j < d; j++) {
        dw[j] += diff * X[i][j];
      }
      db += diff;
    }
    for (let j = 0; j < d; j++) {
      w[j] -= (lr / n) * dw[j];
    }
    b -= (lr / n) * db;
  }
  return { w, b };
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function predict(model, x) {
  const z = model.b + dot(model.w, x);
  const p = sigmoid(z);
  return { probability: p, label: p >= 0.5 ? 1 : 0 };
}

function standardizeFit(X) {
  const d = X[0].length;
  const mean = new Array(d).fill(0);
  const std = new Array(d).fill(0);
  const n = X.length;
  for (let j = 0; j < d; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += X[i][j];
    mean[j] = sum / n;
    let varSum = 0;
    for (let i = 0; i < n; i++) varSum += Math.pow(X[i][j] - mean[j], 2);
    std[j] = Math.sqrt(varSum / Math.max(1, n - 1)) || 1;
  }
  const transform = (x) => x.map((v, j) => (v - mean[j]) / std[j]);
  return { mean, std, transform };
}

function loadLocalDataset() {
  const csvPath = path.join(process.cwd(), 'data', 'sample_koi.csv');
  if (!fs.existsSync(csvPath)) return null;
  const content = fs.readFileSync(csvPath, 'utf-8');
  return new Promise((resolve, reject) => {
    parse(
      content,
      { columns: true, skip_empty_lines: true },
      (err, records) => {
        if (err) return reject(err);
        try {
          const X = [];
          const y = [];
          for (const r of records) {
            const f = [
              parseFloat(r.koi_period),
              parseFloat(r.koi_prad),
              parseFloat(r.koi_depth)
            ];
            if (f.some((v) => !isFinite(v))) continue;
            const label = parseInt(r.planet_candidate, 10);
            if (!Number.isInteger(label)) continue;
            X.push(f);
            y.push(label);
          }
          resolve({ X, y });
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

let trained = null;

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', modelTrained: !!trained });
});

app.post('/api/train', async (req, res) => {
  try {
    const dataset = await loadLocalDataset();
    if (!dataset || dataset.X.length < 10) {
      return res.status(500).json({ error: 'Dataset unavailable or too small' });
    }
    const { X, y } = dataset;
    const scaler = standardizeFit(X);
    const Xs = X.map(scaler.transform);
    const model = trainLogReg(Xs, y, { lr: 0.3, epochs: 400 });
    trained = { model, scaler };
    res.json({ ok: true, samples: X.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/predict', (req, res) => {
  try {
    const { koi_period, koi_prad, koi_depth } = req.body;
    if (!trained) return res.status(400).json({ error: 'Model not trained' });
    const features = [
      Number(koi_period),
      Number(koi_prad),
      Number(koi_depth)
    ];
    if (features.some((v) => !isFinite(v))) {
      return res.status(400).json({ error: 'Invalid feature values' });
    }
    const x = trained.scaler.transform(features);
    const { probability, label } = predict(trained.model, x);
    res.json({ probability, is_planet: label === 1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`PlanetSight server running at http://localhost:${PORT}`);
});