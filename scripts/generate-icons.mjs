// Generates the TriviaPath logo + every PWA/favicon/OG raster from one SVG definition.
// Run: npm run icons   (needs devDependency `sharp`)
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'

const G1 = '#12B981', G2 = '#047857', ORANGE = '#F97316', ORANGE2 = '#FB923C'

// The mark, drawn on a 512 grid and centred optically (shifted down 31px).
const mark = `
  <g transform="translate(0 31)">
    <path d="M256 214C220 190 160 186 112 200V352C160 340 220 344 256 368Z" fill="#fff"/>
    <path d="M256 214C292 190 352 186 400 200V352C352 340 292 344 256 368Z" fill="#fff" fill-opacity=".92"/>
    <path d="M256 214V368" stroke="url(#bg)" stroke-width="7" stroke-linecap="round"/>
    <path d="M256 82C260 112 272 124 302 128C272 132 260 144 256 174C252 144 240 132 210 128C240 124 252 112 256 82Z" fill="url(#sp)"/>
  </g>`

const defs = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stop-color="${G1}"/><stop offset="1" stop-color="${G2}"/></linearGradient>
  <linearGradient id="sp" x1="256" y1="82" x2="256" y2="174" gradientUnits="userSpaceOnUse"><stop stop-color="${ORANGE2}"/><stop offset="1" stop-color="${ORANGE}"/></linearGradient>
</defs>`

const svg = (inner, size = 512) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">${defs}${inner}</svg>`
const scaled = (s) => `<g transform="translate(256 256) scale(${s}) translate(-256 -256)">${mark}</g>`

const variants = {
  rounded: svg(`<rect width="512" height="512" rx="112" fill="url(#bg)"/>${mark}`),        // "any" purpose + favicon + logo
  maskable: svg(`<rect width="512" height="512" fill="url(#bg)"/>${scaled(0.78)}`),          // content inside the 80% safe zone
  apple: svg(`<rect width="512" height="512" fill="url(#bg)"/>${scaled(0.92)}`),             // iOS applies its own rounding
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/logo.svg', variants.rounded)
writeFileSync('public/icons/maskable.svg', variants.maskable)

const png = (key, size, out) => sharp(Buffer.from(variants[key])).resize(size, size).png({ compressionLevel: 9 }).toFile(out)

await Promise.all([
  png('rounded', 512, 'public/logo.png'),
  png('rounded', 192, 'public/icons/icon-192.png'),
  png('rounded', 512, 'public/icons/icon-512.png'),
  png('maskable', 192, 'public/icons/maskable-192.png'),
  png('maskable', 512, 'public/icons/maskable-512.png'),
  png('apple', 180, 'public/apple-touch-icon.png'),
  png('rounded', 192, 'public/android-chrome-192x192.png'),
  png('rounded', 512, 'public/android-chrome-512x512.png'),
  png('rounded', 32, 'public/favicon-32x32.png'),
  png('rounded', 16, 'public/favicon-16x16.png'),
  png('rounded', 48, 'public/icons/favicon-48.png'),
])

// Social share card
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="o" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse"><stop stop-color="#0E1B16"/><stop offset="1" stop-color="#0F3D2F"/></linearGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stop-color="${G1}"/><stop offset="1" stop-color="${G2}"/></linearGradient>
  <linearGradient id="sp" x1="256" y1="82" x2="256" y2="174" gradientUnits="userSpaceOnUse"><stop stop-color="${ORANGE2}"/><stop offset="1" stop-color="${ORANGE}"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#o)"/>
  <circle cx="1080" cy="80" r="260" fill="${ORANGE}" fill-opacity=".10"/>
  <g transform="translate(110 150) scale(.66)"><rect width="512" height="512" rx="112" fill="url(#bg)"/>${mark}</g>
  <text x="520" y="290" font-family="Poppins, DejaVu Sans, sans-serif" font-size="104" font-weight="700" fill="#fff">Trivia<tspan fill="#34D399">Path</tspan></text>
  <text x="522" y="362" font-family="Poppins, DejaVu Sans, sans-serif" font-size="36" fill="#CFE8DD">Run live Bible trivia sessions,</text>
  <text x="522" y="410" font-family="Poppins, DejaVu Sans, sans-serif" font-size="36" fill="#CFE8DD">even when the WiFi doesn't show up.</text>
  <rect x="522" y="450" width="120" height="8" rx="4" fill="${ORANGE}"/>
</svg>`
await sharp(Buffer.from(og)).jpeg({ quality: 88 }).toFile('public/og-image.jpg')
console.log('icons generated')
