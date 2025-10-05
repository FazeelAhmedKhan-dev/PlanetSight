function dot(a,b){ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
function sigmoid(z){ return 1/(1+Math.exp(-z)); }

export default function handler(req, res){
  try{
    if(req.method!=='POST') return res.status(405).json({ error: 'Method not allowed' });
    const { koi_period, koi_prad, koi_depth, model, mean, std } = req.body || {};
    if(!Array.isArray(model?.w) || typeof model?.b !== 'number' || !Array.isArray(mean) || !Array.isArray(std)){
      return res.status(400).json({ error: 'Model parameters required' });
    }
    const x=[Number(koi_period), Number(koi_prad), Number(koi_depth)];
    if(x.some(v=>!isFinite(v))) return res.status(400).json({ error: 'Invalid feature values' });
    const xs=x.map((v,j)=>(v-mean[j])/(std[j]||1));
    const p=sigmoid(model.b+dot(model.w,xs));
    res.status(200).json({ probability:p, is_planet: p>=0.5 });
  }catch(e){
    res.status(500).json({ error: e.message });
  }
}