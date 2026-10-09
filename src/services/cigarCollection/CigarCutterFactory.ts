// VapeAR Premium Cigar Cutter Factory — Created by Saidarshan.K
// Constructs double-bladed guillotine cutter with brushed stainless steel finish and animated sliding blades

import * as THREE from 'three';

export type CutterState = 'CLOSED' | 'OPEN' | 'ANIMATING';

export interface BuiltCigarCutter {
  group: THREE.Group;
  leftBlade: THREE.Mesh;
  rightBlade: THREE.Mesh;
  state: CutterState;
  setBladeProgress: (progress: number) => void; // 0 = CLOSED, 1 = OPEN
  dispose: () => void;
}

export class CigarCutterFactory {
  createCutter(): BuiltCigarCutter {
    const group = new THREE.Group();
    group.name = 'PremiumCigarCutter';

    // ── 1. Materials Setup ──────────────────────────────────────────────────
    // Brushed Stainless Steel Body
    const steelBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      metalness: 0.94,
      roughness: 0.22
    });

    // Mirror-Polished Surgical Steel Blades
    const surgicalBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f8fc,
      metalness: 0.98,
      roughness: 0.08
    });

    // Gold / Brass Fastener Pins & Accent Trim
    const goldAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.24
    });

    // Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(0.55, 0.65);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.001;
    group.add(shadowMesh);

    // ── 2. Dimensional Constants ────────────────────────────────────────────
    const bodyW = 0.36;
    const bodyH = 0.52;
    const plateThick = 0.016;
    const internalGap = 0.018;
    const apertureRadius = 0.112;

    // ── 3. Outer Guillotine Frame (Front Plate & Rear Plate with Aperture) ───
    // Build plates with central circular hole using Shape with Hole
    const makePlateWithAperture = (): THREE.BufferGeometry => {
      const shape = new THREE.Shape();
      const hw = bodyW / 2;
      const hh = bodyH / 2;
      const radius = 0.06; // Rounded corner radius

      // Rounded rectangle contour
      shape.moveTo(-hw + radius, -hh);
      shape.lineTo(hw - radius, -hh);
      shape.quadraticCurveTo(hw, -hh, hw, -hh + radius);
      shape.lineTo(hw, hh - radius);
      shape.quadraticCurveTo(hw, hh, hw - radius, hh);
      shape.lineTo(-hw + radius, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - radius);
      shape.lineTo(-hw, -hh + radius);
      shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);

      // Central circular hole
      const holePath = new THREE.Path();
      holePath.absarc(0, 0, apertureRadius, 0, Math.PI * 2, true);
      shape.holes.push(holePath);

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: plateThick,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.004,
        bevelThickness: 0.004
      };

      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    };

    const frontPlateGeo = makePlateWithAperture();
    const frontPlate = new THREE.Mesh(frontPlateGeo, steelBodyMaterial);
    frontPlate.position.z = internalGap / 2;
    frontPlate.castShadow = true;
    frontPlate.receiveShadow = true;
    group.add(frontPlate);

    const backPlateGeo = makePlateWithAperture();
    const backPlate = new THREE.Mesh(backPlateGeo, steelBodyMaterial);
    backPlate.position.z = -internalGap / 2 - plateThick;
    backPlate.castShadow = true;
    backPlate.receiveShadow = true;
    group.add(backPlate);

    // Beveled Gold Ring Trim around the central aperture
    const apertureRimGeo = new THREE.TorusGeometry(apertureRadius + 0.006, 0.007, 8, 36);
    const apertureRimFront = new THREE.Mesh(apertureRimGeo, goldAccentMaterial);
    apertureRimFront.position.z = internalGap / 2 + plateThick + 0.005;
    group.add(apertureRimFront);

    const apertureRimBack = new THREE.Mesh(apertureRimGeo, goldAccentMaterial);
    apertureRimBack.position.z = -internalGap / 2 - plateThick - 0.005;
    group.add(apertureRimBack);

    // Corner Fastener Screws / Rivets
    const rivetGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.06, 12);
    const rivetOffsets = [
      [-bodyW / 2 + 0.04, -bodyH / 2 + 0.04],
      [bodyW / 2 - 0.04, -bodyH / 2 + 0.04],
      [-bodyW / 2 + 0.04, bodyH / 2 - 0.04],
      [bodyW / 2 - 0.04, bodyH / 2 - 0.04]
    ];

    for (const [rx, ry] of rivetOffsets) {
      const rivet = new THREE.Mesh(rivetGeo, goldAccentMaterial);
      rivet.rotation.x = Math.PI / 2;
      rivet.position.set(rx, ry, 0);
      group.add(rivet);
    }

    // ── 4. Opposing Dual Guillotine Blades (Sliding on X axis) ───────────────
    // Crescent shape blade with concave cutting edge
    const makeBladeGeometry = (isLeft: boolean): THREE.BufferGeometry => {
      const shape = new THREE.Shape();
      const bw = 0.16;
      const bh = 0.32;

      if (isLeft) {
        shape.moveTo(0, -bh / 2);
        shape.lineTo(bw, -bh / 2);
        shape.lineTo(bw, bh / 2);
        shape.lineTo(0, bh / 2);
        // Concave crescent cutting edge
        shape.absarc(bw, 0, apertureRadius * 1.15, Math.PI * 0.65, Math.PI * 1.35, true);
      } else {
        shape.moveTo(0, -bh / 2);
        shape.lineTo(-bw, -bh / 2);
        shape.lineTo(-bw, bh / 2);
        shape.lineTo(0, bh / 2);
        // Concave crescent cutting edge
        shape.absarc(-bw, 0, apertureRadius * 1.15, -Math.PI * 0.35, Math.PI * 0.35, true);
      }

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        depth: 0.006,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.002,
        bevelThickness: 0.002
      };

      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    };

    const leftBladeGeo = makeBladeGeometry(true);
    const leftBlade = new THREE.Mesh(leftBladeGeo, surgicalBladeMaterial);
    leftBlade.position.z = -0.004;
    group.add(leftBlade);

    const rightBladeGeo = makeBladeGeometry(false);
    const rightBlade = new THREE.Mesh(rightBladeGeo, surgicalBladeMaterial);
    rightBlade.position.z = 0.004;
    group.add(rightBlade);

    // ── 5. Blade Travel State & Progress ────────────────────────────────────
    // Closed position: blades overlap in center
    // Open position: blades retract outwards into the housing
    const closedLeftX = -0.01;
    const openLeftX = -0.145;
    const closedRightX = 0.01;
    const openRightX = 0.145;

    let currentState: CutterState = 'OPEN';

    const setBladeProgress = (progress: number) => {
      const p = Math.max(0, Math.min(1, progress));
      leftBlade.position.x = THREE.MathUtils.lerp(closedLeftX, openLeftX, p);
      rightBlade.position.x = THREE.MathUtils.lerp(closedRightX, openRightX, p);

      if (p <= 0.001) currentState = 'CLOSED';
      else if (p >= 0.999) currentState = 'OPEN';
      else currentState = 'ANIMATING';
    };

    // Default to OPEN state so aperture is clearly visible
    setBladeProgress(1.0);

    // ── 6. Safe Disposal ────────────────────────────────────────────────────
    const dispose = () => {
      frontPlateGeo.dispose();
      backPlateGeo.dispose();
      apertureRimGeo.dispose();
      rivetGeo.dispose();
      leftBladeGeo.dispose();
      rightBladeGeo.dispose();
      shadowGeo.dispose();

      steelBodyMaterial.dispose();
      surgicalBladeMaterial.dispose();
      goldAccentMaterial.dispose();
      shadowMat.dispose();
    };

    return {
      group,
      leftBlade,
      rightBlade,
      get state() {
        return currentState;
      },
      setBladeProgress,
      dispose
    };
  }
}
