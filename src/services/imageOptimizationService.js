// 🖼️ Image Optimization Service
class ImageOptimizationService {
  constructor() {
    this.observer = null;
    this.images = new Set();
    this.isInitialized = false;
  }

  // 🎯 Initialize image optimization
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupIntersectionObserver();
    this.setupImagePreloading();
    this.isInitialized = true;

    console.log('🖼️ Image optimization initialized');
  }

  // 👀 Setup intersection observer for lazy loading
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01,
        }
      );
    }
  }

  // 🖼️ Load image with optimization
  loadImage(imgElement) {
    if (imgElement.dataset.src) {
      imgElement.src = imgElement.dataset.src;
      imgElement.classList.remove('lazy');
      imgElement.classList.add('loaded');
      
      // Remove data attributes
      delete imgElement.dataset.src;
      delete imgElement.dataset.srcset;
    }
  }

  // 🎯 Add image to lazy loading
  addLazyImage(imgElement) {
    if (this.observer) {
      this.observer.observe(imgElement);
      this.images.add(imgElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(imgElement);
    }
  }

  // 📱 Generate responsive image sources
  generateResponsiveSources(src, sizes = [320, 640, 960, 1280]) {
    const baseName = src.replace(/\.[^/.]+$/, '');
    const extension = src.split('.').pop();
    
    return sizes.map(size => ({
      src: `${baseName}-${size}w.${extension}`,
      width: size,
    }));
  }

  // 🎯 Generate srcset for responsive images
  generateSrcSet(src, sizes = [320, 640, 960, 1280]) {
    const baseName = src.replace(/\.[^/.]+$/, '');
    const extension = src.split('.').pop();
    
    return sizes
      .map(size => `${baseName}-${size}w.${extension} ${size}w`)
      .join(', ');
  }

  // 🎯 Generate sizes attribute
  generateSizes(breakpoints = {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
  }) {
    return Object.entries(breakpoints)
      .map(([device, size]) => `(min-width: ${this.getBreakpoint(device)}) ${size}`)
      .join(', ');
  }

  // 📱 Get breakpoint for device
  getBreakpoint(device) {
    const breakpoints = {
      mobile: '320px',
      tablet: '768px',
      desktop: '1024px',
    };
    return breakpoints[device] || '320px';
  }

  // 🎯 Optimize image element
  optimizeImage(imgElement, options = {}) {
    const {
      lazy = true,
      responsive = true,
      webp = true,
      quality = 80,
      sizes = '100vw',
    } = options;

    // Add lazy loading class
    if (lazy) {
      imgElement.classList.add('lazy');
    }

    // Add responsive attributes
    if (responsive && imgElement.src) {
      const srcset = this.generateSrcSet(imgElement.src);
      imgElement.srcset = srcset;
      imgElement.sizes = sizes;
    }

    // Add WebP support
    if (webp && imgElement.src) {
      const webpSrc = imgElement.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      imgElement.dataset.webp = webpSrc;
    }

    // Add loading attribute
    imgElement.loading = lazy ? 'lazy' : 'eager';

    // Add to lazy loading if needed
    if (lazy) {
      this.addLazyImage(imgElement);
    }

    return imgElement;
  }

  // 🎯 Create optimized image element
  createOptimizedImage(src, options = {}) {
    const img = document.createElement('img');
    img.src = src;
    return this.optimizeImage(img, options);
  }

  // 📱 Preload critical images
  setupImagePreloading() {
    const criticalImages = [
      '/favicon.ico',
      '/logo192.png',
      '/logo512.png',
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }

  // 🎯 Convert image to WebP format
  async convertToWebP(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // 📊 Get image statistics
  getImageStats() {
    const images = document.querySelectorAll('img');
    const stats = {
      total: images.length,
      lazy: 0,
      loaded: 0,
      responsive: 0,
      webp: 0,
    };

    images.forEach(img => {
      if (img.classList.contains('lazy')) stats.lazy++;
      if (img.classList.contains('loaded')) stats.loaded++;
      if (img.srcset) stats.responsive++;
      if (img.dataset.webp) stats.webp++;
    });

    return stats;
  }

  // 🎯 Optimize all images on page
  optimizeAllImages() {
    const images = document.querySelectorAll('img:not(.optimized)');
    
    images.forEach(img => {
      this.optimizeImage(img, {
        lazy: true,
        responsive: true,
        webp: true,
      });
      img.classList.add('optimized');
    });
  }

  // 🧹 Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.images.clear();
    this.isInitialized = false;
  }
}

// 🚀 Export singleton instance
const imageOptimizationService = new ImageOptimizationService();

// 🎯 Auto-initialize in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    imageOptimizationService.init();
  });
}

export default imageOptimizationService; 