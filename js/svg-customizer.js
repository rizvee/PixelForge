document.addEventListener('DOMContentLoaded', () => {
    const svgs = [
        { id:'heart', d:'M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z' },
        { id:'star', d:'M11.517 3.35l2.253 4.56c.15.3.44.51.77.56l5.035.73c.84.12 1.18 1.16.57 1.75l-3.64 3.55c-.24.23-.35.57-.29.9l.86 5.01c.14.84-.74 1.48-1.5.11l-4.505-2.37c-.3-.15-.65-.15-.95 0l-4.505 2.37c-.76 1.37-1.64.73-1.5-.11l.86-5.01c.06-.33-.05-.67-.29-.9l-3.64-3.55c-.61-.59-.27-1.63.57-1.75l5.035-.73c.33-.05.62-.26.77-.56l2.253-4.56c.38-.76 1.48-.76 1.86 0z' },
        { id:'bolt', d:'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
        { id:'shield', d:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
        { id:'cloud', d:'M17.5 19c1.93 0 3.5-1.57 3.5-3.5S19.43 12 17.5 12c-.22 0-.43.02-.64.06C16.27 10.28 14.31 9 12 9c-3.14 0-5.74 2.43-5.97 5.51C4.3 14.65 3 16.18 3 18c0 2.21 1.79 4 4 4h10.5z' },
        { id:'music', d:'M9 18V5l12-2v13' }, // Requires custom circles later, basic path here
        { id:'camera', d:'M21 19V7H3v12h18zM14 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0z' },
        { id:'moon', d:'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
        { id:'play', d:'M5 3l14 9-14 9V3z' }
    ];

    const UI = {
        grid: document.getElementById('svg-grid'),
        prev: document.getElementById('svg-preview-container'),
        code: document.getElementById('svg-code-out'),
        sz: document.getElementById('param-size'),
        szLbl: document.getElementById('val-size'),
        fCol: document.getElementById('param-fill'),
        sCol: document.getElementById('param-stroke'),
        sWid: document.getElementById('param-stroke-w'),
        sWLbl: document.getElementById('val-stroke-w')
    };
    
    let activeId = 'heart';
    let isFillNone = false;
    let isStrokeNone = false;

    // Build grid
    svgs.forEach(s => {
        let btn = document.createElement('button');
        btn.className = 'svg-thumb';
        if(s.id === activeId) btn.classList.add('active');
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="${s.d}" stroke-width="2" stroke-linejoin="round"/></svg>`;
        btn.onclick = () => {
            document.querySelectorAll('.svg-thumb').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeId = s.id;
            updateSVG();
        };
        UI.grid.appendChild(btn);
    });

    function updateSVG() {
        const shape = svgs.find(s => s.id === activeId);
        const sz = UI.sz.value;
        const fw = UI.sWid.value;
        
        let fill = isFillNone ? 'none' : UI.fCol.value;
        let stroke = isStrokeNone ? 'none' : UI.sCol.value;
        
        // Music needs circles, dirty hack for the simple path above
        let extraPaths = '';
        if(activeId === 'music') {
            extraPaths = `<circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`;
        }
        
        // Wrap
        const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="${fw}" stroke-linecap="round" stroke-linejoin="round">\n  <path d="${shape.d}"/>\n  ${extraPaths}\n</svg>`;
        
        UI.prev.innerHTML = finalSvg;
        UI.code.textContent = finalSvg.replace(/  </g, '  &lt;').replace(/>/g, '&gt;').replace(/</g, '<'); // just raw text is fine for code block
    }

    [UI.sz, UI.fCol, UI.sCol, UI.sWid].forEach(el => el.addEventListener('input', () => {
        UI.szLbl.textContent = UI.sz.value;
        UI.sWLbl.textContent = UI.sWid.value + 'px';
        isFillNone = false; isStrokeNone = false;
        updateSVG();
    }));

    document.getElementById('btn-fill-none').onclick = () => { isFillNone = true; updateSVG(); };
    document.getElementById('btn-stroke-none').onclick = () => { isStrokeNone = true; updateSVG(); };

    document.getElementById('btn-copy-svg').onclick = () => {
        PF.ui.copyToClipboard(UI.prev.innerHTML);
    };

    document.getElementById('btn-dl-svg').onclick = () => {
        const blob = new Blob([UI.prev.innerHTML], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `pixelforge-${activeId}.svg`;
        a.click(); URL.revokeObjectURL(url);
    };

    document.getElementById('btn-dl-png').onclick = () => {
        // SVG to Canvas to PNG
        const svgStr = UI.prev.innerHTML;
        const img = new Image();
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            const sz = parseInt(UI.sz.value);
            const c = document.createElement('canvas');
            c.width = sz; c.height = sz;
            const ctx = c.getContext('2d');
            ctx.clearRect(0,0,sz,sz);
            ctx.drawImage(img, 0, 0);
            PF.image.downloadCanvas(c, `pixelforge-${activeId}.png`);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    updateSVG();
});
