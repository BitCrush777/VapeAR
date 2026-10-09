// VapeAR Cigar Factory — Created by Saidarshan.K
// Constructs high-fidelity 3D cigars with tapered head, foot, wrapper, band, and cut end

import * as THREE from 'three';
import { type CigarVariantConfig, type CigarVariantId, CIGAR_VARIANTS } from './cigarVariants';
import { CigarMaterialManager } from './cigarMaterials';

export interface BuiltCigar {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  bandMesh: THREE.Mesh;
  cutEndMesh: THREE.Mesh;
  footEndMesh: THREE.Mesh;
  wrapperMaterial: THREE.MeshPhysicalMaterial;
  bandMaterial: THREE.MeshStandardMaterial;
  cutEndMaterial: THREE.MeshStandardMaterial;
  footEndMaterial: THREE.MeshStandardMaterial;
  currentVariantId: CigarVariantId;
  updateVariant: (variantId: CigarVariantId) => void;
  dispose: () => void;
}

export class CigarFactory {
  private materialManager: CigarMaterialManager;

  constructor(materialManager: CigarMaterialManager) {
    this.materialManager = materialManager;
  }

  /**
   * Constructs a premium 3D cigar according to the specified variant config.
   * Can be dynamically updated to another variant without scene disruption.
   */
  createCigar(variantId: CigarVariantId = 'maduro', isDisplayCigar = false): BuiltCigar {
    const group = new THREE.Group();
    group.name = `Cigar_${variantId}${isDisplayCigar ? '_Display' : ''}`;

    let currentConfig = CIGAR_VARIANTS[variantId];

    // ── 1. Materials Initialization ──────────────────────────────────────────
    const wrapperTex = this.materialManager.getWrapperTextures(currentConfig);
    const wrapperMaterial = new THREE.MeshPhysicalMaterial({
      color: currentConfig.wrapper.color,
      map: wrapperTex.map,
      bumpMap: wrapperTex.bump,
      bumpScale: currentConfig.wrapper.bumpScale,
      roughness: currentConfig.wrapper.roughness,
      metalness: currentConfig.wrapper.metalness,
      clearcoat: currentConfig.wrapper.clearcoat,
      clearcoatRoughness: currentConfig.wrapper.clearcoatRoughness
    });

    const bandTex = this.materialManager.getBandTexture(currentConfig);
    const bandMaterial = new THREE.MeshStandardMaterial({
      map: bandTex,
      roughness: 0.32,
      metalness: 0.45,
      side: THREE.DoubleSide
    });

    const cutEndTex = this.materialManager.getCutEndTexture(currentConfig);
    const cutEndMaterial = new THREE.MeshStandardMaterial({
      map: cutEndTex,
      roughness: 0.78,
      metalness: 0.05
    });

    const footEndMaterial = new THREE.MeshStandardMaterial({
      map: cutEndTex,
      roughness: 0.88,
      metalness: 0.04
    });

    // ── 2. Geometric Silhouette (Lathe Profile for organic shape) ───────────
    const buildCigarGeometry = (cfg: CigarVariantConfig): THREE.BufferGeometry => {
      const L = cfg.length;
      const R = cfg.radius;
      const halfL = L / 2;

      // Realistic cigar lathe points from bottom foot (y = -halfL) to cut head (y = halfL)
      const points: THREE.Vector2[] = [
        new THREE.Vector2(0.0, -halfL), // Foot center
        new THREE.Vector2(R * cfg.footBevelRatio * 0.85, -halfL), // Foot beveled inset
        new THREE.Vector2(R * cfg.footBevelRatio, -halfL + 0.02), // Foot outer shoulder
        new THREE.Vector2(R * 0.98, -halfL + L * 0.12), // Lower barrel
        new THREE.Vector2(R * 1.015, -halfL + L * 0.42), // Mid-barrel gentle swell
        new THREE.Vector2(R * 1.012, -halfL + L * 0.65), // Upper-mid barrel
        new THREE.Vector2(R * 0.99, halfL - L * 0.16), // Shoulder begin
        new THREE.Vector2(R * cfg.headTaperRatio, halfL - 0.03), // Head taper
        new THREE.Vector2(R * cfg.headTaperRatio * 0.94, halfL) // Head cut rim
      ];

      return new THREE.LatheGeometry(points, 36);
    };

    let bodyGeo = buildCigarGeometry(currentConfig);
    const bodyMesh = new THREE.Mesh(bodyGeo, wrapperMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // ── 3. Cut End Head Cap Disc (Exposes inner tobacco cross-section) ──────
    const buildCutEndGeometry = (cfg: CigarVariantConfig): THREE.CircleGeometry => {
      const R = cfg.radius * cfg.headTaperRatio * 0.94;
      return new THREE.CircleGeometry(R, 32);
    };

    let cutEndGeo = buildCutEndGeometry(currentConfig);
    const cutEndMesh = new THREE.Mesh(cutEndGeo, cutEndMaterial);
    cutEndMesh.position.y = currentConfig.length / 2 + 0.001;
    cutEndMesh.rotation.x = -Math.PI / 2;
    cutEndMesh.castShadow = true;
    group.add(cutEndMesh);

    // ── 4. Foot End Inner Core Disc ─────────────────────────────────────────
    const buildFootEndGeometry = (cfg: CigarVariantConfig): THREE.CircleGeometry => {
      const R = cfg.radius * cfg.footBevelRatio * 0.85;
      return new THREE.CircleGeometry(R, 24);
    };

    let footEndGeo = buildFootEndGeometry(currentConfig);
    const footEndMesh = new THREE.Mesh(footEndGeo, footEndMaterial);
    footEndMesh.position.y = -currentConfig.length / 2 - 0.001;
    footEndMesh.rotation.x = Math.PI / 2;
    group.add(footEndMesh);

    // ── 5. Decorative Cigar Band Ring ───────────────────────────────────────
    const buildBandGeometry = (cfg: CigarVariantConfig): THREE.CylinderGeometry => {
      const rTop = cfg.radius * 1.025;
      const rBottom = cfg.radius * 1.025;
      const h = cfg.band.width;
      return new THREE.CylinderGeometry(rTop, rBottom, h, 36, 1, true);
    };

    let bandGeo = buildBandGeometry(currentConfig);
    const bandMesh = new THREE.Mesh(bandGeo, bandMaterial);
    bandMesh.position.y = currentConfig.length / 2 - currentConfig.band.offsetFromHead;
    bandMesh.castShadow = true;
    group.add(bandMesh);

    // ── 6. Dynamic Variant Update Handler ───────────────────────────────────
    const updateVariant = (newVariantId: CigarVariantId) => {
      const newCfg = CIGAR_VARIANTS[newVariantId];
      if (!newCfg) return;
      currentConfig = newCfg;

      // Update Wrapper Material
      const newWrapperTex = this.materialManager.getWrapperTextures(newCfg);
      wrapperMaterial.color.setHex(newCfg.wrapper.color);
      wrapperMaterial.map = newWrapperTex.map;
      wrapperMaterial.bumpMap = newWrapperTex.bump;
      wrapperMaterial.bumpScale = newCfg.wrapper.bumpScale;
      wrapperMaterial.roughness = newCfg.wrapper.roughness;
      wrapperMaterial.metalness = newCfg.wrapper.metalness;
      wrapperMaterial.clearcoat = newCfg.wrapper.clearcoat;
      wrapperMaterial.clearcoatRoughness = newCfg.wrapper.clearcoatRoughness;
      wrapperMaterial.needsUpdate = true;

      // Update Band Material
      const newBandTex = this.materialManager.getBandTexture(newCfg);
      bandMaterial.map = newBandTex;
      bandMaterial.needsUpdate = true;

      // Update Cut End Material
      const newCutEndTex = this.materialManager.getCutEndTexture(newCfg);
      cutEndMaterial.map = newCutEndTex;
      cutEndMaterial.needsUpdate = true;
      footEndMaterial.map = newCutEndTex;
      footEndMaterial.needsUpdate = true;

      // Rebuild geometries to conform to new length and ring gauge
      bodyMesh.geometry.dispose();
      bodyGeo = buildCigarGeometry(newCfg);
      bodyMesh.geometry = bodyGeo;

      cutEndMesh.geometry.dispose();
      cutEndGeo = buildCutEndGeometry(newCfg);
      cutEndMesh.geometry = cutEndGeo;
      cutEndMesh.position.y = newCfg.length / 2 + 0.001;

      footEndMesh.geometry.dispose();
      footEndGeo = buildFootEndGeometry(newCfg);
      footEndMesh.geometry = footEndGeo;
      footEndMesh.position.y = -newCfg.length / 2 - 0.001;

      bandMesh.geometry.dispose();
      bandGeo = buildBandGeometry(newCfg);
      bandMesh.geometry = bandGeo;
      bandMesh.position.y = newCfg.length / 2 - newCfg.band.offsetFromHead;
    };

    // ── 7. Safe Resource Disposal ───────────────────────────────────────────
    const dispose = () => {
      bodyGeo.dispose();
      cutEndGeo.dispose();
      footEndGeo.dispose();
      bandGeo.dispose();
      wrapperMaterial.dispose();
      bandMaterial.dispose();
      cutEndMaterial.dispose();
      footEndMaterial.dispose();
    };

    return {
      group,
      bodyMesh,
      bandMesh,
      cutEndMesh,
      footEndMesh,
      wrapperMaterial,
      bandMaterial,
      cutEndMaterial,
      footEndMaterial,
      currentVariantId: variantId,
      updateVariant,
      dispose
    };
  }
}
