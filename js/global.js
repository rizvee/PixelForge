window.PF = window.PF || {};

// Color Utils
PF.color = {
  hexToRgb: (hex) => {
    let m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  },
  rgbToHex: (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },
  rgbToHsl: (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if(max == min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  },
  hslToRgb: (h, s, l) => {
    let r, g, b;
    h /= 360; s /= 100; l /= 100;
    if(s == 0){
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  },
  rgbToCmyk: (r, g, b) => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    if (k == 1) return { c:0, m:0, y:0, k:100 };
    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);
    return { c: Math.round(c*100), m: Math.round(m*100), y: Math.round(y*100), k: Math.round(k*100) };
  },
  getLuminance: (r, g, b) => {
    let a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  },
  getContrastColor: (hex) => {
    let rgb = PF.color.hexToRgb(hex);
    if (!rgb) return "#ffffff";
    let lum = PF.color.getLuminance(rgb.r, rgb.g, rgb.b);
    return lum > 0.179 ? "#000000" : "#ffffff";
  }
};

// Canvas Utils
PF.canvas = {
  getContext: (id) => {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx };
  },
  resizeToParent: (canvas) => {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  },
  getMousePos: (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  },
  getTouchPos: (canvas, touch) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  }
};

// Image Utils
PF.image = {
  loadImage: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  canvasToBlob: (canvas, type = 'image/png', quality = 1.0) => {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });
  },
  downloadCanvas: (canvas, filename, type = 'image/png', quality = 1.0) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL(type, quality);
    link.click();
  },
  imageToCanvas: (img, maxW = 0, maxH = 0) => {
    const canvas = document.createElement('canvas');
    let w = img.width;
    let h = img.height;
    if (maxW && w > maxW) { h = h * (maxW / w); w = maxW; }
    if (maxH && h > maxH) { w = w * (maxH / h); h = maxH; }
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }
};

// Storage Utils
PF.storage = {
  save: (key, value) => {
    try { localStorage.setItem(`pf_${key}`, JSON.stringify(value)); } catch(e) {}
  },
  load: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(`pf_${key}`);
      return val ? JSON.parse(val) : fallback;
    } catch(e) { return fallback; }
  },
  remove: (key) => localStorage.removeItem(`pf_${key}`)
};

// UI Utils
PF.ui = {
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      PF.ui.showToast('Copied to clipboard!', 'success');
    } catch(err) {
      PF.ui.showToast('Failed to copy', 'error');
    }
  },
  showToast: (msg, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} glass`;
    toast.style.cssText = `padding:12px 20px;border-radius:8px;color:#fff;animation:slideIn 0.3s ease;
      background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(124, 58, 237, 0.9)'}`;
    toast.textContent = msg;
    container.appendChild(toast);
    
    if (!document.getElementById('toast-style')) {
      const style = document.createElement('style');
      style.id = 'toast-style';
      style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  debounce: (fn, delay) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  },
  throttle: (fn, delay) => {
    let lastCall = 0;
    return function(...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) return;
      lastCall = now;
      return fn.apply(this, args);
    };
  },
  randomItem: (arr) => arr[Math.floor(Math.random() * arr.length)],
  randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomFloat: (min, max) => Math.random() * (max - min) + min,
  clamp: (val, min, max) => Math.min(Math.max(val, min), max),
  lerp: (a, b, t) => a + (b - a) * t,
  mapRange: (val, inMin, inMax, outMin, outMax) => ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
};

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
  
  // Highlight active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path || a.getAttribute('href') === './' + path) {
      a.classList.add('active');
      const parentDropdown = a.closest('.dropdown');
      if (parentDropdown) {
        parentDropdown.querySelector('.dropdown-toggle').classList.add('active');
      }
    }
  });

  // Intersection Observer for Animate on Scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
