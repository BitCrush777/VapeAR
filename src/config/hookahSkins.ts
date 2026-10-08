// VapeAR Skins & Environment Presets Configuration — Created by Saidarshan.K
// Phase 7: Data-driven visual customization for VapeAR Lounge

export interface HookahSkinMaterialConfig {
  glass: {
    color: number;
    roughness: number;
    metalness: number;
    transmission: number;
    opacity: number;
    clearcoat: number;
    clearcoatRoughness: number;
    attenuationColor: number;
    attenuationDistance: number;
  };
  water: {
    color: number;
    roughness: number;
    transmission: number;
    opacity: number;
    clearcoat: number;
  };
  primaryMetal: {
    color: number;
    metalness: number;
    roughness: number;
  };
  secondaryMetal: {
    color: number;
    metalness: number;
    roughness: number;
  };
  accentMetal: {
    color: number;
    metalness: number;
    roughness: number;
  };
  stemEnamel: {
    color: number;
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness: number;
  };
  ceramicBowl: {
    color: number;
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness: number;
  };
  coals: {
    color: number;
    emissive: number;
    glowLightColor: number;
    glowIntensity: number;
  };
  hose: {
    color: number;
    roughness: number;
    metalness: number;
  };
  mouthpieceHandle: {
    color: number;
    roughness: number;
    metalness: number;
  };
  mouthpieceHighlight: {
    color: number;
    emissive: number;
  };
}

export interface HookahSkinConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  previewColors: string[];
  materials: HookahSkinMaterialConfig;
}

export interface EnvironmentPresetConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  previewColors: string[];
  lighting: {
    ambient: {
      color: number;
      intensity: number;
    };
    key: {
      color: number;
      intensity: number;
    };
    fill: {
      color: number;
      intensity: number;
    };
    rim: {
      color: number;
      intensity: number;
    };
  };
  table: {
    marbleColor: number;
    marbleRoughness: number;
    marbleMetalness: number;
    marbleClearcoat: number;
    trimColor: number;
    pedestalColor: number;
  };
  lantern: {
    flameColor: number;
    flameEmissive: number;
    lightColor: number;
    lightIntensity: number;
    glassColor: number;
  };
  dustParticles: {
    color: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 PREMIUM HOOKAH SKINS
// ─────────────────────────────────────────────────────────────────────────────

export const HOOKAH_SKINS: Record<string, HookahSkinConfig> = {
  'royal-gold': {
    id: 'royal-gold',
    name: 'Royal Gold',
    subtitle: 'Classic 24K Luxury',
    description: 'Polished 24K gold stem, deep cobalt enamel, handcrafted terracotta phunnel bowl, and smoky artisan glass.',
    previewColors: ['#d4af37', '#0e1b38', '#00bcd4', '#4a1810'],
    materials: {
      glass: {
        color: 0x182a38,
        roughness: 0.1,
        metalness: 0.04,
        transmission: 0.52,
        opacity: 0.84,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        attenuationColor: 0x0a1c28,
        attenuationDistance: 1.3
      },
      water: {
        color: 0x00bcd4,
        roughness: 0.04,
        transmission: 0.42,
        opacity: 0.76,
        clearcoat: 0.9
      },
      primaryMetal: {
        color: 0xd4af37,
        metalness: 0.94,
        roughness: 0.16
      },
      secondaryMetal: {
        color: 0xb58838,
        metalness: 0.88,
        roughness: 0.26
      },
      accentMetal: {
        color: 0xdde2ec,
        metalness: 0.96,
        roughness: 0.14
      },
      stemEnamel: {
        color: 0x0e1b38,
        roughness: 0.22,
        metalness: 0.2,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1
      },
      ceramicBowl: {
        color: 0x4a1810,
        roughness: 0.36,
        metalness: 0.08,
        clearcoat: 0.65,
        clearcoatRoughness: 0.16
      },
      coals: {
        color: 0x151515,
        emissive: 0xff3b00,
        glowLightColor: 0xff4400,
        glowIntensity: 3.4
      },
      hose: {
        color: 0x222225,
        roughness: 0.68,
        metalness: 0.2
      },
      mouthpieceHandle: {
        color: 0x1a1815,
        roughness: 0.48,
        metalness: 0.22
      },
      mouthpieceHighlight: {
        color: 0xd4af37,
        emissive: 0x554400
      }
    }
  },

  'obsidian-luxury': {
    id: 'obsidian-luxury',
    name: 'Obsidian Luxury',
    subtitle: 'Stealth Midnight Monolith',
    description: 'Black smoked artisan glass, brushed dark gunmetal, deep crimson accents, and restrained crimson coals.',
    previewColors: ['#1a1c20', '#c5a059', '#0a1e28', '#240d0d'],
    materials: {
      glass: {
        color: 0x0b0d10,
        roughness: 0.08,
        metalness: 0.08,
        transmission: 0.38,
        opacity: 0.88,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        attenuationColor: 0x050608,
        attenuationDistance: 1.0
      },
      water: {
        color: 0x0a1e28,
        roughness: 0.05,
        transmission: 0.36,
        opacity: 0.78,
        clearcoat: 0.92
      },
      primaryMetal: {
        color: 0x1a1c20,
        metalness: 0.92,
        roughness: 0.28
      },
      secondaryMetal: {
        color: 0xc5a059,
        metalness: 0.88,
        roughness: 0.22
      },
      accentMetal: {
        color: 0x3a3d45,
        metalness: 0.94,
        roughness: 0.16
      },
      stemEnamel: {
        color: 0x101114,
        roughness: 0.18,
        metalness: 0.35,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08
      },
      ceramicBowl: {
        color: 0x240d0d,
        roughness: 0.32,
        metalness: 0.06,
        clearcoat: 0.7,
        clearcoatRoughness: 0.14
      },
      coals: {
        color: 0x111111,
        emissive: 0xff2800,
        glowLightColor: 0xff3000,
        glowIntensity: 2.8
      },
      hose: {
        color: 0x141416,
        roughness: 0.72,
        metalness: 0.15
      },
      mouthpieceHandle: {
        color: 0x121214,
        roughness: 0.52,
        metalness: 0.18
      },
      mouthpieceHighlight: {
        color: 0xc5a059,
        emissive: 0x443311
      }
    }
  },

  'cyber-neon': {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    subtitle: 'Synthwave Nightclub Glow',
    description: 'Tech titanium finish, electric cyan bands, reactive neon magenta bowl, and glowing cyber coals.',
    previewColors: ['#00f0ff', '#a811a0', '#181e28', '#00b4d8'],
    materials: {
      glass: {
        color: 0x0c2538,
        roughness: 0.14,
        metalness: 0.06,
        transmission: 0.60,
        opacity: 0.82,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        attenuationColor: 0x041824,
        attenuationDistance: 1.4
      },
      water: {
        color: 0x00f0ff,
        roughness: 0.03,
        transmission: 0.55,
        opacity: 0.82,
        clearcoat: 1.0
      },
      primaryMetal: {
        color: 0x181e28,
        metalness: 0.95,
        roughness: 0.18
      },
      secondaryMetal: {
        color: 0x00d4e6,
        metalness: 0.92,
        roughness: 0.16
      },
      accentMetal: {
        color: 0xb8e2f2,
        metalness: 0.98,
        roughness: 0.12
      },
      stemEnamel: {
        color: 0x00b4d8,
        roughness: 0.12,
        metalness: 0.3,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08
      },
      ceramicBowl: {
        color: 0xa811a0,
        roughness: 0.26,
        metalness: 0.08,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12
      },
      coals: {
        color: 0x121218,
        emissive: 0xff0055,
        glowLightColor: 0xff0066,
        glowIntensity: 3.6
      },
      hose: {
        color: 0x141e2e,
        roughness: 0.62,
        metalness: 0.25
      },
      mouthpieceHandle: {
        color: 0x101622,
        roughness: 0.44,
        metalness: 0.26
      },
      mouthpieceHighlight: {
        color: 0x00f0ff,
        emissive: 0x005566
      }
    }
  },

  'deep-ocean': {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    subtitle: 'Mediterranean Azure & Platinum',
    description: 'Aquatic sapphire glass, polished platinum silver, Mediterranean seafoam bowl, and shimmering lagoon water.',
    previewColors: ['#00e5d4', '#dfe5ea', '#073b4c', '#082e3d'],
    materials: {
      glass: {
        color: 0x082e3d,
        roughness: 0.10,
        metalness: 0.05,
        transmission: 0.58,
        opacity: 0.84,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        attenuationColor: 0x031822,
        attenuationDistance: 1.5
      },
      water: {
        color: 0x00e5d4,
        roughness: 0.04,
        transmission: 0.48,
        opacity: 0.80,
        clearcoat: 0.95
      },
      primaryMetal: {
        color: 0xdfe5ea,
        metalness: 0.96,
        roughness: 0.12
      },
      secondaryMetal: {
        color: 0x9fb0c0,
        metalness: 0.90,
        roughness: 0.24
      },
      accentMetal: {
        color: 0xf0f4f8,
        metalness: 0.98,
        roughness: 0.10
      },
      stemEnamel: {
        color: 0x073b4c,
        roughness: 0.18,
        metalness: 0.22,
        clearcoat: 0.88,
        clearcoatRoughness: 0.1
      },
      ceramicBowl: {
        color: 0x0f4c5c,
        roughness: 0.32,
        metalness: 0.06,
        clearcoat: 0.75,
        clearcoatRoughness: 0.15
      },
      coals: {
        color: 0x141618,
        emissive: 0xff4818,
        glowLightColor: 0xff5020,
        glowIntensity: 3.2
      },
      hose: {
        color: 0x0f1c2b,
        roughness: 0.65,
        metalness: 0.2
      },
      mouthpieceHandle: {
        color: 0x111c24,
        roughness: 0.46,
        metalness: 0.24
      },
      mouthpieceHighlight: {
        color: 0xdfe5ea,
        emissive: 0x224455
      }
    }
  },

  'desert-amber': {
    id: 'desert-amber',
    name: 'Desert Amber',
    subtitle: 'Arabian Sunset Bronze',
    description: 'Golden honey artisan glass, antique bronze metalwork, terracotta glaze, and radiant golden sunset embers.',
    previewColors: ['#df8a28', '#8c5324', '#3e2305', '#6e2c14'],
    materials: {
      glass: {
        color: 0x3e2305,
        roughness: 0.12,
        metalness: 0.05,
        transmission: 0.55,
        opacity: 0.84,
        clearcoat: 1.0,
        clearcoatRoughness: 0.07,
        attenuationColor: 0x241202,
        attenuationDistance: 1.4
      },
      water: {
        color: 0xdf8a28,
        roughness: 0.05,
        transmission: 0.45,
        opacity: 0.78,
        clearcoat: 0.9
      },
      primaryMetal: {
        color: 0x8c5324,
        metalness: 0.90,
        roughness: 0.28
      },
      secondaryMetal: {
        color: 0xb8860b,
        metalness: 0.88,
        roughness: 0.24
      },
      accentMetal: {
        color: 0xb85c38,
        metalness: 0.92,
        roughness: 0.18
      },
      stemEnamel: {
        color: 0x4a2408,
        roughness: 0.20,
        metalness: 0.24,
        clearcoat: 0.82,
        clearcoatRoughness: 0.12
      },
      ceramicBowl: {
        color: 0x6e2c14,
        roughness: 0.38,
        metalness: 0.08,
        clearcoat: 0.60,
        clearcoatRoughness: 0.18
      },
      coals: {
        color: 0x181410,
        emissive: 0xff5e00,
        glowLightColor: 0xff6a00,
        glowIntensity: 3.5
      },
      hose: {
        color: 0x2e1b12,
        roughness: 0.70,
        metalness: 0.18
      },
      mouthpieceHandle: {
        color: 0x1e140d,
        roughness: 0.50,
        metalness: 0.22
      },
      mouthpieceHighlight: {
        color: 0xdaa520,
        emissive: 0x664400
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3 VIRTUAL LOUNGE ENVIRONMENT PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const ENVIRONMENT_PRESETS: Record<string, EnvironmentPresetConfig> = {
  'midnight-lounge': {
    id: 'midnight-lounge',
    name: 'Midnight Lounge',
    subtitle: 'Atmospheric Moody Night',
    description: 'Dark neutral marble, warm ambient rim lights, and soft golden candlelight.',
    previewColors: ['#222634', '#fff3e0', '#111318'],
    lighting: {
      ambient: {
        color: 0x222634,
        intensity: 1.4
      },
      key: {
        color: 0xfff3e0,
        intensity: 2.5
      },
      fill: {
        color: 0x6e88b8,
        intensity: 0.85
      },
      rim: {
        color: 0xffb048,
        intensity: 1.1
      }
    },
    table: {
      marbleColor: 0x111318,
      marbleRoughness: 0.22,
      marbleMetalness: 0.15,
      marbleClearcoat: 0.52,
      trimColor: 0xb58838,
      pedestalColor: 0x0a0c10
    },
    lantern: {
      flameColor: 0xff4400,
      flameEmissive: 0xff6600,
      lightColor: 0xff7722,
      lightIntensity: 1.2,
      glassColor: 0xffaa44
    },
    dustParticles: {
      color: 0xffd580
    }
  },

  'royal-lounge': {
    id: 'royal-lounge',
    name: 'Royal Lounge',
    subtitle: 'Warm Opulent Chandelier',
    description: 'Burgundy velvet ambience, Portoro black & gold marble, and 24K chandelier radiance.',
    previewColors: ['#331c24', '#d4af37', '#994455'],
    lighting: {
      ambient: {
        color: 0x331c24,
        intensity: 1.5
      },
      key: {
        color: 0xffe8c0,
        intensity: 2.8
      },
      fill: {
        color: 0x994455,
        intensity: 0.95
      },
      rim: {
        color: 0xffc857,
        intensity: 1.4
      }
    },
    table: {
      marbleColor: 0x0e0e12,
      marbleRoughness: 0.15,
      marbleMetalness: 0.20,
      marbleClearcoat: 0.70,
      trimColor: 0xd4af37,
      pedestalColor: 0x08080a
    },
    lantern: {
      flameColor: 0xff3300,
      flameEmissive: 0xff5500,
      lightColor: 0xff6622,
      lightIntensity: 1.5,
      glassColor: 0xff8833
    },
    dustParticles: {
      color: 0xffe082
    }
  },

  'cyber-lounge': {
    id: 'cyber-lounge',
    name: 'Cyber Lounge',
    subtitle: 'Futuristic Neon Velvet',
    description: 'Electric cyan rim, violet fill, matte obsidian tech slate, and cyber neon flame.',
    previewColors: ['#141a2e', '#00f0ff', '#661858'],
    lighting: {
      ambient: {
        color: 0x141a2e,
        intensity: 1.3
      },
      key: {
        color: 0xd0f4ff,
        intensity: 2.4
      },
      fill: {
        color: 0x661858,
        intensity: 1.1
      },
      rim: {
        color: 0x00f0ff,
        intensity: 1.5
      }
    },
    table: {
      marbleColor: 0x0a0c10,
      marbleRoughness: 0.32,
      marbleMetalness: 0.45,
      marbleClearcoat: 0.35,
      trimColor: 0x00b4d8,
      pedestalColor: 0x06080c
    },
    lantern: {
      flameColor: 0x00e5ff,
      flameEmissive: 0x00ffff,
      lightColor: 0x00e5ff,
      lightIntensity: 1.4,
      glassColor: 0x00b4d8
    },
    dustParticles: {
      color: 0x80e5ff
    }
  }
};

export const DEFAULT_SKIN_ID = 'royal-gold';
export const DEFAULT_ENVIRONMENT_ID = 'midnight-lounge';
