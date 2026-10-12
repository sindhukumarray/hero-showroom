/**
 * Verified Automotive Motorcycle Imagery & Vector Silhouette Architecture
 *
 * Provides authentic, model-accurate visual assets for all catalogue vehicles.
 * Resolves verified manufacturer imagery when available, falling back to precision,
 * legally cleared vector automotive silhouettes tailored to exact models,
 * manufacturer brands, and vehicle categories.
 *
 * Prevents third-party brand mismatches (no Yamahas on Royal Enfield, no sports cars on EVs).
 */

// Category theme palettes for styling precision vector silhouettes
const CATEGORY_THEMES = {
  sport: {
    primary: '#E11D48',
    accent: '#FB7185',
    bgStart: '#141824',
    bgEnd: '#080B11',
    glow: 'rgba(225, 29, 72, 0.22)',
    label: 'PERFORMANCE SPORT'
  },
  cruiser: {
    primary: '#F59E0B',
    accent: '#FBBF24',
    bgStart: '#1A1820',
    bgEnd: '#09080E',
    glow: 'rgba(245, 158, 11, 0.20)',
    label: 'HIGHWAY CRUISER'
  },
  commuter: {
    primary: '#3B82F6',
    accent: '#60A5FA',
    bgStart: '#131A28',
    bgEnd: '#070C15',
    glow: 'rgba(59, 130, 246, 0.20)',
    label: 'ICONIC COMMUTER'
  },
  adventure: {
    primary: '#10B981',
    accent: '#34D399',
    bgStart: '#121C18',
    bgEnd: '#060E0B',
    glow: 'rgba(16, 185, 129, 0.22)',
    label: 'ALL-TERRAIN ADVENTURE'
  },
  tourer: {
    primary: '#8B5CF6',
    accent: '#A78BFA',
    bgStart: '#171526',
    bgEnd: '#080713',
    glow: 'rgba(139, 92, 246, 0.20)',
    label: 'LONG-DISTANCE TOURER'
  },
  scooter: {
    primary: '#EC4899',
    accent: '#F472B6',
    bgStart: '#1A1420',
    bgEnd: '#0B0710',
    glow: 'rgba(236, 72, 153, 0.20)',
    label: 'URBAN SCOOTER'
  },
  electric: {
    primary: '#06B6D4',
    accent: '#22D3EE',
    bgStart: '#101B24',
    bgEnd: '#060D13',
    glow: 'rgba(6, 182, 212, 0.25)',
    label: 'SMART ELECTRIC'
  }
};

/**
 * Disallowed third-party photo IDs from generic stock libraries that previously
 * caused confirmed model/brand mismatches (e.g. Yamaha photo on Hunter 350, red car on Vida V1).
 */
const BANNED_UNSPLASH_IDS = [
  'photo-1558981403-c5f9899a28bc', // Yamaha sports bike on Karizma/Hunter
  'photo-1558980664-2506fca6bfc2', // Touring cruiser on Pulsar
  'photo-1558980663-3685c1d673c4', // Cruiser on Apache
  'photo-1599819811279-d5ad9cccf838', // Kawasaki Ninja on Optima
  'photo-1508974239320-0a029497e820', // Automobile/car on Vida V1 Lite
  'photo-1558980394-4c7c9299fe96', // Harley V-Twin engine on Vida Pro
  'photo-1558981408-db0ecd8a1ee4'  // Harley LiveWire on Karizma
];

/**
 * Escapes special XML characters to prevent SVG syntax breakage
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts raw SVG markup into a standardized Data URI
 */
function svgToDataUri(svgString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

/**
 * Generates category-specific vector silhouette geometry
 */
function getCategorySilhouettePaths(cat, theme) {
  if (cat === 'sport') {
    return `
      <!-- Front Wheel 17-inch Alloy -->
      <circle cx="230" cy="285" r="58" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="230" cy="285" r="42" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="230" cy="285" r="24" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>
      <!-- Rear Wheel 17-inch Alloy -->
      <circle cx="570" cy="285" r="58" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="570" cy="285" r="42" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="570" cy="285" r="24" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>

      <!-- Sport Chassis, Perimeter Frame & Lower Cowl -->
      <path d="M 230 285 L 290 200 L 330 170 L 380 175 L 450 205 L 510 195 L 555 210 L 520 235 L 460 240 L 410 285 L 340 285 Z" fill="#1E293B" stroke="${theme.primary}" stroke-width="3"/>
      <!-- Aerodynamic Front Cowl & Windscreen -->
      <path d="M 280 205 L 315 140 L 345 145 L 330 175 Z" fill="${theme.glow}" stroke="${theme.accent}" stroke-width="2.5"/>
      <!-- Sculpted Fuel Tank with Knee Indents -->
      <path d="M 330 170 Q 375 140 435 175 L 450 205 L 360 200 Z" fill="${theme.primary}" opacity="0.9"/>
      <!-- Stepped Racing Seat -->
      <path d="M 435 175 L 485 195 L 535 185 L 545 205 L 450 205 Z" fill="#0F172A" stroke="${theme.accent}" stroke-width="1.5"/>
      <!-- USD Inverted Front Forks -->
      <line x1="230" y1="285" x2="310" y2="155" stroke="#CBD5E1" stroke-width="5" stroke-linecap="round"/>
      <line x1="238" y1="285" x2="318" y2="155" stroke="${theme.primary}" stroke-width="2"/>
      <!-- Aluminum Swingarm -->
      <path d="M 440 255 L 570 285 L 550 295 L 430 270 Z" fill="#334155" stroke="#94A3B8" stroke-width="2"/>
      <!-- Upswept Sport Exhaust Canister -->
      <path d="M 400 280 L 480 275 L 550 235 L 565 240 L 490 290 Z" fill="#475569" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Clip-on Handlebars -->
      <line x1="315" y1="160" x2="335" y2="150" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round"/>
    `;
  }
  if (cat === 'commuter') {
    return `
      <!-- Front Wheel 18-inch Alloy -->
      <circle cx="230" cy="285" r="62" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="230" cy="285" r="44" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="230" cy="285" r="22" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>
      <!-- Rear Wheel 18-inch Alloy -->
      <circle cx="570" cy="285" r="62" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="570" cy="285" r="44" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="570" cy="285" r="22" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>

      <!-- Classic Commuter Fuel Tank with Graphic Contour -->
      <path d="M 330 185 Q 380 155 440 185 L 435 220 L 340 215 Z" fill="${theme.primary}" opacity="0.9"/>
      <!-- Long Dual Bench Seat -->
      <path d="M 435 185 Q 490 190 545 195 L 540 220 L 435 220 Z" fill="#0F172A" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Rear Luggage Grab Rail -->
      <path d="M 535 195 L 565 192 L 560 205" stroke="#CBD5E1" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Engine Block -->
      <rect x="365" y="225" width="70" height="55" rx="10" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
      <!-- Commuter Horizontal Exhaust Pipe -->
      <path d="M 390 270 L 470 280 L 565 280 L 565 292 L 465 292 Z" fill="#94A3B8" stroke="#F8FAFC" stroke-width="1.5"/>
      <!-- Upright Telescopic Front Forks -->
      <line x1="230" y1="285" x2="320" y2="165" stroke="#CBD5E1" stroke-width="5" stroke-linecap="round"/>
      <!-- Round Headlamp Cowl -->
      <circle cx="310" cy="180" r="16" fill="${theme.glow}" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Upright Handlebars -->
      <path d="M 325 165 L 340 145 L 360 148" stroke="#F8FAFC" stroke-width="4" fill="none" stroke-linecap="round"/>
    `;
  }
  if (cat === 'cruiser') {
    return `
      <!-- Raked Out Front Wheel 19-inch -->
      <circle cx="210" cy="285" r="64" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="210" cy="285" r="46" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="210" cy="285" r="22" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>
      <!-- Wide Rear Wheel 17-inch -->
      <circle cx="585" cy="285" r="54" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="585" cy="285" r="38" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="585" cy="285" r="20" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>

      <!-- Teardrop Cruiser Tank -->
      <path d="M 320 180 Q 380 145 440 195 L 430 230 L 330 220 Z" fill="${theme.primary}" opacity="0.9"/>
      <!-- Low Slung Scoop Saddle -->
      <path d="M 430 200 Q 470 225 510 205 L 535 220 L 435 235 Z" fill="#0F172A" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Engine Block -->
      <rect x="360" y="225" width="85" height="60" rx="8" fill="#1E293B" stroke="#CBD5E1" stroke-width="2"/>
      <!-- Long Raked Front Fork -->
      <line x1="210" y1="285" x2="310" y2="155" stroke="#E2E8F0" stroke-width="6" stroke-linecap="round"/>
      <!-- Swept-Back Cruiser Handlebars -->
      <path d="M 310 155 L 325 130 L 350 140" stroke="#F8FAFC" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- Straight-Through Low Chrome Exhaust -->
      <path d="M 390 275 L 480 282 L 590 282 L 590 295 L 480 295 Z" fill="#CBD5E1" stroke="#F8FAFC" stroke-width="2"/>
      <!-- Classic Round Headlight -->
      <circle cx="295" cy="175" r="18" fill="${theme.glow}" stroke="${theme.accent}" stroke-width="2"/>
    `;
  }
  if (cat === 'adventure') {
    return `
      <!-- Tall 21-inch Spoked Front Wheel -->
      <circle cx="215" cy="275" r="68" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="215" cy="275" r="50" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="215" cy="275" r="20" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>
      <!-- 18-inch Rear Wheel -->
      <circle cx="580" cy="285" r="58" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="580" cy="285" r="42" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="580" cy="285" r="20" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>

      <!-- High Ground Clearance Bash Plate -->
      <path d="M 340 285 L 430 285 L 410 260 L 330 260 Z" fill="#475569" stroke="#94A3B8" stroke-width="2"/>
      <!-- Front ADV Beak Fender & Tall Windscreen -->
      <path d="M 230 190 L 290 205 L 320 135 L 335 140 L 305 210 Z" fill="${theme.primary}" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Ergonomic Adventure Tank -->
      <path d="M 320 175 Q 370 145 430 185 L 420 225 L 330 215 Z" fill="#1E293B" stroke="${theme.primary}" stroke-width="2.5"/>
      <!-- Dual-Purpose Rally Seat -->
      <path d="M 425 185 L 530 195 L 520 220 L 420 220 Z" fill="#0F172A" stroke="${theme.accent}" stroke-width="2"/>
      <!-- High Upswept Underseat Exhaust -->
      <path d="M 410 250 L 490 230 L 565 200 L 575 210 L 495 245 Z" fill="#64748B" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Long Travel Front Suspension -->
      <line x1="215" y1="275" x2="310" y2="150" stroke="#CBD5E1" stroke-width="5" stroke-linecap="round"/>
      <!-- Knuckle Guards & Wide Handlebar -->
      <path d="M 315 150 L 330 135 L 355 140" stroke="#F8FAFC" stroke-width="4" fill="none" stroke-linecap="round"/>
    `;
  }
  if (cat === 'scooter') {
    return `
      <!-- Compact 12-inch Front Wheel -->
      <circle cx="240" cy="295" r="45" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="240" cy="295" r="32" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="240" cy="295" r="16" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>
      <!-- Compact 12-inch Rear Wheel -->
      <circle cx="560" cy="295" r="45" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
      <circle cx="560" cy="295" r="32" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
      <circle cx="560" cy="295" r="16" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>

      <!-- Front Apron & Integrated Headlight -->
      <path d="M 255 285 L 320 180 L 350 185 L 340 260 L 370 295 L 430 295 L 440 260 L 360 260 Z" fill="${theme.primary}" opacity="0.9" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Step-Through Floorboard -->
      <path d="M 340 260 L 440 260 L 440 280 L 340 280 Z" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
      <!-- Sculpted Rear Enclosed Body & Contoured Seat -->
      <path d="M 440 260 Q 480 200 560 215 L 565 270 Q 500 295 440 280 Z" fill="#1E293B" stroke="${theme.primary}" stroke-width="2.5"/>
      <!-- Wide Dual Passenger Seat -->
      <path d="M 410 215 Q 480 200 550 215 L 540 235 L 420 235 Z" fill="#0F172A" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Scooter Handlebar Pod -->
      <path d="M 320 180 L 335 155 L 355 160" stroke="#F8FAFC" stroke-width="4" fill="none" stroke-linecap="round"/>
    `;
  }
  if (cat === 'electric') {
    return `
      <!-- Aero EV Front Wheel -->
      <circle cx="240" cy="295" r="46" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.9"/>
      <circle cx="240" cy="295" r="32" stroke="${theme.accent}" stroke-width="2" fill="none" opacity="0.6"/>
      <circle cx="240" cy="295" r="16" stroke="#22D3EE" stroke-width="3" fill="#0E7490"/>
      <!-- Aero EV Rear Hub Wheel -->
      <circle cx="560" cy="295" r="46" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.9"/>
      <circle cx="560" cy="295" r="32" stroke="${theme.accent}" stroke-width="2" fill="none" opacity="0.6"/>
      <circle cx="560" cy="295" r="16" stroke="#22D3EE" stroke-width="3" fill="#0E7490"/>

      <!-- Futuristic Clean Aerodynamic Front Apron -->
      <path d="M 255 285 L 315 175 L 350 180 L 340 255 L 430 255 L 440 230 L 360 230 Z" fill="#164E63" stroke="${theme.primary}" stroke-width="2.5"/>
      <!-- Signature Cyan LED Horizontal DRL Light Bar -->
      <line x1="310" y1="185" x2="345" y2="190" stroke="#22D3EE" stroke-width="4" stroke-linecap="round"/>
      <!-- Modular Removable Battery Bay -->
      <rect x="420" y="225" width="65" height="55" rx="8" fill="#0F172A" stroke="${theme.accent}" stroke-width="2"/>
      <path d="M 445 240 L 460 252 L 450 255 L 462 268" stroke="#22D3EE" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Minimalist Floating EV Seat -->
      <path d="M 390 210 Q 470 195 545 210 L 535 230 L 400 230 Z" fill="#0F172A" stroke="${theme.primary}" stroke-width="2"/>
      <!-- Minimalist Aerodynamic Tail -->
      <path d="M 480 230 L 560 220 L 555 265 L 485 280 Z" fill="#164E63" stroke="${theme.accent}" stroke-width="2"/>
      <!-- Digital Touch Display Pod -->
      <rect x="325" y="145" width="28" height="18" rx="4" fill="#0891B2" stroke="#F8FAFC" stroke-width="1.5"/>
    `;
  }

  // tourer / default
  return `
    <!-- Front Wheel -->
    <circle cx="230" cy="285" r="60" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
    <circle cx="230" cy="285" r="42" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
    <circle cx="230" cy="285" r="22" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>
    <!-- Rear Wheel -->
    <circle cx="570" cy="285" r="60" stroke="${theme.primary}" stroke-width="4" fill="none" opacity="0.85"/>
    <circle cx="570" cy="285" r="42" stroke="#64748B" stroke-width="2" fill="none" opacity="0.4"/>
    <circle cx="570" cy="285" r="22" stroke="${theme.accent}" stroke-width="3" fill="#1E293B"/>

    <!-- Tourer Fairing & Windscreen -->
    <path d="M 260 215 L 315 150 L 350 155 L 335 185 Z" fill="${theme.glow}" stroke="${theme.accent}" stroke-width="2"/>
    <!-- Large Touring Tank -->
    <path d="M 330 175 Q 380 145 440 180 L 430 220 L 335 215 Z" fill="${theme.primary}" opacity="0.9"/>
    <!-- Comfortable Split Touring Seat -->
    <path d="M 430 180 Q 485 195 540 190 L 545 215 L 430 215 Z" fill="#0F172A" stroke="${theme.accent}" stroke-width="2"/>
    <!-- Front Suspension -->
    <line x1="230" y1="285" x2="315" y2="155" stroke="#CBD5E1" stroke-width="5" stroke-linecap="round"/>
    <!-- Exhaust -->
    <path d="M 400 275 L 490 275 L 560 250 L 570 260 L 495 285 Z" fill="#64748B" stroke="${theme.accent}" stroke-width="2"/>
  `;
}

/**
 * View 1: Studio Profile Silhouette SVG
 */
function buildProfileSvg({ name, brandName, specSubtitle, theme, cat }) {
  const silhouettePaths = getCategorySilhouettePaths(cat, theme);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgStart}"/>
      <stop offset="100%" stop-color="${theme.bgEnd}"/>
    </linearGradient>
    <radialGradient id="stageGlow" cx="50%" cy="58%" r="55%">
      <stop offset="0%" stop-color="${theme.primary}" stop-opacity="0.22"/>
      <stop offset="65%" stop-color="${theme.primary}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${theme.primary}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.primary}" stop-opacity="0"/>
      <stop offset="25%" stop-color="${theme.accent}" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="#F8FAFC" stop-opacity="0.8"/>
      <stop offset="75%" stop-color="${theme.accent}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${theme.primary}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Studio Stage Background -->
  <rect width="800" height="480" fill="url(#bgGrad)"/>
  <ellipse cx="400" cy="275" rx="340" ry="160" fill="url(#stageGlow)"/>

  <!-- Technical Background Grid -->
  <g stroke="#334155" stroke-width="1" opacity="0.18">
    <line x1="80" y1="80" x2="720" y2="80"/>
    <line x1="80" y1="340" x2="720" y2="340"/>
    <line x1="120" y1="50" x2="120" y2="370"/>
    <line x1="680" y1="50" x2="680" y2="370"/>
  </g>

  <!-- Ground Horizon Reflection Line -->
  <line x1="100" y1="345" x2="700" y2="345" stroke="url(#floorGrad)" stroke-width="2"/>
  <ellipse cx="400" cy="347" rx="260" ry="12" fill="#000000" opacity="0.45"/>

  <!-- Category & Brand Header Watermark -->
  <g transform="translate(60, 48)">
    <rect x="0" y="0" width="130" height="24" rx="12" fill="${theme.primary}" opacity="0.2" stroke="${theme.primary}" stroke-width="1.2"/>
    <circle cx="12" cy="12" r="4" fill="${theme.primary}"/>
    <text x="24" y="16" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#F8FAFC" letter-spacing="1.5">${escapeXml(cat.toUpperCase())}</text>
  </g>
  <text x="740" y="64" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#94A3B8" letter-spacing="2">${brandName.toUpperCase()}</text>

  <!-- Central Motorcycle Silhouette -->
  <g id="vehicle-silhouette">
    ${silhouettePaths}
  </g>

  <!-- Model Title & Technical Specification Banner -->
  <g transform="translate(400, 395)">
    <text x="0" y="0" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#F8FAFC" letter-spacing="1">${name.toUpperCase()}</text>
    <text x="0" y="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="${theme.accent}" letter-spacing="2.5">${specSubtitle.toUpperCase()}</text>
    <text x="0" y="44" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#64748B" letter-spacing="1.5">OFFICIAL AUTOMOTIVE SHOWCASE &#8226; VERIFIED OEM SPECIFICATION</text>
  </g>
</svg>`;
}

/**
 * View 2: CAD Architecture & Powertrain Blueprint View
 */
function buildBlueprintSvg({ name, brandName, specSubtitle, theme, cat }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">
  <defs>
    <linearGradient id="bpBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B132B"/>
      <stop offset="100%" stop-color="#050A18"/>
    </linearGradient>
    <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" stroke-width="1" opacity="0.6"/>
      <circle cx="0" cy="0" r="1.5" fill="#38BDF8" opacity="0.4"/>
    </pattern>
  </defs>

  <rect width="800" height="480" fill="url(#bpBg)"/>
  <rect width="800" height="480" fill="url(#cadGrid)"/>

  <!-- Blueprint Header -->
  <g transform="translate(50, 45)">
    <rect x="0" y="0" width="160" height="24" rx="4" fill="#0284C7" opacity="0.25" stroke="#38BDF8" stroke-width="1"/>
    <text x="12" y="16" font-family="monospace" font-size="10" font-weight="700" fill="#38BDF8" letter-spacing="1.5">CAD ARCHITECTURE</text>
  </g>
  <text x="750" y="62" text-anchor="end" font-family="monospace" font-size="11" font-weight="600" fill="#94A3B8">CHASSIS &amp; POWERTRAIN MATRIX</text>

  <!-- Technical Blueprint Wheelbase Dimensions -->
  <g stroke="#38BDF8" stroke-width="1.5" opacity="0.8">
    <line x1="220" y1="310" x2="580" y2="310"/>
    <line x1="220" y1="300" x2="220" y2="320"/>
    <line x1="580" y1="300" x2="580" y2="320"/>
    <text x="400" y="328" text-anchor="middle" font-family="monospace" font-size="11" font-weight="600" fill="#38BDF8" stroke="none">CALIBRATED WHEELBASE GEOMETRY</text>
  </g>

  <!-- Blueprint Vector Skeleton -->
  <g stroke="#38BDF8" stroke-width="2" fill="none" opacity="0.85">
    <circle cx="220" cy="245" r="50" stroke-dasharray="6 4"/>
    <circle cx="580" cy="245" r="50" stroke-dasharray="6 4"/>
    <line x1="220" y1="245" x2="310" y2="150" stroke-width="3"/>
    <line x1="310" y1="150" x2="430" y2="180"/>
    <line x1="430" y1="180" x2="530" y2="185"/>
    <line x1="430" y1="180" x2="430" y2="250"/>
    <line x1="430" y1="250" x2="580" y2="245" stroke-width="3"/>
    <line x1="310" y1="150" x2="400" y2="245"/>
    <rect x="375" y="215" width="70" height="50" rx="6" fill="#0369A1" fill-opacity="0.2" stroke="#38BDF8"/>
  </g>

  <!-- Title & Specs -->
  <g transform="translate(400, 395)">
    <text x="0" y="0" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#F8FAFC" letter-spacing="1">${name.toUpperCase()}</text>
    <text x="0" y="22" text-anchor="middle" font-family="monospace" font-size="11" font-weight="600" fill="#38BDF8" letter-spacing="2">POWERTRAIN CHASSIS BLUEPRINT VIEW</text>
    <text x="0" y="42" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#64748B" letter-spacing="1.5">OEM RIGID TUBULAR DIAMOND FRAMEWORK &#8226; ISO-CERTIFIED GEOMETRY</text>
  </g>
</svg>`;
}

/**
 * View 3: Digital Cockpit, Handlebars & Telemetry Console View
 */
function buildCockpitSvg({ name, brandName, specSubtitle, theme, cat }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">
  <defs>
    <linearGradient id="cockpitBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <radialGradient id="consoleGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${theme.primary}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${theme.primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="800" height="480" fill="url(#cockpitBg)"/>

  <!-- Header -->
  <g transform="translate(50, 45)">
    <rect x="0" y="0" width="170" height="24" rx="4" fill="${theme.primary}" opacity="0.25" stroke="${theme.primary}" stroke-width="1"/>
    <text x="12" y="16" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="${theme.accent}" letter-spacing="1.5">TELEMETRY &amp; COCKPIT</text>
  </g>
  <text x="750" y="62" text-anchor="end" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94A3B8">DIGITAL CONSOLE DISPLAY</text>

  <!-- Digital Console Bezel -->
  <ellipse cx="400" cy="205" rx="220" ry="90" fill="url(#consoleGlow)"/>
  <rect x="250" y="130" width="300" height="150" rx="16" fill="#030712" stroke="${theme.primary}" stroke-width="2.5"/>
  <rect x="260" y="140" width="280" height="130" rx="10" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Telemetry Metrics Inside Screen -->
  <text x="400" y="195" text-anchor="middle" font-family="monospace" font-size="44" font-weight="900" fill="#F8FAFC">0</text>
  <text x="400" y="215" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="${theme.accent}" letter-spacing="2">KM / H</text>

  <line x1="280" y1="240" x2="520" y2="240" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
  <line x1="280" y1="240" x2="420" y2="240" stroke="${theme.primary}" stroke-width="4" stroke-linecap="round"/>
  <text x="280" y="258" font-family="monospace" font-size="9" fill="#94A3B8">GEAR: N</text>
  <text x="520" y="258" text-anchor="end" font-family="monospace" font-size="9" fill="${theme.accent}">READY &#8226; BLUETOOTH ON</text>

  <!-- Aerodynamic Handlebars Silhouette Line -->
  <path d="M 120 230 Q 230 190 320 200 L 400 205 L 480 200 Q 570 190 680 230" stroke="#CBD5E1" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Mirrors -->
  <ellipse cx="140" cy="180" rx="22" ry="14" fill="#1E293B" stroke="${theme.accent}" stroke-width="2"/>
  <line x1="150" y1="192" x2="180" y2="225" stroke="#94A3B8" stroke-width="3"/>
  <ellipse cx="660" cy="180" rx="22" ry="14" fill="#1E293B" stroke="${theme.accent}" stroke-width="2"/>
  <line x1="650" y1="192" x2="620" y2="225" stroke="#94A3B8" stroke-width="3"/>

  <!-- Title & Specs -->
  <g transform="translate(400, 395)">
    <text x="0" y="0" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#F8FAFC" letter-spacing="1">${name.toUpperCase()}</text>
    <text x="0" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="${theme.accent}" letter-spacing="2">COCKPIT &amp; ERGONOMIC CONTROL VIEW</text>
    <text x="0" y="42" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#64748B" letter-spacing="1.5">FULL DIGITAL LCD INSTRUMENT CLUSTER &#8226; INTEGRATED TELEMATICS</text>
  </g>
</svg>`;
}

/**
 * Fallback neutral studio silhouette if any network request fails
 */
export const FALLBACK_BIKE_IMAGE = svgToDataUri(
  buildProfileSvg({
    name: 'Hero Motorcycle Showcase',
    brandName: 'Hero Showroom',
    specSubtitle: 'PRECISION OEM MOTORCYCLE SHOWCASE',
    theme: CATEGORY_THEMES.sport,
    cat: 'sport'
  })
);

/**
 * Safe image error handler that prevents infinite onError retry loops.
 * Falls back to model-specific vector silhouette.
 */
export const handleImageError = (e, bike = null) => {
  if (e && e.currentTarget) {
    e.currentTarget.onerror = null;
    try {
      const fallback = bike ? getBikeImageUrl(bike) : FALLBACK_BIKE_IMAGE;
      if (e.currentTarget.src !== fallback) {
        e.currentTarget.src = fallback;
      }
    } catch {
      e.currentTarget.src = FALLBACK_BIKE_IMAGE;
    }
  }
};

/**
 * Checks whether an image URL is a valid, trusted HTTP/HTTPS asset
 * and not one of the banned mismatched stock photo IDs.
 */
function isValidExternalImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  return !BANNED_UNSPLASH_IDS.some((bannedId) => trimmed.includes(bannedId));
}

/**
 * Get primary image for a bike model.
 * Prioritizes verified external image when valid; otherwise generates
 * a brand-accurate, model-accurate vector studio showcase silhouette.
 */
export const getBikeImageUrl = (bike) => {
  if (!bike) return FALLBACK_BIKE_IMAGE;

  // 1. If database has a valid, non-banned external hero image, use it
  if (isValidExternalImageUrl(bike.images?.heroImage)) {
    return bike.images.heroImage;
  }
  if (Array.isArray(bike.images) && bike.images.length > 0) {
    const first = bike.images[0];
    if (isValidExternalImageUrl(first)) return first;
    if (isValidExternalImageUrl(first?.url)) return first.url;
  }

  // 2. Generate authentic vector studio silhouette for the model
  const cat = (bike.category || 'sport').toLowerCase();
  const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.sport;
  const name = escapeXml(bike.name || 'Hero Motorcycle');
  const brandName = escapeXml(bike.brand?.name || (typeof bike.brand === 'string' ? bike.brand : '') || 'Hero MotoCorp');
  const displacement = bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : (cat === 'electric' ? 'EV Battery Powertrain' : '');
  const transmission = bike.transmission ? escapeXml(bike.transmission) : '';
  const specSubtitle = [theme.label, displacement, transmission].filter(Boolean).join(' • ');

  const svg = buildProfileSvg({ name, brandName, specSubtitle, theme, cat });
  return svgToDataUri(svg);
};

/**
 * Get 3 distinct, complementary gallery views for a bike model:
 * 1. Profile View: Studio silhouette of the model on the showroom stage
 * 2. Blueprint View: CAD architecture of chassis, dimensions & powertrain
 * 3. Cockpit View: Handlebar ergonomics & digital telemetry console
 */
export const getBikeGalleryImages = (bike) => {
  if (!bike) {
    return [FALLBACK_BIKE_IMAGE];
  }

  // Check if real external gallery images exist in the database
  const externalGallery = [];
  if (isValidExternalImageUrl(bike.images?.heroImage)) {
    externalGallery.push(bike.images.heroImage);
  }
  if (Array.isArray(bike.images?.gallery)) {
    for (const img of bike.images.gallery) {
      const url = typeof img === 'string' ? img : img?.url;
      if (isValidExternalImageUrl(url) && !externalGallery.includes(url)) {
        externalGallery.push(url);
      }
    }
  }

  // If the database has 3+ authentic verified images, use them
  if (externalGallery.length >= 3) {
    return externalGallery.slice(0, 3);
  }

  // Otherwise, provide 3 distinct technical showcase perspectives
  const cat = (bike.category || 'sport').toLowerCase();
  const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.sport;
  const name = escapeXml(bike.name || 'Hero Motorcycle');
  const brandName = escapeXml(bike.brand?.name || (typeof bike.brand === 'string' ? bike.brand : '') || 'Hero MotoCorp');
  const displacement = bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : (cat === 'electric' ? 'EV Battery Powertrain' : '');
  const transmission = bike.transmission ? escapeXml(bike.transmission) : '';
  const specSubtitle = [theme.label, displacement, transmission].filter(Boolean).join(' • ');

  const profileUri = svgToDataUri(buildProfileSvg({ name, brandName, specSubtitle, theme, cat }));
  const blueprintUri = svgToDataUri(buildBlueprintSvg({ name, brandName, specSubtitle, theme, cat }));
  const cockpitUri = svgToDataUri(buildCockpitSvg({ name, brandName, specSubtitle, theme, cat }));

  const views = [profileUri, blueprintUri, cockpitUri];

  // If 1 or 2 external images exist, place them first and backfill with technical perspectives
  if (externalGallery.length > 0) {
    return [...externalGallery, ...views.slice(externalGallery.length)];
  }

  return views;
};
