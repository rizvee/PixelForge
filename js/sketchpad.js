document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const previewCanvas = document.createElement('canvas');
  previewCanvas.className = 'preview-layer';
  previewCanvas.width = 800;
  previewCanvas.height = 600;
  container.appendChild(previewCanvas);
  const previewCtx = previewCanvas.getContext('2d');

  let layers = [];
  let activeLayerIndex = 0;
  let historyTracker = [];
  let historyStep = -1;
  const MAX_HISTORY = 50;

  // State
  const state = {
    tool: 'brush',
    brushSize: 10,
    opacity: 1,
    color: '#7c3aed',
    brushType: 'round',
    symmetry: 'none',
    isDrawing: false,
    points: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    startX: 0,
    startY: 0
  };

  // UI Elements
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const layersList = document.getElementById('layers-list');
  const colorInput = document.getElementById('native-color');
  const colorSwatch = document.getElementById('active-color-swatch');

  function saveHistory() {
    if (historyStep < historyTracker.length - 1) {
      historyTracker = historyTracker.slice(0, historyStep + 1);
    }
    const snapshot = layers.map(l => {
      const c = document.createElement('canvas');
      c.width = l.canvas.width;
      c.height = l.canvas.height;
      c.getContext('2d').drawImage(l.canvas, 0, 0);
      return c;
    });
    historyTracker.push(snapshot);
    if (historyTracker.length > MAX_HISTORY) historyTracker.shift();
    else historyStep++;
  }

  function restoreHistory(step) {
    if (step < 0 || step >= historyTracker.length) return;
    historyStep = step;
    const snapshot = historyTracker[step];
    snapshot.forEach((snapCanvas, i) => {
      if (layers[i]) {
        const ctx = layers[i].ctx;
        ctx.clearRect(0, 0, snapCanvas.width, snapCanvas.height);
        ctx.drawImage(snapCanvas, 0, 0);
      }
    });
  }

  function addLayer(name = `Layer ${layers.length + 1}`) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    container.insertBefore(canvas, previewCanvas);

    const layer = { id: Date.now(), name, canvas, ctx, visible: true, opacity: 1 };
    layers.push(layer);
    activeLayerIndex = layers.length - 1;
    renderLayersUI();
    saveHistory();
  }

  function renderLayersUI() {
    layersList.innerHTML = '';
    [...layers].reverse().forEach((l, revIdx) => {
      const idx = layers.length - 1 - revIdx;
      const li = document.createElement('li');
      li.className = `layer-item ${idx === activeLayerIndex ? 'active' : ''}`;
      li.innerHTML = `
        <button class="layer-visible-toggle">${l.visible ? '👁️' : '➖'}</button>
        <div class="layer-name">${l.name}</div>
        <input class="layer-opacity" type="range" min="0" max="1" step="0.1" value="${l.opacity}">
      `;
      li.querySelector('.layer-name').onclick = () => {
        activeLayerIndex = idx;
        renderLayersUI();
      };
      li.querySelector('.layer-visible-toggle').onclick = (e) => {
        e.stopPropagation();
        l.visible = !l.visible;
        l.canvas.style.display = l.visible ? 'block' : 'none';
        renderLayersUI();
      };
      li.querySelector('.layer-opacity').oninput = (e) => {
        l.opacity = e.target.value;
        l.canvas.style.opacity = l.opacity;
      };
      layersList.appendChild(li);
    });
  }

  // Init First Layer
  addLayer('Background');
  layers[0].ctx.fillStyle = '#ffffff';
  layers[0].ctx.fillRect(0, 0, 800, 600);
  saveHistory();

  // Color selection
  colorInput.addEventListener('input', (e) => {
    state.color = e.target.value;
    colorSwatch.style.background = state.color;
  });

  // Tools Selection
  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.tool = btn.dataset.tool;
    });
  });

  // Toolbar bindings
  document.getElementById('brush-size').addEventListener('input', e => {
    state.brushSize = parseInt(e.target.value);
    document.getElementById('size-val').textContent = state.brushSize + 'px';
  });
  document.getElementById('brush-opacity').addEventListener('input', e => {
    state.opacity = parseFloat(e.target.value);
    document.getElementById('opacity-val').textContent = Math.round(state.opacity * 100) + '%';
  });
  document.getElementById('brush-type').addEventListener('change', e => { state.brushType = e.target.value; });
  document.getElementById('symmetry-mode').addEventListener('change', e => { state.symmetry = e.target.value; });
  document.getElementById('grid-toggle').addEventListener('change', e => {
    container.classList.toggle('show-grid', e.target.checked);
  });

  btnUndo.addEventListener('click', () => restoreHistory(historyStep - 1));
  btnRedo.addEventListener('click', () => restoreHistory(historyStep + 1));
  document.getElementById('btn-clear').addEventListener('click', () => {
    if(confirm('Clear active layer?')) {
      const ctx = layers[activeLayerIndex].ctx;
      ctx.clearRect(0,0,800,600);
      saveHistory();
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const exportCnv = document.createElement('canvas');
    exportCnv.width = 800; exportCnv.height = 600;
    const eCtx = exportCnv.getContext('2d');
    layers.forEach(l => {
      if(l.visible) {
        eCtx.globalAlpha = l.opacity;
        eCtx.drawImage(l.canvas, 0, 0);
      }
    });
    PF.image.downloadCanvas(exportCnv, 'pixelforge-sketch.png');
  });

  // Canvas Drawing Logic
  const getPos = (e) => {
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 1
    };
  };

  const drawSymmetry = (ctxFn, x, y, isMove = true) => {
    const w = 800, h = 600;
    ctxFn(x, y);
    if (state.symmetry === 'horizontal' || state.symmetry === 'both') {
      ctxFn(w - x, y);
    }
    if (state.symmetry === 'vertical' || state.symmetry === 'both') {
      ctxFn(x, h - y);
    }
    if (state.symmetry === 'both') {
      ctxFn(w - x, h - y);
    }
  };

  previewCanvas.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    state.isDrawing = true;
    const pos = getPos(e);
    state.points = [pos];
    state.startX = pos.x;
    state.startY = pos.y;
    
    if (state.tool === 'fill') {
      floodFill(pos.x, pos.y);
      state.isDrawing = false;
      return;
    }
    if (state.tool === 'eyedropper') {
      pickColor(pos.x, pos.y);
      state.isDrawing = false;
      return;
    }
    
    previewCtx.clearRect(0,0,800,600);
    previewCtx.lineCap = 'round';
    previewCtx.lineJoin = 'round';
  });

  previewCanvas.addEventListener('pointermove', e => {
    if (!state.isDrawing) return;
    const pos = getPos(e);
    
    if (['brush', 'eraser'].includes(state.tool)) {
      state.points.push(pos);
      drawCurve(previewCtx, state.points, true);
    } else if (['line', 'rect', 'circle'].includes(state.tool)) {
      previewCtx.clearRect(0,0,800,600);
      setupContext(previewCtx);
      drawShape(previewCtx, state.startX, state.startY, pos.x, pos.y);
    }
  });

  previewCanvas.addEventListener('pointerup', e => {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    
    // Commit to active canvas
    const activeCtx = layers[activeLayerIndex].ctx;
    activeCtx.globalAlpha = state.opacity;

    if (state.tool === 'eraser') {
      activeCtx.globalCompositeOperation = 'destination-out';
      drawCurve(activeCtx, state.points, false);
      activeCtx.globalCompositeOperation = 'source-over';
    } else if (state.tool === 'brush') {
      activeCtx.globalCompositeOperation = 'source-over';
      drawCurve(activeCtx, state.points, false);
    } else if (['line', 'rect', 'circle'].includes(state.tool)) {
      const pos = getPos(e);
      setupContext(activeCtx);
      drawShape(activeCtx, state.startX, state.startY, pos.x, pos.y);
    }
    
    previewCtx.clearRect(0,0,800,600);
    saveHistory();
  });

  function setupContext(ctx) {
    ctx.strokeStyle = state.color;
    ctx.fillStyle = state.color;
    ctx.lineWidth = state.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function drawCurve(ctx, points, isPreview) {
    if (isPreview) ctx.clearRect(0,0,800,600);
    setupContext(ctx);
    if(isPreview && state.tool !== 'eraser') ctx.globalAlpha = state.opacity;
    
    if (points.length < 3) {
      if (points.length > 0) {
        ctx.beginPath();
        drawSymmetry((x,y) => {
          ctx.arc(x, y, state.brushSize/2, 0, Math.PI*2);
        }, points[0].x, points[0].y);
        ctx.fill();
      }
      return;
    }

    ctx.beginPath();
    drawSymmetry((x, y) => {
      ctx.moveTo(points[0].x + (x - points[0].x), points[0].y + (y - points[0].y));
      for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(
          points[i].x + (x - points[i].x), 
          points[i].y + (y - points[i].y), 
          xc + (x - points[i].x), 
          yc + (y - points[i].y)
        );
      }
      const last = points[points.length - 1];
      const secondLast = points[points.length - 2];
      ctx.quadraticCurveTo(
        secondLast.x + (x - secondLast.x), 
        secondLast.y + (y - secondLast.y), 
        last.x + (x - last.x), 
        last.y + (y - last.y)
      );
    }, points[0].x, points[0].y);
    ctx.stroke();
  }

  function drawShape(ctx, startX, startY, endX, endY) {
    ctx.beginPath();
    drawSymmetry((x, y) => {
      const w = endX - startX;
      const h = endY - startY;
      const modX = x;
      const modY = y;
      
      if (state.tool === 'line') {
        ctx.moveTo(modX, modY);
        ctx.lineTo(modX + w, modY + h);
      } else if (state.tool === 'rect') {
        ctx.rect(modX, modY, w, h);
      } else if (state.tool === 'circle') {
        const r = Math.sqrt(w*w + h*h);
        ctx.moveTo(modX + r, modY); // prevent extra line from previous sub-path
        ctx.arc(modX, modY, r, 0, Math.PI*2);
      }
    }, startX, startY);
    
    if (state.tool === 'line') ctx.stroke();
    else ctx.fill();
  }

  function floodFill(x, y) {
    x = Math.round(x); y = Math.round(y);
    const canvas = layers[activeLayerIndex].canvas;
    const ctx = layers[activeLayerIndex].ctx;
    const idata = ctx.getImageData(0,0,800,600);
    const data = idata.data;
    const w = 800;
    const pos = (y * w + x) * 4;
    const sr = data[pos], sg = data[pos+1], sb = data[pos+2], sa = data[pos+3];
    
    const fillRgb = PF.color.hexToRgb(state.color);
    if (!fillRgb) return;
    if (sr === fillRgb.r && sg === fillRgb.g && sb === fillRgb.b && sa === 255) return;
    
    const stack = [[x,y]];
    while(stack.length) {
      const [cx, cy] = stack.pop();
      const p = (cy * w + cx) * 4;
      if (cx < 0 || cx >= w || cy < 0 || cy >= 600) continue;
      if (data[p] === sr && data[p+1] === sg && data[p+2] === sb && data[p+3] === sa) {
        data[p] = fillRgb.r; data[p+1] = fillRgb.g; data[p+2] = fillRgb.b; data[p+3] = 255;
        stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
      }
    }
    ctx.putImageData(idata, 0, 0);
    saveHistory();
  }

  function pickColor(x, y) {
    const ctx = layers[activeLayerIndex].ctx;
    const data = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    if (data[3] === 0) return; // ignore transparent
    const hex = PF.color.rgbToHex(data[0], data[1], data[2]);
    state.color = hex;
    colorInput.value = hex;
    colorSwatch.style.background = hex;
    document.querySelector('[data-tool="brush"]').click();
  }
});
