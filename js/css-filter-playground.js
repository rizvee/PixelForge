document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('target-element');
    const out = document.getElementById('output-css');
    
    const UI = {
        type: document.getElementById('param-target-type'),
        bgCol: document.getElementById('param-bg-col'),
        bgAlpha: document.getElementById('param-bg-alpha'),
        blend: document.getElementById('param-blend'),
        bdW: document.getElementById('param-bd-w'),
        bdCol: document.getElementById('param-bd-col'),
        bdA: document.getElementById('param-bd-a'),
        sh: document.getElementById('param-sh')
    };
  
    const bfSliders = document.querySelectorAll('.bf-slider');
    
    function hexToRgba(hex, alpha) {
        let r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  
    function generateCSS() {
        let type = UI.type.value;
        let isText = type === 'text';
        let isImg = type === 'image';
        
        let bfVals = [];
        bfSliders.forEach(s => {
            let p = s.dataset.prop;
            let u = s.dataset.unit;
            let v = s.value;
            if(p === 'blur' && v != 0) bfVals.push(`${p}(${v}${u})`);
            else if(p === 'brightness' && v != 100) bfVals.push(`${p}(${v}${u})`);
            else if(p === 'saturate' && v != 100) bfVals.push(`${p}(${v}${u})`);
            else if(p === 'contrast' && v != 100) bfVals.push(`${p}(${v}${u})`);
        });
        let backdrop = bfVals.length > 0 ? bfVals.join(' ') : 'none';
        
        let blend = UI.blend.value;
        let bg = hexToRgba(UI.bgCol.value, UI.bgAlpha.value);
        let border = `${UI.bdW.value}px solid ${hexToRgba(UI.bdCol.value, UI.bdA.value)}`;
        let shadow = `0 8px 32px 0 rgba(0, 0, 0, ${UI.sh.value})`;
        
        let cssArr = [];
        
        if (isText) {
            el.className = '';
            el.innerHTML = '<h1 style="font-size:8rem; font-weight:900; margin:0; line-height:1">BLEND</h1>';
            el.style = ''; // reset inner
            el.style.color = bg;
            el.style.mixBlendMode = blend;
            cssArr.push(`color: ${bg};`);
            if (blend !== 'normal') cssArr.push(`mix-blend-mode: ${blend};`);
            
            document.getElementById('bg-color-group').querySelector('label').textContent = 'Text Color (rgba):';
            document.getElementById('border-group').style.display = 'none';
        } 
        else if (isImg) {
            el.className = '';
            // Generate a gradient placeholder image to apply blend mode
            // Actually let's just use a photo from unsplash or basic placeholder
            el.innerHTML = '<img src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" style="max-width:400px; border-radius:18px; display:block;">';
            
            let img = el.querySelector('img');
            img.style.mixBlendMode = blend;
            img.style.filter = backdrop; // apply filter to img instead of backdrop-filter
            
            cssArr.push(`/* Applied to <img> */`);
            if (blend !== 'normal') cssArr.push(`mix-blend-mode: ${blend};`);
            if (backdrop !== 'none') cssArr.push(`filter: ${backdrop};`);
            
            document.getElementById('bg-color-group').style.display = 'none';
            document.getElementById('border-group').style.display = 'none';
        }
        else {
            // Card
            el.className = 'target-card';
            el.innerHTML = '<div class="target-content"><h3 style="font-size:1.5rem; margin-bottom:8px">Glassmorphism</h3><p style="color:rgba(255,255,255,0.8); font-size:0.9rem;">Interact with the sliders to adjust.</p></div>';
            
            el.style.background = bg;
            el.style.backdropFilter = backdrop;
            el.style.webkitBackdropFilter = backdrop;
            el.style.border = border;
            el.style.boxShadow = shadow;
            el.style.mixBlendMode = blend;
            
            cssArr.push(`background: ${bg};`);
            if (backdrop !== 'none') {
                cssArr.push(`backdrop-filter: ${backdrop};`);
                cssArr.push(`-webkit-backdrop-filter: ${backdrop};`);
            }
            if (UI.bdW.value > 0) cssArr.push(`border: ${border};`);
            if (UI.sh.value > 0) cssArr.push(`box-shadow: ${shadow};`);
            if (blend !== 'normal') cssArr.push(`mix-blend-mode: ${blend};`);
            
            document.getElementById('bg-color-group').style.display = 'flex';
            document.getElementById('bg-color-group').querySelector('label').textContent = 'Background Color (rgba):';
            document.getElementById('border-group').style.display = 'flex';
        }
  
        out.textContent = cssArr.join('\n');
    }
  
    // Listeners
    Object.values(UI).forEach(el => {
        if(el) el.addEventListener('input', generateCSS);
    });
    
    bfSliders.forEach(s => {
        s.addEventListener('input', (e) => {
            let p = s.dataset.prop;
            let short = p === 'brightness' ? 'bright' : (p === 'saturate' ? 'sat' : (p === 'contrast' ? 'cont' : p));
            document.getElementById(`val-bf-${short}`).textContent = e.target.value + s.dataset.unit;
            generateCSS();
        });
    });
  
    UI.bdW.addEventListener('input', e=>document.getElementById('val-bd-w').textContent = e.target.value+'px');
    UI.sh.addEventListener('input', e=>document.getElementById('val-sh').textContent = Math.round(e.target.value*100)+'%');
  
    document.getElementById('btn-copy-css').onclick = () => {
        PF.ui.copyToClipboard(out.textContent);
    };
  
    generateCSS();
  });
