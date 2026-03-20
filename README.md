<div align="center">
  <img src="https://rizvee.github.io/pixelforge/assets/og-image.png" alt="PixelForge Logo" width="200" />
  
  # PixelForge | Free Online Creative Tools
  
  **Drawing ✨ Pixel Art 🎨 Image Filters 📸 Meme Generator 😂 ASCII Art 🔤 and More!**
  
  [![Website Website](https://img.shields.io/badge/Website-rizvee.github.io%2Fpixelforge-7c3aed?style=for-the-badge&logo=google-chrome&logoColor=white)](https://rizvee.github.io/pixelforge/)
  [![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
  [![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)]()

  <p align="center">
    <strong>Experience 14+ free, browser-based creative tools built for speed and privacy. No installations, no sign-ups, and absolutely zero watermarks.</strong>
  </p>
</div>

---

## 🚀 What is PixelForge?

**PixelForge** is a comprehensive, open-source creative suite that runs entirely within your web browser. Built on raw HTML5 Canvas and Vanilla JavaScript for maximum performance, PixelForge provides artists, developers, and casual creators with a lightning-fast toolkit equivalent to premium desktop software—completely free.

Whether you're sketching digital art, generating retro 8-bit pixel sprites, adding cinematic filters to your photography, or creating high-quality SVG/CSS assets for your web projects, PixelForge handles it all locally on your device ensuring **100% privacy**.

---

## 🛠️ The Toolkit: 14 Free Utilities

### 🎨 Creative & Art
- **[Drawing Sketchpad](https://rizvee.github.io/pixelforge/sketchpad.html)**: A fluid canvas with pressure-responsive brushes and layers.
- **[Pixel Art Maker](https://rizvee.github.io/pixelforge/pixel-art.html)**: Grid-based drawing with animation timelines and instant GIF exports.
- **[Generative Art Canvas](https://rizvee.github.io/pixelforge/generative-art.html)**: Algorithmic art generator utilizing noise, subdivision, and shapes.
- **[Particle System](https://rizvee.github.io/pixelforge/particles.html)**: Interactive physics engine for mesmerizing visual effects.
- **[Gradient Mesh Generator](https://rizvee.github.io/pixelforge/gradient-mesh.html)**: Draggable multi-point mesh builder for rich CSS gradients.
- **[CSS Animation Showcase](https://rizvee.github.io/pixelforge/css-animations.html)**: Curated gallery of 30+ pure CSS loading spinners and effects.
- **[ASCII Text Art](https://rizvee.github.io/pixelforge/ascii-text.html)**: Convert modern text into stylized retro terminal ASCII strings.

### 📸 Image & Media
- **[Image Color Picker](https://rizvee.github.io/pixelforge/color-picker.html)**: Canvas-driven eyedropper tool to extract precise HEX/RGB palettes from photos.
- **[Image Filter App](https://rizvee.github.io/pixelforge/image-filters.html)**: Apply cinematic presets, tweak brightness/contrast, and export filtered visuals.
- **[Meme Generator](https://rizvee.github.io/pixelforge/meme-generator.html)**: Drag-and-drop text overlay system to create classic internet memes without watermarks.
- **[Avatar Generator](https://rizvee.github.io/pixelforge/avatar-generator.html)**: Build deterministic SVG/PNG profile pictures using seed hashes.
- **[Image to ASCII Converter](https://rizvee.github.io/pixelforge/image-to-ascii.html)**: Transform high-resolution images into dense, colored ASCII text art.
- **[CSS Filter Playground](https://rizvee.github.io/pixelforge/css-filter-playground.html)**: Explore `backdrop-filter` glassmorphism and `mix-blend-mode` interactions visually.
- **[SVG Customizer](https://rizvee.github.io/pixelforge/svg-customizer.html)**: Modify vector icons in real-time and export production-ready SVG sequences.

---

## ✨ Key Features & Advantages

* **🔥 Zero Dependencies:** Built with pure HTML5, CSS3, and ES6 JavaScript. No React, no heavy frameworks, zero bloat. Instant load times.
* **🔒 100% Private (Local Processing):** Your images and data never leave your device. All image parsing and canvas rendering is executed directly within your browser.
* **📱 PWA & Offline Support:** Install PixelForge as a Progressive Web App (PWA) on your desktop, iOS, or Android device. Use the tools completely offline.
* **💧 No Watermarks:** Every single export (PNG, JPG, GIF, SVG, CSS) is completely yours. No paywalls, no hidden premium tiers.
* **⚡ High-Performance Architecture:** Optimizations utilize `requestAnimationFrame()`, offscreen buffers, and native Canvas APIs for buttery smooth performance.

---

## 💻 Tech Stack

- **Frontend Core:** HTML5, Vanilla CSS (CSS Variables / Custom Properties), Vanilla JavaScript (ES6+).
- **Graphics Rendering:** HTML5 `<canvas>` API, WebGL (for advanced shaders where applicable).
- **Export Technologies:** Vanilla JS `toBlob()`, `a.download`, embedded encoders (e.g., GIFEncoder).
- **SEO & Connectivity:** Next-gen `manifest.json`, local Service Workers for caching (`caches.open()`), Schema.org JSON-LD structured data.

---

## 🚀 Quick Start / Local Development

No build steps. No `npm install`. To run PixelForge locally, you simply need a basic web server to bypass strict browser CORS rules for Canvas rendering.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rizvee/pixelforge.git
   cd pixelforge
   ```
2. **Launch a local server:**
   *Using Python:*
   ```bash
   python -m http.server 8000
   ```
   *Using Node/npx:*
   ```bash
   npx serve .
   ```
3. **Open your browser:** Navigate to `http://localhost:8000`

---

## 📈 SEO & Performance Highlights

This repository is strictly engineered to hit **100/100 Lighthouse scores**:
* **Semantic HTML:** Deeply compliant `h1`-`h6` structures and accessible ARIA labeling.
* **Rich Snippets:** Dynamic `<script type="application/ld+json">` representing `WebApplication` and `SoftwareApplication` data schemas.
* **Core Web Vitals:** Near-instant First Contentful Paint (FCP) due to inline fundamental CSS and deferred JS.
* **Indexable:** Complete `sitemap.xml` and `robots.txt` configuration deployed locally.

---

## 🤝 Contributing

Contributions make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please ensure any new tool follows the established architecture: utilize `js/global.js` for utilities, reference strictly CSS variables from `css/global.css`, and avoid any external `npm` package dependencies.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for creators by <a href="https://rizvee.github.io">Hasan Rizvee</a>.<br>
  <strong>Create Without Limits.</strong>
</p>
