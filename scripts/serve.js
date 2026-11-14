// Server statico per la rigenerazione di _pre/: file veri, poi index.html per ogni percorso (come .htaccess senza _pre). Uso: node scripts/serve.js <cartella> [porta]
const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2],port=+process.argv[3]||8099;
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json','.txt':'text/plain;charset=utf-8','.xml':'application/xml'};
http.createServer((q,r)=>{
  let p=decodeURIComponent(q.url.split('?')[0]);
  let f=path.join(root,p);
  const send=(file)=>{r.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(r)};
  if(process.env.PRE&&p==='/'&&fs.existsSync(path.join(root,'_pre/home.html')))return send(path.join(root,'_pre/home.html'));
  if(fs.existsSync(f)&&fs.statSync(f).isFile())return send(f);
  if(!/\.[A-Za-z0-9]+$/.test(p)){
    const h=path.join(root,(process.env.PRE?'_pre/':'')+p.replace(/\/$/,'')+'.html');
    if(p!=='/'&&fs.existsSync(h)&&fs.statSync(h).isFile())return send(h);
    return send(path.join(root,'index.html'));
  }
  r.writeHead(404);r.end('404');
}).listen(port,()=>console.log('ok',port));
