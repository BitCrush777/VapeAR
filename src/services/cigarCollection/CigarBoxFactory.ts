// VapeAR Luxury Cigar Box Factory — Created by Saidarshan.K
// Constructs luxury humidor box with Spanish cedar interior, brass hinges, and animated pivoting lid

import * as THREE from 'three';
import { CigarMaterialManager } from './cigarMaterials';
import { CigarFactory, type BuiltCigar } from './CigarFactory';
import { type CigarVariantId } from './cigarVariants';

export interface BuiltCigarBox {
  group: THREE.Group;
  lidPivot: THREE.Group;
  interiorCigars: BuiltCigar[];
  isOpen: boolean;
  setOpenProgress: (progress: number) => void; // 0 (closed) to 1 (fully open)
  updateVariant: (variantId: CigarVariantId) => void;
  dispose: () => void;
}

export class CigarBoxFactory {
  private materialManager: CigarMaterialManager;
  private cigarFactory: CigarFactory;

  constructor(
    materialManager: CigarMaterialManager,
    cigarFactory: CigarFactory
  ) {
    this.materialManager = materialManager;
    this.cigarFactory = cigarFactory;
  }

  createBox(initialVariantId: CigarVariantId = 'maduro'): BuiltCigarBox {
    const group = new THREE.Group();
    group.name = 'LuxuryCigarBox';

    // ── 1. Materials Setup ──────────────────────────────────────────────────
    const darkWoodTex = this.materialManager.getDarkWoodTexture();
    const cedarTex = this.materialManager.getCedarWoodTexture();

    // Exterior Polished Lacquered Mahogany
    const mahoganyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2b1409,
      map: darkWoodTex,
      roughness: 0.24,
      metalness: 0.12,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.7
    });

    // Interior Natural Spanish Cedar Lining
    const cedarMaterial = new THREE.MeshStandardMaterial({
      color: 0xc47952,
      map: cedarTex,
      roughness: 0.65,
      metalness: 0.05
    });

    // Solid Brass Accents & Hinges
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.22
    });

    // Soft Contact Shadow below the box
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    // ── 2. Dimensional Constants ────────────────────────────────────────────
    const boxWidth = 1.68;
    const boxDepth = 1.36;
    const baseHeight = 0.22;
    const wallThick = 0.07;
    const lidHeight = 0.06;

    // Contact Ground Shadow
    const shadowGeo = new THREE.PlaneGeometry(boxWidth * 1.15, boxDepth * 1.15);
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.001;
    group.add(shadowMesh);

    // ── 3. Base Box Tray ────────────────────────────────────────────────────
    const baseTrayGroup = new THREE.Group();

    // Outer Bottom Base Slab
    const bottomGeo = new THREE.BoxGeometry(boxWidth, 0.04, boxDepth);
    const bottomMesh = new THREE.Mesh(bottomGeo, mahoganyMaterial);
    bottomMesh.position.y = 0.02;
    bottomMesh.castShadow = true;
    bottomMesh.receiveShadow = true;
    baseTrayGroup.add(bottomMesh);

    // Cedar Interior Floor
    const interiorFloorGeo = new THREE.BoxGeometry(boxWidth - wallThick * 2, 0.02, boxDepth - wallThick * 2);
    const interiorFloorMesh = new THREE.Mesh(interiorFloorGeo, cedarMaterial);
    interiorFloorMesh.position.y = 0.045;
    interiorFloorMesh.receiveShadow = true;
    baseTrayGroup.add(interiorFloorMesh);

    // Outer Front Wall
    const frontWallGeo = new THREE.BoxGeometry(boxWidth, baseHeight, wallThick);
    const frontWall = new THREE.Mesh(frontWallGeo, mahoganyMaterial);
    frontWall.position.set(0, baseHeight / 2, boxDepth / 2 - wallThick / 2);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    baseTrayGroup.add(frontWall);

    // Outer Back Wall
    const backWallGeo = new THREE.BoxGeometry(boxWidth, baseHeight, wallThick);
    const backWall = new THREE.Mesh(backWallGeo, mahoganyMaterial);
    backWall.position.set(0, baseHeight / 2, -boxDepth / 2 + wallThick / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    baseTrayGroup.add(backWall);

    // Outer Left Wall
    const sideWallGeo = new THREE.BoxGeometry(wallThick, baseHeight, boxDepth - wallThick * 2);
    const leftWall = new THREE.Mesh(sideWallGeo, mahoganyMaterial);
    leftWall.position.set(-boxWidth / 2 + wallThick / 2, baseHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    baseTrayGroup.add(leftWall);

    // Outer Right Wall
    const rightWall = new THREE.Mesh(sideWallGeo, mahoganyMaterial);
    rightWall.position.set(boxWidth / 2 - wallThick / 2, baseHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    baseTrayGroup.add(rightWall);

    // Interior Cedar Wall Liners (contrasting aromatic inner rim)
    const cedarSideGeo = new THREE.BoxGeometry(0.018, baseHeight - 0.04, boxDepth - wallThick * 2);
    const cedarLeft = new THREE.Mesh(cedarSideGeo, cedarMaterial);
    cedarLeft.position.set(-boxWidth / 2 + wallThick + 0.009, (baseHeight - 0.04) / 2 + 0.04, 0);
    baseTrayGroup.add(cedarLeft);

    const cedarRight = new THREE.Mesh(cedarSideGeo, cedarMaterial);
    cedarRight.position.set(boxWidth / 2 - wallThick - 0.009, (baseHeight - 0.04) / 2 + 0.04, 0);
    baseTrayGroup.add(cedarRight);

    // Interior Scalloped Cedar Dividers (3 dividers creating 4 cigar slots)
    const interiorSlotWidth = (boxWidth - (wallThick + 0.02) * 2) / 4;
    const dividerGeo = new THREE.BoxGeometry(0.02, 0.06, boxDepth - wallThick * 2 - 0.08);
    for (let i = 1; i <= 3; i++) {
      const divX = -boxWidth / 2 + wallThick + 0.02 + i * interiorSlotWidth - 0.01;
      const divider = new THREE.Mesh(dividerGeo, cedarMaterial);
      divider.position.set(divX, 0.075, 0);
      divider.receiveShadow = true;
      baseTrayGroup.add(divider);
    }

    // Outer Gold Perimeter Inlay Accent Line around the tray base
    const trimGeo = new THREE.BoxGeometry(boxWidth + 0.012, 0.012, boxDepth + 0.012);
    const trimMesh = new THREE.Mesh(trimGeo, brassMaterial);
    trimMesh.position.y = 0.015;
    baseTrayGroup.add(trimMesh);

    group.add(baseTrayGroup);

    // ── 4. Precision Brass Hinges (Mounted at the rear top edge) ────────────
    const hingeY = baseHeight;
    const hingeZ = -boxDepth / 2 + wallThick / 2;

    for (let xPos of [-0.48, 0.48]) {
      // Hinge Cylinder Barrel
      const hBarrelGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.12, 16);
      const hBarrel = new THREE.Mesh(hBarrelGeo, brassMaterial);
      hBarrel.rotation.z = Math.PI / 2;
      hBarrel.position.set(xPos, hingeY, hingeZ);
      group.add(hBarrel);

      // Lower mounting plate
      const hPlateGeo = new THREE.BoxGeometry(0.08, 0.04, 0.015);
      const hPlate = new THREE.Mesh(hPlateGeo, brassMaterial);
      hPlate.position.set(xPos, hingeY - 0.025, hingeZ - 0.018);
      group.add(hPlate);
    }

    // ── 5. Hinged Lid Assembly (Pivots at rear hinge axis) ───────────────────
    const lidPivot = new THREE.Group();
    lidPivot.name = 'BoxLidPivot';
    lidPivot.position.set(0, hingeY, hingeZ);

    const lidOffsetZ = -hingeZ; // Forward distance to center of lid
    const lidOffsetY = lidHeight / 2;

    // Main Lid Outer Mahogany Top Slab
    const lidTopGeo = new THREE.BoxGeometry(boxWidth + 0.01, lidHeight, boxDepth + 0.01);
    const lidTopMesh = new THREE.Mesh(lidTopGeo, mahoganyMaterial);
    lidTopMesh.position.set(0, lidOffsetY, lidOffsetZ);
    lidTopMesh.castShadow = true;
    lidTopMesh.receiveShadow = true;
    lidPivot.add(lidTopMesh);

    // Spanish Cedar Underside Inset Lid Liner
    const lidLinerGeo = new THREE.BoxGeometry(boxWidth - wallThick * 2 + 0.02, 0.014, boxDepth - wallThick * 2 + 0.02);
    const lidLinerMesh = new THREE.Mesh(lidLinerGeo, cedarMaterial);
    lidLinerMesh.position.set(0, 0.007, lidOffsetZ);
    lidPivot.add(lidLinerMesh);

    // Brass Top Perimeter Inlay Band
    const lidTrimGeo = new THREE.BoxGeometry(boxWidth - 0.12, 0.004, boxDepth - 0.12);
    const lidTrim = new THREE.Mesh(lidTrimGeo, brassMaterial);
    lidTrim.position.set(0, lidHeight + 0.002, lidOffsetZ);
    lidPivot.add(lidTrim);

    // Restrained Brass Heraldic Medallion / Center Emblem
    const emblemGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.01, 32);
    const emblemMesh = new THREE.Mesh(emblemGeo, brassMaterial);
    emblemMesh.position.set(0, lidHeight + 0.006, lidOffsetZ);
    lidPivot.add(emblemMesh);

    const emblemRingGeo = new THREE.TorusGeometry(0.09, 0.008, 8, 24);
    const emblemRing = new THREE.Mesh(emblemRingGeo, brassMaterial);
    emblemRing.rotation.x = Math.PI / 2;
    emblemRing.position.set(0, lidHeight + 0.012, lidOffsetZ);
    lidPivot.add(emblemRing);

    group.add(lidPivot);

    // ── 6. Interior Cigars Array (4 Cigars arranged neatly in slots) ────────
    const interiorCigars: BuiltCigar[] = [];
    const cigarY = 0.115; // Nestled snugly inside the cedar slot floor

    for (let i = 0; i < 4; i++) {
      const slotCenterX = -boxWidth / 2 + wallThick + 0.02 + i * interiorSlotWidth + interiorSlotWidth / 2;
      const c = this.cigarFactory.createCigar(initialVariantId, false);
      c.group.rotation.x = Math.PI / 2; // Lie flat along Z axis
      c.group.position.set(slotCenterX, cigarY, 0);

      // Micro variance in rotation so they look hand-crafted, not copy-pasted
      c.group.rotation.y = (i * 0.45) % Math.PI;

      group.add(c.group);
      interiorCigars.push(c);
    }

    // ── 7. Lid Open/Close Angle Interpolation ───────────────────────────────
    // Rotation around local X axis: 0 is closed, -Math.PI * 0.62 is open (~112 degrees back)
    const maxOpenAngle = -Math.PI * 0.62;
    let currentOpenProgress = 1.0; // Start open by default to showcase interior
    lidPivot.rotation.x = maxOpenAngle * currentOpenProgress;

    const setOpenProgress = (progress: number) => {
      currentOpenProgress = Math.max(0, Math.min(1, progress));
      lidPivot.rotation.x = maxOpenAngle * currentOpenProgress;
    };

    const updateVariant = (variantId: CigarVariantId) => {
      interiorCigars.forEach((c) => c.updateVariant(variantId));
    };

    // ── 8. Safe Disposal ────────────────────────────────────────────────────
    const dispose = () => {
      interiorCigars.forEach((c) => c.dispose());
      shadowGeo.dispose();
      bottomGeo.dispose();
      interiorFloorGeo.dispose();
      frontWallGeo.dispose();
      backWallGeo.dispose();
      sideWallGeo.dispose();
      cedarSideGeo.dispose();
      dividerGeo.dispose();
      trimGeo.dispose();
      lidTopGeo.dispose();
      lidLinerGeo.dispose();
      lidTrimGeo.dispose();
      emblemGeo.dispose();
      emblemRingGeo.dispose();

      mahoganyMaterial.dispose();
      cedarMaterial.dispose();
      brassMaterial.dispose();
      shadowMat.dispose();
    };

    return {
      group,
      lidPivot,
      interiorCigars,
      isOpen: true,
      setOpenProgress,
      updateVariant,
      dispose
    };
  }
}
