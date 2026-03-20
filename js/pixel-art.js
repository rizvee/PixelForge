document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('pixel-canvas');
  const gridCtx = document.getElementById('grid-overlay-canvas').getContext('2d');
  const previewCanvas = document.getElementById('anim-preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');
  
  let grid = parseInt(document.getElementById('grid-size').value);
  let zoom = parseInt(document.getElementById('zoom-slider').value);
  let tool = 'pencil';
  let color = '#000000';
  let isDrawing = false;
  let frames = [];
  let currentFrameIdx = 0;
  
  const DB32 = ["#000000","#222034","#45283c","#663931","#8f563b","#df7126","#d9a066","#eec39a","#fbf236","#99e550","#6abe30","#37946e","#4b692f","#524b24","#323c39","#3f3f74","#306082","#5b6ee1","#639bff","#5fcde4","#cbdbfc","#ffffff","#9badb7","#847e87","#696a6a","#595652","#76428a","#ac3232","#d95763","#d77bba","#8f974a","#8a6f30"];

  function initPalette() {
    const p = document.getElementById('palette-grid');
    DB32.forEach(hex => {
      const sw = document.createElement('div');
      sw.className = 'palette-swatch';
      sw.style.background = hex;
      sw.onclick = () => { color = hex; document.getElementById('primary-color').value = hex; };
      p.appendChild(sw);
    });
  }

  function createFrame() {
    const data = new Array(grid * grid).fill(null);
    frames.push(data);
    currentFrameIdx = frames.length - 1;
    renderFramesList();
    drawGrid();
  }

  function resizeCanvas() {
    grid = parseInt(document.getElementById('grid-size').value);
    const sizePx = grid * zoom;
    document.getElementById('grid-container').style.width = sizePx + 'px';
    document.getElementById('grid-container').style.height = sizePx + 'px';
    canvas.width = grid;
    canvas.height = grid;
    canvas.style.width = sizePx + 'px';
    canvas.style.height = sizePx + 'px';
    const gridEl = document.getElementById('grid-overlay-canvas');
    gridEl.width = grid * zoom;
    gridEl.height = grid * zoom;
    
    // Default redraw grid lines
    gridCtx.clearRect(0,0,gridEl.width, gridEl.height);
    if(document.getElementById('show-grid').checked) {
      gridCtx.fillStyle = '#ffffff';
      for(let x=0; x<=grid; x++) gridCtx.fillRect(x*zoom, 0, 1, grid*zoom);
      for(let y=0; y<=grid; y++) gridCtx.fillRect(0, y*zoom, grid*zoom, 1);
    }
    
    if (frames.length === 0) createFrame();
    drawGrid();
  }

  function drawGrid() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,grid,grid);
    const frame = frames[currentFrameIdx];
    for (let i = 0; i < frame.length; i++) {
      if (frame[i]) {
        ctx.fillStyle = frame[i];
        const x = i % grid;
        const y = Math.floor(i / grid);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    updatePreviewImage();
  }

  function setPixel(gx, gy, col) {
    if (gx < 0 || gy < 0 || gx >= grid || gy >= grid) return;
    frames[currentFrameIdx][gy * grid + gx] = col;
  }

  function handleInteraction(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);
    
    if (tool === 'pencil') setPixel(x, y, color);
    else if (tool === 'eraser') setPixel(x, y, null);
    else if (tool === 'picker') {
      const c = frames[currentFrameIdx][y * grid + x];
      if (c) { color = c; document.getElementById('primary-color').value = c; }
    }
    drawGrid();
  }

  canvas.addEventListener('pointerdown', e => { isDrawing = true; handleInteraction(e); });
  canvas.addEventListener('pointermove', e => { handleInteraction(e); });
  canvas.addEventListener('pointerup', () => { isDrawing = false; });
  canvas.addEventListener('pointerleave', () => { isDrawing = false; });

  document.getElementById('primary-color').addEventListener('input', e => color = e.target.value);
  document.getElementById('zoom-slider').addEventListener('input', e => { zoom = e.target.value; document.getElementById('zoom-val').textContent = zoom+'px'; resizeCanvas(); });
  document.getElementById('grid-size').addEventListener('change', () => { frames = []; resizeCanvas(); });
  document.getElementById('show-grid').addEventListener('change', resizeCanvas);
  
  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tool = btn.dataset.tool;
    };
  });

  document.getElementById('btn-add-frame').onclick = createFrame;

  function renderFramesList() {
    const list = document.getElementById('frames-list');
    list.innerHTML = '';
    frames.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = `frame-item ${i === currentFrameIdx ? 'active' : ''}`;
      div.innerHTML = `<span style="width:20px">${i+1}</span> <canvas class="frame-preview"></canvas> <button class="btn-delete-frame">✕</button>`;
      div.onclick = () => { currentFrameIdx = i; renderFramesList(); drawGrid(); };
      div.querySelector('.btn-delete-frame').onclick = (e) => {
        e.stopPropagation();
        if (frames.length > 1) { frames.splice(i, 1); currentFrameIdx = Math.max(0, currentFrameIdx - 1); renderFramesList(); drawGrid(); }
      };
      
      // render thumbnail
      const thumb = div.querySelector('canvas');
      thumb.width = grid; thumb.height = grid;
      const tCtx = thumb.getContext('2d');
      f.forEach((c, idx) => {
        if(c) { tCtx.fillStyle = c; tCtx.fillRect(idx%grid, Math.floor(idx/grid), 1, 1); }
      });
      list.appendChild(div);
    });
  }

  function updatePreviewImage() {
    previewCtx.clearRect(0,0,128,128);
    // Draw current frame to preview scaled up
    const f = frames[currentFrameIdx];
    const s = 128 / grid;
    for (let i = 0; i < f.length; i++) {
        if (f[i]) {
            previewCtx.fillStyle = f[i];
            previewCtx.fillRect((i%grid)*s, Math.floor(i/grid)*s, s, s);
        }
    }
  }

  let isPlaying = false;
  let animTimer;
  document.getElementById('btn-play').onclick = (e) => {
    isPlaying = !isPlaying;
    e.target.textContent = isPlaying ? '⏸️' : '▶️';
    if(isPlaying) {
      animTimer = setInterval(() => {
        currentFrameIdx = (currentFrameIdx + 1) % frames.length;
        renderFramesList(); drawGrid();
      }, 1000 / parseInt(document.getElementById('fps-input').value));
    } else {
      clearInterval(animTimer);
    }
  };

  document.getElementById('btn-export').onclick = () => document.getElementById('export-modal').classList.add('open');

  document.getElementById('export-png-1x').onclick = () => PF.image.downloadCanvas(canvas, 'pixelart-1x.png');
  document.getElementById('export-png-8x').onclick = () => {
    const bigCanvas = document.createElement('canvas');
    bigCanvas.width = grid * 8; bigCanvas.height = grid * 8;
    const bCtx = bigCanvas.getContext('2d');
    bCtx.imageSmoothingEnabled = false;
    bCtx.drawImage(canvas, 0, 0, bigCanvas.width, bigCanvas.height);
    PF.image.downloadCanvas(bigCanvas, 'pixelart-8x.png');
  };

  initPalette();
  resizeCanvas();
});
