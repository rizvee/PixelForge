document.addEventListener('DOMContentLoaded', () => {
  const UI = {
    seed: document.getElementById('param-seed'),
    shape: document.getElementById('param-shape'),
    paletteGroup: document.getElementById('param-palette'),
    svg: document.getElementById('avatar-svg'),
    box: document.getElementById('avatar-preview-box')
  };

  let style = 'identicon';

  // Basic hashes
  document.querySelectorAll('.style-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
      b.classList.add('active');
      style = b.dataset.style;
      generate();
    };
  });

  UI.seed.addEventListener('input', generate);
  UI.shape.addEventListener('change', generate);
  UI.paletteGroup.addEventListener('change', generate);

  const palettes = {
    vibrant: [
      {bg: '#fdf8f5', fg: ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea']},
      {bg: '#f0fdf4', fg: ['#16a34a', '#0ea5e9', '#6366f1']},
      {bg: '#fef2f2', fg: ['#ef4444', '#f59e0b', '#10b981']}
    ],
    pastel: [
      {bg: '#fdfbf7', fg: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff']},
      {bg: '#fef6e4', fg: ['#f5abaa', '#f3e6cf', '#b7d7d8', '#8f5c6b']},
      {bg: '#fafafa', fg: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94']}
    ],
    dark: [
      {bg: '#111827', fg: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']},
      {bg: '#1e1b4b', fg: ['#a855f7', '#ec4899', '#f43f5e']},
      {bg: '#0f172a', fg: ['#e2e8f0', '#94a3b8', '#38bdf8']}
    ],
    monochrome: [
      {bg: '#ffffff', fg: ['#000000', '#333333', '#666666', '#999999', '#cccccc']},
      {bg: '#000000', fg: ['#ffffff', '#e5e5e5', '#a3a3a3', '#525252', '#262626']}
    ]
  };

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

  function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  function generate() {
    let s = UI.seed.value.trim() || ' ';
    const hashData = cyrb128(s);
    let rand = mulberry32(hashData[0]);

    // Box formatting
    UI.box.className = 'shape-' + UI.shape.value;

    // Pick Palette
    let group = palettes[UI.paletteGroup.value];
    let pObj = group[Math.floor(rand() * group.length)];
    let bgCol = pObj.bg;
    
    // Some routines mix fg colors
    function getFg() { return pObj.fg[Math.floor(rand() * pObj.fg.length)]; }

    let svgData = '';

    if (style === 'identicon') {
        UI.svg.setAttribute('shape-rendering', 'crispEdges');
        // 5x5 grid, mirrored vertically
        // Need to determine 15 boolean blocks (since left half configures right half)
        let fgCol = getFg();
        
        svgData += `<rect width="400" height="400" fill="${bgCol}"/>`;
        
        // padding 40px all around = 320px inner / 5 = 64px blocks
        const blkSize = 64;
        const pad = 40;
        
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 5; y++) {
                if(rand() > 0.5) {
                    // draw left side
                    svgData += `<rect x="${pad + x*blkSize}" y="${pad + y*blkSize}" width="${blkSize}" height="${blkSize}" fill="${fgCol}"/>`;
                    // draw mirrored right side if not center column
                    if (x < 2) {
                        let mirrorX = 4 - x;
                        svgData += `<rect x="${pad + mirrorX*blkSize}" y="${pad + y*blkSize}" width="${blkSize}" height="${blkSize}" fill="${fgCol}"/>`;
                    }
                }
            }
        }
    } 
    else if (style === 'initials') {
        UI.svg.setAttribute('shape-rendering', 'geometricPrecision');
        let fgCol = getFg();
        svgData += `<rect width="400" height="400" fill="${fgCol}"/>`; // bg is fg for initials usually
        let textCol = bgCol; // Text is the background color
        
        let words = s.split(/\s+/).filter(w=>w.length>0);
        let init = '';
        if(words.length === 1) init = words[0].substring(0,2).toUpperCase();
        else if (words.length > 1) init = words[0].substring(0,1).toUpperCase() + words[1].substring(0,1).toUpperCase();
        else init = '?';

        svgData += `<text x="50%" y="54%" font-family="system-ui,-apple-system,sans-serif" font-weight="bold" font-size="160" fill="${textCol}" text-anchor="middle" alignment-baseline="middle">${init}</text>`;
    }
    else if (style === 'bauhaus') {
        UI.svg.setAttribute('shape-rendering', 'geometricPrecision');
        svgData += `<rect width="400" height="400" fill="${bgCol}"/>`;
        
        // Draw 3 random abstract overlapping geometric shapes
        for(let i=0; i<3; i++) {
            let type = Math.floor(rand() * 4); // 0=circle, 1=rect, 2=line, 3=triangle path
            let cx = rand() * 400;
            let cy = rand() * 400;
            let sz = 100 + rand() * 200;
            let col = getFg();
            
            if (type === 0) {
                svgData += `<circle cx="${cx}" cy="${cy}" r="${sz/2}" fill="${col}"/>`;
            } else if (type === 1) {
                svgData += `<rect x="${cx - sz/2}" y="${cy - sz/2}" width="${sz}" height="${sz* (0.5+rand())}" fill="${col}" transform="rotate(${rand()*180} ${cx} ${cy})"/>`;
            } else if (type === 2) {
                // thick pill
                svgData += `<line x1="${cx-sz}" y1="${cy-sz}" x2="${cx+sz}" y2="${cy+sz}" stroke="${col}" stroke-width="${30+rand()*50}" stroke-linecap="round"/>`;
            } else {
                let p1x = cx, p1y = cy - sz;
                let p2x = cx + sz, p2y = cy + sz;
                let p3x = cx - sz, p3y = cy + sz;
                svgData += `<polygon points="${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}" fill="${col}" transform="rotate(${rand()*180} ${cx} ${cy})"/>`;
            }
        }
    }

    UI.svg.innerHTML = svgData;
  }

  // Exports
  document.getElementById('btn-export-svg').onclick = () => {
    // Inject clipPath for rounded corners if needed
    let rawSvg = UI.svg.outerHTML;
    
    // Quick hack: wrap it inside another svg structure to enforce rounding
    let clipId = 'clip-' + Date.now();
    let r = UI.shape.value === 'circle' ? '50%' : (UI.shape.value === 'rounded' ? '20%' : '0');
    
    let wrappedSvg = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs><rect id="${clipId}" width="400" height="400" rx="${UI.shape.value==='circle'?200:(UI.shape.value==='rounded'?80:0)}"/></defs>
  <clipPath id="cp-${clipId}"><use href="#${clipId}"/></clipPath>
  <g clip-path="url(#cp-${clipId})">
      ${UI.svg.innerHTML}
  </g>
</svg>`;

    const blob = new Blob([wrappedSvg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pixelforge-avatar.svg';
    a.click(); URL.revokeObjectURL(url);
  };

  document.getElementById('btn-export-png').onclick = () => {
    // Render SVG onto a Canvas then export
    // Use the wrapped logic for corners
    let clipId = 'clip-' + Date.now();
    let wrappedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><defs><rect id="${clipId}" width="400" height="400" rx="${UI.shape.value==='circle'?200:(UI.shape.value==='rounded'?80:0)}"/></defs><clipPath id="cp-${clipId}"><use href="#${clipId}"/></clipPath><g clip-path="url(#cp-${clipId})">${UI.svg.innerHTML}</g></svg>`;

    const img = new Image();
    const svgBlob = new Blob([wrappedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 400; c.height = 400;
        const ctx = c.getContext('2d');
        // If transparent PNG
        ctx.clearRect(0,0,400,400);
        ctx.drawImage(img, 0, 0);
        PF.image.downloadCanvas(c, 'pixelforge-avatar.png');
        URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  generate();
});
