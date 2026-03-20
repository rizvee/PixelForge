document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let w = window.innerWidth, h = window.innerHeight;
  canvas.width = w; canvas.height = h;

  window.addEventListener('resize', () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w; canvas.height = h;
  });

  document.getElementById('btn-toggle-panel').addEventListener('click', () => {
    document.getElementById('controls-panel').classList.toggle('collapsed');
  });

  const state = {
    type: 'fireflies',
    count: 100,
    speed: 2,
    size: 10,
    gravity: 0,
    colorMode: 'rainbow',
    interact: 'trail',
    c1: '#7c3aed',
    c2: '#06b6d4',
    mx: w/2,
    my: h/2,
    isMouseDown: false
  };

  canvas.addEventListener('mousemove', e => { state.mx = e.clientX; state.my = e.clientY; });
  canvas.addEventListener('touchmove', e => { state.mx = e.touches[0].clientX; state.my = e.touches[0].clientY; });
  canvas.addEventListener('mousedown', () => { state.isMouseDown = true; });
  canvas.addEventListener('mouseup', () => { state.isMouseDown = false; });
  canvas.addEventListener('touchstart', () => { state.isMouseDown = true; });
  canvas.addEventListener('touchend', () => { state.isMouseDown = false; });

  const UI = {
    type: document.getElementById('p-type'),
    count: document.getElementById('p-count'),
    speed: document.getElementById('p-speed'),
    size: document.getElementById('p-size'),
    gravity: document.getElementById('p-gravity'),
    color: document.getElementById('p-color'),
    interact: document.getElementById('p-interact'),
    pickers: document.getElementById('color-pickers')
  };

  const updateVals = () => {
    document.getElementById('val-count').textContent = UI.count.value;
    document.getElementById('val-speed').textContent = UI.speed.value;
    document.getElementById('val-size').textContent = UI.size.value;
    document.getElementById('val-gravity').textContent = UI.gravity.value;
  };

  const syncState = () => {
    state.type = UI.type.value;
    state.count = parseFloat(UI.count.value);
    state.speed = parseFloat(UI.speed.value);
    state.size = parseFloat(UI.size.value);
    state.gravity = parseFloat(UI.gravity.value);
    state.colorMode = UI.color.value;
    state.interact = UI.interact.value;
    state.c1 = document.getElementById('c1').value;
    state.c2 = document.getElementById('c2').value;
    UI.pickers.style.display = (state.colorMode === 'single' || state.colorMode === 'gradient') ? 'flex' : 'none';
    if(state.colorMode === 'single') document.getElementById('c2').style.display='none';
    else document.getElementById('c2').style.display='block';
    
    updateVals();
    adjustParticleCount();
  };

  Object.values(UI).forEach(el => el.addEventListener('input', syncState));
  document.getElementById('c1').addEventListener('input', syncState);
  document.getElementById('c2').addEventListener('input', syncState);

  let particles = [];

  class Particle {
    constructor(x, y) {
      this.init(x, y);
    }
    
    init(x, y) {
      this.x = x !== undefined ? x : Math.random() * w;
      this.y = y !== undefined ? y : Math.random() * h;
      this.vx = (Math.random() - 0.5) * state.speed;
      this.vy = (Math.random() - 0.5) * state.speed;
      this.life = 0;
      this.maxLife = PF.ui.randomInt(50, 200);
      this.baseSize = PF.ui.randomFloat(state.size * 0.2, state.size);
      
      // Assign color
      if (state.colorMode === 'single') {
        this.color = state.c1;
      } else if (state.colorMode === 'random') {
        this.color = `hsl(${Math.random()*360}, 100%, 60%)`;
      } else if (state.colorMode === 'rainbow') {
        this.hueOffset = Math.random() * 360;
      } else { // gradient
        const r1 = PF.color.hexToRgb(state.c1), r2 = PF.color.hexToRgb(state.c2);
        const t = Math.random();
        this.color = `rgb(${PF.ui.lerp(r1.r,r2.r,t)},${PF.ui.lerp(r1.g,r2.g,t)},${PF.ui.lerp(r1.b,r2.b,t)})`;
      }
      
      // specific type vars
      this.angle = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
      this.life++;
      if (this.life > this.maxLife) this.init();

      let dx = state.mx - this.x;
      let dy = state.my - this.y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      if (state.interact === 'attract' && dist < 200) {
        this.vx += (dx / dist) * 0.2;
        this.vy += (dy / dist) * 0.2;
      } else if (state.interact === 'repel' && dist < 150) {
        this.vx -= (dx / dist) * 0.5;
        this.vy -= (dy / dist) * 0.5;
      } else if (state.interact === 'orbit' && dist < 250) {
        const ax = dx/dist, ay = dy/dist;
        this.vx += ay * 0.5;
        this.vy -= ax * 0.5;
      }

      this.vy += state.gravity;
      this.x += this.vx;
      this.y += this.vy;

      // Bounce/Wrap
      if (this.x < 0) { this.x = w; }
      if (this.x > w) { this.x = 0; }
      if (this.y < 0) { this.y = h; }
      if (this.y > h) { this.y = 0; }
      
      if (state.colorMode === 'rainbow') {
        this.color = `hsl(${(this.hueOffset + this.life) % 360}, 100%, 60%)`;
      }
      
      this.angle += this.rotSpeed;
    }

    draw() {
      const pLife = this.life / this.maxLife; // 0 to 1
      const size = this.baseSize * Math.sin(pLife * Math.PI); // fade in/out implicitly
      
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = 1 - pLife;
      
      if (state.type === 'sparks') {
        ctx.fillStyle = this.color;
        ctx.fillRect(-size/2, -size/2, size, size);
      } else if (state.type === 'bubbles') {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI*2); ctx.stroke();
      } else if (state.type === 'stars') {
        ctx.fillStyle = this.color;
        for(let i=0; i<5; i++){
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size/4, -size/4);
          ctx.lineTo(size, 0);
          ctx.lineTo(size/4, size/4);
          ctx.lineTo(0, size);
          ctx.lineTo(-size/4, size/4);
          ctx.lineTo(-size, 0);
          ctx.lineTo(-size/4, -size/4);
          ctx.fill();
        }
      } else if (state.type === 'confetti') {
        ctx.fillStyle = this.color;
        ctx.fillRect(-size, -size/2, size*2, size);
      } else if (state.type === 'snow') {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, size/2, 0, Math.PI*2); ctx.fill();
      } else { // fireflies
        const grad = ctx.createRadialGradient(0,0,0, 0,0,size);
        grad.addColorStop(0, this.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function adjustParticleCount() {
    while(particles.length < state.count) particles.push(new Particle());
    while(particles.length > state.count) particles.pop();
  }

  function animate() {
    // slight fade out to leave trails
    ctx.fillStyle = state.type === 'sparks' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,1)';
    ctx.fillRect(0,0,w,h);
    
    if(state.interact === 'spawn' && state.isMouseDown) {
      for(let i=0; i<5; i++) {
        let p = new Particle(state.mx, state.my);
        p.vx = (Math.random()-0.5)*10;
        p.vy = (Math.random()-0.5)*10;
        particles.push(p);
      }
      if(particles.length > state.count + 100) particles.splice(0, 5);
    } else if (state.interact === 'trail' && state.isMouseDown) {
      let p = new Particle(state.mx, state.my);
      particles.push(p);
      if(particles.length > state.count) particles.shift();
    }

    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  function applyPreset(type, count, speed, size, grav, colorM, int, c1, c2) {
    UI.type.value = type; UI.count.value = count; UI.speed.value = speed; UI.size.value = size; 
    UI.gravity.value = grav; UI.color.value = colorM; UI.interact.value = int;
    if(c1) document.getElementById('c1').value = c1;
    if(c2) document.getElementById('c2').value = c2;
    syncState();
  }

  document.getElementById('pre-galaxy').onclick = () => applyPreset('stars', 200, 1, 15, 0, 'gradient', 'attract', '#a855f7', '#ec4899');
  document.getElementById('pre-fireworks').onclick = () => applyPreset('sparks', 300, 5, 8, 0.1, 'rainbow', 'spawn', null, null);
  document.getElementById('pre-rain').onclick = () => applyPreset('sparks', 400, 8, 20, 0.5, 'gradient', 'trail', '#3b82f6', '#60a5fa');
  document.getElementById('pre-matrix').onclick = () => applyPreset('confetti', 200, 3, 10, 0.1, 'single', 'repel', '#22c55e', null);

  document.getElementById('btn-export').onclick = () => PF.image.downloadCanvas(canvas, 'pixelforge-particles.png');

  syncState();
  animate();
});
