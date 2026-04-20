/**
 * Convert a 6-character hex string to the app's color object format.
 * @param {string} h - 6-character hex string (no #)
 * @returns {{ color: string, r: number, g: number, b: number, a: number }} color object
 */
function hex(h) {
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return { color: `rgba(${r},${g},${b},1)`, r, g, b, a: 255 }
}

export const PRESETS = [
  { id: '1bit', label: '1-Bit' },
  { id: 'gameboy', label: 'GameBoy' },
  { id: 'pico8', label: 'Pico-8' },
  { id: 'sweetie16', label: 'Sweetie 16' },
]

export const DEFAULT_PALETTES = {
  '1bit': [hex('000000'), hex('ffffff')],
  gameboy: [hex('0f380f'), hex('306230'), hex('8bac0f'), hex('9bbc0f')],
  pico8: [
    hex('000000'),
    hex('1d2b53'),
    hex('7e2553'),
    hex('008751'),
    hex('ab5236'),
    hex('5f574f'),
    hex('c2c3c7'),
    hex('fff1e8'),
    hex('ff004d'),
    hex('ffa300'),
    hex('ffec27'),
    hex('00e436'),
    hex('29adff'),
    hex('83769c'),
    hex('ff77a8'),
    hex('ffccaa'),
  ],
  sweetie16: [
    hex('1a1c2c'),
    hex('5d275d'),
    hex('b13e53'),
    hex('ef7d57'),
    hex('ffcd75'),
    hex('a7f070'),
    hex('38b764'),
    hex('257179'),
    hex('29366f'),
    hex('3b5dc9'),
    hex('41a6f6'),
    hex('73eff7'),
    hex('f4f4f4'),
    hex('94b0c2'),
    hex('566c86'),
    hex('333c57'),
  ],
}
