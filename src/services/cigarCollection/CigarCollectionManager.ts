// VapeAR Cigar Collection Manager — Created by Saidarshan.K
// Orchestrates 3D cigar models, luxury box, cutter, materials, animations, and interactions

import * as THREE from 'three';
import { type CigarVariantId, DEFAULT_CIGAR_VARIANT_ID } from './cigarVariants';
import { CigarMaterialManager } from './cigarMaterials';
import { CigarFactory, type BuiltCigar } from './CigarFactory';
import { CigarBoxFactory, type BuiltCigarBox } from './CigarBoxFactory';
import { CigarCutterFactory, type BuiltCigarCutter, type CutterState } from './CigarCutterFactory';

export interface CigarCollectionState {
  currentVariant: CigarVariantId;
  isBoxOpen: boolean;
  boxLidProgress: number; // 0 to 1
  isCutterOpen: boolean;
  cutterState: CutterState;
  isCigarSelected: boolean;
  isCigarGrabbed: boolean;
  isBoxVisible: boolean;
  isCutterVisible: boolean;
  isAutoSpin: boolean;
}

export class CigarCollectionManager {
  private rootGroup: THREE.Group;
  private materialManager: CigarMaterialManager;
  private cigarFactory: CigarFactory;
  private boxFactory: CigarBoxFactory;
  private cutterFactory: CigarCutterFactory;

  // Scene Objects
  private displayCigar: BuiltCigar;
  private cigarBox: BuiltCigarBox;
  private cutter: BuiltCigarCutter;
  private displayRestGroup: THREE.Group;
  private selectionRing: THREE.Mesh;
  private selectionRingMat: THREE.MeshBasicMaterial;

  // State
  private currentVariant: CigarVariantId = DEFAULT_CIGAR_VARIANT_ID;
  private isBoxOpen: boolean = true;
  private currentLidProgress: number = 1.0;
  private targetLidProgress: number = 1.0;

  private isCutterOpen: boolean = true;
  private currentCutterProgress: number = 1.0;
  private targetCutterProgress: number = 1.0;

  private isCigarSelected: boolean = false;
  private isCigarGrabbed: boolean = false;
  private isBoxVisible: boolean = true;
  private isCutterVisible: boolean = true;
  private isAutoSpin: boolean = false;

  // Display rest resting transform
  private readonly defaultCigarLocalPos = new THREE.Vector3(0.0, 0.09, 0.88);
  private readonly defaultCigarLocalRot = new THREE.Euler(0, 0, Math.PI / 2); // Lies horizontal along X axis

  // Inspection Rotation Angles
  private inspectRotation = {
    yaw: 0,
    pitch: 0
  };

  // Target and smoothed positions for interactive manipulation
  private targetCigarPos = new THREE.Vector3();
  private smoothedCigarPos = new THREE.Vector3();
  private cigarPosLerp = 0.22;

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'CigarCollectionRoot';

    // Grounded placement on the lounge table to the right of hookah
    this.rootGroup.position.set(1.28, 0.0, 0.52);

    this.materialManager = new CigarMaterialManager();
    this.cigarFactory = new CigarFactory(this.materialManager);
    this.boxFactory = new CigarBoxFactory(this.materialManager, this.cigarFactory);
    this.cutterFactory = new CigarCutterFactory();

    // ── 1. Luxury Cigar Box Assembly ────────────────────────────────────────
    this.cigarBox = this.boxFactory.createBox(this.currentVariant);
    this.cigarBox.group.position.set(0, 0, 0);
    this.rootGroup.add(this.cigarBox.group);

    // ── 2. Display Cradle Stand for Active Cigar ────────────────────────────
    this.displayRestGroup = new THREE.Group();
    this.displayRestGroup.name = 'CigarDisplayCradle';
    this.displayRestGroup.position.set(0, 0, 0.88);

    // Spanish Cedar Base Bar
    const restBarGeo = new THREE.BoxGeometry(0.72, 0.04, 0.18);
    const cedarMat = new THREE.MeshStandardMaterial({
      color: 0xc47952,
      roughness: 0.65,
      metalness: 0.05
    });
    const restBar = new THREE.Mesh(restBarGeo, cedarMat);
    restBar.position.y = 0.02;
    restBar.castShadow = true;
    restBar.receiveShadow = true;
    this.displayRestGroup.add(restBar);

    // Twin Brass Notched Rests
    const restNotchGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.08, 16);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.22
    });

    for (const xOff of [-0.22, 0.22]) {
      const notch1 = new THREE.Mesh(restNotchGeo, brassMat);
      notch1.position.set(xOff, 0.065, -0.04);
      notch1.rotation.x = Math.PI / 6;
      this.displayRestGroup.add(notch1);

      const notch2 = new THREE.Mesh(restNotchGeo, brassMat);
      notch2.position.set(xOff, 0.065, 0.04);
      notch2.rotation.x = -Math.PI / 6;
      this.displayRestGroup.add(notch2);
    }
    this.rootGroup.add(this.displayRestGroup);

    // ── 3. Active / Display Cigar ───────────────────────────────────────────
    this.displayCigar = this.cigarFactory.createCigar(this.currentVariant, true);
    this.targetCigarPos.copy(this.defaultCigarLocalPos);
    this.smoothedCigarPos.copy(this.defaultCigarLocalPos);
    this.displayCigar.group.position.copy(this.defaultCigarLocalPos);
    this.displayCigar.group.rotation.copy(this.defaultCigarLocalRot);
    this.rootGroup.add(this.displayCigar.group);

    // ── 4. Selection Indicator Ring ─────────────────────────────────────────
    const ringGeo = new THREE.RingGeometry(0.18, 0.22, 32);
    this.selectionRingMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.selectionRing = new THREE.Mesh(ringGeo, this.selectionRingMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.set(0, 0.003, 0.88);
    this.rootGroup.add(this.selectionRing);

    // ── 5. Premium Cigar Cutter ─────────────────────────────────────────────
    this.cutter = this.cutterFactory.createCutter();
    // Placed neatly on the right side of the cigar stand
    this.cutter.group.position.set(0.92, 0.02, 0.82);
    this.cutter.group.rotation.x = -Math.PI / 2; // Flat on table surface
    this.cutter.group.rotation.z = -Math.PI / 6; // Slight angled posture
    this.rootGroup.add(this.cutter.group);
  }

  getRootGroup(): THREE.Group {
    return this.rootGroup;
  }

  getDisplayCigarWorldPosition(): THREE.Vector3 {
    const worldPos = new THREE.Vector3();
    this.displayCigar.group.getWorldPosition(worldPos);
    return worldPos;
  }

  // ── Variant Switching ─────────────────────────────────────────────────────
  setVariant(variantId: CigarVariantId) {
    if (this.currentVariant === variantId) return;
    this.currentVariant = variantId;
    this.displayCigar.updateVariant(variantId);
    this.cigarBox.updateVariant(variantId);
  }

  getVariant(): CigarVariantId {
    return this.currentVariant;
  }

  // ── Cigar Box Open / Close Controls ───────────────────────────────────────
  toggleBox(): boolean {
    return this.setBoxOpen(!this.isBoxOpen);
  }

  setBoxOpen(open: boolean): boolean {
    this.isBoxOpen = open;
    this.targetLidProgress = open ? 1.0 : 0.0;
    return this.isBoxOpen;
  }

  getIsBoxOpen(): boolean {
    return this.isBoxOpen;
  }

  // ── Cigar Cutter Controls ─────────────────────────────────────────────────
  toggleCutter(): boolean {
    return this.setCutterOpen(!this.isCutterOpen);
  }

  setCutterOpen(open: boolean): boolean {
    this.isCutterOpen = open;
    this.targetCutterProgress = open ? 1.0 : 0.0;
    return this.isCutterOpen;
  }

  getCutterState(): CutterState {
    return this.cutter.state;
  }

  // ── Cigar Selection & Interaction ─────────────────────────────────────────
  selectCigar(selected: boolean) {
    this.isCigarSelected = selected;
    if (!selected) {
      this.isCigarGrabbed = false;
    }
  }

  isSelectionActive(): boolean {
    return this.isCigarSelected;
  }

  hasActiveOwnership(): boolean {
    return this.isCigarGrabbed;
  }

  setGrabbed(grabbed: boolean) {
    this.isCigarGrabbed = grabbed;
    if (grabbed) {
      this.isCigarSelected = true;
    }
  }

  setTargetPosition(worldPos: THREE.Vector3) {
    // Convert worldPos to local space of rootGroup
    const localPos = worldPos.clone();
    this.rootGroup.worldToLocal(localPos);

    // Limit movement within sensible bounding box around the table
    localPos.x = THREE.MathUtils.clamp(localPos.x, -1.8, 1.8);
    localPos.y = THREE.MathUtils.clamp(localPos.y, 0.08, 1.5);
    localPos.z = THREE.MathUtils.clamp(localPos.z, -0.4, 1.8);

    this.targetCigarPos.copy(localPos);
  }

  // ── 3D Inspection Controls ────────────────────────────────────────────────
  rotateInspect(deltaYaw: number, deltaPitch: number) {
    this.inspectRotation.yaw += deltaYaw;
    this.inspectRotation.pitch = THREE.MathUtils.clamp(
      this.inspectRotation.pitch + deltaPitch,
      -Math.PI / 3,
      Math.PI / 3
    );
  }

  toggleAutoSpin(): boolean {
    this.isAutoSpin = !this.isAutoSpin;
    return this.isAutoSpin;
  }

  resetInspectionOrientation() {
    this.inspectRotation.yaw = 0;
    this.inspectRotation.pitch = 0;
    this.isAutoSpin = false;
  }

  resetDisplayCigar() {
    this.isCigarGrabbed = false;
    this.isCigarSelected = false;
    this.isAutoSpin = false;
    this.inspectRotation.yaw = 0;
    this.inspectRotation.pitch = 0;
    this.targetCigarPos.copy(this.defaultCigarLocalPos);
    this.smoothedCigarPos.copy(this.defaultCigarLocalPos);
    this.displayCigar.group.position.copy(this.defaultCigarLocalPos);
    this.displayCigar.group.rotation.copy(this.defaultCigarLocalRot);
  }

  // ── Visibility Controls ───────────────────────────────────────────────────
  setBoxVisible(visible: boolean) {
    this.isBoxVisible = visible;
    this.cigarBox.group.visible = visible;
  }

  setCutterVisible(visible: boolean) {
    this.isCutterVisible = visible;
    this.cutter.group.visible = visible;
  }

  getState(): CigarCollectionState {
    return {
      currentVariant: this.currentVariant,
      isBoxOpen: this.isBoxOpen,
      boxLidProgress: this.currentLidProgress,
      isCutterOpen: this.isCutterOpen,
      cutterState: this.cutter.state,
      isCigarSelected: this.isCigarSelected,
      isCigarGrabbed: this.isCigarGrabbed,
      isBoxVisible: this.isBoxVisible,
      isCutterVisible: this.isCutterVisible,
      isAutoSpin: this.isAutoSpin
    };
  }

  // ── Frame Update Loop ─────────────────────────────────────────────────────
  update(timestampMs: number) {
    // 1. Smooth Box Lid Open/Close Animation
    if (Math.abs(this.currentLidProgress - this.targetLidProgress) > 0.001) {
      this.currentLidProgress = THREE.MathUtils.lerp(
        this.currentLidProgress,
        this.targetLidProgress,
        0.12
      );
      this.cigarBox.setOpenProgress(this.currentLidProgress);
    }

    // 2. Smooth Cutter Blade Travel Animation
    if (Math.abs(this.currentCutterProgress - this.targetCutterProgress) > 0.001) {
      this.currentCutterProgress = THREE.MathUtils.lerp(
        this.currentCutterProgress,
        this.targetCutterProgress,
        0.16
      );
      this.cutter.setBladeProgress(this.currentCutterProgress);
    }

    // 3. Auto-Spin Inspection Rotation
    if (this.isAutoSpin) {
      this.inspectRotation.yaw += 0.015;
    }

    // 4. Smooth Cigar Position Lerp
    this.smoothedCigarPos.lerp(
      this.targetCigarPos,
      this.isCigarGrabbed ? this.cigarPosLerp : 0.08
    );
    this.displayCigar.group.position.copy(this.smoothedCigarPos);

    // 5. Update Cigar Rotation
    if (this.isCigarGrabbed || this.isCigarSelected) {
      // Compose base orientation with inspection yaw/pitch
      this.displayCigar.group.rotation.set(
        this.inspectRotation.pitch,
        this.inspectRotation.yaw,
        Math.PI / 2
      );
    } else {
      // Return to resting horizontal orientation
      this.displayCigar.group.rotation.set(
        THREE.MathUtils.lerp(this.displayCigar.group.rotation.x, this.defaultCigarLocalRot.x, 0.1),
        THREE.MathUtils.lerp(this.displayCigar.group.rotation.y, this.defaultCigarLocalRot.y, 0.1),
        THREE.MathUtils.lerp(this.displayCigar.group.rotation.z, this.defaultCigarLocalRot.z, 0.1)
      );
    }

    // 6. Selection Ring Indicator Animation
    const targetRingOpacity = this.isCigarSelected ? 0.85 : 0.0;
    this.selectionRingMat.opacity = THREE.MathUtils.lerp(
      this.selectionRingMat.opacity,
      targetRingOpacity,
      0.15
    );

    if (this.selectionRingMat.opacity > 0.01) {
      const pulse = 1.0 + Math.sin(timestampMs * 0.005) * 0.06;
      this.selectionRing.scale.set(pulse, pulse, pulse);
      this.selectionRing.position.x = this.smoothedCigarPos.x;
      this.selectionRing.position.z = this.smoothedCigarPos.z;
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  dispose() {
    this.cigarBox.dispose();
    this.displayCigar.dispose();
    this.cutter.dispose();
    this.materialManager.dispose();

    this.selectionRing.geometry.dispose();
    this.selectionRingMat.dispose();

    // Clean up display cradle meshes
    this.displayRestGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) {
        (obj as THREE.Mesh).geometry.dispose();
      }
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });

    this.rootGroup.clear();
  }
}
