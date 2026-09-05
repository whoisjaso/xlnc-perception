import { Easing } from 'remotion';

// Nova Wheels: near-black ground, porcelain type, one gold hero color.
export const theme = {
  colors: {
    bg: '#0f1012',
    bgAlt: '#17181c',
    surface: '#1d1e23',
    primary: '#d6b25f', // the hero color: at most one element per frame
    accent: '#8c6b2a',
    text: '#f4f2ee',
    textDim: '#a3a29e',
    glow: 'rgba(214, 178, 95, 0.35)',
    porcelain: '#f5f4f1',
    ink: '#141416',
  },
  fonts: {
    display: '"Bodoni Moda", "Didot", serif',
    body: '"Hanken Grotesk", "SF Pro Text", system-ui, sans-serif',
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
    slow: { damping: 26, stiffness: 60, mass: 1.2 },
  },
} as const;
