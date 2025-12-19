// Hero gradient presets (for individual blocks)
export const HERO_GRADIENT_PRESETS = [
  { id: 'mexican', name: 'Mexican Tricolor', value: 'linear-gradient(135deg, #006341 0%, #006341 33%, #ffffff 33%, #ffffff 66%, #ce1126 66%, #ce1126 100%)' },
  { id: 'sunset', name: 'Desert Sunset', value: 'linear-gradient(135deg, #1a472a 0%, #d97706 50%, #dc2626 100%)' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #075985 100%)' },
  { id: 'berry', name: 'Berry', value: 'linear-gradient(135deg, #701a75 0%, #a21caf 50%, #c026d3 100%)' },
  { id: 'forest', name: 'Forest', value: 'linear-gradient(135deg, #0f3d0f 0%, #166534 50%, #15803d 100%)' },
  { id: 'fire', name: 'Fire', value: 'linear-gradient(135deg, #b91c1c 0%, #f97316 50%, #fbbf24 100%)' },
  { id: 'midnight', name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #475569 100%)' },
  { id: 'tropical', name: 'Tropical', value: 'linear-gradient(135deg, #f59e0b 0%, #10b981 50%, #06b6d4 100%)' },
]

// Page background gradient presets
export const PAGE_GRADIENT_PRESETS = [
  { id: 'forest', name: 'Forest Green', value: 'linear-gradient(180deg, #0f3d0f 0%, #1a4d1a 50%, #0d2e0d 100%)' },
  { id: 'emerald', name: 'Emerald', value: 'linear-gradient(180deg, #064e3b 0%, #059669 50%, #047857 100%)' },
  { id: 'ocean', name: 'Ocean Blue', value: 'linear-gradient(180deg, #0c4a6e 0%, #0369a1 50%, #075985 100%)' },
  { id: 'sunset', name: 'Sunset', value: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)' },
  { id: 'berry', name: 'Berry', value: 'linear-gradient(180deg, #701a75 0%, #a21caf 50%, #c026d3 100%)' },
  { id: 'midnight', name: 'Midnight', value: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
  { id: 'warmBlack', name: 'Warm Black', value: 'linear-gradient(180deg, #1c1917 0%, #292524 50%, #1c1917 100%)' },
  { id: 'slate', name: 'Slate', value: 'linear-gradient(180deg, #1e293b 0%, #334155 50%, #1e293b 100%)' },
  // Restaurant-themed gradients
  { id: 'puebla-blue', name: 'Puebla Blue', value: 'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 50%, #1e3a5f 100%)' },
  { id: 'taco-fiesta', name: 'Taco Fiesta', value: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 50%, #16a34a 100%)' },
  { id: 'coffee-brown', name: 'Coffee Brown', value: 'linear-gradient(180deg, #3d2314 0%, #5d3a1a 50%, #3d2314 100%)' },
  { id: 'gym-steel', name: 'Gym Steel', value: 'linear-gradient(180deg, #1f2937 0%, #374151 50%, #1f2937 100%)' },
  { id: 'car-shop-chrome', name: 'Chrome', value: 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #374151 100%)' },
]

// Mexico 98 Jersey Inspired Patterns - Aztec & Geometric
export const PATTERN_PRESETS = [
  { id: 'none', name: 'None', value: null, size: null, preview: '⬜' },
  {
    id: 'aztec-zigzag',
    name: 'Aztec Zigzag',
    value: `repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 20px), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`,
    size: '40px 40px',
    preview: '⚡'
  },
  {
    id: 'aztec-diamonds',
    name: 'Aztec Diamonds',
    value: `linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)`,
    size: '30px 30px',
    preview: '◆'
  },
  {
    id: 'mexico98-stripes',
    name: 'Mexico 98 Stripes',
    value: `repeating-linear-gradient(90deg, rgba(0,99,65,0.15), rgba(0,99,65,0.15) 2px, transparent 2px, transparent 20px, rgba(206,17,38,0.15) 20px, rgba(206,17,38,0.15) 22px, transparent 22px, transparent 40px)`,
    size: '40px 100%',
    preview: '🇲🇽'
  },
  {
    id: 'quetzal-feathers',
    name: 'Quetzal Feathers',
    value: `radial-gradient(ellipse at 0% 50%, rgba(0,200,100,0.1) 0%, transparent 50%), radial-gradient(ellipse at 100% 50%, rgba(0,200,100,0.1) 0%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,215,0,0.08) 15px, rgba(255,215,0,0.08) 17px)`,
    size: '60px 30px',
    preview: '🦅'
  },
  {
    id: 'serpent-scales',
    name: 'Serpent Scales',
    value: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 50%, transparent 50%), radial-gradient(circle at 0% 50%, rgba(255,255,255,0.08) 50%, transparent 50%), radial-gradient(circle at 100% 50%, rgba(255,255,255,0.08) 50%, transparent 50%)`,
    size: '24px 24px',
    preview: '🐍'
  },
  {
    id: 'sun-stone',
    name: 'Sun Stone',
    value: `repeating-radial-gradient(circle at center, rgba(255,215,0,0.05) 0px, rgba(255,215,0,0.05) 2px, transparent 2px, transparent 20px, rgba(255,215,0,0.03) 20px, rgba(255,215,0,0.03) 22px, transparent 22px, transparent 40px)`,
    size: '80px 80px',
    preview: '☀️'
  },
  {
    id: 'pyramid-steps',
    name: 'Pyramid Steps',
    value: `repeating-linear-gradient(0deg, transparent 0px, transparent 8px, rgba(255,255,255,0.06) 8px, rgba(255,255,255,0.06) 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 16px)`,
    size: '32px 32px',
    preview: '🏛️'
  },
  {
    id: 'tribal-waves',
    name: 'Tribal Waves',
    value: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,150,100,0.1) 5px, rgba(0,150,100,0.1) 10px, transparent 10px, transparent 15px, rgba(200,50,50,0.1) 15px, rgba(200,50,50,0.1) 20px)`,
    size: '40px 40px',
    preview: '〰️'
  },
  {
    id: 'quetzalcoatl-spiral',
    name: 'Quetzalcoatl Spiral',
    value: `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 10px, rgba(255,215,0,0.06) 10px, rgba(255,215,0,0.06) 12px, transparent 12px, transparent 22px), repeating-radial-gradient(circle at 25% 25%, rgba(0,200,100,0.05) 0px, rgba(0,200,100,0.05) 5px, transparent 5px, transparent 15px)`,
    size: '60px 60px',
    preview: '🌀'
  },
  {
    id: 'maya-glyphs',
    name: 'Maya Glyphs',
    value: `linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(45deg, transparent 40%, rgba(255,215,0,0.06) 40%, rgba(255,215,0,0.06) 60%, transparent 60%)`,
    size: '40px 40px',
    preview: '🔷'
  },
  {
    id: 'stars-scattered',
    name: 'Scattered Stars',
    value: `radial-gradient(circle at 15% 25%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.15) 2px, transparent 2px), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.12) 2px, transparent 2px), radial-gradient(circle at 45% 60%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.14) 2px, transparent 2px), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.08) 1px, transparent 1px)`,
    size: '100px 100px',
    preview: '✨'
  },
  {
    id: 'flourish-vines',
    name: 'Flourish Vines',
    value: `repeating-linear-gradient(60deg, transparent, transparent 20px, rgba(255,255,255,0.04) 20px, rgba(255,255,255,0.04) 21px), repeating-linear-gradient(-60deg, transparent, transparent 20px, rgba(255,255,255,0.04) 20px, rgba(255,255,255,0.04) 21px), radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 30%)`,
    size: '50px 50px',
    preview: '🌿'
  },
  {
    id: 'eagle-warrior',
    name: 'Eagle Warrior',
    value: `linear-gradient(135deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(225deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(315deg, rgba(0,0,0,0.1) 25%, transparent 25%), radial-gradient(circle at 50% 50%, rgba(255,215,0,0.08) 0%, transparent 40%)`,
    size: '40px 40px',
    preview: '🦅'
  },
  {
    id: 'teotihuacan-grid',
    name: 'Teotihuacan Grid',
    value: `linear-gradient(rgba(255,255,255,0.06) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.06) 2px, transparent 2px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
    size: '50px 50px, 50px 50px, 10px 10px, 10px 10px',
    preview: '📐'
  },
  {
    id: 'obsidian-sparkle',
    name: 'Obsidian Sparkle',
    value: `radial-gradient(circle at 10% 20%, rgba(255,255,255,0.2) 0%, transparent 1%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.18) 0%, transparent 1%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 1%), radial-gradient(circle at 20% 70%, rgba(255,255,255,0.12) 0%, transparent 1%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.16) 0%, transparent 1%), radial-gradient(circle at 35% 35%, rgba(255,255,255,0.1) 0%, transparent 1%)`,
    size: '80px 80px',
    preview: '💎'
  },
  {
    id: 'jade-circles',
    name: 'Jade Circles',
    value: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,200,100,0.08) 40%, rgba(0,200,100,0.08) 50%, transparent 50%), radial-gradient(circle at 0% 0%, transparent 40%, rgba(0,200,100,0.06) 40%, rgba(0,200,100,0.06) 50%, transparent 50%), radial-gradient(circle at 100% 100%, transparent 40%, rgba(0,200,100,0.06) 40%, rgba(0,200,100,0.06) 50%, transparent 50%)`,
    size: '60px 60px',
    preview: '🟢'
  },
  {
    id: 'gold-filigree',
    name: 'Gold Filigree',
    value: `repeating-linear-gradient(45deg, rgba(255,215,0,0.04) 0px, rgba(255,215,0,0.04) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255,215,0,0.04) 0px, rgba(255,215,0,0.04) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(0deg, rgba(255,215,0,0.03) 0px, rgba(255,215,0,0.03) 1px, transparent 1px, transparent 20px)`,
    size: '30px 30px',
    preview: '✴️'
  },
  {
    id: 'aztec-calendar',
    name: 'Aztec Calendar',
    value: `repeating-radial-gradient(circle at center, rgba(255,215,0,0.06) 0px, rgba(255,215,0,0.06) 3px, transparent 3px, transparent 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 10px, transparent 10px, transparent 20px), linear-gradient(0deg, rgba(255,255,255,0.02) 50%, transparent 50%)`,
    size: '100px 100px',
    preview: '🗓️'
  },
  {
    id: 'starburst-glow',
    name: 'Starburst Glow',
    value: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 25%), repeating-conic-gradient(from 0deg, rgba(255,255,255,0.05) 0deg 15deg, transparent 15deg 30deg)`,
    size: '80px 80px',
    preview: '💫'
  },
  {
    id: 'feathered-serpent',
    name: 'Feathered Serpent',
    value: `repeating-linear-gradient(45deg, transparent 0px, transparent 20px, rgba(0,200,100,0.06) 20px, rgba(0,200,100,0.06) 22px, transparent 22px, transparent 40px, rgba(255,0,0,0.04) 40px, rgba(255,0,0,0.04) 42px), repeating-linear-gradient(-45deg, transparent 0px, transparent 20px, rgba(255,215,0,0.05) 20px, rgba(255,215,0,0.05) 22px)`,
    size: '60px 60px',
    preview: '🐉'
  },
  // Template-specific patterns
  {
    id: 'coffee-beans',
    name: 'Coffee Beans',
    value: `radial-gradient(ellipse at 20% 30%, rgba(101,67,33,0.15) 0%, transparent 30%), radial-gradient(ellipse at 80% 70%, rgba(101,67,33,0.12) 0%, transparent 30%), radial-gradient(ellipse at 50% 50%, rgba(139,90,43,0.1) 0%, transparent 25%)`,
    size: '60px 60px',
    preview: '☕'
  },
  {
    id: 'gym-hexagons',
    name: 'Hexagon Grid',
    value: `repeating-linear-gradient(60deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-60deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)`,
    size: '40px 40px',
    preview: '💪'
  },
  {
    id: 'auto-checkered',
    name: 'Checkered Flag',
    value: `repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 30px, transparent 30px, transparent 40px)`,
    size: '40px 40px',
    preview: '🏁'
  },
]

// Animation presets
export const ANIMATION_PRESETS = [
  { id: 'none', name: 'None', value: null, description: 'No animation', icon: '⛔' },
  { id: 'pulse', name: 'Pulse Glow', value: 'pulse', description: 'Subtle breathing glow', icon: '💫' },
  { id: 'shimmer', name: 'Shimmer', value: 'shimmer', description: 'Light sweep effect', icon: '✨' },
  { id: 'gradient-shift', name: 'Color Flow', value: 'gradient-shift', description: 'Slowly shifting colors', icon: '🌊' },
  { id: 'aurora', name: 'Aurora', value: 'aurora', description: 'Northern lights wave', icon: '🌌' },
]

// Card Style Presets - Showcase Styles with Glow
export const CARD_STYLE_PRESETS = [
  { id: 'dark-red', name: 'Dark Red', cardBg: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', imageBg: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)', borderColor: '#334155', accentColor: '#ef4444', glowColor: '#ef4444', textLight: true, icon: '🔴' },
  { id: 'dark-emerald', name: 'Dark Emerald', cardBg: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', imageBg: 'linear-gradient(180deg, #064e3b 0%, #065f46 100%)', borderColor: '#10b981', accentColor: '#10b981', glowColor: '#10b981', textLight: true, icon: '🟢' },
  { id: 'dark-gold', name: 'Dark Gold', cardBg: 'linear-gradient(180deg, #1c1917 0%, #0c0a09 100%)', imageBg: 'linear-gradient(180deg, #292524 0%, #1c1917 100%)', borderColor: '#d97706', accentColor: '#f59e0b', glowColor: '#fbbf24', textLight: true, icon: '🟡' },
  { id: 'dark-purple', name: 'Dark Purple', cardBg: 'linear-gradient(180deg, #1e1b4b 0%, #0f0d22 100%)', imageBg: 'linear-gradient(180deg, #312e81 0%, #1e1b4b 100%)', borderColor: '#7c3aed', accentColor: '#8b5cf6', glowColor: '#a78bfa', textLight: true, icon: '🟣' },
  { id: 'clean-white', name: 'Clean White', cardBg: '#ffffff', imageBg: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderColor: '#e2e8f0', accentColor: '#ef4444', glowColor: '#ef4444', textLight: false, icon: '⬜' },
  { id: 'aztec-jade', name: 'Aztec Jade', cardBg: 'linear-gradient(180deg, #064e3b 0%, #065f46 100%)', imageBg: 'linear-gradient(180deg, #022c22 0%, #064e3b 100%)', borderColor: '#10b981', accentColor: '#fbbf24', glowColor: '#fbbf24', textLight: true, icon: '🌿' },
  { id: 'fiesta-red', name: 'Fiesta Red', cardBg: 'linear-gradient(180deg, #7f1d1d 0%, #991b1b 100%)', imageBg: 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 100%)', borderColor: '#f87171', accentColor: '#fbbf24', glowColor: '#fbbf24', textLight: true, icon: '❤️' },
  { id: 'ocean-blue', name: 'Ocean Blue', cardBg: 'linear-gradient(180deg, #0c4a6e 0%, #075985 100%)', imageBg: 'linear-gradient(180deg, #082f49 0%, #0c4a6e 100%)', borderColor: '#0ea5e9', accentColor: '#0ea5e9', glowColor: '#38bdf8', textLight: true, icon: '💙' },
  { id: 'puebla-blue', name: 'Puebla Blue', cardBg: 'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 100%)', imageBg: 'linear-gradient(180deg, #152a47 0%, #1e3a5f 100%)', borderColor: '#c9a227', accentColor: '#c9a227', glowColor: '#fbbf24', textLight: true, icon: '🔵' },
]

// Card Image Effect Presets - WOW Effects!
export const CARD_IMAGE_EFFECTS = [
  { id: 'none', name: 'None', value: '', icon: '⬜' },
  { id: 'soft-shadow', name: 'Soft Shadow', value: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))', icon: '🌫️' },
  { id: 'strong-shadow', name: 'Strong Shadow', value: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))', icon: '⬛' },
  { id: 'glow-white', name: 'White Glow', value: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))', icon: '✨' },
  { id: 'glow-gold', name: 'Gold Glow', value: 'drop-shadow(0 0 20px rgba(255,215,0,0.4))', icon: '🌟' },
  { id: 'glow-emerald', name: 'Emerald Glow', value: 'drop-shadow(0 0 20px rgba(16,185,129,0.4))', icon: '💚' },
  { id: 'float-3d', name: '3D Float', value: 'drop-shadow(0 25px 25px rgba(0,0,0,0.25)) drop-shadow(0 5px 10px rgba(0,0,0,0.1))', icon: '🎯' },
  { id: 'neon-red', name: 'Neon Red', value: 'drop-shadow(0 0 10px rgba(239,68,68,0.8)) drop-shadow(0 0 30px rgba(239,68,68,0.5)) drop-shadow(0 0 50px rgba(239,68,68,0.3))', icon: '🔴' },
  { id: 'neon-blue', name: 'Neon Blue', value: 'drop-shadow(0 0 10px rgba(59,130,246,0.8)) drop-shadow(0 0 30px rgba(59,130,246,0.5)) drop-shadow(0 0 50px rgba(59,130,246,0.3))', icon: '🔵' },
  { id: 'neon-purple', name: 'Neon Purple', value: 'drop-shadow(0 0 10px rgba(139,92,246,0.8)) drop-shadow(0 0 30px rgba(139,92,246,0.5)) drop-shadow(0 0 50px rgba(139,92,246,0.3))', icon: '🟣' },
  { id: 'fire', name: 'Fire', value: 'drop-shadow(0 0 15px rgba(251,146,60,0.9)) drop-shadow(0 0 30px rgba(239,68,68,0.6)) drop-shadow(0 5px 20px rgba(234,179,8,0.4))', icon: '🔥' },
  { id: 'ice', name: 'Ice', value: 'drop-shadow(0 0 15px rgba(147,197,253,0.8)) drop-shadow(0 0 30px rgba(59,130,246,0.5)) drop-shadow(0 5px 20px rgba(255,255,255,0.4))', icon: '❄️' },
  { id: 'electric', name: 'Electric', value: 'drop-shadow(0 0 8px rgba(250,204,21,1)) drop-shadow(0 0 20px rgba(234,179,8,0.8)) drop-shadow(0 0 40px rgba(251,191,36,0.5))', icon: '⚡' },
  { id: 'premium', name: 'Premium Gold', value: 'drop-shadow(0 0 15px rgba(251,191,36,0.9)) drop-shadow(0 10px 30px rgba(180,83,9,0.6)) drop-shadow(0 5px 15px rgba(255,215,0,0.4))', icon: '👑' },
  { id: 'hologram', name: 'Hologram', value: 'drop-shadow(-5px 0 15px rgba(239,68,68,0.5)) drop-shadow(5px 0 15px rgba(59,130,246,0.5)) drop-shadow(0 0 20px rgba(16,185,129,0.4))', icon: '🌈' },
  { id: 'mega-3d', name: 'Mega 3D', value: 'drop-shadow(0 35px 35px rgba(0,0,0,0.4)) drop-shadow(0 15px 15px rgba(0,0,0,0.2)) drop-shadow(0 5px 5px rgba(0,0,0,0.1))', icon: '🚀' },
  { id: 'spotlight', name: 'Spotlight', value: 'drop-shadow(0 0 40px rgba(255,255,255,0.8)) drop-shadow(0 20px 40px rgba(0,0,0,0.5))', icon: '💡' },
]

