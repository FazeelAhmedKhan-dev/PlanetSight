function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function dot(a,b){ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
function trainLogReg(X,y,{lr=0.3,epochs=250}={}){
  const d=X[0].length; let w=new Array(d).fill(0), b=0;
  for(let ep=0;ep<epochs;ep++){
    const dw=new Array(d).fill(0); let db=0;
    for(let i=0;i<X.length;i++){
      const a=sigmoid(b+dot(w,X[i])); const diff=a-y[i];
      for(let j=0;j<d;j++) dw[j]+=diff*X[i][j]; db+=diff;
    }
    for(let j=0;j<d;j++) w[j]-=(lr/X.length)*dw[j]; b-=(lr/X.length)*db;
  }
  return {w,b};
}
function standardizeFit(X){
  const d=X[0].length, n=X.length, mean=new Array(d).fill(0), std=new Array(d).fill(0);
  for(let j=0;j<d;j++){ let sum=0; for(let i=0;i<n;i++) sum+=X[i][j]; mean[j]=sum/n; let v=0; for(let i=0;i<n;i++) v+=Math.pow(X[i][j]-mean[j],2); std[j]=Math.sqrt(v/Math.max(1,n-1))||1; }
  const transform=(x)=>x.map((v,j)=>(v-mean[j])/std[j]);
  return {mean,std,transform};
}

export default async function handler(req, res) {
  try {
    const text = await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/data/sample_koi.csv`).then(r=>r.text());
    const lines = text.trim().split(/\r?\n/);
    lines.shift();
    const X=[]; const y=[];
    for(const line of lines){
      const [p,pr,dp,lbl]=line.split(',').map(v=>v.trim());
      const f=[parseFloat(p),parseFloat(pr),parseFloat(dp)];
      if(f.some(v=>!isFinite(v))) continue; const label=parseInt(lbl,10);
      if(!Number.isInteger(label)) continue; X.push(f); y.push(label);
    }
    const scaler=standardizeFit(X); const Xs=X.map(scaler.transform);
    const model=trainLogReg(Xs,y);
    res.status(200).json({ ok:true, samples:X.length, model, mean:scaler.mean, std:scaler.std });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}