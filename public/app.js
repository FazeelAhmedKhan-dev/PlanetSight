const trainBtn = document.getElementById('trainBtn');
const trainStatus = document.getElementById('trainStatus');
const form = document.getElementById('predictForm');
const resultEl = document.getElementById('result');

async function trainModel() {
  trainBtn.disabled = true;
  trainStatus.textContent = 'Training...';
  resultEl.classList.add('hidden');
  try {
    const res = await fetch('/api/train', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Training failed');
    trainStatus.textContent = `Model trained on ${data.samples} samples`;
  } catch (e) {
    trainStatus.textContent = `Error: ${e.message}`;
  } finally {
    trainBtn.disabled = false;
  }
}

async function predict(e) {
  e.preventDefault();
  const koi_period = document.getElementById('koi_period').value;
  const koi_prad = document.getElementById('koi_prad').value;
  const koi_depth = document.getElementById('koi_depth').value;
  resultEl.classList.add('hidden');
  resultEl.textContent = '';
  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ koi_period, koi_prad, koi_depth })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Prediction failed');
    const label = data.is_planet ? 'Planet Candidate' : 'Not Planet';
    const prob = (data.probability * 100).toFixed(2) + '%';
    resultEl.textContent = `${label} • Confidence: ${prob}`;
    resultEl.style.borderColor = data.is_planet ? 'rgba(110,193,255,0.5)' : 'rgba(255,120,120,0.5)';
    resultEl.classList.remove('hidden');
  } catch (e) {
    resultEl.textContent = `Error: ${e.message}`;
    resultEl.style.borderColor = 'rgba(255,120,120,0.5)';
    resultEl.classList.remove('hidden');
  }
}

trainBtn.addEventListener('click', trainModel);
form.addEventListener('submit', predict);