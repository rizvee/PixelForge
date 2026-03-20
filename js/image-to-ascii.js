document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const uo = document.getElementById('upload-overlay');
    const rc = document.getElementById('result-container');
    const out = document.getElementById('ascii-output');
    
    const charsMaps = {
        standard: "@$#*!=;:~-,. ", // Dark to Light
        detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
        blocks: "█▓▒░ ",
        binary: "10 ",
        custom: " .-+=#@"
    };
  
    let sourceImg = null;
    let asciiColors = [];
    let isColor = false;
  
    const UI = {
        res: document.getElementById('param-res'),
        chars: document.getElementById('param-chars'),
        customBox: document.getElementById('custom-char-box'),
        customStr: document.getElementById('param-custom'),
        color: document.getElementById('param-color'),
        invert: document.getElementById('param-invert'),
        contrast: document.getElementById('param-contrast'),
        bright: document.getElementById('param-bright')
    };
  
    // Add drag and drop to workspace
    const workspace = document.getElementById('workspace');
    workspace.addEventListener('dragover', e => { e.preventDefault(); document.querySelector('.upload-box').classList.add('dragover'); });
    workspace.addEventListener('dragleave', e => { e.preventDefault(); document.querySelector('.upload-box').classList.remove('dragover'); });
    workspace.addEventListener('drop', e => { e.preventDefault(); document.querySelector('.upload-box').classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
    document.addEventListener('paste', e => { if(e.clipboardData.files.length) handleFiles(e.clipboardData.files); });
  
    fileInput.onchange = e => handleFiles(e.target.files);
  
    async function handleFiles(files) {
        if(!files.length) return;
        try {
            sourceImg = await PF.image.loadImage(files[0]);
            uo.style.display = 'none';
            rc.style.display = 'flex';
            generateASCII();
        } catch(e) { console.error(e); PF.ui.showToast('Invalid image', 'error'); }
    }
  
    function getCharSet() {
        let set = UI.chars.value === 'custom' ? UI.customStr.value : charsMaps[UI.chars.value];
        if(!set) set = " ";
        // Reverse if invert not checked. (Assumes string is Dark->Light. If white text on black, light pixels get dark chars? No, white text on black means light pixels get DENSE chars)
        // Let's standardise: 0(dark)->255(light). Dense char for light pixel if invert=false.
        // Wait, typical ASCII: dark pixels are represented by dense chars for black text on white.
        // But our terminal is BLACK. So dense chars = white/bright pixels.
        // Map: "$@#" (dense), " ., " (sparse).
        // Bright pixel (255) -> "$". String should be sparse to dense: " .,#"
        let mappedSet = set.split('').reverse().join(''); 
        if(UI.invert.checked) mappedSet = mappedSet.split('').reverse().join('');
        return mappedSet;
    }
  
    function adjustPixel(val, bright, cont) {
        // Brightness
        val += bright;
        // Contrast
        let factor = (259 * (cont + 255)) / (255 * (259 - cont));
        val = factor * (val - 128) + 128;
        return PF.ui.clamp(val, 0, 255);
    }
  
    function generateASCII() {
        if(!sourceImg) return;
        isColor = UI.color.value === 'color';
        let cols = parseInt(UI.res.value);
        let fontAspect = 0.5; // Monospace fonts are ~2:1 height:width ratio typically
        
        let c = document.createElement('canvas');
        let ctx = c.getContext('2d');
        
        // Calculate rows factoring in font aspect ratio and image aspect ratio
        let imgAspect = sourceImg.height / sourceImg.width;
        let rows = Math.floor(cols * imgAspect * fontAspect);
        
        c.width = cols;
        c.height = rows;
        ctx.drawImage(sourceImg, 0, 0, cols, rows);
        
        let imgData = ctx.getImageData(0,0,cols,rows).data;
        let charSet = getCharSet();
        let cLen = charSet.length - 1;
        
        let bVal = parseInt(UI.bright.value);
        let cVal = parseInt(UI.contrast.value);
        
        let asciiStr = '';
        asciiColors = []; // Stored for HTML export later
        
        for (let j=0; j<rows; j++) {
            for (let i=0; i<cols; i++) {
                let p = (j*cols + i) * 4;
                let r = imgData[p], g=imgData[p+1], b=imgData[p+2], a=imgData[p+3];
                
                // alpha handling (assume dark)
                if (a < 128) { r=0; g=0; b=0; }
                
                // luminance
                let lum = 0.299 * r + 0.587 * g + 0.114 * b;
                lum = adjustPixel(lum, bVal, cVal);
                
                let charIndex = Math.floor((lum / 255) * cLen);
                let ch = charSet[charIndex];
                if(ch === ' ') ch = '\u00A0'; // non breaking space for HTML rendering consistency
                if(ch === '<') ch = '&lt;';
                if(ch === '>') ch = '&gt;';
                
                if (isColor) {
                    let hex = PF.color.rgbToHex(r,g,b);
                    asciiStr += `<span style="color:${hex}">${ch}</span>`;
                } else {
                    asciiStr += ch;
                }
            }
            asciiStr += '\n';
        }
        
        if (UI.color.value === 'mono') out.className = 'ascii-output';
        else if (UI.color.value === 'mono-white') out.className = 'ascii-output white';
        else out.className = 'ascii-output white';
  
        out.innerHTML = asciiStr;
        
        // Auto-scale font size to fit container if needed, mostly handled by css/zoom but we'll do font-size mapping
        let screenW = rc.clientWidth - 32; // padding
        let estFontW = screenW / cols;
        out.style.fontSize = Math.max(3, Math.min(14, estFontW*1.5)) + 'px';
    }
  
    const sync = PF.ui.debounce(generateASCII, 50);
  
    UI.res.oninput = (e) => { document.getElementById('val-res').textContent = e.target.value+'ch'; sync(); }
    UI.contrast.oninput = (e) => { document.getElementById('val-contrast').textContent = e.target.value+'%'; sync(); }
    UI.bright.oninput = (e) => { document.getElementById('val-bright').textContent = e.target.value; sync(); }
    
    UI.chars.onchange = () => { UI.customBox.style.display = UI.chars.value === 'custom' ? 'block' : 'none'; sync(); };
    UI.customStr.oninput = sync;
    UI.color.onchange = sync;
    UI.invert.onchange = sync;
  
    // Exports
    document.getElementById('btn-copy').onclick = () => {
        let text = isColor ? out.innerText : out.textContent; // innerText drops spans
        PF.ui.copyToClipboard(text);
    };
  
    document.getElementById('btn-dl-txt').onclick = () => {
        let text = out.innerText; // Get raw text without HTML tags for .txt
        // re-replace nbsps if needed
        text = text.replace(/\u00A0/g, ' ');

        const blob = new Blob([text], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'pixelforge-ascii.txt';
        a.click(); URL.revokeObjectURL(url);
    };
  
    document.getElementById('btn-dl-html').onclick = () => {
        let bg = '#000';
        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ASCII Art</title><style>
        body { background: ${bg}; color: ${UI.color.value==='mono'?'#00ff41':'#fff'}; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
        pre { font-family: monospace; font-size: 10px; line-height: 1; letter-spacing: 2px; }
        </style></head><body><pre>${out.innerHTML}</pre></body></html>`;
        
        const blob = new Blob([html], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'pixelforge-ascii.html';
        a.click(); URL.revokeObjectURL(url);
    };
});
