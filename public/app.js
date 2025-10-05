const tryBtn = document.getElementById('tryBtn');
const backBtn = document.getElementById('backBtn');
const form = document.getElementById('predictForm');
const resultEl = document.getElementById('result');
const trySection = document.querySelector('.try-section');

// Input validation functions
function isValidNumber(value) {
  return !isNaN(value) && !isNaN(parseFloat(value)) && isFinite(value);
}

function validateInput(input) {
  const value = input.value.trim();
  const errorEl = input.parentElement.querySelector('.error-message');
  
  if (value === '') {
    showError(input, 'This field is required');
    return false;
  }
  
  if (!isValidNumber(value)) {
    showError(input, 'Please enter a valid number');
    return false;
  }
  
  const num = parseFloat(value);
  if (num < 0) {
    showError(input, 'Please enter a positive number');
    return false;
  }
  
  hideError(input);
  return true;
}

function showError(input, message) {
  input.classList.add('error');
  let errorEl = input.parentElement.querySelector('.error-message');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    input.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function hideError(input) {
  input.classList.remove('error');
  const errorEl = input.parentElement.querySelector('.error-message');
  if (errorEl) {
    errorEl.remove();
  }
}

function validateAllInputs() {
  const inputs = form.querySelectorAll('input[type="text"]');
  let allValid = true;
  
  inputs.forEach(input => {
    if (!validateInput(input)) {
      allValid = false;
    }
  });
  
  return allValid;
}

function showForm() {
  trySection.classList.add('hidden');
  form.classList.remove('hidden');
  resultEl.classList.add('hidden');
}

function showTryButton() {
  form.classList.add('hidden');
  resultEl.classList.add('hidden');
  trySection.classList.remove('hidden');
}

async function predict(e) {
  e.preventDefault();
  
  // Validate all inputs before submission
  if (!validateAllInputs()) {
    return; // Stop submission if validation fails
  }
  
  const koi_prad = document.getElementById('koi_prad').value;
  const koi_teq = document.getElementById('koi_teq').value;
  const koi_depth = document.getElementById('koi_depth').value;
  const koi_duration = document.getElementById('koi_duration').value;
  
  // Get the submit button and show loading state
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';
  
  resultEl.classList.add('hidden');
  resultEl.textContent = '';
  
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        koi_prad: parseFloat(koi_prad),
        koi_teq: parseFloat(koi_teq), 
        koi_depth: parseFloat(koi_depth),
        koi_duration: parseFloat(koi_duration)
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Analysis failed');
    
    // Map prediction results to display format
    let label, emoji, confidence;
    const predictionType = data.prediction;
    const confidenceScore = (data.confidence * 100).toFixed(1);
    
    switch(predictionType) {
      case 'CONFIRMED':
        emoji = '🪐';
        label = 'Confirmed Planet';
        break;
      case 'CANDIDATE':
        emoji = '🌟';
        label = 'Planet Candidate';
        break;
      case 'FALSE POSITIVE':
        emoji = '⭐';
        label = 'False Positive';
        break;
      default:
        emoji = '❓';
        label = 'Unknown';
    }
    
    // Determine confidence level
    const confLevel = data.confidence > 0.7 ? 'High' : data.confidence > 0.5 ? 'Medium' : 'Low';
    
    resultEl.innerHTML = `
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 10px;">${emoji} ${label}</div>
      <div style="opacity: 0.9; margin-bottom: 10px;">Confidence: ${confLevel} (${confidenceScore}%)</div>
      <div style="font-size: 12px; opacity: 0.7;">
        <div>Probabilities:</div>
        <div>• Confirmed: ${(data.probabilities.confirmed * 100).toFixed(1)}%</div>
        <div>• Candidate: ${(data.probabilities.candidate * 100).toFixed(1)}%</div>
        <div>• False Positive: ${(data.probabilities.false_positive * 100).toFixed(1)}%</div>
      </div>
    `;
    resultEl.classList.remove('hidden');
  } catch (error) {
    resultEl.innerHTML = `<div style="color: var(--error-color);">Error: ${error.message}</div>`;
    resultEl.classList.remove('hidden');
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Event listeners
tryBtn.addEventListener('click', showForm);
backBtn.addEventListener('click', showTryButton);
form.addEventListener('submit', predict);

// Add real-time validation to all input fields
document.addEventListener('DOMContentLoaded', function() {
  const inputs = ['koi_prad', 'koi_teq', 'koi_depth', 'koi_duration'];
  
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      // Validate on blur (when user leaves the field)
      input.addEventListener('blur', function() {
        validateInput(this);
      });
      
      // Clear errors on input (while typing)
      input.addEventListener('input', function() {
        if (this.classList.contains('error')) {
          hideError(this);
        }
      });
      
      // Prevent non-numeric characters (except decimal point and minus sign)
      input.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.which);
        const value = this.value;
        
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
          return;
        }
        
        // Allow: numbers, decimal point, minus sign at start
        if (!/[\d\.\-]/.test(char) || 
            (char === '.' && value.includes('.')) ||
            (char === '-' && (value.includes('-') || this.selectionStart !== 0))) {
          e.preventDefault();
        }
      });
    }
  });
});