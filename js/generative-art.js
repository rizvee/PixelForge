document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gen-canvas');
  const ctx = canvas.getContext('2d');
  
  const width = canvas.width;
  const height = canvas.height;

  // PRNG (Mulberry32)
  function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
  }

  let rand = Math.random; // Global deterministic random function

  const palettes = {
    neon: ['#04d9ff', '#ff0055', '#7c3aed', '#fdee00', '#00ff41'],
    ocean: ['#001011', '#093a3e', '#3aafa9', '#def2f1', '#17252a'],
    earth: ['#4a4e4d', '#0e9aa7', '#3da4ab', '#f6cd61', '#fe8a71'],
    pastel: ['#fdcb6e', '#e17055', '#d63031', '#e84393', '#6c5ce7', '#00b894'],
    cyber: ['#fdf600', '#ff007f', '#00fdfd', '#111111', '#555555'],
    monochrome: ['#000000', '#1a1a1a', '#333333', '#808080', '#e6e6e6', '#ffffff'],
    fire: ['#110000', '#550000', '#aa0000', '#ff0000', '#ff5500', '#ffaa00', '#ffff00']
  };

  const UI = {
    algo: document.getElementById('algo-select'),
    palette: document.getElementById('palette-select'),
    density: document.getElementById('param-density'),
    comp: document.getElementById('param-complexity'),
    thick: document.getElementById('param-thickness'),
    seed: document.getElementById('param-seed'),
    anim: document.getElementById('param-animate')
  };

  let animFrameId;
  let animTime = 0;
  let history = [];

  function updatePreview() {
    const cols = palettes[UI.palette.value];
    const pre = document.getElementById('palette-preview');
    pre.innerHTML = '';
    cols.forEach(c => {
      const d = document.createElement('div');
      d.className = 'palette-swatch';
      d.style.backgroundColor = c;
      pre.appendChild(d);
    });
    
    document.getElementById('val-density').textContent = UI.density.value;
    document.getElementById('val-complexity').textContent = UI.comp.value;
    document.getElementById('val-thickness').textContent = UI.thick.value;
  }

  function getPalette() {
    return palettes[UI.palette.value];
  }

  function rndItem(arr) {
    return arr[Math.floor(rand() * arr.length)];
  }

  function generate() {
    cancelAnimationFrame(animFrameId);
    let s = UI.seed.value;
    if (!s) {
      s = Math.random().toString(36).substring(7);
      UI.seed.value = s;
    }
    const seedHash = cyrb128(s);
    rand = mulberry32(seedHash[0]);
    
    ctx.clearRect(0, 0, width, height);
    
    const algo = UI.algo.value;
    if (algo === 'circle-packing') drawCirclePacking();
    else if (algo === 'mondrian') drawMondrian();
    else if (algo === 'recursive') drawRecursive();
    else if (algo === 'truchet') drawTruchet();
    else if (algo === 'flow-field') drawFlowField();
    
    saveToHistory();

    if (UI.anim.checked) {
      animTime = 0;
      animate();
    }
  }

  // --- ALGORITHMS ---

  function drawCirclePacking() {
    const p = getPalette();
    ctx.fillStyle = p[0];
    ctx.fillRect(0,0,width,height);
    
    const density = parseInt(UI.density.value); // 10-200 attempts mapping
    const attempts = density * 200;
    const maxRadius = 100 + parseInt(UI.comp.value) * 10;
    const minRadius = 5;
    const thick = parseInt(UI.thick.value);
    
    let circles = [];
    
    for(let i=0; i<attempts; i++) {
      let r = minRadius + rand() * (maxRadius - minRadius);
      let x = r + rand() * (width - r*2);
      let y = r + rand() * (height - r*2);
      
      let overlaps = false;
      for(let j=0; j<circles.length; j++){
        let c = circles[j];
        let dx = c.x - x; let dy = c.y - y;
        if (Math.sqrt(dx*dx + dy*dy) < c.r + r + thick) {
          overlaps = true; break;
        }
      }
      if (!overlaps) {
        circles.push({x,y,r, col: rndItem(p.slice(1))});
      }
    }
    
    ctx.lineWidth = thick;
    ctx.strokeStyle = p[1] || '#000';
    circles.forEach(c => {
      ctx.fillStyle = c.col;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
      ctx.fill();
      if(thick > 0) ctx.stroke();
    });
  }

  function drawMondrian() {
    const p = getPalette();
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0,0,width,height);
    ctx.lineWidth = 4 + parseInt(UI.thick.value) * 2;
    ctx.strokeStyle = '#000'; // Mondrian is usually black lines
    
    const maxDepth = parseInt(UI.comp.value);
    const rects = [{x:0, y:0, w:width, h:height, c: rndItem(p)}];
    
    for(let d=0; d<maxDepth; d++) {
      let len = rects.length;
      for(let i=0; i<len; i++) {
        let r = rects[i];
        if (r.w > 100 && r.h > 100 && rand() > 0.3) {
          let splitVert = rand() > 0.5;
          let rRatio = 0.3 + rand() * 0.4;
          rects.splice(i, 1);
          i--; len--;
          if (splitVert) {
            rects.push({x: r.x, y: r.y, w: r.w*rRatio, h: r.h, c: rndItem(p)});
            rects.push({x: r.x + r.w*rRatio, y: r.y, w: r.w*(1-rRatio), h: r.h, c: rndItem(p)});
          } else {
            rects.push({x: r.x, y: r.y, w: r.w, h: r.h*rRatio, c: rndItem(p)});
            rects.push({x: r.x, y: r.y + r.h*rRatio, w: r.w, h: r.h*(1-rRatio), c: rndItem(p)});
          }
        }
      }
    }
    
    rects.forEach(r => {
      ctx.fillStyle = rand() > 0.3 ? '#fff' : r.c;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if(UI.thick.value > 0) ctx.strokeRect(r.x, r.y, r.w, r.h);
    });
  }

  function drawRecursive() {
    const p = getPalette();
    ctx.fillStyle = p[0];
    ctx.fillRect(0,0,width,height);
    ctx.lineWidth = parseInt(UI.thick.value);
    
    const depthLimit = parseInt(UI.comp.value);
    
    function divide(x, y, w, h, depth) {
      if (depth === depthLimit || rand() < 0.1) {
        ctx.fillStyle = rndItem(p);
        ctx.beginPath();
        // Maybe draw different shapes based on random
        let shape = rand();
        if(shape < 0.33) { ctx.fillRect(x,y,w,h); }
        else if (shape < 0.66) { 
          ctx.arc(x+w/2, y+h/2, Math.min(w,h)/2, 0, Math.PI*2); ctx.fill(); 
        } else {
          ctx.moveTo(x,y+h); ctx.lineTo(x+w/2, y); ctx.lineTo(x+w, y+h); ctx.fill();
        }
        if (ctx.lineWidth > 0) { ctx.strokeStyle = p[0]; ctx.strokeRect(x,y,w,h); }
        return;
      }
      
      let sz = parseInt(UI.density.value) * 2;
      let ratio = 0.2 + 0.6*rand();
      if (w > h) {
        divide(x, y, w*ratio, h, depth+1);
        divide(x+w*ratio, y, w*(1-ratio), h, depth+1);
      } else {
        divide(x, y, w, h*ratio, depth+1);
        divide(x, y+h*ratio, w, h*(1-ratio), depth+1);
      }
    }
    
    divide(0,0,width,height, 0);
  }

  function drawTruchet() {
    const p = getPalette();
    ctx.fillStyle = p[0];
    ctx.fillRect(0,0,width,height);
    
    let sz = Math.floor(2000 / parseInt(UI.density.value)); // size 10 to 200
    ctx.lineWidth = parseInt(UI.thick.value) * 3 || 1;
    ctx.strokeStyle = rndItem(p.slice(1));
    ctx.lineCap = 'round';
    
    let style = parseInt(UI.comp.value) % 3; // 0=arcs, 1=lines, 2=mixed
    
    for(let x=0; x<width; x+=sz) {
      for(let y=0; y<height; y+=sz) {
        let rv = rand();
        let currentS = style === 2 ? (rand() > 0.5 ? 0 : 1) : style;
        
        ctx.strokeStyle = rndItem(p.slice(1));
        
        if (currentS === 0) {
          if (rv > 0.5) {
            ctx.beginPath(); ctx.arc(x,y,sz/2, 0, Math.PI/2); ctx.stroke();
            ctx.beginPath(); ctx.arc(x+sz,y+sz,sz/2, Math.PI, Math.PI*1.5); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.arc(x+sz,y,sz/2, Math.PI/2, Math.PI); ctx.stroke();
            ctx.beginPath(); ctx.arc(x,y+sz,sz/2, Math.PI*1.5, Math.PI*2); ctx.stroke();
          }
        } else {
          ctx.beginPath();
          if (rv > 0.5) { ctx.moveTo(x,y); ctx.lineTo(x+sz, y+sz); } 
          else { ctx.moveTo(x+sz, y); ctx.lineTo(x, y+sz); }
          ctx.stroke();
        }
      }
    }
  }

  function drawFlowField() {
    const p = getPalette();
    ctx.fillStyle = p[0];
    ctx.fillRect(0,0,width,height);
    
    ctx.lineWidth = parseInt(UI.thick.value) || 1;
    let nLines = parseInt(UI.density.value) * 20;
    
    let noiseScale = 0.005 + (parseInt(UI.comp.value)*0.001);
    
    function pseudoNoise(x, y) {
      // Very crude noise approximation
      return Math.sin(x*noiseScale + Math.cos(y*noiseScale)) * Math.PI * 2;
    }
    
    for(let i=0; i<nLines; i++) {
        let x = rand() * width;
        let y = rand() * height;
        ctx.strokeStyle = rndItem(p.slice(1));
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x,y);
        for(let step=0; step<50; step++) {
            let a = pseudoNoise(x, y);
            x += Math.cos(a) * 5;
            y += Math.sin(a) * 5;
            ctx.lineTo(x,y);
            if(x<0||x>width||y<0||y>height) break;
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  function animate() {
      if(!UI.anim.checked) return;
      // In a real flow field anime we'd update particles, here just slowly change seed
      UI.seed.value = Math.random().toString(36).substring(7);
      generate();
      animFrameId = setTimeout(animate, 2000); // redraw every 2s
  }

  // History
  function saveToHistory() {
      const url = canvas.toDataURL('image/jpeg', 0.5);
      const conf = { algo: UI.algo.value, pal: UI.palette.value, ...UI };
      history.unshift({url, conf});
      if(history.length > 12) history.pop();
      renderHistory();
  }
  
  function renderHistory() {
      const g = document.getElementById('history-gallery');
      g.innerHTML = '';
      history.forEach((h, i) => {
          const img = document.createElement('img');
          img.src = h.url;
          img.className = 'history-thumb';
          img.title = 'Click to restore';
          g.appendChild(img);
          // Restore on click logic could be added here
      });
  }

  // Events
  Object.values(UI).forEach(el => {
    el.addEventListener('change', () => { updatePreview(); });
  });
  ['param-density', 'param-complexity', 'param-thickness'].forEach(id => {
      document.getElementById(id).addEventListener('input', updatePreview);
  });
  
  document.getElementById('btn-generate').onclick = generate;
  document.getElementById('btn-surprise').onclick = () => {
      UI.algo.selectedIndex = Math.floor(Math.random() * UI.algo.options.length);
      UI.palette.selectedIndex = Math.floor(Math.random() * UI.palette.options.length);
      UI.density.value = Math.floor(run()* 190)+10;
      UI.comp.value = Math.floor(rand()*9)+1;
      UI.thick.value = Math.floor(rand()*10);
      UI.seed.value = Math.random().toString(36).substring(7);
      
      updatePreview();
      generate();
  };
  
  document.getElementById('btn-export').onclick = () => PF.image.downloadCanvas(canvas, 'generative-art.png');

  // init
  updatePreview();
  setTimeout(generate, 100);
});
function run(){ return Math.random(); }
