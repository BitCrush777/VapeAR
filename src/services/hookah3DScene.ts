import * as THREE from 'three';
import type { AppState, PipePosition, Point2D } from '../types/hookah';
import {
  HOOKAH_SKINS,
  ENVIRONMENT_PRESETS,
  DEFAULT_SKIN_ID,
  DEFAULT_ENVIRONMENT_ID
} from '../config/hookahSkins';

interface WaterBubble {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  y: number;
  speed: number;
  wobbleSpeed: number;
  wobblePhase: number;
  scale: number;
}

export class Hookah3DScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Active custom presets
  private currentSkinId: string = DEFAULT_SKIN_ID;
  private currentEnvironmentId: string = DEFAULT_ENVIRONMENT_ID;

  // Main scene groups
  private hookahGroup: THREE.Group;
  private environmentGroup: THREE.Group;
  private mouthpieceGroup: THREE.Group;

  // Dynamic hose mesh
  private hoseMesh: THREE.Mesh | null = null;
  private hoseMaterial: THREE.MeshStandardMaterial;

  // Premium Materials
  private glassMaterial: THREE.MeshPhysicalMaterial;
  private waterMaterial: THREE.MeshPhysicalMaterial;
  private goldMaterial: THREE.MeshStandardMaterial;
  private brassMaterial: THREE.MeshStandardMaterial;
  private steelMaterial: THREE.MeshStandardMaterial;
  private cobaltMaterial: THREE.MeshPhysicalMaterial;
  private ceramicMaterial: THREE.MeshPhysicalMaterial;
  private coalMaterial: THREE.MeshStandardMaterial;
  private mouthpieceHandleMaterial: THREE.MeshStandardMaterial;
  private mouthpieceHighlightMaterial: THREE.MeshStandardMaterial;

  // Environment & Table Materials
  private tableMarbleMaterial: THREE.MeshPhysicalMaterial;
  private tableTrimMaterial: THREE.MeshStandardMaterial;
  private tablePedestalMaterial: THREE.MeshStandardMaterial;
  private lanternGlassMaterial: THREE.MeshStandardMaterial;
  private lanternFlameMaterial: THREE.MeshStandardMaterial;
  private lanternBronzeMaterial: THREE.MeshStandardMaterial;
  private ambientParticlesMaterial: THREE.PointsMaterial | null = null;

  // Scene Lights
  private ambientLight: THREE.AmbientLight;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private coalGlowLight: THREE.PointLight;
  private lanternLight: THREE.PointLight | null = null;

  // Animated elements
  private waterBubbles: WaterBubble[] = [];
  private coalMeshes: THREE.Mesh[] = [];
  private waterSurfaceMesh: THREE.Mesh | null = null;
  private ambientParticles: THREE.Points | null = null;
  private shadowTexture: THREE.CanvasTexture | null = null;

  // Proportional scale for realistic lounge grounding & framing
  private hookahScale = 0.76;

  // Smoothed 3D positions to eliminate tracking jitter
  private smoothedHookahPos: THREE.Vector3 = new THREE.Vector3();
  private smoothedPipePos: THREE.Vector3 = new THREE.Vector3();
  private posLerp = 0.12;

  private canvasWidth = 1280;
  private canvasHeight = 720;

  constructor(canvas: HTMLCanvasElement) {
    this.canvasWidth = canvas.width || window.innerWidth;
    this.canvasHeight = canvas.height || window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      42,
      this.canvasWidth / this.canvasHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 0, 11);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    // ─── 1. Cinematic Five-Point Lighting Hierarchy ─────────────────────────
    // Ambient light: prevents black surfaces while preserving night lounge depth
    this.ambientLight = new THREE.AmbientLight(0x222634, 1.4);
    this.scene.add(this.ambientLight);

    // Warm Key Light (Upper right front)
    this.keyLight = new THREE.DirectionalLight(0xfff3e0, 2.5);
    this.keyLight.position.set(6, 13, 9);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.bias = -0.001;
    this.scene.add(this.keyLight);

    // Moody Cool Fill Light (Left low angle)
    this.fillLight = new THREE.DirectionalLight(0x6e88b8, 0.85);
    this.fillLight.position.set(-8, 3, 5);
    this.scene.add(this.fillLight);

    // Warm Amber Rim Light (Back-right silhouette separation)
    this.rimLight = new THREE.DirectionalLight(0xffb048, 1.1);
    this.rimLight.position.set(3, -2, -6);
    this.scene.add(this.rimLight);

    // Dynamic Coal Ember Point Light (radiates warm amber glow from top bowl)
    this.coalGlowLight = new THREE.PointLight(0xff4400, 3.4, 4.5);
    this.coalGlowLight.position.set(0, 5.5, 0.2);
    this.scene.add(this.coalGlowLight);

    // ─── 2. Physically Plausible Material Hierarchy (PBR) ───────────────────
    // 24K Royal Warm Gold (high metalness, crisp clear reflections)
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.94,
      roughness: 0.16
    });

    // Antique Architectural Brass (slightly darker, satiny finish)
    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xb58838,
      metalness: 0.88,
      roughness: 0.26
    });

    // Polished Stainless Steel / Chrome (brilliant silver reflections)
    this.steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xdde2ec,
      metalness: 0.96,
      roughness: 0.14
    });

    // Deep Royal Cobalt Enamel (rich translucent clearcoat on deep navy)
    this.cobaltMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0e1b38,
      roughness: 0.22,
      metalness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    });

    // Artisan Bohemian Smoky Glass Base (transmission, refraction, high clearcoat)
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x182a38,
      roughness: 0.1,
      metalness: 0.04,
      transparent: true,
      opacity: 0.84,
      transmission: 0.52,
      ior: 1.52,
      thickness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.78,
      attenuationColor: new THREE.Color(0x0a1c28),
      attenuationDistance: 1.3,
      side: THREE.DoubleSide
    });

    // Pure Water Liquid Body (high clarity, liquid refraction)
    this.waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00bcd4,
      roughness: 0.04,
      metalness: 0.0,
      transparent: true,
      opacity: 0.76,
      transmission: 0.42,
      ior: 1.333,
      clearcoat: 0.9,
      clearcoatRoughness: 0.03
    });

    // Handcrafted Glazed Ceramic Phunnel Bowl (oxblood terracotta with reactive glaze)
    this.ceramicMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4a1810,
      roughness: 0.36,
      metalness: 0.08,
      clearcoat: 0.65,
      clearcoatRoughness: 0.16
    });

    // Natural Coconut Charcoal Embers (dark rough ash exterior with red core emission)
    this.coalMaterial = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.94,
      metalness: 0.05,
      emissive: new THREE.Color(0xff3b00),
      emissiveIntensity: 1.8
    });

    // Flexible Braided Velvet/Silicone Hose
    this.hoseMaterial = new THREE.MeshStandardMaterial({
      color: 0x222225,
      metalness: 0.2,
      roughness: 0.68
    });

    // Mouthpiece Grip
    this.mouthpieceHandleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1815,
      roughness: 0.48,
      metalness: 0.22
    });

    // Mouthpiece Grab Highlight (subtle golden glow when held)
    this.mouthpieceHighlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
      emissive: new THREE.Color(0x554400),
      emissiveIntensity: 0.0
    });

    // Virtual Lounge Table & Props Materials
    this.tableMarbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111318,
      roughness: 0.22,
      metalness: 0.15,
      clearcoat: 0.52,
      clearcoatRoughness: 0.14,
      reflectivity: 0.62
    });

    this.tableTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xb58838,
      metalness: 0.88,
      roughness: 0.26
    });

    this.tablePedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      roughness: 0.65,
      metalness: 0.2
    });

    this.lanternBronzeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2712,
      metalness: 0.85,
      roughness: 0.32
    });

    this.lanternGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.55,
      roughness: 0.35
    });

    this.lanternFlameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: new THREE.Color(0xff6600),
      emissiveIntensity: 2.8
    });

    // Procedural soft shadow map for contact ambient occlusion
    this.shadowTexture = this.createSoftShadowTexture();

    // ─── 3. Construct Artisanal 3D Hookah ───────────────────────────────────
    this.hookahGroup = new THREE.Group();
    this.buildHookah();
    this.hookahGroup.scale.set(this.hookahScale, this.hookahScale, this.hookahScale);
    this.scene.add(this.hookahGroup);

    // ─── 4. Construct Virtual Lounge Environment (Phase 1 Grounding) ────────
    this.environmentGroup = new THREE.Group();
    this.buildLoungeEnvironment();
    this.environmentGroup.scale.set(this.hookahScale, this.hookahScale, this.hookahScale);
    this.scene.add(this.environmentGroup);

    // ─── 5. Atmospheric Lounge Dust Particles ───────────────────────────────
    this.buildAtmosphere();

    // ─── 6. Ergonomic Luxury Mouthpiece ─────────────────────────────────────
    this.mouthpieceGroup = new THREE.Group();
    this.buildMouthpiece();
    this.mouthpieceGroup.scale.set(this.hookahScale, this.hookahScale, this.hookahScale);
    this.scene.add(this.mouthpieceGroup);

    // ─── 7. Initialize Custom Presets (Phase 7) ─────────────────────────────
    this.applySkin(this.currentSkinId);
    this.applyEnvironment(this.currentEnvironmentId);
  }

  private createSoftShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.94)');
      grad.addColorStop(0.32, 'rgba(0, 0, 0, 0.68)');
      grad.addColorStop(0.68, 'rgba(0, 0, 0, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private buildHookah() {
    // ── A. Bohemian Flared Glass Base (Lathe Silhouette) ────────────────────
    // High-end teardrop bell silhouette with double-walled thickness
    const vasePoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),       // Flat center resting at table level y=0
      new THREE.Vector2(0.72, 0.01),      // Grounded foot ring
      new THREE.Vector2(0.85, 0.06),      // Beveled lower base lip
      new THREE.Vector2(1.18, 0.32),      // Flared lower bell
      new THREE.Vector2(1.34, 0.72),      // Widest bell curvature
      new THREE.Vector2(1.26, 1.10),      // Upper belly
      new THREE.Vector2(1.02, 1.50),      // Inward tapering waist
      new THREE.Vector2(0.68, 1.90),      // Graceful shoulder taper
      new THREE.Vector2(0.42, 2.22),      // Neck cylinder base
      new THREE.Vector2(0.38, 2.45),      // Neck top
      new THREE.Vector2(0.46, 2.48),      // Flared glass collar lip
      new THREE.Vector2(0.40, 2.50),      // Inside rim
      new THREE.Vector2(0.32, 2.44),      // Inner neck wall
      new THREE.Vector2(0.34, 2.20),      // Inner neck
      new THREE.Vector2(0.58, 1.88),      // Inner shoulder
      new THREE.Vector2(0.92, 1.48),      // Inner waist
      new THREE.Vector2(1.20, 0.72),      // Inner belly
      new THREE.Vector2(0.70, 0.12),      // Inner base bottom
      new THREE.Vector2(0.0, 0.10)        // Inner bottom center
    ];

    const glassGeo = new THREE.LatheGeometry(vasePoints, 48);
    const glassMesh = new THREE.Mesh(glassGeo, this.glassMaterial);
    glassMesh.castShadow = true;
    glassMesh.receiveShadow = true;
    this.hookahGroup.add(glassMesh);

    // ── B. Liquid Water Body Inside Base ────────────────────────────────────
    // Liquid volume conforming to the inner glass contour with flat surface at y=1.20
    const waterPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.11),
      new THREE.Vector2(0.68, 0.13),
      new THREE.Vector2(1.16, 0.70),
      new THREE.Vector2(1.08, 1.20),
      new THREE.Vector2(0.0, 1.20) // Flat liquid surface
    ];
    const waterGeo = new THREE.LatheGeometry(waterPoints, 36);
    this.waterSurfaceMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    this.hookahGroup.add(this.waterSurfaceMesh);

    // ── C. Water Bubbles Object Pool (Phase 3.4) ─────────────────────────────
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f7fa,
      transparent: true,
      opacity: 0.65,
      roughness: 0.04,
      transmission: 0.85,
      ior: 1.1
    });

    const bubbleGroup = new THREE.Group();
    this.waterBubbles = [];

    // Pre-allocate 18 bubbles to prevent runtime GC allocations
    for (let i = 0; i < 18; i++) {
      const radius = 0.024 + Math.random() * 0.032;
      const bGeo = new THREE.SphereGeometry(radius, 10, 10);
      const bMesh = new THREE.Mesh(bGeo, bubbleMat);

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.45;
      const baseX = Math.cos(angle) * dist;
      const baseZ = Math.sin(angle) * dist;
      const startY = 0.25 + Math.random() * 0.85;

      bMesh.position.set(baseX, startY, baseZ);
      bubbleGroup.add(bMesh);

      this.waterBubbles.push({
        mesh: bMesh,
        baseX,
        baseZ,
        y: startY,
        speed: 0.008 + Math.random() * 0.014,
        wobbleSpeed: 0.005 + Math.random() * 0.008,
        wobblePhase: Math.random() * Math.PI * 2,
        scale: 1.0
      });
    }
    this.hookahGroup.add(bubbleGroup);

    // ── D. Base Decorative Filigree Bands ──────────────────────────────────
    // Bottom Gold Foot Ring
    const footRingGeo = new THREE.TorusGeometry(0.85, 0.04, 12, 48);
    const footRing = new THREE.Mesh(footRingGeo, this.goldMaterial);
    footRing.position.y = 0.04;
    footRing.rotation.x = Math.PI / 2;
    this.hookahGroup.add(footRing);

    // Mid-Vase Inlaid Filigree Gold Band
    const midBandGeo = new THREE.TorusGeometry(1.30, 0.045, 12, 64);
    const midBand = new THREE.Mesh(midBandGeo, this.goldMaterial);
    midBand.position.y = 0.72;
    midBand.rotation.x = Math.PI / 2;
    this.hookahGroup.add(midBand);

    // Neck Flange Gold Collar
    const neckCollarGeo = new THREE.CylinderGeometry(0.38, 0.46, 0.18, 36);
    const neckCollar = new THREE.Mesh(neckCollarGeo, this.goldMaterial);
    neckCollar.position.y = 2.46;
    this.hookahGroup.add(neckCollar);

    // ── E. Artisanal Metal Stem & Purge/Hose Hub (Phase 3.9 & 3.10) ─────────
    const stemGroup = new THREE.Group();

    // 1. Stainless Steel Downstem running into the vase
    const downstemGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.1, 24);
    const downstem = new THREE.Mesh(downstemGeo, this.steelMaterial);
    downstem.position.y = 1.45;
    stemGroup.add(downstem);

    // 2. Lower Turned Brass Orb
    const lowerOrbGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const lowerOrb = new THREE.Mesh(lowerOrbGeo, this.goldMaterial);
    lowerOrb.position.y = 2.85;
    stemGroup.add(lowerOrb);

    const lowerRingGeo = new THREE.TorusGeometry(0.25, 0.03, 10, 36);
    const lowerRing = new THREE.Mesh(lowerRingGeo, this.brassMaterial);
    lowerRing.position.y = 2.85;
    lowerRing.rotation.x = Math.PI / 2;
    stemGroup.add(lowerRing);

    // 3. Cobalt Enamel Barrel 1 (Lower Shaft)
    const barrel1Geo = new THREE.CylinderGeometry(0.21, 0.21, 0.62, 32);
    const barrel1 = new THREE.Mesh(barrel1Geo, this.cobaltMaterial);
    barrel1.position.y = 3.32;
    stemGroup.add(barrel1);

    stemGroup.add(this.makeStemRing(0.225, this.goldMaterial, 3.02));
    stemGroup.add(this.makeStemRing(0.225, this.goldMaterial, 3.62));

    // 4. Central Mechanical Hub (Hose Port & Purge Valve)
    const hubGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.44, 32);
    const hub = new THREE.Mesh(hubGeo, this.brassMaterial);
    hub.position.y = 4.05;
    stemGroup.add(hub);

    // Hose Port (Angled right for natural connection to hose)
    const portGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.46, 20);
    const portMesh = new THREE.Mesh(portGeo, this.goldMaterial);
    portMesh.rotation.z = -Math.PI / 2.6;
    portMesh.position.set(0.28, 4.12, 0.05);
    stemGroup.add(portMesh);

    const portThreadGeo = new THREE.TorusGeometry(0.11, 0.025, 8, 24);
    const portThread = new THREE.Mesh(portThreadGeo, this.brassMaterial);
    portThread.position.set(0.36, 4.16, 0.05);
    portThread.rotation.y = Math.PI / 2;
    stemGroup.add(portThread);

    // Traditional Purge Valve (Angled left with chrome ball valve housing)
    const purgeGeo = new THREE.CylinderGeometry(0.08, 0.10, 0.32, 16);
    const purgeMesh = new THREE.Mesh(purgeGeo, this.brassMaterial);
    purgeMesh.rotation.z = Math.PI / 2.6;
    purgeMesh.position.set(-0.25, 4.08, 0);
    stemGroup.add(purgeMesh);

    const purgeCapGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const purgeCap = new THREE.Mesh(purgeCapGeo, this.steelMaterial);
    purgeCap.position.set(-0.35, 4.12, 0);
    stemGroup.add(purgeCap);

    // 5. Upper Turned Brass Orb
    const upperOrbGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const upperOrb = new THREE.Mesh(upperOrbGeo, this.goldMaterial);
    upperOrb.position.y = 4.45;
    stemGroup.add(upperOrb);

    // 6. Cobalt Enamel Barrel 2 (Upper Shaft)
    const barrel2Geo = new THREE.CylinderGeometry(0.19, 0.19, 0.55, 32);
    const barrel2 = new THREE.Mesh(barrel2Geo, this.cobaltMaterial);
    barrel2.position.y = 4.90;
    stemGroup.add(barrel2);

    stemGroup.add(this.makeStemRing(0.205, this.goldMaterial, 4.64));
    stemGroup.add(this.makeStemRing(0.205, this.goldMaterial, 5.16));

    // 7. Fluted Upper Stem Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.38, 24);
    const pillar = new THREE.Mesh(pillarGeo, this.brassMaterial);
    pillar.position.y = 5.36;
    stemGroup.add(pillar);

    this.hookahGroup.add(stemGroup);

    // ── F. Charcoal Ash Tray with Drop-Well (Phase 3.8) ─────────────────────
    const trayGroup = new THREE.Group();
    trayGroup.position.y = 5.58;

    // Sunken Main Tray Basin
    const trayGeo = new THREE.CylinderGeometry(1.22, 1.15, 0.08, 64);
    const trayMesh = new THREE.Mesh(trayGeo, this.brassMaterial);
    trayMesh.castShadow = true;
    trayGroup.add(trayMesh);

    // Raised Beveled Gold Outer Rim
    const trayRimGeo = new THREE.TorusGeometry(1.21, 0.055, 12, 64);
    const trayRim = new THREE.Mesh(trayRimGeo, this.goldMaterial);
    trayRim.position.y = 0.04;
    trayRim.rotation.x = Math.PI / 2;
    trayGroup.add(trayRim);

    // Inner Concentric Grate Rib
    const innerGrateGeo = new THREE.TorusGeometry(0.68, 0.025, 8, 48);
    const innerGrate = new THREE.Mesh(innerGrateGeo, this.goldMaterial);
    innerGrate.position.y = 0.045;
    innerGrate.rotation.x = Math.PI / 2;
    trayGroup.add(innerGrate);

    this.hookahGroup.add(trayGroup);

    // ── G. Glazed Ceramic Phunnel Bowl (Phase 3.6) ──────────────────────────
    // Authentic phunnel shape with wide flared head and raised central spire
    const bowlPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.18, 0.03),      // Lower grommet base
      new THREE.Vector2(0.26, 0.28),      // Stem curve
      new THREE.Vector2(0.46, 0.58),      // Flared outer head
      new THREE.Vector2(0.48, 0.72),      // Top outer rim lip
      new THREE.Vector2(0.44, 0.74),      // Inner rim edge
      new THREE.Vector2(0.24, 0.58),      // Bowl basin floor
      new THREE.Vector2(0.16, 0.68),      // Raised central spire peak
      new THREE.Vector2(0.08, 0.68),      // Spire opening edge
      new THREE.Vector2(0.07, 0.0)        // Inner down-hole
    ];
    const bowlGeo = new THREE.LatheGeometry(bowlPoints, 40);
    const bowlMesh = new THREE.Mesh(bowlGeo, this.ceramicMaterial);
    bowlMesh.position.y = 5.64;
    bowlMesh.castShadow = true;
    this.hookahGroup.add(bowlMesh);

    // ── H. Natural Coconut Charcoal Embers (Phase 3.7) ──────────────────────
    // 3 realistically positioned natural charcoal cubes in the bowl
    this.coalMeshes = [];
    const coalPositions = [
      { pos: new THREE.Vector3(-0.12, 6.48, 0.06), rot: new THREE.Euler(0.2, 0.4, 0.1) },
      { pos: new THREE.Vector3(0.15, 6.49, -0.05), rot: new THREE.Euler(-0.3, 0.2, 0.25) },
      { pos: new THREE.Vector3(0.02, 6.56, 0.12), rot: new THREE.Euler(0.1, -0.5, 0.3) }
    ];

    for (let i = 0; i < coalPositions.length; i++) {
      const cGeo = new THREE.BoxGeometry(0.24, 0.22, 0.24);
      const cMesh = new THREE.Mesh(cGeo, this.coalMaterial);
      cMesh.position.copy(coalPositions[i].pos);
      cMesh.rotation.copy(coalPositions[i].rot);
      cMesh.castShadow = true;
      this.hookahGroup.add(cMesh);
      this.coalMeshes.push(cMesh);
    }
  }

  private makeStemRing(radius: number, mat: THREE.Material, y: number): THREE.Mesh {
    const geo = new THREE.TorusGeometry(radius, 0.032, 10, 48);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = y;
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  private buildLoungeEnvironment() {
    // ── A. Nero Marquina Dark Marble Platform (Top surface at y = 0.0) ──────
    const tableGroup = new THREE.Group();

    // Main Nero Marquina Dark Marble Slab (top surface sits flush at y = 0.0)
    const slabGeo = new THREE.BoxGeometry(5.4, 0.26, 3.0);
    const slabMesh = new THREE.Mesh(slabGeo, this.tableMarbleMaterial);
    slabMesh.position.y = -0.13; // Top surface sits precisely at y = 0
    slabMesh.receiveShadow = true;
    tableGroup.add(slabMesh);

    // Beveled Champagne Brass Lower Trim
    const trimGeo = new THREE.BoxGeometry(5.52, 0.05, 3.12);
    const trimMesh = new THREE.Mesh(trimGeo, this.tableTrimMaterial);
    trimMesh.position.y = -0.235;
    tableGroup.add(trimMesh);

    // Fluted Dark Plinth Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.42, 32);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, this.tablePedestalMaterial);
    pedestalMesh.position.y = -0.47;
    tableGroup.add(pedestalMesh);

    // Contact Soft Shadow beneath Hookah Base
    if (this.shadowTexture) {
      const hookahShadowGeo = new THREE.PlaneGeometry(2.3, 2.3);
      const hookahShadowMat = new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.88,
        depthWrite: false
      });
      const hookahShadow = new THREE.Mesh(hookahShadowGeo, hookahShadowMat);
      hookahShadow.rotation.x = -Math.PI / 2;
      hookahShadow.position.set(0, 0.002, 0);
      tableGroup.add(hookahShadow);
    }

    this.environmentGroup.add(tableGroup);

    // ── B. Turkish Tulip Tea Glass with Saucer (Right Table Area) ───────────
    const teaGroup = new THREE.Group();
    teaGroup.position.set(1.4, 0, 0.35);

    if (this.shadowTexture) {
      const teaShadowGeo = new THREE.PlaneGeometry(0.85, 0.85);
      const teaShadowMat = new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false
      });
      const teaShadow = new THREE.Mesh(teaShadowGeo, teaShadowMat);
      teaShadow.rotation.x = -Math.PI / 2;
      teaShadow.position.y = 0.002;
      teaGroup.add(teaShadow);
    }

    // Gold Saucer
    const saucerGeo = new THREE.CylinderGeometry(0.42, 0.38, 0.025, 32);
    const saucerMesh = new THREE.Mesh(saucerGeo, this.goldMaterial);
    saucerMesh.position.y = 0.013;
    saucerMesh.castShadow = true;
    teaGroup.add(saucerMesh);

    // Tulip Glass
    const glassPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.16, 0.01),
      new THREE.Vector2(0.17, 0.08),
      new THREE.Vector2(0.12, 0.28),
      new THREE.Vector2(0.13, 0.38),
      new THREE.Vector2(0.19, 0.55),
      new THREE.Vector2(0.18, 0.56),
      new THREE.Vector2(0.11, 0.28),
      new THREE.Vector2(0.15, 0.05),
      new THREE.Vector2(0.0, 0.02)
    ];
    const tGlassGeo = new THREE.LatheGeometry(glassPoints, 32);
    const tGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.08,
      transmission: 0.65,
      ior: 1.5
    });
    const tGlassMesh = new THREE.Mesh(tGlassGeo, tGlassMat);
    tGlassMesh.position.y = 0.025;
    tGlassMesh.castShadow = true;
    teaGroup.add(tGlassMesh);

    // Spiced Dark Amber Tea Liquid
    const teaLiquidGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.36, 20);
    const teaLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x6e1f02,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
    });
    const teaLiquid = new THREE.Mesh(teaLiquidGeo, teaLiquidMat);
    teaLiquid.position.y = 0.21;
    teaGroup.add(teaLiquid);

    // Gold Rim Ring
    const teaRimGeo = new THREE.TorusGeometry(0.185, 0.015, 8, 32);
    const teaRim = new THREE.Mesh(teaRimGeo, this.goldMaterial);
    teaRim.position.y = 0.575;
    teaRim.rotation.x = Math.PI / 2;
    teaGroup.add(teaRim);

    this.environmentGroup.add(teaGroup);

    // ── C. Ambient Moroccan Lantern (Left-Rear Table Area) ──────────────────
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(-1.45, 0, -0.32);

    if (this.shadowTexture) {
      const lanternShadowGeo = new THREE.PlaneGeometry(0.9, 0.9);
      const lanternShadowMat = new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });
      const lanternShadow = new THREE.Mesh(lanternShadowGeo, lanternShadowMat);
      lanternShadow.rotation.x = -Math.PI / 2;
      lanternShadow.position.y = 0.002;
      lanternGroup.add(lanternShadow);
    }

    const lBaseGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.06, 16);
    const lBase = new THREE.Mesh(lBaseGeo, this.lanternBronzeMaterial);
    lBase.position.y = 0.03;
    lanternGroup.add(lBase);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const strutGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.58, 8);
      const strut = new THREE.Mesh(strutGeo, this.lanternBronzeMaterial);
      strut.position.set(Math.cos(angle) * 0.28, 0.35, Math.sin(angle) * 0.28);
      lanternGroup.add(strut);
    }

    const domeGeo = new THREE.ConeGeometry(0.34, 0.22, 16);
    const dome = new THREE.Mesh(domeGeo, this.lanternBronzeMaterial);
    dome.position.y = 0.72;
    lanternGroup.add(dome);

    const lRingGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16);
    const lRing = new THREE.Mesh(lRingGeo, this.goldMaterial);
    lRing.position.y = 0.86;
    lanternGroup.add(lRing);

    const lGlassGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.54, 20);
    const lGlass = new THREE.Mesh(lGlassGeo, this.lanternGlassMaterial);
    lGlass.position.y = 0.35;
    lanternGroup.add(lGlass);

    const flameGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const flame = new THREE.Mesh(flameGeo, this.lanternFlameMaterial);
    flame.position.y = 0.25;
    lanternGroup.add(flame);

    this.lanternLight = new THREE.PointLight(0xff7722, 1.2, 3.2);
    this.lanternLight.position.set(-1.45, 0.35, -0.32);
    this.environmentGroup.add(this.lanternLight);

    this.environmentGroup.add(lanternGroup);

    // ── D. Hammered Brass Aroma Bowl (Front-Left Table Area) ────────────────
    const bowlGroup = new THREE.Group();
    bowlGroup.position.set(-0.85, 0, 0.65);

    if (this.shadowTexture) {
      const bShadowGeo = new THREE.PlaneGeometry(0.8, 0.8);
      const bShadowMat = new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });
      const bShadow = new THREE.Mesh(bShadowGeo, bShadowMat);
      bShadow.rotation.x = -Math.PI / 2;
      bShadow.position.y = 0.002;
      bowlGroup.add(bShadow);
    }

    const bMeshGeo = new THREE.CylinderGeometry(0.38, 0.22, 0.12, 24);
    const bMesh = new THREE.Mesh(bMeshGeo, this.brassMaterial);
    bMesh.position.y = 0.06;
    bMesh.castShadow = true;
    bowlGroup.add(bMesh);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const amberCrystalMat = new THREE.MeshStandardMaterial({ color: 0xa04000, roughness: 0.2, metalness: 0.3 });

    const stone1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 0), stoneMat);
    stone1.position.set(-0.06, 0.11, 0.02);
    const stone2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05, 0), amberCrystalMat);
    stone2.position.set(0.07, 0.1, -0.04);
    const stone3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045, 0), stoneMat);
    stone3.position.set(0.02, 0.11, 0.08);

    bowlGroup.add(stone1, stone2, stone3);
    this.environmentGroup.add(bowlGroup);

    // ── E. Velvet Succulent in Ceramic Pot (Back-Left Table Area) ───────────
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-1.75, 0, -0.65);

    if (this.shadowTexture) {
      const pShadowGeo = new THREE.PlaneGeometry(0.7, 0.7);
      const pShadowMat = new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      });
      const pShadow = new THREE.Mesh(pShadowGeo, pShadowMat);
      pShadow.rotation.x = -Math.PI / 2;
      pShadow.position.y = 0.002;
      plantGroup.add(pShadow);
    }

    const potGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.28, 20);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.75, metalness: 0.1 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.14;
    pot.castShadow = true;
    plantGroup.add(pot);

    const soilGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x140e08, roughness: 0.9 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.27;
    plantGroup.add(soil);

    const leafGeo = new THREE.ConeGeometry(0.07, 0.20, 5);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.55 });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 0.08, 0.33, Math.sin(angle) * 0.08);
      leaf.rotation.z = Math.cos(angle) * 0.45;
      leaf.rotation.x = -Math.sin(angle) * 0.45;
      plantGroup.add(leaf);
    }

    this.environmentGroup.add(plantGroup);
  }

  private buildAtmosphere() {
    const particleCount = 28;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 5.5;
      posArray[i * 3 + 1] = Math.random() * 4.2;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    this.ambientParticlesMaterial = new THREE.PointsMaterial({
      color: 0xffd580,
      size: 0.05,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.ambientParticles = new THREE.Points(particleGeo, this.ambientParticlesMaterial);
    this.scene.add(this.ambientParticles);
  }

  private buildMouthpiece() {
    // Ergonomic wand mouthpiece compatible with PipePosition coordinate system
    // 1. Contoured ebony grip
    const gripGeo = new THREE.CylinderGeometry(0.065, 0.08, 1.1, 24);
    const gripMesh = new THREE.Mesh(gripGeo, this.mouthpieceHandleMaterial);
    gripMesh.rotation.z = Math.PI / 2;
    this.mouthpieceGroup.add(gripMesh);

    // 2. Brass accent rings
    for (let i = 0; i < 4; i++) {
      const gRingGeo = new THREE.TorusGeometry(0.082, 0.02, 8, 24);
      const gRing = new THREE.Mesh(gRingGeo, this.mouthpieceHighlightMaterial);
      gRing.rotation.y = Math.PI / 2;
      gRing.position.x = -0.32 + i * 0.20;
      this.mouthpieceGroup.add(gRing);
    }

    // 3. Tapered Gold Inhaling Tip
    const tipGeo = new THREE.ConeGeometry(0.055, 0.48, 24);
    const tip = new THREE.Mesh(tipGeo, this.goldMaterial);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 0.76;
    this.mouthpieceGroup.add(tip);

    // 4. Rear Brass Ferrule Hose Coupling
    const rearFerruleGeo = new THREE.CylinderGeometry(0.082, 0.07, 0.16, 20);
    const rearFerrule = new THREE.Mesh(rearFerruleGeo, this.brassMaterial);
    rearFerrule.rotation.z = Math.PI / 2;
    rearFerrule.position.x = -0.62;
    this.mouthpieceGroup.add(rearFerrule);
  }

  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (width < 768) {
      this.environmentGroup.scale.set(
        this.hookahScale * 0.86,
        this.hookahScale,
        this.hookahScale * 0.86
      );
    } else {
      this.environmentGroup.scale.set(
        this.hookahScale,
        this.hookahScale,
        this.hookahScale
      );
    }
  }

  private screenToWorld(screenX: number, screenY: number, targetZ = 0): THREE.Vector3 {
    const ndcX = (screenX / this.canvasWidth) * 2 - 1;
    const ndcY = -(screenY / this.canvasHeight) * 2 + 1;
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
    vec.unproject(this.camera);
    const dir = vec.sub(this.camera.position).normalize();
    const distance = (targetZ - this.camera.position.z) / dir.z;
    return this.camera.position.clone().add(dir.multiplyScalar(distance));
  }

  update(
    base2DPos: Point2D,
    pipePos: PipePosition,
    appState: AppState,
    timestampMs: number
  ) {
    // ── 1. Smooth hookah base position & grounding ──────────────────────────
    const targetHookahPos = this.screenToWorld(base2DPos.x, base2DPos.y, 0);

    // Grounding: vase bottom meets table slab at y = 0.0
    this.smoothedHookahPos.lerp(targetHookahPos, this.posLerp);

    this.hookahGroup.position.copy(this.smoothedHookahPos);
    this.environmentGroup.position.copy(this.smoothedHookahPos);

    // ── 2. Smooth mouthpiece position & angle ───────────────────────────────
    const targetPipePos = this.screenToWorld(pipePos.x, pipePos.y, 0.5);
    this.smoothedPipePos.lerp(targetPipePos, pipePos.isHeld ? 0.28 : 0.10);
    this.mouthpieceGroup.position.copy(this.smoothedPipePos);
    this.mouthpieceGroup.rotation.z = pipePos.angle || -Math.PI / 4;

    // Subtle tactile highlight on mouthpiece when grabbed
    const targetHighlight = pipePos.isHeld ? 0.35 : 0.0;
    this.mouthpieceHighlightMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      this.mouthpieceHighlightMaterial.emissiveIntensity,
      targetHighlight,
      0.15
    );

    // ── 3. Rebuild flexible braided hose curve ──────────────────────────────
    const s = this.hookahScale;
    const hosePort = this.smoothedHookahPos.clone().add(new THREE.Vector3(0.28 * s, 4.12 * s, 0.05 * s));
    const mouthEnd = this.smoothedPipePos.clone();

    // Cubic Bezier gravity sag curve
    const segLen = hosePort.distanceTo(mouthEnd);
    const cp1 = hosePort.clone().add(new THREE.Vector3(0.55 * s, -segLen * 0.35, 0));
    const cp2 = mouthEnd.clone().add(new THREE.Vector3(-0.35 * s, -segLen * 0.4, 0));

    const curve = new THREE.CubicBezierCurve3(hosePort, cp1, cp2, mouthEnd);

    if (this.hoseMesh) {
      this.scene.remove(this.hoseMesh);
      this.hoseMesh.geometry.dispose();
    }

    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.056 * s, 12, false);
    this.hoseMesh = new THREE.Mesh(tubeGeo, this.hoseMaterial);
    this.hoseMesh.castShadow = true;
    this.scene.add(this.hoseMesh);

    // ── 4. Dynamic Water Bubbles (Phase 3.4) ─────────────────────────────────
    const isSipping = appState === 'SIP_DETECTED' || appState === 'PIPE_AT_MOUTH';
    const isVapour = appState === 'VAPOUR';
    const bubbleSpeedMultiplier = appState === 'SIP_DETECTED' ? 2.8 : (appState === 'PIPE_AT_MOUTH' ? 1.6 : 0.35);

    for (let i = 0; i < this.waterBubbles.length; i++) {
      const b = this.waterBubbles[i];
      b.y += b.speed * bubbleSpeedMultiplier;

      // Slight wobble
      const wobble = Math.sin(timestampMs * b.wobbleSpeed + b.wobblePhase) * 0.02;
      b.mesh.position.x = b.baseX + wobble;
      b.mesh.position.z = b.baseZ + wobble;
      b.mesh.position.y = b.y;

      // Bubble reaches water surface at y = 1.18: reset to bottom
      if (b.y > 1.18) {
        b.y = 0.22 + Math.random() * 0.12;
        b.baseX = (Math.random() - 0.5) * 0.65;
        b.baseZ = (Math.random() - 0.5) * 0.65;
      }

      // Smooth opacity fade near water surface
      const opacityFactor = b.y > 0.95 ? Math.max(0, (1.18 - b.y) / 0.23) : 1.0;
      (b.mesh.material as THREE.MeshPhysicalMaterial).opacity =
        (isSipping ? 0.75 : 0.35) * opacityFactor;
    }

    // ── 5. Animate Embers & Localized Lighting (Phase 3.7 & 3.15) ────────────
    const baseEmissive = isSipping ? (appState === 'SIP_DETECTED' ? 4.6 : 2.8) : (isVapour ? 3.0 : 1.8);
    const emberPulse = baseEmissive + Math.sin(timestampMs * 0.008) * (isSipping ? 1.1 : 0.35);
    this.coalMaterial.emissiveIntensity = emberPulse;

    if (this.coalGlowLight) {
      const lightIntensity = (isSipping ? (appState === 'SIP_DETECTED' ? 5.2 : 3.8) : 2.6) +
        Math.sin(timestampMs * 0.008) * 0.4;
      this.coalGlowLight.intensity = lightIntensity;
      this.coalGlowLight.position.copy(this.smoothedHookahPos).add(new THREE.Vector3(0, 6.5 * s, 0.15 * s));
    }

    if (this.lanternLight) {
      this.lanternLight.intensity =
        1.15 + Math.sin(timestampMs * 0.006) * 0.12 + Math.cos(timestampMs * 0.017) * 0.06;
    }

    // Gentle ambient dust particle drift
    if (this.ambientParticles) {
      const positions = this.ambientParticles.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.0025;
        positions[i * 3] += Math.sin(timestampMs * 0.001 + i) * 0.0012;
        if (positions[i * 3 + 1] > 4.5) {
          positions[i * 3 + 1] = 0.1;
        }
      }
      this.ambientParticles.geometry.attributes.position.needsUpdate = true;
    }

    // ── 6. Render Frame ─────────────────────────────────────────────────────
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Apply a visual skin to the hookah without rebuilding meshes or restarting the scene (Phase 7)
   */
  applySkin(skinId: string): boolean {
    const config = HOOKAH_SKINS[skinId];
    if (!config) {
      console.warn(`[Hookah3DScene] Unknown skin id: ${skinId}`);
      return false;
    }
    this.currentSkinId = skinId;
    const m = config.materials;

    // Glass Base
    this.glassMaterial.color.setHex(m.glass.color);
    this.glassMaterial.roughness = m.glass.roughness;
    this.glassMaterial.metalness = m.glass.metalness;
    this.glassMaterial.transmission = m.glass.transmission;
    this.glassMaterial.opacity = m.glass.opacity;
    this.glassMaterial.clearcoat = m.glass.clearcoat;
    this.glassMaterial.clearcoatRoughness = m.glass.clearcoatRoughness;
    this.glassMaterial.attenuationColor.setHex(m.glass.attenuationColor);
    this.glassMaterial.attenuationDistance = m.glass.attenuationDistance;
    this.glassMaterial.needsUpdate = true;

    // Water Liquid Body
    this.waterMaterial.color.setHex(m.water.color);
    this.waterMaterial.roughness = m.water.roughness;
    this.waterMaterial.transmission = m.water.transmission;
    this.waterMaterial.opacity = m.water.opacity;
    this.waterMaterial.clearcoat = m.water.clearcoat;
    this.waterMaterial.needsUpdate = true;

    // Primary Metal (Shaft, Tray Rim, Bands, Inhale Tip)
    this.goldMaterial.color.setHex(m.primaryMetal.color);
    this.goldMaterial.metalness = m.primaryMetal.metalness;
    this.goldMaterial.roughness = m.primaryMetal.roughness;
    this.goldMaterial.needsUpdate = true;

    // Secondary Metal (Hub, Purge, Pillar, Tray Basin)
    this.brassMaterial.color.setHex(m.secondaryMetal.color);
    this.brassMaterial.metalness = m.secondaryMetal.metalness;
    this.brassMaterial.roughness = m.secondaryMetal.roughness;
    this.brassMaterial.needsUpdate = true;

    // Accent Metal (Downstem, Purge Ball)
    this.steelMaterial.color.setHex(m.accentMetal.color);
    this.steelMaterial.metalness = m.accentMetal.metalness;
    this.steelMaterial.roughness = m.accentMetal.roughness;
    this.steelMaterial.needsUpdate = true;

    // Stem Enamel Barrels
    this.cobaltMaterial.color.setHex(m.stemEnamel.color);
    this.cobaltMaterial.roughness = m.stemEnamel.roughness;
    this.cobaltMaterial.metalness = m.stemEnamel.metalness;
    this.cobaltMaterial.clearcoat = m.stemEnamel.clearcoat;
    this.cobaltMaterial.clearcoatRoughness = m.stemEnamel.clearcoatRoughness;
    this.cobaltMaterial.needsUpdate = true;

    // Phunnel Ceramic Bowl
    this.ceramicMaterial.color.setHex(m.ceramicBowl.color);
    this.ceramicMaterial.roughness = m.ceramicBowl.roughness;
    this.ceramicMaterial.metalness = m.ceramicBowl.metalness;
    this.ceramicMaterial.clearcoat = m.ceramicBowl.clearcoat;
    this.ceramicMaterial.clearcoatRoughness = m.ceramicBowl.clearcoatRoughness;
    this.ceramicMaterial.needsUpdate = true;

    // Coconut Coals & Glow Point Light
    this.coalMaterial.color.setHex(m.coals.color);
    this.coalMaterial.emissive.setHex(m.coals.emissive);
    this.coalMaterial.needsUpdate = true;
    if (this.coalGlowLight) {
      this.coalGlowLight.color.setHex(m.coals.glowLightColor);
    }

    // Hose & Mouthpiece
    this.hoseMaterial.color.setHex(m.hose.color);
    this.hoseMaterial.roughness = m.hose.roughness;
    this.hoseMaterial.metalness = m.hose.metalness;
    this.hoseMaterial.needsUpdate = true;

    this.mouthpieceHandleMaterial.color.setHex(m.mouthpieceHandle.color);
    this.mouthpieceHandleMaterial.roughness = m.mouthpieceHandle.roughness;
    this.mouthpieceHandleMaterial.metalness = m.mouthpieceHandle.metalness;
    this.mouthpieceHandleMaterial.needsUpdate = true;

    this.mouthpieceHighlightMaterial.color.setHex(m.mouthpieceHighlight.color);
    this.mouthpieceHighlightMaterial.emissive.setHex(m.mouthpieceHighlight.emissive);
    this.mouthpieceHighlightMaterial.needsUpdate = true;

    return true;
  }

  /**
   * Apply an environment preset to the virtual table and lighting hierarchy (Phase 7)
   */
  applyEnvironment(envId: string): boolean {
    const config = ENVIRONMENT_PRESETS[envId];
    if (!config) {
      console.warn(`[Hookah3DScene] Unknown environment preset id: ${envId}`);
      return false;
    }
    this.currentEnvironmentId = envId;

    // Cinematic Lights
    if (this.ambientLight) {
      this.ambientLight.color.setHex(config.lighting.ambient.color);
      this.ambientLight.intensity = config.lighting.ambient.intensity;
    }
    if (this.keyLight) {
      this.keyLight.color.setHex(config.lighting.key.color);
      this.keyLight.intensity = config.lighting.key.intensity;
    }
    if (this.fillLight) {
      this.fillLight.color.setHex(config.lighting.fill.color);
      this.fillLight.intensity = config.lighting.fill.intensity;
    }
    if (this.rimLight) {
      this.rimLight.color.setHex(config.lighting.rim.color);
      this.rimLight.intensity = config.lighting.rim.intensity;
    }

    // Virtual Lounge Table & Pedestal
    if (this.tableMarbleMaterial) {
      this.tableMarbleMaterial.color.setHex(config.table.marbleColor);
      this.tableMarbleMaterial.roughness = config.table.marbleRoughness;
      this.tableMarbleMaterial.metalness = config.table.marbleMetalness;
      this.tableMarbleMaterial.clearcoat = config.table.marbleClearcoat;
      this.tableMarbleMaterial.needsUpdate = true;
    }
    if (this.tableTrimMaterial) {
      this.tableTrimMaterial.color.setHex(config.table.trimColor);
      this.tableTrimMaterial.needsUpdate = true;
    }
    if (this.tablePedestalMaterial) {
      this.tablePedestalMaterial.color.setHex(config.table.pedestalColor);
      this.tablePedestalMaterial.needsUpdate = true;
    }

    // Moroccan Lantern
    if (this.lanternLight) {
      this.lanternLight.color.setHex(config.lantern.lightColor);
      this.lanternLight.intensity = config.lantern.lightIntensity;
    }
    if (this.lanternGlassMaterial) {
      this.lanternGlassMaterial.color.setHex(config.lantern.glassColor);
      this.lanternGlassMaterial.needsUpdate = true;
    }
    if (this.lanternFlameMaterial) {
      this.lanternFlameMaterial.color.setHex(config.lantern.flameColor);
      this.lanternFlameMaterial.emissive.setHex(config.lantern.flameEmissive);
      this.lanternFlameMaterial.needsUpdate = true;
    }

    // Ambient Dust Particles
    if (this.ambientParticlesMaterial) {
      this.ambientParticlesMaterial.color.setHex(config.dustParticles.color);
      this.ambientParticlesMaterial.needsUpdate = true;
    }

    return true;
  }

  getActiveSkinId(): string {
    return this.currentSkinId;
  }

  getActiveEnvironmentId(): string {
    return this.currentEnvironmentId;
  }

  destroy() {
    if (this.shadowTexture) {
      this.shadowTexture.dispose();
      this.shadowTexture = null;
    }

    if (this.hoseMesh) {
      this.scene.remove(this.hoseMesh);
      this.hoseMesh.geometry.dispose();
      this.hoseMesh = null;
    }

    // Dispose all meshes, geometries, and materials
    this.scene.traverse((object) => {
      if ((object as THREE.Mesh).geometry) {
        (object as THREE.Mesh).geometry.dispose();
      }
      if ((object as THREE.Mesh).material) {
        const mat = (object as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}
