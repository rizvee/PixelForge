document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const overlay = document.getElementById('upload-overlay');
  const container = document.getElementById('img-container');
  const canvas = document.getElementById('img-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const lens = document.getElementById('hover-lens');
  const hexOut = document.getElementById('v-hex');
  const rgbOut = document.getElementById('v-rgb');
  const hslOut = document.getElementById('v-hsl');
  const cmykOut = document.getElementById('v-cmyk');
  const lgSwatch = document.getElementById('active-swatch');

  let imgData = null;
  let activeHex = '#000000';
  let myPalette = [];

  // File Upload Logic
  fileInput.addEventListener('change', e => handleFiles(e.target.files));
  dropZone.addEventListener('dragover', e => { e.preventDefault(); document.querySelector('.upload-box').classList.add('dragover'); });
  dropZone.addEventListener('dragleave', e => { e.preventDefault(); document.querySelector('.upload-box').classList.remove('dragover'); });
  dropZone.addEventListener('drop', e => { e.preventDefault(); document.querySelector('.upload-box').classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  document.addEventListener('paste', e => { if(e.clipboardData.files.length) handleFiles(e.clipboardData.files); });

  async function handleFiles(files) {
    if(!files.length || !files[0].type.startsWith('image/')) return;
    try {
      const img = await PF.image.loadImage(files[0]);
      overlay.style.display = 'none';
      container.style.display = 'block';
      let maxW = window.innerWidth * 0.6; // initial fit
      let tmp = PF.image.imageToCanvas(img, maxW);
      canvas.width = tmp.width; canvas.height = tmp.height;
      ctx.drawImage(tmp, 0,0);
      imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
      
      extractPalette(tmp);
      document.getElementById('param-zoom').value = 1;
      applyZoom(1);
    } catch(err) {
      console.error(err);
      PF.ui.showToast('Invalid image file', 'error');
    }
  }

  function applyZoom(z) {
    document.getElementById('val-zoom').textContent = z + 'x';
    container.style.transform = `scale(${z})`;
    // Adjust workspace scroll
  }
  document.getElementById('param-zoom').addEventListener('input', e => applyZoom(e.target.value));

  // Canvas Interactions
  container.addEventListener('mousemove', e => {
    if(!imgData) return;
    const rect = canvas.getBoundingClientRect();
    const scale =  rect.width / canvas.width; // considering zoom
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);
    
    lens.style.display = 'flex';
    lens.style.left = (e.clientX - rect.left) + 'px';
    lens.style.top = (e.clientY - rect.top) + 'px';

    if(x>=0 && x<canvas.width && y>=0 && y<canvas.height) {
      const p = (y * canvas.width + x) * 4;
      const r=imgData.data[p], g=imgData.data[p+1], b=imgData.data[p+2], a=imgData.data[p+3];
      if (a === 0) return;
      const hex = PF.color.rgbToHex(r,g,b);
      document.getElementById('lens-color').style.background = hex;
      document.getElementById('lens-hex').textContent = hex;
    }
  });

  container.addEventListener('mouseleave', () => lens.style.display = 'none');

  container.addEventListener('click', e => {
    if(!imgData) return;
    const rect = canvas.getBoundingClientRect();
    const scale =  rect.width / canvas.width;
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);
    
    if(x>=0 && x<canvas.width && y>=0 && y<canvas.height) {
      const p = (y * canvas.width + x) * 4;
      const r=imgData.data[p], g=imgData.data[p+1], b=imgData.data[p+2], a=imgData.data[p+3];
      if (a === 0) return;
      setPickedColor(r,g,b);
    }
  });

  function setPickedColor(r, g, b) {
    const hex = PF.color.rgbToHex(r,g,b);
    const hsl = PF.color.rgbToHsl(r,g,b);
    const cmyk = PF.color.rgbToCmyk(r,g,b);
    activeHex = hex;
    
    lgSwatch.style.background = hex;
    hexOut.textContent = hex;
    rgbOut.textContent = `rgb(${r}, ${g}, ${b})`;
    hslOut.textContent = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
    cmykOut.textContent = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  }

  // --- PALETTE EXTRACTION (Basic Color Quantization) ---
  function extractPalette(cvs) {
    // downsample heavily to 64x64 to quickly find dominant colors
    const thumb = document.createElement('canvas');
    thumb.width = 64; thumb.height = 64;
    thumb.getContext('2d').drawImage(cvs, 0,0, 64, 64);
    const data = thumb.getContext('2d').getImageData(0,0,64,64).data;
    
    // Bucket colors in 4-bit per channel (4096 bins)
    const bins = {};
    for (let i = 0; i < data.length; i += 4) {
      if(data[i+3]<128) continue; // skip transparent
      const r = Math.round(data[i]/16)*16;
      const g = Math.round(data[i+1]/16)*16;
      const b = Math.round(data[i+2]/16)*16;
      const key = `${r},${g},${b}`;
      if(!bins[key]) bins[key] = {r,g,b, count:0};
      bins[key].count++;
    }
    
    let sorted = Object.values(bins).sort((a,b) => b.count - a.count);
    // Filter similar colors
    let finalColors = [];
    for (let c of sorted) {
      let isSimilar = false;
      for (let fc of finalColors) {
        let dist = Math.abs(c.r-fc.r) + Math.abs(c.g-fc.g) + Math.abs(c.b-fc.b);
        if (dist < 80) { isSimilar = true; break; }
      }
      if (!isSimilar) {
        finalColors.push(c);
        if (finalColors.length >= 8) break;
      }
    }
    
    const pGrid = document.getElementById('extracted-palette');
    pGrid.innerHTML = '';
    finalColors.forEach(c => {
      let hex = PF.color.rgbToHex(c.r,c.g,c.b);
      let s = document.createElement('div');
      s.className = 'swatch-item';
      s.style.background = hex;
      s.onclick = () => setPickedColor(c.r,c.g,c.b);
      pGrid.appendChild(s);
    });
  }

  // Custom Palette
  document.getElementById('btn-add-palette').onclick = () => {
    if(!activeHex || myPalette.includes(activeHex)) return;
    myPalette.push(activeHex);
    renderCustomPalette();
  };
  document.getElementById('btn-clear-palette').onclick = () => { myPalette = []; renderCustomPalette(); };

  function renderCustomPalette() {
    const pGrid = document.getElementById('custom-palette');
    pGrid.innerHTML = '';
    myPalette.forEach((hex, i) => {
      let s = document.createElement('div');
      s.className = 'swatch-item';
      s.style.background = hex;
      s.onclick = () => {
        myPalette.splice(i, 1);
        renderCustomPalette();
      };
      pGrid.appendChild(s);
    });
    document.getElementById('btn-export-palette').disabled = myPalette.length === 0;
  }

  // Export
  document.getElementById('btn-export-palette').onclick = () => updateExportCode() || document.getElementById('export-modal').classList.add('open');
  document.getElementById('export-format').onchange = updateExportCode;
  
  function updateExportCode() {
    if(myPalette.length === 0) return false;
    const fmt = document.getElementById('export-format').value;
    const out = document.getElementById('export-code');
    let str = '';
    
    if (fmt === 'css') {
      str = ':root {\n';
      myPalette.forEach((c, i) => str += `  --color-${i+1}: ${c};\n`);
      str += '}';
    } else if (fmt === 'tailwind') {
      str = 'module.exports = {\n  theme: {\n    extend: {\n      colors: {\n';
      str += '        custom: {\n';
      myPalette.forEach((c, i) => {
        let step = (i+1)*100; if(step>900) step=950;
        str += `          ${step}: '${c}',\n`;
      });
      str += '        }\n      }\n    }\n  }\n}';
    } else if (fmt === 'scss') {
      str = '$custom-palette: (\n';
      myPalette.forEach((c, i) => str += `  'color-${i+1}': ${c},\n`);
      str += ');';
    } else if (fmt === 'json') {
      str = '[\n  ' + myPalette.map(c => `"${c}"`).join(',\n  ') + '\n]';
    }
    out.textContent = str;
    return true;
  }

  document.getElementById('btn-copy-export').onclick = () => PF.ui.copyToClipboard(document.getElementById('export-code').textContent);
  
  document.getElementById('btn-dl-png').onclick = () => {
    if(myPalette.length===0) return;
    const c = document.createElement('canvas');
    c.width = myPalette.length * 100; c.height = 100;
    const ctx = c.getContext('2d');
    myPalette.forEach((hex, i) => {
      ctx.fillStyle = hex; ctx.fillRect(i*100, 0, 100, 100);
    });
    PF.image.downloadCanvas(c, 'palette-swatches.png');
  };
});
