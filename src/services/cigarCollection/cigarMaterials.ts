// VapeAR Cigar Collection Materials — Created by Saidarshan.K
// Procedural canvas textures & physically-based materials for cigars, box, and cutter

import * as THREE from 'three';
import { type CigarVariantConfig, type CigarVariantId } from './cigarVariants';

export class CigarMaterialManager {
  private texturesToDispose: THREE.Texture[] = [];
  private bandTextures: Map<CigarVariantId, THREE.CanvasTexture> = new Map();
  private wrapperTextures: Map<CigarVariantId, { map: THREE.CanvasTexture; bump: THREE.CanvasTexture }> = new Map();
  private cutEndTextures: Map<CigarVariantId, THREE.CanvasTexture> = new Map();
  private darkWoodTexture: THREE.CanvasTexture | null = null;
  private cedarWoodTexture: THREE.CanvasTexture | null = null;

  /**
   * Procedural canvas texture generator for tobacco leaf wrapper.
   * Generates natural fine veins, organic micro-grain, and tone variation.
   */
  getWrapperTextures(config: CigarVariantConfig): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const existing = this.wrapperTextures.get(config.id);
    if (existing) return existing;

    const width = 512;
    const height = 512;

    // 1. Diffuse Albedo Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 2. Bump / Micro-Relief Canvas
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = width;
    bumpCanvas.height = height;
    const bumpCtx = bumpCanvas.getContext('2d');

    if (ctx && bumpCtx) {
      const baseHex = config.wrapper.color;
      const baseR = (baseHex >> 16) & 255;
      const baseG = (baseHex >> 8) & 255;
      const baseB = baseHex & 255;

      // Base background gradient simulating cured leaf wrap
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, `rgb(${Math.max(0, baseR - 18)}, ${Math.max(0, baseG - 14)}, ${Math.max(0, baseB - 10)})`);
      bgGrad.addColorStop(0.5, `rgb(${baseR}, ${baseG}, ${baseB})`);
      bgGrad.addColorStop(1, `rgb(${Math.min(255, baseR + 14)}, ${Math.min(255, baseG + 10)}, ${Math.min(255, baseB + 8)})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      bumpCtx.fillStyle = '#808080';
      bumpCtx.fillRect(0, 0, width, height);

      // Fine diagonal tobacco leaf striations / fibrous tooth
      ctx.globalAlpha = 0.14;
      bumpCtx.globalAlpha = 0.22;
      for (let y = 0; y < height; y += 4) {
        const offset = Math.sin(y * 0.08) * 8;
        ctx.strokeStyle = y % 8 === 0 ? '#1a0e07' : '#8f6542';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(width, y + offset * 0.5);
        ctx.stroke();

        bumpCtx.strokeStyle = y % 8 === 0 ? '#444444' : '#aaaaaa';
        bumpCtx.lineWidth = 1.2;
        bumpCtx.beginPath();
        bumpCtx.moveTo(0, y + offset);
        bumpCtx.lineTo(width, y + offset * 0.5);
        bumpCtx.stroke();
      }

      // Organic delicate leaf veins (branched pattern)
      ctx.globalAlpha = 0.28;
      bumpCtx.globalAlpha = 0.45;
      for (let i = 0; i < 9; i++) {
        const startX = (i * width) / 9 + 20;
        let curX = startX;
        let curY = 0;
        ctx.strokeStyle = '#24130a';
        ctx.lineWidth = 1.8;
        bumpCtx.strokeStyle = '#222222';
        bumpCtx.lineWidth = 2.0;

        ctx.beginPath();
        bumpCtx.beginPath();
        ctx.moveTo(curX, curY);
        bumpCtx.moveTo(curX, curY);

        while (curY < height) {
          curX += (Math.random() - 0.48) * 12;
          curY += 24 + Math.random() * 20;
          ctx.lineTo(curX, curY);
          bumpCtx.lineTo(curX, curY);

          // Secondary micro-vein offshoots
          if (Math.random() > 0.4) {
            const sideLen = 18 + Math.random() * 22;
            const sideAngle = (Math.PI / 4) * (Math.random() > 0.5 ? 1 : -1);
            const sideEndX = curX + Math.cos(sideAngle) * sideLen;
            const sideEndY = curY + Math.sin(sideAngle) * sideLen;

            ctx.stroke();
            bumpCtx.stroke();

            ctx.beginPath();
            bumpCtx.beginPath();
            ctx.moveTo(curX, curY);
            bumpCtx.moveTo(curX, curY);
            ctx.lineTo(sideEndX, sideEndY);
            bumpCtx.lineTo(sideEndX, sideEndY);
            ctx.stroke();
            bumpCtx.stroke();

            ctx.beginPath();
            bumpCtx.beginPath();
            ctx.moveTo(curX, curY);
            bumpCtx.moveTo(curX, curY);
          }
        }
        ctx.stroke();
        bumpCtx.stroke();
      }

      // Organic tooth grain noise
      ctx.globalAlpha = 0.08;
      bumpCtx.globalAlpha = 0.16;
      for (let i = 0; i < 2800; i++) {
        const px = Math.random() * width;
        const py = Math.random() * height;
        const rad = 0.8 + Math.random() * 1.6;
        ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();

        bumpCtx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#222222';
        bumpCtx.beginPath();
        bumpCtx.arc(px, py, rad, 0, Math.PI * 2);
        bumpCtx.fill();
      }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 4);

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(2, 4);

    this.texturesToDispose.push(map, bump);
    const result = { map, bump };
    this.wrapperTextures.set(config.id, result);
    return result;
  }

  /**
   * Procedural canvas texture generator for decorative cigar band.
   * Generates high-definition gold foil borders, crests, and typography.
   */
  getBandTexture(config: CigarVariantConfig): THREE.CanvasTexture {
    const existing = this.bandTextures.get(config.id);
    if (existing) return existing;

    const width = 1024;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const b = config.band;

      // 1. Background Fill with subtle radial lighting
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, b.baseColor);
      bgGrad.addColorStop(0.5, b.secondaryColor);
      bgGrad.addColorStop(1, b.baseColor);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Dual Gold Foil Outer Border Trim
      ctx.strokeStyle = b.foilColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, width - 12, height - 12);

      ctx.strokeStyle = b.accentColor;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // 3. Repeating Ornamental Lattice along the wings
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = b.foilColor;
      ctx.lineWidth = 1.5;
      for (let x = 30; x < width - 30; x += 32) {
        if (Math.abs(x - width / 2) > 160) {
          ctx.beginPath();
          ctx.moveTo(x, 22);
          ctx.lineTo(x + 16, height / 2);
          ctx.lineTo(x, height - 22);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x + 8, height / 2, 3, 0, Math.PI * 2);
          ctx.fillStyle = b.foilColor;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // 4. Central Medallion Shield
      const cx = width / 2;
      const cy = height / 2;
      const medallionW = 240;
      const medallionH = 190;

      // Medallion Background with Gold Border
      ctx.save();
      ctx.fillStyle = b.secondaryColor;
      ctx.strokeStyle = b.foilColor;
      ctx.lineWidth = 5;

      ctx.beginPath();
      ctx.ellipse(cx, cy, medallionW / 2, medallionH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Medallion Inset Ring
      ctx.strokeStyle = b.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, medallionW / 2 - 10, medallionH / 2 - 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Gold Laurel Wreath Sprigs
      ctx.strokeStyle = b.foilColor;
      ctx.fillStyle = b.foilColor;
      for (let side of [-1, 1]) {
        for (let a = -0.7; a <= 0.7; a += 0.25) {
          const lx = cx + side * (medallionW / 2 - 20) * Math.cos(a);
          const ly = cy + (medallionH / 2 - 20) * Math.sin(a);
          ctx.beginPath();
          ctx.ellipse(lx, ly, 7, 3, side * (a + 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Embossed Typography
      ctx.fillStyle = b.foilColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Title
      ctx.font = 'bold 36px "Cinzel", "Times New Roman", Georgia, serif';
      ctx.fillText(b.title, cx, cy - 18);

      // Divider Line & Diamond
      ctx.beginPath();
      ctx.moveTo(cx - 55, cy + 8);
      ctx.lineTo(cx + 55, cy + 8);
      ctx.strokeStyle = b.foilColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx + 6, cy + 8);
      ctx.lineTo(cx, cy + 12);
      ctx.lineTo(cx - 6, cy + 8);
      ctx.closePath();
      ctx.fill();

      // Subtitle
      ctx.font = '600 20px "Cinzel", "Times New Roman", Georgia, serif';
      ctx.fillText(b.sub, cx, cy + 32);

      // Micro Brand Seal Text
      ctx.font = 'bold 11px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillStyle = b.accentColor;
      ctx.fillText('HECHO A MANO · VAPEAR', cx, cy + 56);

      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texturesToDispose.push(texture);
    this.bandTextures.set(config.id, texture);
    return texture;
  }

  /**
   * Procedural canvas texture generator for the cut-end inner tobacco cross-section.
   * Renders concentric rolled leaf layers and dark bunched long-filler tobacco.
   */
  getCutEndTexture(config: CigarVariantConfig): THREE.CanvasTexture {
    const existing = this.cutEndTextures.get(config.id);
    if (existing) return existing;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 4;

      // Dark core background
      const baseHex = config.innerTobacco.coreColor;
      const rHex = (baseHex >> 16) & 255;
      const gHex = (baseHex >> 8) & 255;
      const bHex = baseHex & 255;
      ctx.fillStyle = `rgb(${rHex}, ${gHex}, ${bHex})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Swirled bunched long-filler tobacco leaves in concentric rings
      const darkHex = config.innerTobacco.leafDark;
      const lightHex = config.innerTobacco.leafLight;
      const dR = (darkHex >> 16) & 255;
      const dG = (darkHex >> 8) & 255;
      const dB = darkHex & 255;
      const lR = (lightHex >> 16) & 255;
      const lG = (lightHex >> 8) & 255;
      const lB = lightHex & 255;

      for (let ring = 10; ring < r; ring += 7) {
        const ringLeaves = Math.floor(ring * 0.9);
        for (let i = 0; i < ringLeaves; i++) {
          const angle = (i / ringLeaves) * Math.PI * 2 + (ring * 0.2);
          const lx = cx + Math.cos(angle) * ring;
          const ly = cy + Math.sin(angle) * ring;
          const leafW = 5 + Math.random() * 6;
          const leafH = 2 + Math.random() * 3;

          const isLight = Math.random() > 0.45;
          ctx.fillStyle = isLight
            ? `rgb(${lR + Math.floor((Math.random() - 0.5) * 16)}, ${lG}, ${lB})`
            : `rgb(${dR}, ${dG}, ${dB})`;

          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(angle + Math.PI / 2 + (Math.random() - 0.5) * 0.6);
          ctx.beginPath();
          ctx.ellipse(0, 0, leafW, leafH, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Outer wrapper leaf ring rim
      ctx.strokeStyle = `rgb(${lR - 10}, ${lG - 10}, ${lB - 10})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.texturesToDispose.push(texture);
    this.cutEndTextures.set(config.id, texture);
    return texture;
  }

  /**
   * Procedural dark Spanish mahogany / walnut wood texture for luxury box exterior.
   */
  getDarkWoodTexture(): THREE.CanvasTexture {
    if (this.darkWoodTexture) return this.darkWoodTexture;

    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Deep mahogany tone base
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#24120a');
      grad.addColorStop(0.3, '#351b0f');
      grad.addColorStop(0.7, '#2a150c');
      grad.addColorStop(1, '#1e0e08');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Fine straight grain lines
      ctx.globalAlpha = 0.18;
      for (let x = 0; x < width; x += 2) {
        const tone = Math.random() > 0.5 ? '#110703' : '#4d2816';
        ctx.strokeStyle = tone;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        const wave = Math.sin(x * 0.04) * 6;
        ctx.moveTo(x + wave, 0);
        ctx.lineTo(x + wave * 0.6, height);
        ctx.stroke();
      }

      // Subtle wood pores
      ctx.globalAlpha = 0.09;
      for (let i = 0; i < 1400; i++) {
        const px = Math.random() * width;
        const py = Math.random() * height;
        ctx.fillStyle = '#0f0502';
        ctx.fillRect(px, py, 1.2, 4 + Math.random() * 6);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.texturesToDispose.push(texture);
    this.darkWoodTexture = texture;
    return texture;
  }

  /**
   * Procedural authentic Spanish cedar wood texture for luxury box interior.
   */
  getCedarWoodTexture(): THREE.CanvasTexture {
    if (this.cedarWoodTexture) return this.cedarWoodTexture;

    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Warm salmon / Spanish cedar color base
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#c57850');
      grad.addColorStop(0.4, '#d88b63');
      grad.addColorStop(0.8, '#b66943');
      grad.addColorStop(1, '#be714a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Fine cedar wood grain
      ctx.globalAlpha = 0.22;
      for (let x = 0; x < width; x += 3) {
        ctx.strokeStyle = x % 6 === 0 ? '#8e492b' : '#e69f78';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const wave = Math.sin(x * 0.02) * 4;
        ctx.moveTo(x + wave, 0);
        ctx.lineTo(x + wave * 0.7, height);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.texturesToDispose.push(texture);
    this.cedarWoodTexture = texture;
    return texture;
  }

  dispose() {
    for (const t of this.texturesToDispose) {
      t.dispose();
    }
    this.texturesToDispose = [];
    this.bandTextures.clear();
    this.wrapperTextures.clear();
    this.cutEndTextures.clear();
    this.darkWoodTexture = null;
    this.cedarWoodTexture = null;
  }
}
