document.addEventListener('DOMContentLoaded', () => {
  const animations = [
    // LOADERS
    { id: '1', name: 'Spinning Ring', category: 'loaders',
      html: `<div class="loader-ring"></div>`,
      css: `.loader-ring { width: 50px; height: 50px; border: 5px solid rgba(124, 58, 237, 0.2); border-top-color: #7c3aed; border-radius: 50%; --base-duration: 1s; animation: spin var(--base-duration) linear infinite; }\n@keyframes spin { to { transform: rotate(360deg); } }`,
      desc: 'A classic infinite spinning CSS ring.'
    },
    { id: '2', name: 'Bouncing Dots', category: 'loaders',
      html: `<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`,
      css: `.dots { display: flex; gap: 8px; }\n.dot { width: 12px; height: 12px; background: #06b6d4; border-radius: 50%; --base-duration: 0.6s; animation: bounce var(--base-duration) infinite alternate; }\n.dot:nth-child(2) { animation-delay: 0.2s; }\n.dot:nth-child(3) { animation-delay: 0.4s; }\n@keyframes bounce { to { transform: translateY(-15px); } }`,
      desc: 'Three sequential bouncing dots loading indicator.'
    },
    { id: '3', name: 'Pulsing Circle', category: 'loaders',
      html: `<div class="pulse-circle"></div>`,
      css: `.pulse-circle { width: 40px; height: 40px; background: #f59e0b; border-radius: 50%; --base-duration: 1.5s; animation: pulse var(--base-duration) infinite; }\n@keyframes pulse { 0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(245, 158, 11, 0); } 100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }`,
      desc: 'A breathing, pulsing circle that mimics a heartbeat.'
    },
    { id: '4', name: 'Bar Equalizer', category: 'loaders',
      html: `<div class="equalizer"><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>`,
      css: `.equalizer { display: flex; gap: 4px; height: 40px; align-items: flex-end; }\n.bar { width: 8px; background: #10b981; --base-duration: 0.5s; animation: eq var(--base-duration) infinite alternate ease-in-out; }\n.bar:nth-child(1) { height: 20%; animation-delay: 0s; }\n.bar:nth-child(2) { height: 40%; animation-delay: 0.1s; }\n.bar:nth-child(3) { height: 100%; animation-delay: 0.2s; }\n.bar:nth-child(4) { height: 60%; animation-delay: 0.3s; }\n@keyframes eq { to { height: 10px; } }`,
      desc: 'Audio equalizer style loading bars.'
    },
    
    // TEXT EFFECTS
    { id: '5', name: 'Typewriter', category: 'text',
      html: `<h2 class="typewriter">Hello World.</h2>`,
      css: `.typewriter { font-family: monospace; overflow: hidden; border-right: 3px solid; white-space: nowrap; margin: 0; letter-spacing: 2px; --base-duration: 4s; animation: typing 3.5s steps(12, end), border-blink 0.75s step-end infinite; }\n@keyframes typing { from { width: 0 } to { width: 100% } }\n@keyframes border-blink { 50% { border-color: transparent } }`,
      desc: 'Classic typewriter text reveal with blinking cursor.'
    },
    { id: '6', name: 'Neon Glow', category: 'text',
      html: `<h2 class="neon">NEON</h2>`,
      css: `.neon { color: #fff; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #f09, 0 0 40px #f09, 0 0 80px #f09; --base-duration: 1.5s; animation: flicker var(--base-duration) infinite alternate; }\n@keyframes flicker { 0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #f09, 0 0 40px #f09, 0 0 80px #f09; } 20%, 24%, 55% { opacity: 0.4; text-shadow: none; } }`,
      desc: 'Flickering neon sign text effect.'
    },
    { id: '7', name: 'Gradient Shift', category: 'text',
      html: `<h2 class="grad-text">VIBRANT</h2>`,
      css: `.grad-text { font-size: 3rem; font-weight: 900; background: linear-gradient(45deg, #f09, #3f5efb, #fc466b, #3f5efb); background-size: 300%; -webkit-background-clip: text; color: transparent; --base-duration: 3s; animation: bg-shift var(--base-duration) infinite alternate; }\n@keyframes bg-shift { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }`,
      desc: 'Text with an animated shifting linear gradient.'
    },
    
    // SHAPES
    { id: '8', name: 'Morphing Blob', category: 'shapes',
      html: `<div class="blob"></div>`,
      css: `.blob { width: 100px; height: 100px; background: linear-gradient(135deg, #7c3aed, #06b6d4); border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; --base-duration: 8s; animation: morph-blob var(--base-duration) infinite alternate ease-in-out; }\n@keyframes morph-blob { 0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: scale(1) rotate(0deg); } 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1.1) rotate(45deg); } }`,
      desc: 'A continuously morphing organic shape using border-radius.'
    },
    { id: '9', name: 'Rotating 3D Cube', category: 'shapes',
      html: `<div class="cube-scene"><div class="cube"><div class="face front"></div><div class="face back"></div><div class="face right"></div><div class="face left"></div><div class="face top"></div><div class="face bottom"></div></div></div>`,
      css: `.cube-scene { perspective: 400px; } .cube { width: 60px; height: 60px; position: relative; transform-style: preserve-3d; --base-duration: 4s; animation: rotate-cube var(--base-duration) infinite linear; } .face { position: absolute; width: 60px; height: 60px; border: 2px solid #7c3aed; background: rgba(124, 58, 237, 0.2); } .front { transform: translateZ(30px); } .back { transform: rotateY(180deg) translateZ(30px); } .right { transform: rotateY(90deg) translateZ(30px); } .left { transform: rotateY(-90deg) translateZ(30px); } .top { transform: rotateX(90deg) translateZ(30px); } .bottom { transform: rotateX(-90deg) translateZ(30px); } @keyframes rotate-cube { 0% { transform: rotateX(0) rotateY(0); } 100% { transform: rotateX(360deg) rotateY(360deg); } }`,
      desc: 'CSS 3D transforms rendering a spinning cube.'
    },
    
    // HOVER
    { id: '10', name: 'Fill Sweep Button', category: 'hover',
      html: `<button class="sweep-btn">Hover Me</button>`,
      css: `.sweep-btn { padding: 12px 24px; font-size: 1rem; color: #fff; background: transparent; border: 2px solid #06b6d4; border-radius: 4px; position: relative; overflow: hidden; z-index: 1; cursor: pointer; transition: color 0.3s; }\n.sweep-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: #06b6d4; z-index: -1; transition: left 0.3s ease; }\n.sweep-btn:hover { color: #000; }\n.sweep-btn:hover::before { left: 0; }`,
      desc: 'Button background sweeps in from left on hover.'
    },
    { id: '11', name: 'Underline Draw', category: 'hover',
      html: `<a href="#" class="draw-link">Animated Link</a>`,
      css: `.draw-link { font-size: 1.25rem; color: #7c3aed; text-decoration: none; position: relative; }\n.draw-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0%; height: 2px; background: #7c3aed; transition: width 0.3s ease; }\n.draw-link:hover::after { width: 100%; }`,
      desc: 'An underline smoothly draws itself left-to-right on hover.'
    },
    
    // TRANSITIONS
    { id: '12', name: 'Flip Card', category: 'transitions',
      html: `<div class="flip-card"><div class="flip-inner"><div class="flip-front">Front</div><div class="flip-back">Back</div></div></div>`,
      css: `.flip-card { perspective: 1000px; width: 120px; height: 150px; cursor: pointer; }\n.flip-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.6s; }\n.flip-card:hover .flip-inner { transform: rotateY(180deg); }\n.flip-front, .flip-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 8px; }\n.flip-front { background: #3f5efb; color: white; }\n.flip-back { background: #fc466b; color: white; transform: rotateY(180deg); }`,
      desc: 'Classic 3D card flip transition on hover.'
    },
    { id: '13', name: 'Zoom In Reveal', category: 'transitions',
      html: `<div class="zoom-box"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzU1NSIvPjwvc3ZnPg==" alt="img" class="zoom-img"><div class="overlay">Zoom</div></div>`,
      css: `.zoom-box { position: relative; width: 120px; height: 120px; overflow: hidden; border-radius: 8px; cursor: pointer; }\n.zoom-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }\n.zoom-box:hover .zoom-img { transform: scale(1.2); }\n.overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); color: white; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.5s; }\n.zoom-box:hover .overlay { opacity: 1; }`,
      desc: 'Image scales up and dark overlay fades in.'
    }
  ];

  const grid = document.getElementById('anim-grid');
  
  // Create a dynamic style tag for injected CSS
  const styleTag = document.createElement('style');
  document.head.appendChild(styleTag);
  
  let currentActiveCodeRef = null;

  function renderGrid(cat = 'all', searchQuery = '') {
    grid.innerHTML = '';
    let cssString = '';
    
    animations.forEach(anim => {
      if (cat !== 'all' && anim.category !== cat) return;
      if (searchQuery && !anim.name.toLowerCase().includes(searchQuery.toLowerCase())) return;
      
      cssString += anim.css + '\n';
      
      const card = document.createElement('div');
      card.className = 'anim-card';
      card.innerHTML = `
        <div class="anim-preview-area dark-mode" id="preview-${anim.id}">
          <button class="bg-toggle" title="Toggle BG">🌓</button>
          ${anim.html}
        </div>
        <div class="anim-info">
          <div class="anim-header">
            <h4 class="anim-title">${anim.name}</h4>
            <span class="badge">${anim.category}</span>
          </div>
          <p class="anim-desc">${anim.desc}</p>
          <div class="anim-actions">
            <button class="btn btn-secondary btn-sm" onclick="PF.ui.copyToClipboard('${anim.css.replace(/'/g, "\\'")}')">Copy CSS</button>
            <button class="btn btn-primary btn-sm btn-view-code" data-id="${anim.id}">View Code</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
    
    styleTag.textContent = cssString;

    // Attach listeners
    document.querySelectorAll('.bg-toggle').forEach(btn => {
      btn.onclick = (e) => {
        const p = e.target.parentElement;
        if(p.classList.contains('dark-mode')) { p.classList.replace('dark-mode', 'light-mode'); }
        else { p.classList.replace('light-mode', 'dark-mode'); }
      };
    });

    document.querySelectorAll('.btn-view-code').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.dataset.id;
        const anim = animations.find(a => a.id === id);
        currentActiveCodeRef = anim;
        document.getElementById('modal-title').textContent = anim.name;
        document.getElementById('code-block-html').textContent = anim.html;
        document.getElementById('code-block-css').textContent = anim.css;
        document.getElementById('code-modal').classList.add('open');
      };
    });
  }

  // Filtering
  document.getElementById('category-tabs').addEventListener('click', e => {
    if(e.target.tagName === 'BUTTON') {
      document.querySelectorAll('#category-tabs button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderGrid(e.target.dataset.cat, document.getElementById('search-input').value);
    }
  });

  document.getElementById('search-input').addEventListener('input', e => {
    const cat = document.querySelector('#category-tabs .active').dataset.cat;
    renderGrid(cat, e.target.value);
  });

  // Speed Control using CSS custom variable on body
  document.getElementById('global-speed').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    document.getElementById('speed-val').textContent = v + 'x';
    document.documentElement.style.setProperty('--global-speed', v);
  });

  // Code Modal Tabs
  document.querySelectorAll('.code-tab').forEach(btn => {
    btn.onclick = e => {
      document.querySelectorAll('.code-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.code-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    };
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = e => {
      const type = e.target.dataset.copy;
      PF.ui.copyToClipboard(currentActiveCodeRef[type]);
    };
  });

  document.getElementById('btn-download-css').onclick = () => {
    if(!currentActiveCodeRef) return;
    const blob = new Blob([currentActiveCodeRef.css], {type: 'text/css'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentActiveCodeRef.name.toLowerCase().replace(/ /g, '-') + '.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  renderGrid();
});
