document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const uo = document.getElementById('upload-overlay');
    const cc = document.getElementById('canvas-container');
    const canvas = document.getElementById('meme-canvas');
    const ctx = canvas.getContext('2d');
    const tList = document.getElementById('text-blocks-list');
  
    let bgImg = null;
    let imgDataURL = null;
    let texts = [
      { id: Date.now(), text: 'TOP TEXT', x: 50, y: 10, align: 'center', isDragging: false },
      { id: Date.now()+1, text: 'BOTTOM TEXT', x: 50, y: 90, align: 'center', isDragging: false }
    ];
  
    let dragTarget = null;
    let dragStartX = 0, dragStartY = 0;
  
    const UI = {
      gSize: document.getElementById('param-global-size'),
      gColor: document.getElementById('param-color'),
      gStroke: document.getElementById('param-stroke'),
      border: document.getElementById('param-border')
    };
  
    // Uploads
    fileInput.onchange = e => handleFiles(e.target.files);
    document.getElementById('btn-blank').onclick = () => {
      bgImg = null;
      imgDataURL = null;
      canvas.width = 800; canvas.height = 600;
      startEditor();
    };
  
    async function handleFiles(files) {
      if(!files.length) return;
      try {
        bgImg = await PF.image.loadImage(files[0]);
        // constrain max dimensions
        let maxW = 1200;
        let cCv = PF.image.imageToCanvas(bgImg, maxW);
        canvas.width = cCv.width; canvas.height = cCv.height;
        imgDataURL = cCv.toDataURL(); // store base so we don't hold the huge image in memory repeatedly
        startEditor();
      } catch(e) { console.error(e); }
    }
  
    function startEditor() {
      uo.style.display = 'none';
      cc.style.display = 'block';
      renderUI();
      draw();
    }
  
    // Text UI
    function renderUI() {
      tList.innerHTML = '';
      texts.forEach((tb, i) => {
        let card = document.createElement('div');
        card.className = 'text-block-card';
        card.innerHTML = `
          <div class="text-block-header">
            <span class="text-block-title">Text Box ${i+1}</span>
            <button class="btn-del-block" title="Delete">✕</button>
          </div>
          <textarea class="input w-full" rows="2" placeholder="Enter text here...">${tb.text}</textarea>
        `;
        
        card.querySelector('textarea').oninput = e => { tb.text = e.target.value.toUpperCase(); draw(); };
        card.querySelector('.btn-del-block').onclick = () => { texts.splice(i, 1); renderUI(); draw(); };
        tList.appendChild(card);
      });
    }
  
    document.getElementById('btn-add-text').onclick = () => {
      texts.push({ id: Date.now(), text: 'NEW TEXT', x: 50, y: 50, align: 'center', isDragging: false });
      renderUI(); draw();
    };
  
    // Rendering
    function draw() {
      if(!bgImg) {
        // Blank
        ctx.fillStyle = '#000000';
        ctx.fillRect(0,0,canvas.width,canvas.height);
      } else {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        // Draw with border if needed
        let pad = parseInt(UI.border.value);
        if(pad > 0) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0,0,canvas.width,canvas.height);
            // Redraw bgImg scaled down
            let newW = canvas.width - (pad*2);
            let newH = canvas.height - (pad*2);
            ctx.drawImage(bgImg, pad, pad, newW, newH);
        } else {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        }
      }
  
      let baseSize = canvas.height * (UI.gSize.value / 100);
      
      texts.forEach(tb => {
        if(!tb.text.trim()) return;
        
        ctx.font = `${baseSize}px 'Oswald', Impact, sans-serif`;
        ctx.textAlign = tb.align;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = UI.gColor.value;
        ctx.strokeStyle = UI.gStroke.value;
        ctx.lineWidth = Math.max(2, baseSize / 15);
        ctx.lineJoin = 'round';
  
        let px = (tb.x / 100) * canvas.width;
        let py = (tb.y / 100) * canvas.height;
  
        let lines = tb.text.split('\n');
        let lineHeight = baseSize * 1.1;
        let startY = py - ((lines.length - 1) * lineHeight / 2);
  
        lines.forEach((line, j) => {
          let currY = startY + (j * lineHeight);
          ctx.strokeText(line, px, currY);
          ctx.fillText(line, px, currY);
        });
      });
    }
  
    // Global Listeners
    [UI.gSize, UI.gColor, UI.gStroke, UI.border].forEach(el => el.addEventListener('input', () => {
      if(el.id==='param-global-size') document.getElementById('val-size').textContent = el.value + '%';
      if(el.id==='param-border') document.getElementById('val-border').textContent = el.value + 'px';
      draw();
    }));
  
    // Dragging logic
    canvas.addEventListener('pointerdown', e => {
      let rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let mx = (e.clientX - rect.left) * scaleX;
      let my = (e.clientY - rect.top) * scaleY;
  
      // Hit testing backwards (top z-index first)
      for(let i=texts.length-1; i>=0; i--) {
        let tb = texts[i];
        let px = (tb.x / 100) * canvas.width;
        let py = (tb.y / 100) * canvas.height;
        // rough hit box
        let baseSize = canvas.height * (UI.gSize.value / 100);
        let lines = tb.text.split('\n');
        let hitW = ctx.measureText(lines[0] || 'A').width * 1.2; // approx
        let hitH = lines.length * baseSize;
  
        let left = px - hitW/2; let right = px + hitW/2;
        let top = py - hitH/2; let bot = py + hitH/2;
  
        if(mx >= left && mx <= right && my >= top && my <= bot) {
           dragTarget = tb;
           dragStartX = mx; dragStartY = my;
           // highlight in UI
           document.querySelectorAll('.text-block-card').forEach(c=>c.classList.remove('active-block'));
           if (tList.children[i]) tList.children[i].classList.add('active-block');
           break;
        }
      }
    });
  
    window.addEventListener('pointermove', e => {
      if(!dragTarget) return;
      let rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      let mx = (e.clientX - rect.left) * scaleX;
      let my = (e.clientY - rect.top) * scaleY;
  
      dragTarget.x = (mx / canvas.width) * 100;
      dragTarget.y = (my / canvas.height) * 100;
  
      draw();
    });
  
    window.addEventListener('pointerup', () => { dragTarget = null; });
  
    document.getElementById('btn-export').onclick = () => PF.image.downloadCanvas(canvas, 'pixelforge-meme.png');
  });
