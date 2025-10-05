import { spawn } from 'child_process';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { koi_prad, koi_teq, koi_depth, koi_duration } = req.body || {};

  // Validate input parameters
  if (!koi_prad || !koi_teq || !koi_depth || !koi_duration) {
    return res.status(400).json({ error: 'All parameters are required' });
  }

  // Validate that all inputs are numbers
  const params = [koi_prad, koi_teq, koi_depth, koi_duration];
  if (params.some(param => isNaN(parseFloat(param)) || !isFinite(param))) {
    return res.status(400).json({ error: 'All parameters must be valid numbers' });
  }

  try {
    // Create a Python script that imports and uses the model implementation
    const pythonScript = `
import sys
import os
import json
import warnings

# Suppress sklearn warnings
warnings.filterwarnings('ignore')

# Add the public directory to Python path
sys.path.append('${path.join(process.cwd(), 'public').replace(/\\/g, '\\\\')}')

try:
    from model_implementation import predict_planet_status
    
    result = predict_planet_status(${koi_prad}, ${koi_teq}, ${koi_depth}, ${koi_duration})
    print("RESULT_START")
    print(json.dumps(result))
    print("RESULT_END")
    
except Exception as e:
    print("ERROR_START")
    print(str(e))
    print("ERROR_END")
`;

    // Execute Python script
    const python = spawn('python', ['-c', pythonScript]);
    
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      try {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          return res.status(500).json({ 
            error: 'Python execution failed', 
            details: errorOutput 
          });
        }

        // Extract result from output
        const resultMatch = output.match(/RESULT_START\r?\n(.*?)\r?\nRESULT_END/s);
        const errorMatch = output.match(/ERROR_START\r?\n(.*?)\r?\nERROR_END/s);

        if (errorMatch) {
          return res.status(500).json({ 
            error: 'Model execution failed', 
            details: errorMatch[1].trim() 
          });
        }

        if (resultMatch) {
          const result = JSON.parse(resultMatch[1].trim());
          return res.status(200).json(result);
        } else {
          return res.status(500).json({ 
            error: 'Could not parse model output',
            output: output
          });
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        return res.status(500).json({ 
          error: 'Failed to parse model results',
          details: parseError.message
        });
      }
    });

    python.on('error', (error) => {
      console.error('Python spawn error:', error);
      return res.status(500).json({ 
        error: 'Failed to execute Python script',
        details: error.message
      });
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}