<div align="center">
  <img src="PlanetSight_logo.png" alt="PlanetSight Logo" width="200"/>
</div>

# 🌌 PlanetSight

**An AI-powered exoplanet classification system that predicts whether Kepler Objects of Interest (KOI) are confirmed planets, planet candidates, or false positives.**

![PlanetSight Demo](https://img.shields.io/badge/Status-Active-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-blue) ![Python](https://img.shields.io/badge/Python-3.8+-blue)

## 🚀 What is PlanetSight?

PlanetSight is a web application that uses machine learning to analyze exoplanet transit data and classify Kepler Objects of Interest (KOI). The system takes four key astronomical parameters and predicts whether the object is:

- **CONFIRMED** - A confirmed exoplanet
- **CANDIDATE** - A potential planet candidate requiring further study  
- **FALSE POSITIVE** - Not actually a planet

### 🔬 The Science Behind It

The application uses a trained Random Forest machine learning model that analyzes:

- **koi_prad** - Planet radius (in Earth radii)
- **koi_teq** - Equilibrium temperature (in Kelvin)
- **koi_depth** - Transit depth (in parts per million)
- **koi_duration** - Transit duration (in hours)

The model was trained on real Kepler mission data and provides confidence scores and probability distributions for each prediction.

## 🏗️ Architecture

```
PlanetSight/
├── 🌐 Frontend (HTML/CSS/JS)
│   ├── User interface for inputting transit data
│   ├── Real-time prediction results
│   └── Loading states and error handling
│
├── 🔧 Backend (Node.js/Express)
│   ├── REST API endpoints
│   ├── Python script execution
│   └── Static file serving
│
├── 🤖 ML Model (Python/scikit-learn)
│   ├── Pre-trained Random Forest model
│   ├── Feature preprocessing
│   └── Prediction pipeline
│
└── 📊 Model Files
    ├── planetfall_model.pkl (trained model)
    ├── feature_medians.pkl (feature defaults)
    └── Training data and notebooks
```

## 🛠️ Prerequisites

Before running PlanetSight, ensure you have:

- **Node.js** (version 18 or higher)
- **Python** (version 3.8 or higher)
- **npm** (comes with Node.js)

### Required Python Packages

```bash
pip install joblib pandas scikit-learn
```

## 🚀 Quick Start

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd PlanetSight
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
```

The application will be available at: **http://localhost:3000**

## 📖 How to Use

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Enter the transit parameters:**
   - **Planet Radius** (koi_prad): Enter in Earth radii (e.g., 1.2)
   - **Equilibrium Temperature** (koi_teq): Enter in Kelvin (e.g., 500)
   - **Transit Depth** (koi_depth): Enter in parts per million (e.g., 200)
   - **Transit Duration** (koi_duration): Enter in hours (e.g., 5)

3. **Click "Analyze Transit Data"** and wait for the prediction

4. **View Results:**
   - **Prediction**: CONFIRMED, CANDIDATE, or FALSE POSITIVE
   - **Confidence**: Overall confidence score (0-1)
   - **Probabilities**: Breakdown of probabilities for each class

### Example Input Values

Try these sample values to test the system:

```
Planet Radius: 1.2
Equilibrium Temperature: 500
Transit Depth: 200
Transit Duration: 5
```

## 🔧 API Endpoints

### POST `/api/analyze`

Analyzes transit data and returns exoplanet classification.

**Request Body:**
```json
{
  "koi_prad": 1.2,
  "koi_teq": 500,
  "koi_depth": 200,
  "koi_duration": 5
}
```

**Response:**
```json
{
  "prediction": "CONFIRMED",
  "confidence": 0.5066,
  "probabilities": {
    "false_positive": 0.1536,
    "candidate": 0.3398,
    "confirmed": 0.5066
  }
}
```

### GET `/api/status`

Returns server status.

**Response:**
```json
{
  "status": "ok"
}
```

## 📁 Project Structure

```
PlanetSight/
├── 📄 README.md                    # This file
├── 📦 package.json                 # Node.js dependencies
├── 🖥️ server.js                    # Express server
├── 📁 api/
│   ├── analyze.js                  # Main prediction endpoint
│   └── status.js                   # Status endpoint
├── 📁 public/                      # Frontend files
│   ├── index.html                  # Main HTML page
│   ├── app.js                      # Frontend JavaScript
│   ├── styles.css                  # Styling
│   └── model_implementation.py     # Python ML model
├── 📁 exoplanet-ml/               # ML model and data
│   ├── planetfall_model.pkl       # Trained Random Forest model
│   ├── feature_medians.pkl         # Feature default values
│   ├── exoplanets.ipynb           # Training notebook
│   └── koi_dataset.csv            # Original training data
└── 📄 vercel.json                  # Deployment configuration
```

## 🧠 Machine Learning Details

### Model Information
- **Algorithm**: Random Forest Classifier
- **Training Data**: Kepler Objects of Interest (KOI) dataset
- **Features**: 4 primary transit parameters + additional derived features
- **Classes**: 3 (FALSE POSITIVE, CANDIDATE, CONFIRMED)
- **Performance**: Optimized for balanced classification

### Feature Engineering
- **Missing Value Imputation**: Uses feature medians for missing values
- **Feature Scaling**: Applied during training
- **Class Balancing**: Handled during model training

### Model Files
- `planetfall_model.pkl`: Serialized Random Forest model
- `feature_medians.pkl`: Default values for feature imputation

## 🔧 Development

### Running in Development Mode

```bash
# Start the server with auto-restart
npm start
```

### Testing the API

```bash
# Test with curl
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"koi_prad": 1.2, "koi_teq": 500, "koi_depth": 200, "koi_duration": 5}'
```

### Modifying the Model

To retrain or modify the model:

1. Open `exoplanet-ml/exoplanets.ipynb`
2. Modify the training pipeline
3. Save the new model as `planetfall_model.pkl`
4. Update feature medians if needed

## 🚀 Deployment

### Vercel Deployment

The project is configured for deployment to Vercel with both Node.js and Python support:

```bash
# Deploy to Vercel
vercel --prod
```

**Key Deployment Features:**
- **Hybrid Runtime**: Uses Node.js for static files and Python for ML predictions
- **Python API**: `/api/analyze` endpoint runs on Vercel's Python runtime
- **Automatic Dependencies**: Python packages installed from `requirements.txt`
- **Model Files**: ML models are included in the deployment

**Deployment Configuration:**
- `vercel.json`: Configures Python runtime for the analyze endpoint
- `requirements.txt`: Specifies Python dependencies (joblib, pandas, scikit-learn)
- `api/analyze.py`: Python-based prediction endpoint for Vercel
- `api/analyze.js`: Node.js fallback for local development

### Other Platforms

For deployment to other platforms, ensure:
- Node.js runtime is available
- Python dependencies are installed
- Model files are accessible
- Both `/api/analyze.js` (Node.js) and `/api/analyze.py` (Python) endpoints work

## 🐛 Troubleshooting

### Common Issues

**"Could not parse model output"**
- Ensure Python dependencies are installed
- Check that model files exist in `exoplanet-ml/`

**Server won't start**
- Verify Node.js version (18+)
- Run `npm install` to install dependencies
- Check port 3000 is available

**Python errors**
- Install required packages: `pip install joblib pandas scikit-learn`
- Ensure Python is in your system PATH

### Error Messages

- **"Model not found"**: Check that `planetfall_model.pkl` exists
- **"Invalid input"**: Ensure all parameters are numeric
- **"Server error"**: Check terminal for detailed error logs

## 📊 Performance

- **Response Time**: ~1-3 seconds per prediction
- **Accuracy**: Varies by input quality and model confidence
- **Scalability**: Suitable for moderate concurrent usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and research purposes.

## 🙏 Acknowledgments

- **NASA Kepler Mission** for providing the exoplanet data
- **scikit-learn** for machine learning capabilities
- **Express.js** for the web framework

---

**Happy planet hunting! 🌍✨**

For questions or issues, please check the troubleshooting section or create an issue in the repository.