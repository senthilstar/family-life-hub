import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
function swPlugin(){
  return { name:'sw-precache', apply:'build', closeBundle(){
    const dist=path.resolve('dist'); const files=[];
    const walk=d=>fs.readdirSync(d).forEach(f=>{const p=path.join(d,f); fs.statSync(p).isDirectory()?walk(p):files.push(path.relative(dist,p).split(path.sep).join('/'));});
    walk(dist);
    const list=['./',...files.filter(f=>f!=='sw.js'&&f!=='.nojekyll').map(f=>'./'+f)];
    const src=fs.readFileSync(path.resolve('sw-template.js'),'utf8').replace('__VERSION__',Date.now().toString(36)).replace('__PRECACHE__',JSON.stringify(list));
    fs.writeFileSync(path.join(dist,'sw.js'),src);
  }};
}
export default defineConfig({ base:'./', plugins:[react(), swPlugin()], build:{ target:'es2019' } });
