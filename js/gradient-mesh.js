document.addEventListener('DOMContentLoaded', () => {
  const vp = document.getElementById('mesh-viewport');
  const bg = document.getElementById('mesh-bg');
  const svg = document.getElementById('mesh-svg-overlay');
  const cont = document.getElementById('handles-container');
  const out = document.getElementById('css-output-code');
  const colorPicker = document.getElementById('hidden-color-picker');
  
  let mode = 'mesh'; // mesh, linear, radial, conic
  let meshGrid = 3;
  let points = [];
  let w = vp.clientWidth, h = vp.clientHeight;
  
  let stdAngle = 90;
  let stdStops = [
    { c: '#7c3aed', p: 0 },
    { c: '#06b6d4', p: 100 }
  ];

  const presets = {
    aurora: ['#04d9ff', '#ff0055', '#7c3aed', '#00ff41'],
    sunset: ['#ff4e50', '#f9d423', '#ff0844', '#ffb199'],
    ocean: ['#2E3192', '#1BFFFF', '#009245', '#FCEE21'],
    candy: ['#ff0844', '#ffb199', '#fccb90', '#d57eeb'],
    neon: ['#fdf600', '#ff007f', '#00fdfd', '#7c3aed']
  };

  // Resizing
  new ResizeObserver(() => {
    if(vp.clientWidth === 0) return;
    w = vp.clientWidth; h = vp.clientHeight;
    if(mode === 'mesh') updateMeshCoordinates();
    renderCSS();
  }).observe(vp);

  function updateMeshCoordinates() {
    points.forEach(p => {
      p.px = p.rx * w;
      p.py = p.ry * h;
    });
    renderHandles();
  }

  // --- MESH LOGIC ---
  function initMesh() {
    points = [];
    const colors = presets[document.getElementById('mesh-presets').value] || presets.aurora;
    for(let y=0; y<meshGrid; y++) {
      for(let x=0; x<meshGrid; x++) {
        let rx = x / (meshGrid - 1);
        let ry = y / (meshGrid - 1);
        points.push({
          x: x, y: y,
          rx: rx, ry: ry,
          px: rx * w, py: ry * h,
          color: colors[(x+y)%colors.length],
          vx: (Math.random()-0.5)*0.002,
          vy: (Math.random()-0.5)*0.002
        });
      }
    }
    renderHandles();
    renderCSS();
  }

  function getPoint(x,y) { return points.find(p => p.x === x && p.y === y); }

  function renderHandles() {
    cont.innerHTML = '';
    svg.innerHTML = '';
    if(mode !== 'mesh') return;

    // Draw lines
    for(let y=0; y<meshGrid; y++) {
      for(let x=0; x<meshGrid; x++) {
        let p = getPoint(x,y);
        if(x < meshGrid-1) {
          let pr = getPoint(x+1,y);
          svg.innerHTML += `<line x1="${p.rx*100}%" y1="${p.ry*100}%" x2="${pr.rx*100}%" y2="${pr.ry*100}%"/>`;
        }
        if(y < meshGrid-1) {
          let pb = getPoint(x,y+1);
          svg.innerHTML += `<line x1="${p.rx*100}%" y1="${p.ry*100}%" x2="${pb.rx*100}%" y2="${pb.ry*100}%"/>`;
        }
      }
    }

    points.forEach((p, i) => {
      let handle = document.createElement('div');
      handle.className = 'mesh-handle';
      handle.style.left = `${p.rx*100}%`;
      handle.style.top = `${p.ry*100}%`;
      handle.style.backgroundColor = p.color;
      
      let isDragging = false;
      handle.onpointerdown = (e) => {
        if(e.button !== 0 && e.pointerType === 'mouse') return;
        if(e.shiftKey) {
            // Pick color
            colorPicker.value = PF.color.rgbToHex(...PF.color.hexToRgb(p.color));
            colorPicker.oninput = (ce) => { p.color = ce.target.value; renderCSS(); handle.style.backgroundColor = p.color; };
            colorPicker.click();
            return;
        }
        isDragging = true;
        handle.setPointerCapture(e.pointerId);
      };
      handle.onpointermove = (e) => {
        if(!isDragging) return;
        const rect = vp.getBoundingClientRect();
        let nx = PF.ui.clamp(e.clientX - rect.left, 0, w);
        let ny = PF.ui.clamp(e.clientY - rect.top, 0, h);
        p.px = nx; p.py = ny;
        p.rx = nx/w; p.ry = ny/h;
        handle.style.left = `${p.rx*100}%`;
        handle.style.top = `${p.ry*100}%`;
        renderCSS();
        // Update lines lazily by re-rendering SVG (slow but works for small grids)
        svg.innerHTML = '';
        renderHandlesLinesOnly();
      };
      handle.onpointerup = () => isDragging = false;
      
      handle.onclick = () => {
        colorPicker.value = p.color.length===7 ? p.color : '#000000';
        colorPicker.oninput = (ce) => { p.color = ce.target.value; renderCSS(); handle.style.backgroundColor=p.color; };
        colorPicker.click();
      }
      cont.appendChild(handle);
    });
  }
  
  function renderHandlesLinesOnly() {
      for(let y=0; y<meshGrid; y++) {
          for(let x=0; x<meshGrid; x++) {
            let p = getPoint(x,y);
            if(x < meshGrid-1) svg.innerHTML += `<line x1="${p.rx*100}%" y1="${p.ry*100}%" x2="${getPoint(x+1,y).rx*100}%" y2="${getPoint(x+1,y).ry*100}%"/>`;
            if(y < meshGrid-1) svg.innerHTML += `<line x1="${p.rx*100}%" y1="${p.ry*100}%" x2="${getPoint(x,y+1).rx*100}%" y2="${getPoint(x,y+1).ry*100}%"/>`;
          }
      }
  }

  function getMeshCSS() {
    // Generate an overlapping radial gradient for each point to simulate mesh
    // We enhance spread to blend smoothly
    let layers = points.map(p => {
      return `radial-gradient(circle at ${Math.round(p.rx*100)}% ${Math.round(p.ry*100)}%, ${p.color} 0%, transparent 60%)`;
    });
    return layers.join(',\n  ');
  }

  // --- STANDARD LOGIC ---
  function getStandardCSS() {
    let stops = stdStops.sort((a,b)=>a.p - b.p).map(s => `${s.c} ${s.p}%`).join(', ');
    if (mode === 'linear') return `linear-gradient(${stdAngle}deg, ${stops})`;
    if (mode === 'radial') return `radial-gradient(circle, ${stops})`;
    if (mode === 'conic') return `conic-gradient(from ${stdAngle}deg, ${stops})`;
  }

  function renderStandardUI() {
    const c = document.getElementById('color-stops-container');
    c.innerHTML = '';
    stdStops.forEach((s, i) => {
      let div = document.createElement('div');
      div.className = 'color-stop-row';
      div.innerHTML = `
        <input type="color" class="input p-0" value="${s.c}" style="width:30px;height:30px;padding:0;">
        <input type="range" class="range" min="0" max="100" value="${s.p}" style="flex:1">
        <span style="width:40px;text-align:right;color:#fff">${s.p}%</span>
        <button class="btn-remove-stop">✕</button>
      `;
      div.querySelector('input[type="color"]').oninput = (e) => { s.c = e.target.value; renderCSS(); };
      div.querySelector('input[type="range"]').oninput = (e) => { 
        s.p = parseInt(e.target.value); 
        div.querySelector('span').textContent = s.p+'%'; 
        renderCSS(); 
      };
      div.querySelector('.btn-remove-stop').onclick = () => {
        if(stdStops.length > 2) { stdStops.splice(i, 1); renderStandardUI(); renderCSS(); }
      };
      c.appendChild(div);
    });
    document.getElementById('angle-control-group').style.display = (mode==='linear' || mode==='conic') ? 'flex' : 'none';
  }

  // --- MAIN ENTRY ---
  function renderCSS() {
    let css = '';
    if (mode === 'mesh') {
      let val = getMeshCSS();
      bg.style.background = val; // Actually applies CSS
      bg.style.backgroundColor = '#111'; // fallback
      css = `background-color: #111;\nbackground-image:\n  ${val};`;
    } else {
      let val = getStandardCSS();
      bg.style.background = val;
      css = `background: ${val};`;
    }
    out.textContent = css;
  }

  // Events
  document.querySelectorAll('.g-tab').forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll('.g-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.dataset.type;
      
      document.querySelectorAll('.controls-section').forEach(s => s.classList.remove('active'));
      if(mode === 'mesh') {
        document.getElementById('controls-mesh').classList.add('active');
        svg.style.display = 'block'; cont.style.display = 'block';
        initMesh();
      } else {
        document.getElementById('controls-standard').classList.add('active');
        svg.style.display = 'none'; cont.style.display = 'none';
        renderStandardUI();
        renderCSS();
      }
    };
  });

  document.querySelectorAll('.grid-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.grid-btn').forEach(b=>b.classList.replace('btn-primary','btn-secondary'));
      btn.classList.replace('btn-secondary','btn-primary');
      meshGrid = parseInt(btn.dataset.grid);
      initMesh();
    };
  });

  document.getElementById('mesh-presets').onchange = () => initMesh();

  document.getElementById('grad-angle').oninput = e => { stdAngle = e.target.value; document.getElementById('val-angle').textContent=stdAngle+'deg'; renderCSS(); };
  document.getElementById('btn-add-stop').onclick = () => {
    stdStops.push({c: '#ffffff', p: 50});
    renderStandardUI(); renderCSS();
  };

  document.getElementById('btn-copy-css').onclick = () => PF.ui.copyToClipboard(out.textContent);
  document.getElementById('btn-copy-code').onclick = () => PF.ui.copyToClipboard(out.textContent);
  document.getElementById('btn-export-png').onclick = async () => {
    // Note: Due to limitations of capturing CSS background to canvas locally,
    // we use a trick: draw radial gradients onto canvas to export.
    const cvs = document.createElement('canvas');
    cvs.width = w * 2; cvs.height = h * 2; // high res
    const cx = cvs.getContext('2d');
    cx.scale(2,2);
    
    if (mode === 'mesh') {
      cx.fillStyle = '#111'; cx.fillRect(0,0,w,h);
      cx.globalCompositeOperation = 'screen';
      points.forEach(p => {
        const grd = cx.createRadialGradient(p.px, p.py, 0, p.px, p.py, Math.max(w,h)*0.6);
        grd.addColorStop(0, p.color);
        grd.addColorStop(1, 'transparent');
        cx.fillStyle = grd;
        cx.fillRect(0,0,w,h);
      });
    } else {
      // Linear/Radial fallback export unsupported easily without library.
      // So alert user.
      alert('PNG Export currently optimized for Mesh mode. For standard gradients, copy CSS!');
      return;
    }
    
    PF.image.downloadCanvas(cvs, 'gradient-mesh.png');
  };

  // Animation
  let animId;
  document.getElementById('mesh-animate').onchange = (e) => {
    if(e.target.checked) animateMesh();
    else cancelAnimationFrame(animId);
  }
  function animateMesh() {
    points.forEach(p => {
      p.rx += p.vx; p.ry += p.vy;
      if(p.rx<0 || p.rx>1) p.vx*=-1;
      if(p.ry<0 || p.ry>1) p.vy*=-1;
      p.px = p.rx*w; p.py = p.ry*h;
    });
    renderHandles();
    renderCSS();
    animId = requestAnimationFrame(animateMesh);
  }

  // Init
  initMesh();
});
