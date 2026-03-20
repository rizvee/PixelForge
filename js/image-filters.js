document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const overlay = document.getElementById('upload-overlay');
  const container = document.getElementById('img-container');
  
  const imgBase = document.getElementById('img-base');
  const imgFiltered = document.getElementById('img-filtered');
  const splitCont = document.getElementById('split-filtered');
  const splitSlider = document.getElementById('split-slider');
  const splitView = document.getElementById('split-view');
  
  let currentFileUrl = null;

  // File Upload Logic
  fileInput.addEventListener('change', e => handleFiles(e.target.files));
  dropZone.addEventListener('dragover', e => { e.preventDefault(); document.querySelector('.upload-box').classList.add('dragover'); });
  dropZone.addEventListener('dragleave', e => { e.preventDefault(); document.querySelector('.upload-box').classList.remove('dragover'); });
  dropZone.addEventListener('drop', e => { e.preventDefault(); document.querySelector('.upload-box').classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  document.addEventListener('paste', e => { if(e.clipboardData.files.length) handleFiles(e.clipboardData.files); });

  function handleFiles(files) {
    if(!files.length || !files[0].type.startsWith('image/')) return;
    overlay.style.display = 'none';
    container.style.display = 'flex';
    
    if(currentFileUrl) URL.revokeObjectURL(currentFileUrl);
    currentFileUrl = URL.createObjectURL(files[0]);
    
    imgBase.src = currentFileUrl;
    imgFiltered.src = currentFileUrl;
    
    // Set preset thumbs
    document.querySelectorAll('.preset-thumb').forEach(div => {
      div.style.backgroundImage = `url(${currentFileUrl})`;
    });

    imgBase.onload = () => {
        // Sync widths
        imgFiltered.style.width = imgBase.width + 'px';
        imgFiltered.style.height = imgBase.height + 'px';
    };
  }

  // Window resize resync
  window.addEventListener('resize', () => {
      if(imgBase.width) {
          imgFiltered.style.width = imgBase.width + 'px';
          imgFiltered.style.height = imgBase.height + 'px';
      }
  });

  // Slider Logic
  let isDragging = false;
  splitSlider.addEventListener('mousedown', () => isDragging = true);
  window.addEventListener('mouseup', () => isDragging = false);
  window.addEventListener('mousemove', e => {
    if(!isDragging) return;
    const rect = splitView.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let percent = PF.ui.clamp((x / rect.width) * 100, 0, 100);
    splitSlider.style.left = percent + '%';
    splitCont.style.width = percent + '%';
  });

  // Compare Toggle
  document.getElementById('split-compare').addEventListener('change', e => {
    if(e.target.checked) {
      splitSlider.style.display = 'block';
      splitCont.style.width = splitSlider.style.left || '50%';
    } else {
      splitSlider.style.display = 'none';
      splitCont.style.width = '100%';
    }
  });

  // Filters State
  const filters = {
    brightness: { val: 100, unit: '%' },
    contrast: { val: 100, unit: '%' },
    saturate: { val: 100, unit: '%' },
    grayscale: { val: 0, unit: '%' },
    sepia: { val: 0, unit: '%' },
    'hue-rotate': { val: 0, unit: 'deg' },
    blur: { val: 0, unit: 'px' },
    invert: { val: 0, unit: '%' }
  };

  const presetsMaps = {
    none: {},
    vintage: { sepia: 50, contrast: 120, grayscale: 20 },
    cinematic: { contrast: 130, saturate: 120, brightness: 90 },
    noir: { grayscale: 100, contrast: 150 },
    polaroid: { sepia: 30, saturate: 140, 'hue-rotate': -10, contrast: 110 },
    cyberpunk: { 'hue-rotate': 90, saturate: 200, contrast: 120 }
  };

  function updateFilters() {
    let cssVals = [];
    for(let key in filters) {
      let f = filters[key];
      // Default ignoring
      if (key === 'brightness' || key === 'contrast' || key === 'saturate') {
          if (f.val !== 100) cssVals.push(`${key}(${f.val}${f.unit})`);
      } else {
          if (f.val !== 0) cssVals.push(`${key}(${f.val}${f.unit})`);
      }
    }
    const cssFilter = cssVals.length > 0 ? cssVals.join(' ') : 'none';
    imgFiltered.style.filter = cssFilter;
    document.getElementById('css-code').textContent = `filter: ${cssFilter};`;
  }

  function syncUIFromState() {
    document.querySelectorAll('.adj-slider').forEach(s => {
      let key = s.dataset.filter;
      s.value = filters[key].val;
      document.getElementById('val-'+(key==='hue-rotate'?'hue':key)).textContent = filters[key].val + filters[key].unit;
    });
    updateFilters();
  }

  document.querySelectorAll('.adj-slider').forEach(s => {
    s.addEventListener('input', e => {
      // Manual edit removes preset active state
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      let key = s.dataset.filter;
      filters[key].val = s.value;
      document.getElementById('val-'+(key==='hue-rotate'?'hue':key)).textContent = s.value + filters[key].unit;
      updateFilters();
    });
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      let pmap = presetsMaps[btn.dataset.preset];
      
      // Reset all to defaults
      filters.brightness.val = 100;
      filters.contrast.val = 100;
      filters.saturate.val = 100;
      filters.grayscale.val = 0;
      filters.sepia.val = 0;
      filters['hue-rotate'].val = 0;
      filters.blur.val = 0;
      filters.invert.val = 0;
      
      // Apply preset
      for(let k in pmap) {
        filters[k].val = pmap[k];
      }
      syncUIFromState();
    };
  });

  document.getElementById('btn-reset').onclick = () => {
    document.querySelector('.preset-btn[data-preset="none"]').click();
  };

  // Export process
  document.getElementById('btn-export').onclick = () => {
    if(!currentFileUrl) return;
    const filterCSS = imgFiltered.style.filter;
    if(filterCSS === 'none' || !filterCSS) { // just export normally
        const a = document.createElement('a');
        a.href = currentFileUrl; a.download = 'pixelforge-filtered.png'; a.click();
        return;
    }

    // Draw to canvas to bake filter
    // Need an image object backing to original size
    const imgObj = new Image();
    imgObj.crossOrigin = 'Anonymous';
    imgObj.onload = () => {
        const c = document.createElement('canvas');
        c.width = imgObj.width; c.height = imgObj.height;
        const cctx = c.getContext('2d');
        cctx.filter = filterCSS;
        cctx.drawImage(imgObj, 0, 0);
        PF.image.downloadCanvas(c, 'pixelforge-filtered.png');
    };
    imgObj.src = currentFileUrl;
  };

  syncUIFromState();
});
