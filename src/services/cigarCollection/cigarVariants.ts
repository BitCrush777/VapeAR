// VapeAR Cigar Collection — Created by Saidarshan.K
// Variant definitions, dimensions, and material parameters for premium cigars

export type CigarVariantId = 'maduro' | 'connecticut' | 'robusto';

export interface CigarVariantConfig {
  id: CigarVariantId;
  name: string;
  subtitle: string;
  gauge: string;
  // Physical dimensions in Three.js world units
  length: number;
  radius: number;
  headTaperRatio: number; // Taper at head cap
  footBevelRatio: number; // Bevel at foot
  // Material parameters
  wrapper: {
    color: number;
    roughness: number;
    metalness: number;
    clearcoat: number;
    clearcoatRoughness: number;
    bumpScale: number;
  };
  band: {
    baseColor: string;
    secondaryColor: string;
    foilColor: string;
    accentColor: string;
    title: string;
    sub: string;
    width: number; // Band width along cigar length
    offsetFromHead: number; // Distance from head cap
  };
  innerTobacco: {
    coreColor: number;
    leafDark: number;
    leafLight: number;
  };
}

export const CIGAR_VARIANTS: Record<CigarVariantId, CigarVariantConfig> = {
  maduro: {
    id: 'maduro',
    name: 'Classic Maduro',
    subtitle: 'Deep Dark Wrapper · Aged Broadleaf · Rich Cocoa Sheen',
    gauge: 'Corona Gorda · 48 RG',
    length: 1.32,
    radius: 0.088,
    headTaperRatio: 0.92,
    footBevelRatio: 0.94,
    wrapper: {
      color: 0x331b11,
      roughness: 0.54,
      metalness: 0.08,
      clearcoat: 0.28,
      clearcoatRoughness: 0.25,
      bumpScale: 0.024
    },
    band: {
      baseColor: '#121214',
      secondaryColor: '#24201c',
      foilColor: '#d4af37',
      accentColor: '#8a6825',
      title: 'MADURO',
      sub: 'RESERVA',
      width: 0.26,
      offsetFromHead: 0.26
    },
    innerTobacco: {
      coreColor: 0x22130a,
      leafDark: 0x381f12,
      leafLight: 0x4f2d1a
    }
  },
  connecticut: {
    id: 'connecticut',
    name: 'Natural Connecticut',
    subtitle: 'Silky Golden Tan Shade · Ivory Gold Foil · Velvety Smoke',
    gauge: 'Lonsdale · 44 RG',
    length: 1.25,
    radius: 0.082,
    headTaperRatio: 0.94,
    footBevelRatio: 0.96,
    wrapper: {
      color: 0x8a5e38,
      roughness: 0.68,
      metalness: 0.04,
      clearcoat: 0.12,
      clearcoatRoughness: 0.38,
      bumpScale: 0.016
    },
    band: {
      baseColor: '#f5eedc',
      secondaryColor: '#e0d5bd',
      foilColor: '#c59b27',
      accentColor: '#3d342a',
      title: 'NATURAL',
      sub: 'CONNECTICUT',
      width: 0.24,
      offsetFromHead: 0.24
    },
    innerTobacco: {
      coreColor: 0x342013,
      leafDark: 0x4d311d,
      leafLight: 0x6e482b
    }
  },
  robusto: {
    id: 'robusto',
    name: 'Robusto Reserva',
    subtitle: 'Sun-Grown Chestnut · Imperial Crimson Band · Heavy Gauge',
    gauge: 'Robusto · 52 RG',
    length: 1.12,
    radius: 0.106,
    headTaperRatio: 0.89,
    footBevelRatio: 0.92,
    wrapper: {
      color: 0x54321c,
      roughness: 0.48,
      metalness: 0.06,
      clearcoat: 0.35,
      clearcoatRoughness: 0.20,
      bumpScale: 0.030
    },
    band: {
      baseColor: '#580e15',
      secondaryColor: '#36080d',
      foilColor: '#e5b842',
      accentColor: '#ffd700',
      title: 'ROBUSTO',
      sub: 'SELECCIÓN',
      width: 0.28,
      offsetFromHead: 0.22
    },
    innerTobacco: {
      coreColor: 0x2b170c,
      leafDark: 0x442614,
      leafLight: 0x5f371d
    }
  }
};

export const DEFAULT_CIGAR_VARIANT_ID: CigarVariantId = 'maduro';
