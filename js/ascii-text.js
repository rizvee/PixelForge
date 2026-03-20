document.addEventListener('DOMContentLoaded', () => {
  const UI = {
    text: document.getElementById('text-input'),
    size: document.getElementById('param-size'),
    font: document.getElementById('param-font'),
    color: document.getElementById('param-color'),
    border: document.getElementById('param-border'),
    out: document.getElementById('ascii-output'),
    stats: document.getElementById('info-stats')
  };

  let align = 'left';

  // Basic Big Font Map (partial for demonstration: A-Z, a-z map to A-Z)
  const fontBig = {
    'A': ["  ___  "," / _ \\ ","/ /_\\ \\","|  _  |","| | | |","\\_| |_/"],
    'B': ["______ ","| ___ \\","| |_/ /","| ___ \\","| |_/ /","\\____/ "],
    'C': [" _____ ","/  __ \\","| /  \\/","| |    ","| \\__/\\"," \\____/"],
    'D': ["______ ","|  _  \\","| | | |","| | | |","| |/ / ","|___/  "],
    'E': [" _____ ","|  ___|","| |__  ","|  __| ","| |___ ","\\____/ "],
    'F': [" _____ ","|  ___|","| |__  ","|  __| ","| |    ","\\_|    "],
    'G': [" _____ ","|  __ \\","| |  \\/","| | __ ","| |_\\ \\"," \\____/"],
    'H': [" _   _ ","| | | |","| |_| |","|  _  |","| | | |","\\_| |_/"],
    'I': [" _____ ","|_   _|","  | |  ","  | |  "," _| |_ "," \\___/ "],
    'J': ["   ___ ","  |_  |","    | |","    | |","/\\__/ /","\\____/ "],
    'K': [" _   __","| | / /","| |/ / ","|    \\ ","| |\\  \\","\\_| \\_/"],
    'L': [" _     ","| |    ","| |    ","| |    ","| |____","\\_____/"],
    'M': ["__  __ ","|  \\/  |","| .  . |","| |\\/| |","| |  | |","\\_|  |_/"],
    'N': [" _   _ ","| \\ | |","|  \\| |","| . ` |","| |\\  |","\\_| \\_/"],
    'O': [" _____ ","|  _  |","| | | |","| | | |","\\ \\_/ /"," \\___/ "],
    'P': ["______ ","| ___ \\","| |_/ /","|  __/ ","| |    ","\\_|    "],
    'Q': [" _____ ","|  _  |","| | | |","| | | |","\\ \\_/ /"," \\___\\X"],
    'R': ["______ ","| ___ \\","| |_/ /","|    / ","| |\\ \\ ","\\_| \\_|"],
    'S': [" _____ ","/  ___|","\\ `--. "," `--. \\","/\\__/ /","\\____/ "],
    'T': [" _____ ","|_   _|","  | |  ","  | |  ","  | |  ","  \\_/  "],
    'U': [" _   _ ","| | | |","| | | |","| | | |","| |_| |"," \\___/ "],
    'V': [" _   _ ","| | | |","| | | |","| | | |","\\ \\_/ /"," \\___/ "],
    'W': [" _    _ ","| |  | |","| |  | |","| |/\\| |","\\  /\\  /"," \\/  \\/ "],
    'X': ["__   __","\\ \\ / /"," \\ V / "," /   \\ ","/ /^\\ \\","\\/   \\/"],
    'Y': ["__   __","\\ \\ / /"," \\ V / ","  | |  ","  | |  ","  \\_/  "],
    'Z': [" _____ ","|__  / ","  / /  "," / /   ","/_/____","\\_____/"],
    ' ': ["   ","   ","   ","   ","   ","   "]
  };
  
  const fontBlock = {
    'A': ["█████", "█   █", "█████", "█   █", "█   █"],
    'B': ["████ ", "█   █", "████ ", "█   █", "████ "],
    ' ': ["     ","     ","     ","     ","     "]
  }; // simplified block representation idea for scale

  function generateASCII() {
    let text = UI.text.value.toUpperCase();
    if(!text) { UI.out.textContent = ''; return; }
    
    let fontName = UI.font.value;
    let finalStr = '';
    
    // Check if real map
    if (fontName === 'big' || fontName === 'block') {
      let map = fontName === 'big' ? fontBig : fontBlock;
      let height = fontName === 'big' ? 6 : 5;
      
      let lines = text.split('\n');
      let resultLines = [];
      
      lines.forEach(word => {
        for(let row=0; row<height; row++){
          let rStr = '';
          for(let i=0; i<word.length; i++) {
            let char = word[i];
            let cMap = map[char] || map[' '];
            if (!cMap) cMap = map[' ']; // fallback
            rStr += cMap[row] + ' ';
          }
          resultLines.push(rStr);
        }
        resultLines.push(''); // spacing between original lines
      });
      finalStr = resultLines.join('\n');
    } else {
      // Stub for stylized CSS fonts
      finalStr = text; 
      UI.out.className = 'terminal-output font-' + fontName;
    }
    
    if (fontName === 'big' || fontName === 'block') {
      UI.out.className = 'terminal-output';
    }

    // Apply Border
    if (UI.border.value !== 'none' && (fontName === 'big' || fontName === 'block')) {
        let linesArr = finalStr.split('\n').filter(l => l.trim().length > 0 || l.length > 0);
        let maxW = Math.max(...linesArr.map(l => l.length));
        let cBorder, hBorder, vBorder;
        if(UI.border.value === 'box') { cBorder=['┌','┐','└','┘']; hBorder='─'; vBorder='│'; }
        else if(UI.border.value === 'double') { cBorder=['=','=','=','=']; hBorder='='; vBorder='='; }
        else { cBorder=['#','#','#','#']; hBorder='#'; vBorder='#'; }
        
        let top = cBorder[0] + hBorder.repeat(maxW+2) + cBorder[1];
        let bot = cBorder[2] + hBorder.repeat(maxW+2) + cBorder[3];
        
        let boxed = linesArr.map(l => {
            let pad = maxW - l.length;
            let leftPad = align === 'center' ? Math.floor(pad/2) : (align === 'right' ? pad : 0);
            let rightPad = align === 'center' ? Math.ceil(pad/2) : (align === 'right' ? 0 : pad);
            return `${vBorder} ${' '.repeat(leftPad)}${l}${' '.repeat(rightPad)} ${vBorder}`;
        });
        
        finalStr = [top, ...boxed, bot].join('\n');
    } else {
        // Just alignment
        if(align !== 'left') {
            let linesArr = finalStr.split('\n');
            let maxW = Math.max(...linesArr.map(l => l.length));
            let aligned = linesArr.map(l => {
                let pad = maxW - l.length;
                let leftPad = align === 'center' ? Math.floor(pad/2) : pad;
                return ' '.repeat(leftPad) + l;
            });
            finalStr = aligned.join('\n');
        }
    }

    UI.out.textContent = finalStr;
    
    // Stats
    let charCount = finalStr.replace(/\n, \r/g, '').length;
    let lineCount = finalStr.split('\n').length;
    UI.stats.textContent = `Chars: ${charCount} | Lines: ${lineCount}`;
  }

  const sync = PF.ui.debounce(generateASCII, 100);

  UI.text.addEventListener('input', sync);
  UI.font.addEventListener('change', sync);
  UI.border.addEventListener('change', sync);
  
  UI.size.addEventListener('input', e => {
    UI.out.style.fontSize = e.target.value + 'px';
    document.getElementById('val-size').textContent = e.target.value + 'px';
  });
  
  UI.color.addEventListener('input', e => {
    UI.out.style.color = e.target.value;
  });

  document.querySelectorAll('.align-btn').forEach(b => {
      b.onclick = (e) => {
          document.querySelectorAll('.align-btn').forEach(btn => btn.classList.remove('active'));
          b.classList.add('active');
          align = b.dataset.align;
          sync();
      };
  });

  document.getElementById('btn-copy').onclick = () => {
    PF.ui.copyToClipboard(UI.out.textContent);
  };

  document.getElementById('btn-download').onclick = () => {
    const blob = new Blob([UI.out.textContent], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ascii-art.txt';
    a.click(); URL.revokeObjectURL(url);
  };

  document.getElementById('btn-download-html').onclick = () => {
    let cssClass = UI.out.className;
    let col = UI.color.value;
    let fsz = UI.size.value;
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ASCII Art</title><style>
    body { background: #0d0d14; color: ${col}; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    pre { font-family: monospace; font-size: ${fsz}px; line-height: 1.2; }
    </style></head><body><pre class="${cssClass}">${UI.out.textContent}</pre></body></html>`;
    
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ascii-art.html';
    a.click(); URL.revokeObjectURL(url);
  };

  // Init
  generateASCII();
});
