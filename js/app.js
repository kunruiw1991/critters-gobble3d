/**
 * Critter Gobble 3D: Rainbow Toy Island! (Three.js 3D WebGL Katamari / Hole.io Toy World Engine)
 * Round 2 Upgrade:
 * - Upright 3D Critter Portrait Medallion + True Katamari Toy-Studded Rolling Ball (eaten 3D props stick & roll on your ball!)
 * - 3D Rainbow Sky Arch, Fluffy 3D Clouds, Animated Spinning Windmills, 4-Wheel Toy Cars & 4-Turret Golden Castles
 * - Quadrant-Spread AI Rivals + Opening Grace Window so rank starts at 🥇 (⭐⭐⭐) until action begins
 * - Clean window.__gobbleGame telemetry & test harness API
 */

/* global THREE */

const CRITTERS = [
  {
    id: 'dogday',
    icon: 'icons/dogday.jpg',
    badge: '☀️',
    earStyle: 'dog',
    bodyColor: 0xff8f00,
    trimColor: 0xffe082,
    skyColor: 0x4fc3f7,
    seaColor: 0x0288d1,
    beachColor: 0xffe082,
    grassColor: 0x5cc465,
    tileColor: 0x76d275,
    islandRadius: 42
  },
  {
    id: 'catnap',
    icon: 'icons/catnap.jpg',
    badge: '🌙',
    earStyle: 'cat',
    bodyColor: 0x7e57c2,
    trimColor: 0xe1bee7,
    skyColor: 0x392563,
    seaColor: 0x1a0f33,
    beachColor: 0xb39ddb,
    grassColor: 0x512da8,
    tileColor: 0x673ab7,
    islandRadius: 43
  },
  {
    id: 'craftycorn',
    icon: 'icons/craftycorn.jpg',
    badge: '🎨',
    earStyle: 'unicorn',
    bodyColor: 0x26c6da,
    trimColor: 0xffffff,
    skyColor: 0x80deea,
    seaColor: 0x00acc1,
    beachColor: 0xfff59d,
    grassColor: 0xf48fb1,
    tileColor: 0xf8bbd0,
    islandRadius: 44
  },
  {
    id: 'hoppy',
    icon: 'icons/hoppy.jpg',
    badge: '⚡',
    earStyle: 'bunny',
    bodyColor: 0x00c853,
    trimColor: 0xb9f6ca,
    skyColor: 0x29b6f6,
    seaColor: 0x0277bd,
    beachColor: 0xfff176,
    grassColor: 0x43a047,
    tileColor: 0x66bb6a,
    islandRadius: 45
  },
  {
    id: 'pickypiggy',
    icon: 'icons/picky.jpg',
    badge: '🍎',
    earStyle: 'pig',
    bodyColor: 0xf06292,
    trimColor: 0xf8bbd0,
    skyColor: 0xffb2dd,
    seaColor: 0xd81b60,
    beachColor: 0xffe0b2,
    grassColor: 0xff80ab,
    tileColor: 0xff4081,
    islandRadius: 46
  },
  {
    id: 'bubba',
    icon: 'icons/bubba.jpg',
    badge: '❄️',
    earStyle: 'elephant',
    bodyColor: 0x29b6f6,
    trimColor: 0xb3e5fc,
    skyColor: 0x90caf9,
    seaColor: 0x1565c0,
    beachColor: 0xffffff,
    grassColor: 0x4fc3f7,
    tileColor: 0x81d4fa,
    islandRadius: 47
  },
  {
    id: 'bobby',
    icon: 'icons/bobby.jpg',
    badge: '💖',
    earStyle: 'bear',
    bodyColor: 0xe53935,
    trimColor: 0xffcdd2,
    skyColor: 0xff8a80,
    seaColor: 0xc62828,
    beachColor: 0xffe082,
    grassColor: 0xef5350,
    tileColor: 0xe57373,
    islandRadius: 48
  },
  {
    id: 'kickinchicken',
    icon: 'icons/kickin.jpg',
    badge: '🔥',
    earStyle: 'chicken',
    bodyColor: 0xffca28,
    trimColor: 0xff6f00,
    skyColor: 0xffab40,
    seaColor: 0xe65100,
    beachColor: 0xffe082,
    grassColor: 0xf57c00,
    tileColor: 0xff9800,
    islandRadius: 50
  }
];

const RAINBOW_HEX = [0xff5252, 0xff9100, 0xffea00, 0x00e676, 0x00b0ff, 0xd500f9];

// Size Tier Definitions
const MIN_RADIUS = 1.0;
const MAX_TARGET_RADIUS = 3.6;
const TIER_THRESHOLDS = [1.0, 1.45, 2.15, 2.95];
const TIER_EMOJIS = ['🌱', '🌳', '🏡', '🏰', '👑'];
const ROUND_DURATION_SEC = 45.0;

// Web Audio Toy Synthesizer
let soundEnabled = true;
let audioCtx = null;
let noiseBuffer = null;

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  if (audioCtx && !noiseBuffer) {
    const sr = audioCtx.sampleRate;
    noiseBuffer = audioCtx.createBuffer(1, sr * 0.5, sr);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.18));
    }
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.14, gainVal = 0.14, slideTo = null) {
  if (!soundEnabled || !audioCtx || audioCtx.state !== 'running') return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), audioCtx.currentTime + duration);
    }
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

function playNoiseBurst(startFreq = 1200, endFreq = 200, duration = 0.22, gainVal = 0.32) {
  if (!soundEnabled || !audioCtx || audioCtx.state !== 'running' || !noiseBuffer) return;
  try {
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), audioCtx.currentTime + duration);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
    src.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

let gobbleComboCount = 0;
let gobbleComboTimer = 0;

function playGobblePopSfx(tier = 1) {
  const baseFreq = 320 + Math.min(12, gobbleComboCount) * 38 + tier * 55;
  playTone(baseFreq, 'sine', 0.13, 0.18, baseFreq * 1.48);
  if (tier >= 3) {
    playTone(160, 'triangle', 0.22, 0.25, 65);
    playNoiseBurst(1400, 260, 0.18, 0.22);
  }
}

function playTierUpFanfare() {
  [440, 554.37, 659.25, 880].forEach((f, i) => {
    setTimeout(() => playTone(f, 'triangle', 0.2, 0.2, f * 1.08), i * 65);
  });
}

function playBonkCrashSfx() {
  playTone(135, 'triangle', 0.28, 0.4, 28);
  playTone(195, 'sawtooth', 0.18, 0.22, 55);
  playNoiseBurst(1600, 140, 0.24, 0.36);
}

function playQuakeSfx() {
  playTone(150, 'sawtooth', 0.34, 0.38, 25);
  playNoiseBurst(1900, 180, 0.28, 0.38);
}

function playWinFanfare(starsEarned = 3) {
  const notes =
    starsEarned === 3
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : starsEarned === 2
        ? [523.25, 659.25, 783.99, 1046.5]
        : [523.25, 659.25, 783.99];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'triangle', 0.25, 0.18, f * 1.05), i * 85);
  });
}

function playLoseSadSfx() {
  [392.0, 369.99, 349.23, 311.13].forEach((f, i) => {
    const dur = i === 3 ? 0.48 : 0.22;
    setTimeout(() => playTone(f, 'sawtooth', dur, 0.2, f * 0.86), i * 195);
  });
}

// Progress Persistence
let currentWorld = 0;
let cupStars = new Array(CRITTERS.length).fill(0);
try {
  const saved = JSON.parse(localStorage.getItem('critters_gobble3d_stars_v1') || 'null');
  if (Array.isArray(saved) && saved.length === CRITTERS.length) {
    cupStars = saved;
  }
} catch (_) {}

function saveProgress() {
  try {
    localStorage.setItem('critters_gobble3d_stars_v1', JSON.stringify(cupStars));
  } catch (_) {}
}

function isWorldUnlocked(idx) {
  if (idx <= 0) return true;
  return (cupStars[idx - 1] || 0) >= 1 || (cupStars[idx] || 0) >= 1;
}

// Three.js WebGL Setup
const canvas = document.getElementById('webglCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 380);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x37474f, 0.98);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff8e1, 1.22);
dirLight.position.set(30, 56, 36);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 5;
dirLight.shadow.camera.far = 160;
const dCam = 56;
dirLight.shadow.camera.left = -dCam;
dirLight.shadow.camera.right = dCam;
dirLight.shadow.camera.top = dCam;
dirLight.shadow.camera.bottom = -dCam;
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();
const critterTextures = {};
CRITTERS.forEach((c) => {
  critterTextures[c.id] = textureLoader.load(c.icon);
});

const worldGroup = new THREE.Group();
scene.add(worldGroup);

const dynamicGroup = new THREE.Group();
scene.add(dynamicGroup);

// Build a 3D Sculpted Rolling Katamari Ball + Upright Critter Portrait Rider + Vortex Ring + Leader Crown!
function createGobblerMesh(critterCfg, isPlayer = false) {
  const root = new THREE.Group();
  const deformGroup = new THREE.Group();
  root.add(deformGroup);

  // Rolling Katamari Core Sphere (rotates physically as the ball rolls and collects stuck 3D toys!)
  const rollBallGroup = new THREE.Group();
  rollBallGroup.position.y = 1.0;
  deformGroup.add(rollBallGroup);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: critterCfg.bodyColor,
    roughness: 0.25,
    metalness: 0.12
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: critterCfg.trimColor,
    roughness: 0.22,
    metalness: 0.18
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd54f,
    emissive: 0xff8f00,
    emissiveIntensity: 0.35,
    metalness: 0.65,
    roughness: 0.2
  });

  // Main Rolling Sphere Core
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.96, 24, 24), bodyMat);
  sphere.castShadow = true;
  rollBallGroup.add(sphere);

  // Two Orthogonal Candy-Stripe Ribbons around the Rolling Ball (makes rolling motion vivid from every angle!)
  const band1 = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.065, 10, 28), trimMat);
  band1.rotation.x = Math.PI / 2;
  rollBallGroup.add(band1);

  const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.065, 10, 28), trimMat);
  band2.rotation.y = Math.PI / 2;
  rollBallGroup.add(band2);

  // Container inside rollBallGroup for gobbled 3D Toy Props that stick onto the Katamari ball!
  const stuckToysGroup = new THREE.Group();
  rollBallGroup.add(stuckToysGroup);

  // Upright Critter Rider / Portrait Medallion + 3D Character Ears + Crown + Dizzy Stars
  // Positioned cleanly ABOVE the rolling Katamari sphere (y = 2.08) and billboarded toward the camera
  // so the Critter's smiling face is 100% unobstructed from every angle!
  const headCrest = new THREE.Group();
  headCrest.position.set(0, 2.08, 0.15);
  deformGroup.add(headCrest);

  // Golden / Team-Colored Bezel Backing Disc
  const bezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.64, 0.64, 0.12, 28),
    isPlayer ? goldMat : trimMat
  );
  bezel.rotation.x = Math.PI / 2;
  headCrest.add(bezel);

  // Crisp Critter Portrait Badge on Front of Bezel
  const tex = critterTextures[critterCfg.id];
  const badgeMat = new THREE.MeshBasicMaterial({ map: tex });
  const frontBadge = new THREE.Mesh(new THREE.CircleGeometry(0.56, 28), badgeMat);
  frontBadge.position.set(0, 0, 0.075);
  headCrest.add(frontBadge);

  // Cute 3D Character Ears / Horn / Crest around the Upright Portrait Bezel
  if (critterCfg.earStyle === 'dog') {
    [-0.64, 0.64].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.56, 0.24), bodyMat);
      ear.position.set(ex, 0.12, -0.02);
      ear.rotation.z = ex < 0 ? 0.32 : -0.32;
      headCrest.add(ear);
    });
  } else if (critterCfg.earStyle === 'cat') {
    [-0.48, 0.48].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.52, 12), bodyMat);
      ear.position.set(ex, 0.56, -0.02);
      ear.rotation.z = ex < 0 ? 0.25 : -0.25;
      headCrest.add(ear);
    });
  } else if (critterCfg.earStyle === 'unicorn') {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.68, 12), goldMat);
    horn.position.set(0, 0.78, 0.04);
    headCrest.add(horn);
  } else if (critterCfg.earStyle === 'bunny') {
    [-0.34, 0.34].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.76, 12), bodyMat);
      ear.position.set(ex, 0.74, -0.02);
      headCrest.add(ear);
    });
  } else if (critterCfg.earStyle === 'elephant') {
    [-0.74, 0.74].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), trimMat);
      ear.scale.set(0.42, 1.0, 0.85);
      ear.position.set(ex, 0.12, -0.04);
      headCrest.add(ear);
    });
  } else if (critterCfg.earStyle === 'chicken') {
    const crest = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.48, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xff5252 })
    );
    crest.position.set(0, 0.68, 0);
    headCrest.add(crest);
  } else {
    [-0.5, 0.5].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), bodyMat);
      ear.position.set(ex, 0.5, -0.02);
      headCrest.add(ear);
    });
  }

  // 3D Golden 1st-Place Leader Crown above the Critter Portrait
  const leaderCrown = new THREE.Group();
  leaderCrown.position.set(0, 0.86, 0);
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.32, 8), goldMat);
  leaderCrown.add(crownBase);
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const jewel = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({ color: RAINBOW_HEX[i] })
    );
    jewel.position.set(Math.cos(ang) * 0.36, 0.16, Math.sin(ang) * 0.36);
    leaderCrown.add(jewel);
  }
  leaderCrown.visible = isPlayer;
  headCrest.add(leaderCrown);

  // 3D Orbiting Dizzy Stars Halo (visible when bonked/stunned!)
  const dizzyHalo = new THREE.Group();
  dizzyHalo.position.set(0, 0.8, 0);
  const dizzyStarGeo = new THREE.OctahedronGeometry(0.2, 0);
  const dizzyStarMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const st = new THREE.Mesh(dizzyStarGeo, dizzyStarMat);
    st.position.set(Math.cos(ang) * 0.75, 0, Math.sin(ang) * 0.75);
    dizzyHalo.add(st);
  }
  dizzyHalo.visible = false;
  headCrest.add(dizzyHalo);

  // Ground Glowing Suction Vortex Ring
  const vortexRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.38, 0.085, 12, 36),
    new THREE.MeshBasicMaterial({
      color: isPlayer ? 0xffea00 : critterCfg.bodyColor,
      transparent: true,
      opacity: isPlayer ? 0.9 : 0.58
    })
  );
  vortexRing.rotation.x = Math.PI / 2;
  vortexRing.position.y = 0.08;
  root.add(vortexRing);

  // Outer Magnet Power-Up Ring (for Player)
  let magnetRing = null;
  if (isPlayer) {
    magnetRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.35, 0.11, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0xe040fb, transparent: true, opacity: 0.88 })
    );
    magnetRing.rotation.x = Math.PI / 2;
    magnetRing.position.y = 0.12;
    magnetRing.visible = false;
    root.add(magnetRing);
  }

  return {
    root,
    deformGroup,
    rollBallGroup,
    stuckToysGroup,
    headCrest,
    leaderCrown,
    dizzyHalo,
    vortexRing,
    magnetRing,
    stuckCount: 0
  };
}

// Create Sculpted 3D Toy Props across 4 Size Tiers!
// Includes animated parts (e.g., spinning windmill blades & spinning star gems) + base edibility ring!
function createToyPropMesh(tier, variant = 0) {
  const g = new THREE.Group();
  const modelGroup = new THREE.Group();
  g.add(modelGroup);

  const colorHex = RAINBOW_HEX[variant % RAINBOW_HEX.length];
  let spinPart = null;

  if (tier === 1) {
    // Tier 1 (Tiny Snacks: Frosted Cupcake / Polka Mushroom / Spinning Star Gem / Toy Duck)
    const kind = variant % 4;
    if (kind === 0) {
      // Frosted Cupcake with Cherry
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.3, 0.45, 12),
        new THREE.MeshStandardMaterial({ color: 0xffb74d, roughness: 0.5 })
      );
      cup.position.y = 0.22;
      const frosting = new THREE.Mesh(
        new THREE.SphereGeometry(0.46, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0xf48fb1, roughness: 0.3 })
      );
      frosting.position.y = 0.52;
      const cherry = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xd50000 })
      );
      cherry.position.y = 0.95;
      modelGroup.add(cup, frosting, cherry);
    } else if (kind === 1) {
      // Polka-Dot Bouncy Mushroom
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.3, 0.55, 10),
        new THREE.MeshStandardMaterial({ color: 0xfff8e1 })
      );
      stem.position.y = 0.27;
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 14, 12),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.28 })
      );
      cap.scale.y = 0.65;
      cap.position.y = 0.64;
      modelGroup.add(stem, cap);
    } else if (kind === 2) {
      // Spinning Golden Star Gem
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.56, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffea00,
          emissive: 0xff9100,
          emissiveIntensity: 0.48,
          roughness: 0.18
        })
      );
      gem.position.y = 0.65;
      modelGroup.add(gem);
      spinPart = gem;
    } else {
      // Cute Yellow Toy Rubber Duckie
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.44, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffea00, roughness: 0.25 })
      );
      body.scale.set(1.0, 0.82, 1.25);
      body.position.y = 0.36;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffea00, roughness: 0.25 })
      );
      head.position.set(0, 0.72, 0.24);
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.24, 8),
        new THREE.MeshBasicMaterial({ color: 0xff6d00 })
      );
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.7, 0.52);
      modelGroup.add(body, head, beak);
    }
  } else if (tier === 2) {
    // Tier 2 (Medium Props: 4-Wheel Toy Race Car / Giant Swirl Lollipop / Apple Tree Bush)
    const kind = variant % 3;
    if (kind === 0) {
      // 3D 4-Wheeled Toy Car
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.38, 0.52, 2.15),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.22 })
      );
      body.position.y = 0.48;
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 0.48, 1.1),
        new THREE.MeshStandardMaterial({ color: 0xe1f5fe, roughness: 0.12 })
      );
      cabin.position.set(0, 0.92, -0.08);
      modelGroup.add(body, cabin);

      const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.6 });
      [
        [-0.72, 0.28, 0.65],
        [0.72, 0.28, 0.65],
        [-0.72, 0.28, -0.65],
        [0.72, 0.28, -0.65]
      ].forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(wx, wy, wz);
        modelGroup.add(w);
      });
    } else if (kind === 1) {
      // Giant Swirl Lollipop with Inner Ring
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.65, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      stick.position.y = 0.82;
      const candy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.82, 0.82, 0.28, 20),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2 })
      );
      candy.rotation.z = Math.PI / 2;
      candy.position.y = 1.8;
      const swirl = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.1, 8, 18),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      swirl.rotation.y = Math.PI / 2;
      swirl.position.set(0.14, 1.8, 0);
      modelGroup.add(stick, candy, swirl);
    } else {
      // Lush Fruit Bush with Bright Berries
      const b1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 })
      );
      b1.position.y = 0.88;
      modelGroup.add(b1);
      [
        [0.52, 1.35, 0.35],
        [-0.48, 1.25, 0.42],
        [0.15, 1.48, -0.45]
      ].forEach(([bx, by, bz], idx) => {
        const berry = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 10, 10),
          new THREE.MeshBasicMaterial({ color: RAINBOW_HEX[(variant + idx) % RAINBOW_HEX.length] })
        );
        berry.position.set(bx, by, bz);
        modelGroup.add(berry);
      });
    }
  } else if (tier === 3) {
    // Tier 3 (Large Town Props: Gingerbread Toy Cottage / Spinning Candy Windmill / Layered Pine Tree)
    const kind = variant % 3;
    if (kind === 0) {
      // 3D Gingerbread Toy Cottage with Door & Chimney
      const walls = new THREE.Mesh(
        new THREE.BoxGeometry(2.35, 1.95, 2.35),
        new THREE.MeshStandardMaterial({ color: 0xfff8e1, roughness: 0.4 })
      );
      walls.position.y = 0.98;
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.15, 1.6, 4),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 })
      );
      roof.position.y = 2.72;
      roof.rotation.y = Math.PI / 4;
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.05, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xffb300 })
      );
      door.position.set(0, 0.55, 1.18);
      modelGroup.add(walls, roof, door);
    } else if (kind === 1) {
      // Animated Spinning Candy Windmill!
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 1.35, 2.6, 12),
        new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.35 })
      );
      tower.position.y = 1.3;
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 14, 12),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.25 })
      );
      dome.position.y = 2.65;

      const rotor = new THREE.Group();
      rotor.position.set(0, 2.35, 0.98);
      const hub = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      rotor.add(hub);
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 1.45, 0.08),
          new THREE.MeshBasicMaterial({ color: RAINBOW_HEX[(variant + b) % RAINBOW_HEX.length] })
        );
        const bAng = (b * Math.PI) / 2;
        blade.position.set(Math.cos(bAng) * 0.72, Math.sin(bAng) * 0.72, 0.06);
        blade.rotation.z = bAng + Math.PI / 2;
        rotor.add(blade);
      }
      modelGroup.add(tower, dome, rotor);
      spinPart = rotor;
    } else {
      // Tall 3-Tier Toy Pine Tree with Star Topper
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.52, 1.6, 10),
        new THREE.MeshStandardMaterial({ color: 0x6d4c41 })
      );
      trunk.position.y = 0.8;
      const c1 = new THREE.Mesh(
        new THREE.ConeGeometry(1.8, 2.3, 10),
        new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
      );
      c1.position.y = 2.15;
      const c2 = new THREE.Mesh(
        new THREE.ConeGeometry(1.35, 1.95, 10),
        new THREE.MeshStandardMaterial({ color: 0x43a047 })
      );
      c2.position.y = 3.35;
      const topStar = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.38, 0),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      topStar.position.y = 4.45;
      modelGroup.add(trunk, c1, c2, topStar);
    }
  } else {
    // Tier 4 (Giant Landmarks: 4-Turret Golden Fairy-Tale Castle OR Giant Spinning Rainbow Ferris Wheel!)
    if (variant === 1) {
      // Giant Spinning Rainbow Ferris Wheel Monument!
      const legMat = new THREE.MeshStandardMaterial({ color: 0xfff8e1, roughness: 0.3 });
      [-0.75, 0.75].forEach((lz) => {
        const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.8, 10), legMat);
        legL.position.set(-0.9, 1.7, lz);
        legL.rotation.z = -0.26;
        const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.8, 10), legMat);
        legR.position.set(0.9, 1.7, lz);
        legR.rotation.z = 0.26;
        modelGroup.add(legL, legR);
      });

      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(0, 3.4, 0);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(2.1, 0.16, 12, 32),
        new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0xff8f00, emissiveIntensity: 0.3 })
      );
      wheelGroup.add(rim);
      const hub = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff4081 })
      );
      wheelGroup.add(hub);

      for (let gIdx = 0; gIdx < 6; gIdx++) {
        const gAng = (gIdx / 6) * Math.PI * 2;
        const spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.07, 4.1, 8),
          legMat
        );
        spoke.rotation.z = gAng;
        wheelGroup.add(spoke);

        const gondola = new THREE.Mesh(
          new THREE.SphereGeometry(0.42, 12, 12),
          new THREE.MeshStandardMaterial({ color: RAINBOW_HEX[gIdx % RAINBOW_HEX.length], roughness: 0.2 })
        );
        gondola.position.set(Math.cos(gAng) * 2.1, Math.sin(gAng) * 2.1, 0);
        wheelGroup.add(gondola);
      }
      modelGroup.add(wheelGroup);
      spinPart = wheelGroup;
    } else {
      // Giant 4-Turret Golden Fairy-Tale Castle Monument!
      const goldCastleMat = new THREE.MeshStandardMaterial({
        color: 0xffd54f,
        emissive: 0xff8f00,
        emissiveIntensity: 0.25,
        metalness: 0.48,
        roughness: 0.24
      });
      const spireMat = new THREE.MeshStandardMaterial({ color: 0xff4081, roughness: 0.22 });

      const keep = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.2, 2.9, 14), goldCastleMat);
      keep.position.y = 1.45;
      const mainSpire = new THREE.Mesh(new THREE.ConeGeometry(1.75, 2.3, 14), spireMat);
      mainSpire.position.y = 4.0;
      const crownStar = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.82, 0),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
      );
      crownStar.position.y = 5.55;
      modelGroup.add(keep, mainSpire, crownStar);
      spinPart = crownStar;

      // 4 Corner Turrets around the Castle Keep
      for (let t = 0; t < 4; t++) {
        const tAng = (t * Math.PI) / 2 + Math.PI / 4;
        const tx = Math.cos(tAng) * 1.95;
        const tz = Math.sin(tAng) * 1.95;
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 2.2, 10), goldCastleMat);
        turret.position.set(tx, 1.1, tz);
        const tRoof = new THREE.Mesh(
          new THREE.ConeGeometry(0.7, 1.1, 10),
          new THREE.MeshStandardMaterial({ color: RAINBOW_HEX[t], roughness: 0.25 })
        );
        tRoof.position.set(tx, 2.75, tz);
        modelGroup.add(turret, tRoof);
      }
    }
  }

  modelGroup.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  // Base Edibility Halo Ring (Green = Can Eat Now! Red = Too Big, Will Bonk!)
  const ringScale = tier === 1 ? 0.65 : tier === 2 ? 1.25 : tier === 3 ? 1.85 : 2.65;
  const ringMat = new THREE.MeshBasicMaterial({
    color: tier === 1 ? 0x00e676 : 0xff5252,
    transparent: true,
    opacity: tier === 1 ? 0.5 : 0.65
  });
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(ringScale, 0.075, 8, 24), ringMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.05;
  g.add(baseRing);

  return { group: g, modelGroup, baseRing, ringMat, spinPart, tier };
}

// Game State
let playerGobbler = null;
let playerState = {
  x: 0,
  y: 0,
  z: 0,
  vx: 0,
  vz: 0,
  knockVx: 0,
  knockVz: 0,
  vy: 0,
  radius: MIN_RADIUS,
  tier: 0,
  squash: 0,
  dizzyTimer: 0,
  dashTimer: 0,
  magnetTimer: 0,
  bonkCooldown: 0,
  inputDx: 0,
  inputDz: 0,
  gobbledCount: 0
};

let camTrauma = {
  shake: 0,
  fovKick: 0,
  zoomKick: 0
};

let hitStopTimer = 0;
let roundTimeRemaining = ROUND_DURATION_SEC;
let roundElapsedSec = 0;
let raceFinished = false;
let playerFinishRank = 1;
let playerLostRace = false;
let podiumOrbitAngle = 0;
let steerGuideShown = true;
let candyRespawnTimer = 0;

let rivals = [];
let toyProps = [];
let suckingProps = [];
let particles3D = [];
let shockwaves3D = [];
let clouds3D = [];

function showIslandToast(emojiText) {
  const el = document.getElementById('islandToast');
  if (!el) return;
  el.textContent = emojiText;
  el.classList.remove('hidden');
  clearTimeout(showIslandToast._t);
  showIslandToast._t = setTimeout(() => el.classList.add('hidden'), 1200);
}

function triggerImpactScreenEffect(mode = 'tier-up', badgeEmoji = '👑') {
  const overlay = document.getElementById('impactFlashOverlay');
  const badge = document.getElementById('impactBadgeBurst');
  if (overlay) {
    overlay.className = `impact-flash-overlay ${mode}`;
    clearTimeout(triggerImpactScreenEffect._ft);
    triggerImpactScreenEffect._ft = setTimeout(() => {
      overlay.className = 'impact-flash-overlay';
    }, 190);
  }
  if (badge && badgeEmoji) {
    badge.textContent = badgeEmoji;
    badge.classList.remove('hidden');
    clearTimeout(triggerImpactScreenEffect._bt);
    triggerImpactScreenEffect._bt = setTimeout(() => {
      badge.classList.add('hidden');
    }, 380);
  }
}

function hideSteerGuide() {
  if (!steerGuideShown) return;
  steerGuideShown = false;
  const g = document.getElementById('steerGuide');
  if (g) g.classList.add('hidden');
}

function clearGroup(group) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
}

function spawnShockwave3D(x, y, z, hexColor = 0xffea00, maxScale = 5.0) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.14, 12, 28),
    new THREE.MeshBasicMaterial({ color: hexColor, transparent: true, opacity: 0.95 })
  );
  ring.position.set(x, y, z);
  ring.rotation.x = Math.PI / 2;

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.9 })
  );
  core.position.set(x, y, z);

  dynamicGroup.add(ring, core);
  shockwaves3D.push({
    ring,
    core,
    maxScale,
    life: 0.28,
    maxLife: 0.28
  });
}

function spawn3DBurst(x, y, z, hexColor, count = 14) {
  const geo = new THREE.OctahedronGeometry(0.22, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: hexColor,
    emissive: hexColor,
    emissiveIntensity: 0.45,
    roughness: 0.25
  });
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    const ang = Math.random() * Math.PI * 2;
    const spd = 5 + Math.random() * 11;
    dynamicGroup.add(m);
    particles3D.push({
      mesh: m,
      vx: Math.cos(ang) * spd,
      vy: 4 + Math.random() * 9,
      vz: Math.sin(ang) * spd,
      rvx: (Math.random() - 0.5) * 14,
      rvy: (Math.random() - 0.5) * 14,
      gravity: 24,
      bounce: true,
      life: 0.65
    });
  }
}

function getTierForRadius(r) {
  if (r >= TIER_THRESHOLDS[3]) return 3; // Tier 4 Giant Castle eater
  if (r >= TIER_THRESHOLDS[2]) return 2; // Tier 3 Cottage/Tree eater
  if (r >= TIER_THRESHOLDS[1]) return 1; // Tier 2 Car/Bush eater
  return 0;                              // Tier 1 Candy/Mushroom eater
}

function spawnToyPropOnIsland(tier, variant, x, z) {
  const reqRadius = TIER_THRESHOLDS[tier - 1];
  const growGain = tier === 1 ? 0.042 : tier === 2 ? 0.092 : tier === 3 ? 0.18 : 0.38;
  const hitRadius = tier === 1 ? 0.85 : tier === 2 ? 1.35 : tier === 3 ? 1.95 : 2.75;
  const { group, modelGroup, baseRing, ringMat, spinPart } = createToyPropMesh(tier, variant);
  group.position.set(x, 0, z);
  group.rotation.y = (variant * 1.3) % (Math.PI * 2);
  dynamicGroup.add(group);

  const prop = {
    mesh: group,
    modelGroup,
    baseRing,
    ringMat,
    spinPart,
    tier,
    variant,
    x,
    y: 0,
    z,
    reqRadius,
    growGain,
    hitRadius,
    wobble: 0,
    eaten: false
  };
  toyProps.push(prop);
  return prop;
}

// Build Complete 3D Floating Toy Island Diorama for Selected Smiling Critter
function buildIslandWorld(worldIdx) {
  currentWorld = worldIdx;
  const cfg = CRITTERS[worldIdx];

  clearGroup(worldGroup);
  clearGroup(dynamicGroup);

  rivals = [];
  toyProps = [];
  suckingProps = [];
  particles3D = [];
  shockwaves3D = [];
  clouds3D = [];

  roundTimeRemaining = ROUND_DURATION_SEC;
  roundElapsedSec = 0;
  raceFinished = false;
  playerFinishRank = 1;
  playerLostRace = false;
  clearTimeout(finishIslandRound._modalTimer);
  podiumOrbitAngle = 0;
  hitStopTimer = 0;
  candyRespawnTimer = 0;
  gobbleComboCount = 0;
  gobbleComboTimer = 0;
  camTrauma = { shake: 0, fovKick: 0, zoomKick: 0 };

  scene.background = new THREE.Color(cfg.skyColor);
  scene.fog = new THREE.FogExp2(cfg.skyColor, 0.0038);

  const islandR = cfg.islandRadius;

  // Sparkling Ocean Plane + Shoreline Foam Ring
  const seaMat = new THREE.MeshStandardMaterial({
    color: cfg.seaColor,
    roughness: 0.22,
    metalness: 0.18
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(380, 380), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.8;
  worldGroup.add(sea);

  const foamRing = new THREE.Mesh(
    new THREE.TorusGeometry(islandR + 5.6, 0.45, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })
  );
  foamRing.rotation.x = Math.PI / 2;
  foamRing.position.y = -0.68;
  worldGroup.add(foamRing);

  // Golden Sandy Beach Rim
  const beach = new THREE.Mesh(
    new THREE.CylinderGeometry(islandR + 3.8, islandR + 6.2, 1.2, 48),
    new THREE.MeshStandardMaterial({ color: cfg.beachColor, roughness: 0.72 })
  );
  beach.position.y = -0.55;
  beach.receiveShadow = true;
  worldGroup.add(beach);

  // Main Circular Grass Island Platform
  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(islandR, islandR + 1.5, 1.2, 48),
    new THREE.MeshStandardMaterial({ color: cfg.grassColor, roughness: 0.62 })
  );
  grass.position.y = -0.5;
  grass.receiveShadow = true;
  worldGroup.add(grass);

  // Decorative Checkerboard Park Tiles
  const tileGeo = new THREE.PlaneGeometry(4.5, 4.5);
  tileGeo.rotateX(-Math.PI / 2);
  const tileMat = new THREE.MeshStandardMaterial({ color: cfg.tileColor, roughness: 0.58 });
  for (let gx = -islandR + 8; gx <= islandR - 8; gx += 9) {
    for (let gz = -islandR + 8; gz <= islandR - 8; gz += 9) {
      if (gx * gx + gz * gz < (islandR - 5) * (islandR - 5)) {
        const t = new THREE.Mesh(tileGeo, tileMat);
        t.position.set(gx, 0.11, gz);
        t.receiveShadow = true;
        worldGroup.add(t);
      }
    }
  }

  // 3D Giant Rainbow Arch Spanning Across the Island Horizon!
  const rainbowGroup = new THREE.Group();
  rainbowGroup.position.set(0, -2, -islandR - 8);
  RAINBOW_HEX.forEach((hex, idx) => {
    const archR = islandR * 1.15 - idx * 1.15;
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(archR, 0.55, 10, 48, Math.PI),
      new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.85 })
    );
    rainbowGroup.add(arch);
  });
  worldGroup.add(rainbowGroup);

  // 8 Fluffy 3D White Toy Clouds Drifting in the Sky!
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  for (let c = 0; c < 8; c++) {
    const cg = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 12), cloudMat);
    const p2 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 12, 12), cloudMat);
    p2.position.set(2.1, -0.3, 0.2);
    const p3 = new THREE.Mesh(new THREE.SphereGeometry(1.9, 12, 12), cloudMat);
    p3.position.set(-2.0, -0.4, -0.2);
    cg.add(p1, p2, p3);
    const cAng = (c / 8) * Math.PI * 2;
    const cDist = islandR + 12 + (c % 2) * 10;
    cg.position.set(Math.cos(cAng) * cDist, 15 + (c % 3) * 3.5, Math.sin(cAng) * cDist - 10);
    worldGroup.add(cg);
    clouds3D.push({ group: cg, baseAng: cAng, dist: cDist, speed: 0.04 + (c % 3) * 0.015 });
  }

  // 6 Floating 3D Toy Sailboats Bobbing in the Sparkling Ocean!
  for (let b = 0; b < 6; b++) {
    const bg = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 0.9, 0.65, 10),
      new THREE.MeshStandardMaterial({ color: 0xffe0b2, roughness: 0.4 })
    );
    hull.scale.set(1.0, 1.0, 1.75);
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    mast.position.y = 1.3;
    const sail = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 2.1, 3),
      new THREE.MeshStandardMaterial({ color: RAINBOW_HEX[b % RAINBOW_HEX.length], roughness: 0.3 })
    );
    sail.position.set(0, 1.5, 0.15);
    bg.add(hull, mast, sail);
    const bAng = (b / 6) * Math.PI * 2 + 0.3;
    const bDist = islandR + 11.5 + (b % 2) * 4.5;
    bg.position.set(Math.cos(bAng) * bDist, -0.45, Math.sin(bAng) * bDist);
    worldGroup.add(bg);
    clouds3D.push({ group: bg, baseAng: bAng, dist: bDist, speed: -0.055, isBoat: true });
  }

  // Rainbow Bumper Posts around the Island Edge
  const postCount = 36;
  const postGeo = new THREE.CylinderGeometry(0.45, 0.5, 1.15, 10);
  const capGeo = new THREE.SphereGeometry(0.5, 10, 10);
  for (let i = 0; i < postCount; i++) {
    const ang = (i / postCount) * Math.PI * 2;
    const colMat = new THREE.MeshStandardMaterial({
      color: RAINBOW_HEX[i % RAINBOW_HEX.length],
      roughness: 0.3
    });
    const post = new THREE.Mesh(postGeo, colMat);
    const px = Math.cos(ang) * (islandR - 0.6);
    const pz = Math.sin(ang) * (islandR - 0.6);
    post.position.set(px, 0.55, pz);
    const cap = new THREE.Mesh(capGeo, colMat);
    cap.position.set(px, 1.15, pz);
    worldGroup.add(post, cap);
  }

  // Populate 4 Tiers of 3D Toy Props across the Island:
  // - 3 Tier-4 Giant 4-Turret Golden Castles in a triangle
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + 0.45;
    const dist = 15.5;
    spawnToyPropOnIsland(4, i, Math.cos(ang) * dist, Math.sin(ang) * dist);
  }

  // - 12 Tier-3 Large Gingerbread Cottages, Spinning Windmills & Pine Trees
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + 0.2;
    const dist = 20.5 + (i % 2) * 6.5;
    spawnToyPropOnIsland(3, i, Math.cos(ang) * dist, Math.sin(ang) * dist);
  }

  // - 20 Tier-2 Medium 4-Wheel Toy Cars, Swirl Lollipops & Berry Bushes
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2 + 0.1;
    const dist = 10.5 + (i % 3) * 8.2;
    spawnToyPropOnIsland(2, i, Math.cos(ang) * dist, Math.sin(ang) * dist);
  }

  // - 48 Tier-1 Tiny Cupcakes, Mushrooms, Spinning Star Gems & Toy Ducks!
  //   Includes a juicy starter ring right around the player at r = 4.2..7.5 so the player can immediately gobble a chain!
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const dist = 4.2 + (i % 2) * 1.8;
    spawnToyPropOnIsland(1, i, Math.cos(ang) * dist, Math.sin(ang) * dist);
  }
  for (let i = 0; i < 36; i++) {
    const ang = (i / 36) * Math.PI * 2 * 2.0;
    const dist = 8.5 + (i / 36) * (islandR - 11.5);
    spawnToyPropOnIsland(1, i + 12, Math.cos(ang) * dist, Math.sin(ang) * dist);
  }

  // Create Player 3D Rolling Critter Gobbler at Island Center (0, 0)
  playerGobbler = createGobblerMesh(cfg, true);
  playerState.x = 0;
  playerState.y = 0;
  playerState.z = 0;
  playerState.vx = 0;
  playerState.vz = 0;
  playerState.knockVx = 0;
  playerState.knockVz = 0;
  playerState.vy = 0;
  playerState.radius = MIN_RADIUS;
  playerState.tier = 0;
  playerState.squash = 0;
  playerState.dizzyTimer = 0;
  playerState.dashTimer = 0;
  playerState.magnetTimer = 0;
  playerState.magnetCooldown = 0;
  playerState.dashCooldown = 0;
  playerState.quakeCooldown = 0;
  playerState.bonkCooldown = 0;
  playerState.inputDx = 0;
  playerState.inputDz = 0;
  playerState.gobbledCount = 0;
  playerGobbler.root.position.set(0, 0, 0);
  dynamicGroup.add(playerGobbler.root);

  // Create 4 Active 3D Rival Critter Gobblers (5 Gobblers Total!)
  // Spawned in 4 distinct outer quadrants (r = 22) so they never pile onto (0, 0) at t = 1s!
  const rivalBaseGrowthRates = [0.036, 0.029, 0.022, 0.015];
  const rivalMoveSpeeds = [11.4, 10.6, 9.8, 9.0];

  [1, 2, 3, 4].forEach((offset, idx) => {
    const rCfg = CRITTERS[(worldIdx + offset) % CRITTERS.length];
    const rMesh = createGobblerMesh(rCfg, false);
    const startAng = (idx / 4) * Math.PI * 2 + Math.PI / 4;
    const sx = Math.cos(startAng) * 22;
    const sz = Math.sin(startAng) * 22;
    rMesh.root.position.set(sx, 0, sz);
    dynamicGroup.add(rMesh.root);

    // Spawn 3 juicy Tier-1 snacks right along each Rival's quadrant path so Rivals actively gobble & stick toys too!
    for (let k = 0; k < 3; k++) {
      const pAng = startAng + (k + 1) * 0.18;
      const pDist = 19.5 + (k % 2) * 2.5;
      spawnToyPropOnIsland(1, idx * 3 + k, Math.cos(pAng) * pDist, Math.sin(pAng) * pDist);
    }

    rivals.push({
      cfg: rCfg,
      gobbler: rMesh,
      x: sx,
      y: 0,
      vy: 0,
      z: sz,
      vx: 0,
      vz: 0,
      knockVx: 0,
      knockVz: 0,
      radius: MIN_RADIUS,
      moveSpeed: rivalMoveSpeeds[idx],
      passiveGrowthRate: rivalBaseGrowthRates[idx],
      spinTimer: 0,
      squash: 0,
      clashCooldown: 2.0,
      homeAng: startAng,
      aiTargetAngle: startAng + Math.PI * 0.55,
      aiRetargetTimer: 0.15,
      gobbledCount: 0
    });
  });

  updatePropEdibilityRings();
  renderWorldSelector();
  updateHudDom();
}

// Update Green (Edible) vs Red (Too Big!) Base Rings on all Toy Props
function updatePropEdibilityRings() {
  toyProps.forEach((p) => {
    if (p.eaten) return;
    const canEat = playerState.radius >= p.reqRadius;
    p.ringMat.color.setHex(canEat ? 0x00e676 : 0xff5252);
    p.ringMat.opacity = canEat ? 0.52 : 0.68;
  });
}

// Attach a Gobbled 3D Toy Prop onto the Rolling Katamari Ball Surface!
function attachPropToKatamariBall(gobblerObj, prop) {
  if (!gobblerObj || !gobblerObj.stuckToysGroup || !prop.modelGroup) return;
  if (gobblerObj.stuckCount >= 26) return; // Cap stuck meshes for 60 FPS WebGL smoothness
  gobblerObj.stuckCount += 1;

  // Remove base edibility ring and move the sculpted 3D toy model onto the rolling sphere surface!
  prop.mesh.remove(prop.modelGroup);
  const stuckToy = prop.modelGroup;

  // Pick a random point on the unit sphere surface (avoiding the top-front where the Critter portrait sits)
  const theta = Math.random() * Math.PI * 2;
  const phi = 0.45 + Math.random() * (Math.PI - 0.75);
  const surfR = 0.88;
  const sx = Math.sin(phi) * Math.cos(theta) * surfR;
  const sy = Math.cos(phi) * surfR;
  const sz = Math.sin(phi) * Math.sin(theta) * surfR;

  const stickScale = prop.tier === 1 ? 0.36 : prop.tier === 2 ? 0.26 : prop.tier === 3 ? 0.2 : 0.16;
  stuckToy.position.set(sx, sy, sz);
  stuckToy.scale.setScalar(stickScale);
  stuckToy.lookAt(sx * 2, sy * 2, sz * 2);
  gobblerObj.stuckToysGroup.add(stuckToy);
}

// Handle Gobbling an Edible Prop (Spiral 3D Vortex Suction + Katamari Ball Attachment + Growth Pulse!)
function startSuckingProp(prop, eater, isPlayerEater) {
  prop.eaten = true;
  suckingProps.push({
    prop,
    eater,
    isPlayerEater,
    progress: 0,
    startX: prop.x,
    startZ: prop.z
  });

  if (isPlayerEater) {
    gobbleComboCount = gobbleComboTimer > 0 ? gobbleComboCount + 1 : 1;
    gobbleComboTimer = 1.65;
    playGobblePopSfx(prop.tier);
    if (gobbleComboCount >= 5 && (playerState.feverTimer || 0) <= 0.5) {
      playerState.feverTimer = 4.5;
      showIslandToast('🌈🔥✨');
      playTierUpFanfare();
    }
  }
}

function completePropGobble(sp) {
  const { prop, eater, isPlayerEater } = sp;
  prop.mesh.visible = false;
  dynamicGroup.remove(prop.mesh);

  // Stick the 3D toy onto the rolling Katamari sphere!
  const targetGobbler = isPlayerEater ? playerGobbler : eater.gobbler;
  attachPropToKatamariBall(targetGobbler, prop);

  const prevTier = getTierForRadius(eater.radius);
  eater.radius = Math.min(4.2, eater.radius + prop.growGain);
  eater.squash = 0.38;
  eater.gobbledCount = (eater.gobbledCount || 0) + 1;

  spawn3DBurst(eater.x, eater.radius * 1.1, eater.z, RAINBOW_HEX[prop.variant % RAINBOW_HEX.length], 10);

  if (isPlayerEater) {
    const newTier = getTierForRadius(playerState.radius);
    playerState.tier = newTier;
    updatePropEdibilityRings();

    // Pulse top-left Critter chip
    const chip = document.getElementById('hudCritterChip');
    if (chip) {
      chip.classList.add('pulse');
      clearTimeout(completePropGobble._pt);
      completePropGobble._pt = setTimeout(() => chip.classList.remove('pulse'), 220);
    }

    // Celebrate crossing into a new Size Tier!
    if (newTier > prevTier) {
      hitStopTimer = 0.055;
      camTrauma.shake = 1.15;
      camTrauma.fovKick = 12;
      spawnShockwave3D(playerState.x, 0.5, playerState.z, 0xffea00, 6.5);
      triggerImpactScreenEffect('tier-up', TIER_EMOJIS[newTier]);
      showIslandToast(`${TIER_EMOJIS[newTier]}⬆️✨`);
      playTierUpFanfare();
    } else if (prop.tier === 4) {
      hitStopTimer = 0.055;
      camTrauma.shake = 1.25;
      spawnShockwave3D(playerState.x, 0.8, playerState.z, 0xffd54f, 7.2);
      triggerImpactScreenEffect('tier-up', '👑');
      showIslandToast('👑🏰✨');
      playTierUpFanfare();
    }

    // Check if all 3 Tier-4 Golden Crown Monuments have been eaten and player is at max size
    const remainingCrowns = toyProps.filter((p) => p.tier === 4 && !p.eaten).length;
    if (remainingCrowns === 0 && playerState.radius >= MAX_TARGET_RADIUS) {
      finishIslandRound();
    }
  }
}

// Handle Visceral 3D Bonk Collision when Bumping an Oversized Prop (`prop.reqRadius > playerState.radius`)
function handleOversizedPropBonk(prop) {
  hitStopTimer = 0.055;
  const dx = playerState.x - prop.x;
  const dz = playerState.z - prop.z;
  const dist = Math.hypot(dx, dz) || 1;
  const nx = dx / dist;
  const nz = dz / dist;

  playerState.knockVx = nx * 22.0;
  playerState.knockVz = nz * 22.0;
  playerState.vy = 8.5;
  playerState.squash = -0.45;
  playerState.dizzyTimer = 1.1;
  playerState.bonkCooldown = 0.65;
  prop.wobble = 1.0;

  camTrauma.shake = 1.25;
  camTrauma.fovKick = -9;

  spawnShockwave3D((playerState.x + prop.x) * 0.5, 0.9, (playerState.z + prop.z) * 0.5, 0xff3d00, 4.2);
  spawn3DBurst((playerState.x + prop.x) * 0.5, 1.0, (playerState.z + prop.z) * 0.5, 0xff5252, 14);
  triggerImpactScreenEffect('bonk-hard', '💥');
  showIslandToast(`🔒${TIER_EMOJIS[prop.tier - 1]}💥`);
  playBonkCrashSfx();
}

// Handle 3D Critter-vs-Critter Bumper Clash!
// Bigger Critter launches the smaller Critter skyward and shakes loose 3 bonus star candies!
function handleCritterClash(r) {
  r.clashCooldown = 0.85;
  const dx = playerState.x - r.x;
  const dz = playerState.z - r.z;
  const dist = Math.hypot(dx, dz) || 1;
  const nx = dx / dist;
  const nz = dz / dist;
  const contactX = (playerState.x + r.x) * 0.5;
  const contactZ = (playerState.z + r.z) * 0.5;

  hitStopTimer = 0.05;

  if (playerState.radius >= r.radius - 0.04 || playerState.dashTimer > 0) {
    // Player dominates the clash and knocks the Rival flying!
    r.knockVx = -nx * 26.0;
    r.knockVz = -nz * 26.0;
    r.vy = 12.5;
    r.spinTimer = 1.45;
    r.squash = -0.45;
    r.radius = Math.max(MIN_RADIUS, r.radius - 0.08);

    playerState.knockVx = nx * 8.0;
    playerState.knockVz = nz * 8.0;
    playerState.squash = 0.35;
    playerState.radius = Math.min(4.2, playerState.radius + 0.09);
    updatePropEdibilityRings();

    // Pop 3 bonus Tier-1 star candies out of the rival!
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2 + Math.random();
      const cx = Math.max(-34, Math.min(34, r.x + Math.cos(ang) * 4.5));
      const cz = Math.max(-34, Math.min(34, r.z + Math.sin(ang) * 4.5));
      spawnToyPropOnIsland(1, 2 + i * 4, cx, cz);
    }

    camTrauma.shake = 1.15;
    camTrauma.fovKick = 10;
    spawnShockwave3D(contactX, 1.0, contactZ, 0xffea00, 5.2);
    spawn3DBurst(contactX, 1.2, contactZ, 0xffea00, 18);
    triggerImpactScreenEffect('tier-up', '💥');
    showIslandToast('🌀💥⭐');
    playQuakeSfx();
  } else {
    // Rival is bigger and bonks the Player back!
    playerState.knockVx = nx * 24.0;
    playerState.knockVz = nz * 24.0;
    playerState.vy = 9.5;
    playerState.dizzyTimer = 1.2;
    playerState.squash = -0.45;

    r.knockVx = -nx * 8.0;
    r.knockVz = -nz * 8.0;
    r.squash = 0.3;

    camTrauma.shake = 1.3;
    camTrauma.fovKick = -10;
    spawnShockwave3D(contactX, 1.0, contactZ, 0xff3d00, 4.8);
    spawn3DBurst(contactX, 1.2, contactZ, 0xff5252, 16);
    triggerImpactScreenEffect('bonk-hard', '💥');
    showIslandToast('💥💫');
    playBonkCrashSfx();
  }
}

// Player Power Pedals with Tactical Cooldowns
function triggerMagnetVortex() {
  ensureAudio();
  hideSteerGuide();
  if ((playerState.magnetCooldown || 0) > 0) return;
  playerState.magnetTimer = 5.0;
  playerState.magnetCooldown = 7.5;
  playTierUpFanfare();
  showIslandToast('🌪️🍭✨');
  updatePowerPedalVisuals();
}

function triggerDashSurge() {
  ensureAudio();
  hideSteerGuide();
  if ((playerState.dashCooldown || 0) > 0) return;
  playerState.dashTimer = 3.6;
  playerState.dashCooldown = 5.5;
  playerState.dizzyTimer = 0;
  camTrauma.fovKick = 9;
  playTone(380, 'sawtooth', 0.22, 0.18, 760);
  showIslandToast('⚡🌀✨');
  updatePowerPedalVisuals();
}

function triggerQuakeSlam() {
  ensureAudio();
  hideSteerGuide();
  if ((playerState.quakeCooldown || 0) > 0) return;
  playerState.quakeCooldown = 6.5;
  playerState.vy = 11.5;
  playerState.squash = 0.45;
  camTrauma.shake = 1.2;
  spawnShockwave3D(playerState.x, 0.4, playerState.z, 0xff9100, 7.5);
  playQuakeSfx();
  showIslandToast('💥🌊✨');
  updatePowerPedalVisuals();

  // Quake slam sucks in up to 5 nearby edible props AND knocks back nearby rivals!
  let suckedByQuake = 0;
  toyProps.forEach((p) => {
    if (p.eaten || suckedByQuake >= 5) return;
    const d = Math.hypot(p.x - playerState.x, p.z - playerState.z);
    if (d < 7.2 && playerState.radius >= p.reqRadius) {
      startSuckingProp(p, playerState, true);
      suckedByQuake++;
    }
  });

  rivals.forEach((r) => {
    const dx = r.x - playerState.x;
    const dz = r.z - playerState.z;
    const d = Math.hypot(dx, dz) || 1;
    if (d < 11.0) {
      r.knockVx = (dx / d) * 24;
      r.knockVz = (dz / d) * 24;
      r.vy = 11.0;
      r.spinTimer = 1.4;
    }
  });
}

function updatePowerPedalVisuals() {
  document.getElementById('btnPowerMagnet').classList.toggle('active-boost', playerState.magnetTimer > 0);
  document.getElementById('btnPowerDash').classList.toggle('active-boost', playerState.dashTimer > 0);
  document.getElementById('btnPowerQuake').classList.toggle('active-boost', (playerState.quakeCooldown || 0) > 5.8);
}

// Rank-to-Stars & Rank-to-Medal Mapping (Top 3 Required to Pass!):
function getStarsForRank(rank) {
  if (rank === 1) return 3;
  if (rank === 2) return 2;
  if (rank === 3) return 1;
  return 0;
}

function getMedalForRank(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '😭';
}

// Compute Live 5-Critter Size Standings (1st through 5th by 3D Radius!)
// Tie-breaker favors the player when radii are within 0.015 (e.g., at round start)!
function computeStandings() {
  const cfg = CRITTERS[currentWorld];
  const entries = [
    {
      isPlayer: true,
      id: cfg.id,
      icon: cfg.icon,
      badge: cfg.badge,
      radius: playerState.radius,
      gobbledCount: playerState.gobbledCount
    },
    ...rivals.map((r, idx) => ({
      isPlayer: false,
      rivalIdx: idx,
      id: r.cfg.id,
      icon: r.cfg.icon,
      badge: r.cfg.badge,
      radius: r.radius,
      gobbledCount: r.gobbledCount || 0
    }))
  ];

  entries.sort((a, b) => {
    if (Math.abs(b.radius - a.radius) > 0.012) {
      return b.radius - a.radius;
    }
    return (b.isPlayer ? 1 : 0) - (a.isPlayer ? 1 : 0);
  });
  return entries;
}

function updateLiveRankHud() {
  const standings = computeStandings();
  const currentRank = standings.findIndex((s) => s.isPlayer) + 1;
  const projectedStars = getStarsForRank(currentRank);

  // Update 3D Leader Crown visibility on whichever Critter is currently #1!
  if (playerGobbler) {
    playerGobbler.leaderCrown.visible = currentRank === 1;
  }
  rivals.forEach((r, idx) => {
    const isRivalFirst = standings[0] && !standings[0].isPlayer && standings[0].rivalIdx === idx;
    r.gobbler.leaderCrown.visible = Boolean(isRivalFirst);
  });

  const rankChip = document.getElementById('hudRankChip');
  const rankEmoji = document.getElementById('hudRankEmoji');
  if (rankChip && rankEmoji) {
    rankEmoji.textContent = getMedalForRank(currentRank);
    const rankClass =
      currentRank === 1
        ? 'rank-1'
        : currentRank === 2
          ? 'rank-2'
          : currentRank === 3
            ? 'rank-3'
            : 'rank-lose';
    rankChip.className = `hud-rank-chip ${rankClass}`;
  }

  for (let i = 0; i < 3; i++) {
    const starEl = document.getElementById(`hudStar${i}`);
    if (starEl) {
      starEl.classList.toggle('earned', i < projectedStars);
    }
  }

  const tier = getTierForRadius(playerState.radius);
  document.getElementById('hudTierBadge').textContent = TIER_EMOJIS[tier];
  document.getElementById('tierGate1').classList.toggle('unlocked', tier >= 1);
  document.getElementById('tierGate2').classList.toggle('unlocked', tier >= 2);
  document.getElementById('tierGate3').classList.toggle('unlocked', tier >= 3);

  return { standings, currentRank, projectedStars };
}

function renderWorldSelector() {
  const rail = document.getElementById('worldSelectorRail');
  if (!rail) return;
  rail.innerHTML = '';
  CRITTERS.forEach((c, idx) => {
    const unlocked = isWorldUnlocked(idx);
    const btn = document.createElement('button');
    btn.className =
      'world-pill' +
      (idx === currentWorld ? ' active' : '') +
      (unlocked ? '' : ' locked');
    const stars = cupStars[idx] || 0;
    const starBadge = !unlocked ? '🔒' : stars > 0 ? '⭐'.repeat(stars) : c.badge;
    btn.innerHTML = `
      <img src="${c.icon}" alt="" />
      <span class="world-pill-stars">${starBadge}</span>
    `;
    btn.addEventListener('click', () => {
      ensureAudio();
      if (!isWorldUnlocked(idx)) {
        playTone(180, 'square', 0.12, 0.14, 110);
        showIslandToast('🔒🥇🥈🥉');
        return;
      }
      document.getElementById('winModal').classList.add('hidden');
      buildIslandWorld(idx);
    });
    rail.appendChild(btn);
  });
}

function updateHudDom() {
  const cfg = CRITTERS[currentWorld];
  document.getElementById('hudDriverImg').src = cfg.icon;
  document.getElementById('playerMarkerImg').src = cfg.icon;

  rivals.forEach((r, idx) => {
    const imgEl = document.getElementById(`rivalMarkerImg${idx}`);
    if (imgEl) imgEl.src = r.cfg.icon;
  });

  updateLiveRankHud();
}

function radiusToProgressPct(r) {
  return Math.max(0, Math.min(100, ((r - MIN_RADIUS) / (MAX_TARGET_RADIUS - MIN_RADIUS)) * 100));
}

function finishIslandRound() {
  if (raceFinished) return;
  raceFinished = true;

  const pPct = radiusToProgressPct(playerState.radius);
  document.getElementById('sizeProgressFill').style.width = `${pPct}%`;
  document.getElementById('playerMarker').style.left = `${pPct}%`;
  rivals.forEach((r, idx) => {
    const el = document.getElementById(`rivalMarker${idx}`);
    if (el) el.style.left = `${radiusToProgressPct(r.radius)}%`;
  });

  const { standings, currentRank, projectedStars } = updateLiveRankHud();
  playerFinishRank = currentRank;
  const earnedStars = projectedStars; // 1st->3, 2nd->2, 3rd->1, 4th/5th->0
  const passedLevel = playerFinishRank <= 3;
  playerLostRace = !passedLevel;

  if (passedLevel) {
    cupStars[currentWorld] = Math.max(cupStars[currentWorld] || 0, earnedStars);
    saveProgress();
    renderWorldSelector();
    playWinFanfare(earnedStars);

    for (let i = 0; i < 5; i++) {
      const col = RAINBOW_HEX[i % RAINBOW_HEX.length];
      spawn3DBurst(
        playerState.x + (i - 2) * 2.5,
        playerState.radius * 1.6 + (i % 2) * 1.5,
        playerState.z,
        col,
        18
      );
    }
  } else {
    playerState.dizzyTimer = 99;
    playLoseSadSfx();
    showIslandToast('😭💔');
  }

  clearTimeout(finishIslandRound._modalTimer);
  finishIslandRound._modalTimer = setTimeout(() => {
    const cfg = CRITTERS[currentWorld];
    const cardEl = document.getElementById('winPodiumCard');
    const sparklesEl = document.getElementById('winSparklesHeader');
    const medalEl = document.getElementById('winMedalBadge');
    const starsEls = document.querySelectorAll('#winStarsRow .podium-star');
    const standingsRowEl = document.getElementById('podiumStandingsRow');
    const nextBtnEl = document.getElementById('btnWinNext');

    if (cardEl) {
      cardEl.classList.toggle('lose-card', !passedLevel);
    }
    if (sparklesEl) {
      sparklesEl.textContent = passedLevel ? '👑 🏆 🌈 🏆 👑' : '🌧️ 💥 😭 💥 🌧️';
    }
    document.getElementById('winDriverImg').src = cfg.icon;
    document.getElementById('winCupBadge').textContent = cfg.badge;
    if (medalEl) {
      medalEl.textContent = getMedalForRank(playerFinishRank);
    }

    starsEls.forEach((el, idx) => {
      el.classList.toggle('earned', idx < earnedStars);
    });

    if (standingsRowEl) {
      standingsRowEl.innerHTML = standings
        .map((entry, idx) => {
          const rankNum = idx + 1;
          const isTop3 = rankNum <= 3;
          const slotMedal = rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : '💔';
          const slotStars = getStarsForRank(rankNum);
          const starsHtml = slotStars > 0 ? '⭐'.repeat(slotStars) : '❌';
          return `
            <div class="standing-slot ${isTop3 ? 'rank-top3' : 'rank-out'} ${entry.isPlayer ? 'is-player' : ''}">
              ${entry.isPlayer ? '<span class="standing-you-crown">🌀</span>' : ''}
              <span class="standing-medal">${slotMedal}</span>
              <img class="standing-avatar" src="${entry.icon}" alt="" />
              <span class="standing-stars">${starsHtml}</span>
            </div>
          `;
        })
        .join('');
    }

    if (nextBtnEl) {
      nextBtnEl.classList.toggle('hidden', !passedLevel);
    }

    document.getElementById('winModal').classList.remove('hidden');
  }, 1050);
}

// Main 3D Simulation Step
function updateGame3D(dt, timeSec) {
  const cfg = CRITTERS[currentWorld];
  const islandR = cfg.islandRadius - 1.8;

  // Drift 3D Clouds, Bob 3D Ocean Sailboats & Spin Animated Toy Prop Parts
  clouds3D.forEach((cl, idx) => {
    cl.baseAng += dt * cl.speed;
    if (cl.isBoat) {
      const bx = Math.cos(cl.baseAng) * cl.dist;
      const bz = Math.sin(cl.baseAng) * cl.dist;
      cl.group.position.set(bx, -0.45 + Math.sin(timeSec * 3.2 + idx) * 0.14, bz);
      cl.group.rotation.y = -cl.baseAng;
      cl.group.rotation.z = Math.sin(timeSec * 2.8 + idx) * 0.08;
    } else {
      cl.group.position.x = Math.cos(cl.baseAng) * cl.dist;
      cl.group.position.z = Math.sin(cl.baseAng) * cl.dist - 10;
    }
  });

  toyProps.forEach((p) => {
    if (!p.eaten && p.spinPart) {
      if (p.tier === 3) {
        p.spinPart.rotation.z += dt * 2.4; // Spinning Windmill Rotor
      } else if (p.tier === 4 && p.variant === 1) {
        p.spinPart.rotation.z += dt * 1.1; // Giant Spinning Ferris Wheel
      } else {
        p.spinPart.rotation.y += dt * 3.2; // Spinning Star Gem / Castle Crown
      }
    }
  });

  // Update 3D Shockwave Rings
  for (let i = shockwaves3D.length - 1; i >= 0; i--) {
    const sw = shockwaves3D[i];
    sw.life -= dt;
    const progress = 1 - Math.max(0, sw.life) / sw.maxLife;
    const sc = 0.4 + progress * sw.maxScale;
    sw.ring.scale.set(sc, sc, 1);
    sw.ring.material.opacity = (1 - progress) * 0.95;
    sw.core.scale.setScalar(0.5 + progress * (sw.maxScale * 0.65));
    sw.core.rotation.y += dt * 14;
    sw.core.material.opacity = (1 - progress) * 0.85;
    if (sw.life <= 0) {
      dynamicGroup.remove(sw.ring, sw.core);
      shockwaves3D.splice(i, 1);
    }
  }

  // Update 3D Burst Particles
  for (let i = particles3D.length - 1; i >= 0; i--) {
    const p = particles3D[i];
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    if (p.rvx) p.mesh.rotation.x += p.rvx * dt;
    if (p.rvy) p.mesh.rotation.y += p.rvy * dt;
    p.vy -= (p.gravity || 22) * dt;
    if (p.bounce && p.mesh.position.y < 0.15 && p.vy < 0) {
      p.mesh.position.y = 0.15;
      p.vy = -p.vy * 0.52;
    }
    p.life -= dt;
    if (p.life <= 0) {
      dynamicGroup.remove(p.mesh);
      particles3D.splice(i, 1);
    }
  }

  // Animate Spiral 3D Suction of Eaten Props into Gobbler Vortex!
  for (let i = suckingProps.length - 1; i >= 0; i--) {
    const sp = suckingProps[i];
    sp.progress += dt * 5.2;
    const t = Math.min(1, sp.progress);
    const spiralAng = t * Math.PI * 3.5;
    const orbitR = (1 - t) * 1.4;
    sp.prop.mesh.position.set(
      sp.startX + (sp.eater.x - sp.startX) * t + Math.cos(spiralAng) * orbitR,
      Math.sin(t * Math.PI) * (sp.eater.radius * 1.15),
      sp.startZ + (sp.eater.z - sp.startZ) * t + Math.sin(spiralAng) * orbitR
    );
    sp.prop.mesh.rotation.y += dt * 16;
    sp.prop.mesh.rotation.x += dt * 10;
    sp.prop.mesh.scale.setScalar(Math.max(0.12, 1 - t * 0.82));
    if (sp.progress >= 1) {
      completePropGobble(sp);
      suckingProps.splice(i, 1);
    }
  }

  if (hitStopTimer > 0) {
    hitStopTimer = Math.max(0, hitStopTimer - dt);
    return;
  }

  if (raceFinished) {
    podiumOrbitAngle += dt * 1.25;
    const camDist = 9.0 + playerState.radius * 2.4;
    camera.position.set(
      playerState.x + Math.sin(podiumOrbitAngle) * camDist,
      5.5 + playerState.radius * 1.5,
      playerState.z + Math.cos(podiumOrbitAngle) * camDist
    );
    camera.lookAt(playerState.x, playerState.radius * 0.9, playerState.z);
    if (playerLostRace) {
      playerGobbler.dizzyHalo.visible = true;
      playerGobbler.dizzyHalo.rotation.y += dt * 9.5;
    }
    return;
  }

  roundElapsedSec += dt;

  // Round Countdown Timer + Visual Sun-Clock Arc
  roundTimeRemaining = Math.max(0, roundTimeRemaining - dt);
  const clockArc = document.getElementById('clockArc');
  if (clockArc) {
    const ratio = roundTimeRemaining / ROUND_DURATION_SEC;
    clockArc.style.strokeDashoffset = `${(1 - ratio) * 125.66}`;
    clockArc.style.stroke = ratio > 0.45 ? '#00c853' : ratio > 0.2 ? '#ffb300' : '#d50000';
  }
  if (roundTimeRemaining <= 0) {
    finishIslandRound();
    return;
  }

  // Gentle Respawn of Tier-1 Tiny Snacks so the island never runs dry!
  candyRespawnTimer += dt;
  if (candyRespawnTimer >= 1.6) {
    candyRespawnTimer = 0;
    const activeTier1 = toyProps.filter((p) => p.tier === 1 && !p.eaten).length;
    if (activeTier1 < 32) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 4 + Math.random() * (islandR - 6);
      spawnToyPropOnIsland(
        1,
        Math.floor(Math.random() * 8),
        Math.cos(ang) * dist,
        Math.sin(ang) * dist
      );
      updatePropEdibilityRings();
    }
  }

  // Timers & Decays
  if (gobbleComboTimer > 0) gobbleComboTimer = Math.max(0, gobbleComboTimer - dt);
  if ((playerState.feverTimer || 0) > 0) playerState.feverTimer = Math.max(0, playerState.feverTimer - dt);
  if (playerState.dashTimer > 0) {
    playerState.dashTimer = Math.max(0, playerState.dashTimer - dt);
    if (playerState.dashTimer === 0) updatePowerPedalVisuals();
  }
  if (playerState.magnetTimer > 0) {
    playerState.magnetTimer = Math.max(0, playerState.magnetTimer - dt);
    if (playerState.magnetTimer === 0) updatePowerPedalVisuals();
  }
  if ((playerState.magnetCooldown || 0) > 0) playerState.magnetCooldown = Math.max(0, playerState.magnetCooldown - dt);
  if ((playerState.dashCooldown || 0) > 0) playerState.dashCooldown = Math.max(0, playerState.dashCooldown - dt);
  if ((playerState.quakeCooldown || 0) > 0) playerState.quakeCooldown = Math.max(0, playerState.quakeCooldown - dt);
  if (playerState.dizzyTimer > 0) playerState.dizzyTimer = Math.max(0, playerState.dizzyTimer - dt);
  if (playerState.bonkCooldown > 0) playerState.bonkCooldown = Math.max(0, playerState.bonkCooldown - dt);

  playerState.knockVx *= Math.pow(0.015, dt);
  playerState.knockVz *= Math.pow(0.015, dt);
  playerState.squash *= Math.pow(0.01, dt);

  camTrauma.shake = Math.max(0, camTrauma.shake - dt * 3.0);
  camTrauma.fovKick *= Math.pow(0.04, dt);

  // Compute Player 3D Movement & Rolling Ball Rotation
  const isFever = (playerState.feverTimer || 0) > 0;
  const moveSpeed = playerState.dashTimer > 0 ? 18.5 : playerState.dizzyTimer > 0 ? 7.2 : isFever ? 15.2 : 13.0;
  const targetVx = playerState.inputDx * moveSpeed;
  const targetVz = playerState.inputDz * moveSpeed;
  playerState.vx += (targetVx - playerState.vx) * Math.min(1, dt * 10);
  playerState.vz += (targetVz - playerState.vz) * Math.min(1, dt * 10);

  const totalVx = playerState.vx + playerState.knockVx;
  const totalVz = playerState.vz + playerState.knockVz;
  playerState.x += totalVx * dt;
  playerState.z += totalVz * dt;

  // Keep within Circular Island Boundary with Bouncy Rim Reflection!
  const distFromCenter = Math.hypot(playerState.x, playerState.z);
  if (distFromCenter > islandR) {
    const nx = playerState.x / distFromCenter;
    const nz = playerState.z / distFromCenter;
    playerState.x = nx * islandR;
    playerState.z = nz * islandR;
    playerState.knockVx = -nx * 10;
    playerState.knockVz = -nz * 10;
  }

  // Vertical Hop / Slam Physics
  if (playerState.y > 0 || playerState.vy !== 0) {
    playerState.vy -= 28.0 * dt;
    playerState.y += playerState.vy * dt;
    if (playerState.y <= 0) {
      playerState.y = 0;
      playerState.vy = 0;
      playerState.squash = 0.28;
    }
  }

  const sc = playerState.radius;
  const sq = playerState.squash;
  playerGobbler.root.position.set(playerState.x, playerState.y, playerState.z);
  playerGobbler.deformGroup.scale.set(
    sc * (1 + sq * 0.45),
    sc * (1 - sq * 0.38),
    sc * (1 + sq * 0.45)
  );
  playerGobbler.vortexRing.scale.setScalar(sc * (isFever ? 1.18 : 1.0));
  playerGobbler.vortexRing.rotation.z += dt * (isFever ? 7.0 : 3.5);
  if (isFever) {
    playerGobbler.vortexRing.material.color.setHSL((timeSec * 1.8) % 1, 1.0, 0.55);
  } else {
    playerGobbler.vortexRing.material.color.setHex(0xffea00);
  }

  if (playerGobbler.magnetRing) {
    playerGobbler.magnetRing.visible = playerState.magnetTimer > 0;
    playerGobbler.magnetRing.scale.setScalar(sc);
    playerGobbler.magnetRing.rotation.z -= dt * 5.0;
  }

  // Physically roll the 3D sphere + all stuck Katamari toys along the movement vector!
  playerGobbler.rollBallGroup.rotation.x += (totalVz / sc) * dt;
  playerGobbler.rollBallGroup.rotation.z -= (totalVx / sc) * dt;

  // Keep Upright Critter Portrait Medallion 100% ABOVE the Katamari sphere & tilted toward the camera!
  playerGobbler.headCrest.position.set(0, 2.34 + Math.sin(timeSec * 7.5) * 0.06, 0.28);
  playerGobbler.headCrest.rotation.x = -0.52;

  playerGobbler.dizzyHalo.visible = playerState.dizzyTimer > 0;
  if (playerGobbler.dizzyHalo.visible) {
    playerGobbler.dizzyHalo.rotation.y += dt * 9.5;
  }

  // Check Player vs 3D Toy Props (Gobble Edible Props OR Bonk Oversized Props!)
  const pullBonus = (playerState.magnetTimer > 0 ? 4.2 : 1.05) + (isFever ? 1.15 : 0);
  toyProps.forEach((prop) => {
    if (prop.eaten) return;
    if (prop.wobble > 0) {
      prop.wobble = Math.max(0, prop.wobble - dt * 3.2);
      prop.mesh.rotation.z = Math.sin(timeSec * 36) * prop.wobble * 0.28;
    } else {
      prop.mesh.rotation.z = 0;
    }

    const dx = prop.x - playerState.x;
    const dz = prop.z - playerState.z;
    const dist = Math.hypot(dx, dz);
    const canEat = playerState.radius >= prop.reqRadius;

    if (canEat) {
      const suckRadius = playerState.radius * 1.1 + prop.hitRadius * 0.6 + pullBonus;
      if (dist < suckRadius) {
        startSuckingProp(prop, playerState, true);
      }
    } else if (
      playerState.bonkCooldown <= 0 &&
      dist < playerState.radius * 0.85 + prop.hitRadius * 0.72
    ) {
      handleOversizedPropBonk(prop);
    }
  });

  // Update 4 Active 3D Rival Critter Gobblers (AI Roaming, Eating, Growing & Bumping!)
  rivals.forEach((r) => {
    if (r.clashCooldown > 0) r.clashCooldown = Math.max(0, r.clashCooldown - dt);
    if (r.spinTimer > 0) r.spinTimer = Math.max(0, r.spinTimer - dt);
    r.knockVx *= Math.pow(0.02, dt);
    r.knockVz *= Math.pow(0.02, dt);
    r.squash *= Math.pow(0.015, dt);

    // Steady competitive growth + prop eating (after 1.8s opening grace window so player starts #1!)
    if (roundElapsedSec > 1.8 && r.spinTimer <= 0) {
      r.radius = Math.min(3.55, r.radius + r.passiveGrowthRate * dt);
    }

    r.aiRetargetTimer -= dt;
    if (r.aiRetargetTimer <= 0) {
      r.aiRetargetTimer = 0.65 + Math.random() * 0.6;
      let bestProp = null;
      let bestDist = Infinity;
      for (const p of toyProps) {
        if (p.eaten || r.radius < p.reqRadius) continue;
        if (roundElapsedSec < 4.5 && Math.hypot(p.x, p.z) < 9.5) continue;
        const d = Math.hypot(p.x - r.x, p.z - r.z);
        if (d < bestDist) {
          bestDist = d;
          bestProp = p;
        }
      }
      if (bestProp) {
        r.aiTargetAngle = Math.atan2(bestProp.z - r.z, bestProp.x - r.x);
      } else {
        r.aiTargetAngle += (Math.random() - 0.5) * 1.8;
      }
    }

    const spd = r.spinTimer > 0 ? r.moveSpeed * 0.35 : r.moveSpeed;
    const rvx = Math.cos(r.aiTargetAngle) * spd + r.knockVx;
    const rvz = Math.sin(r.aiTargetAngle) * spd + r.knockVz;
    r.x += rvx * dt;
    r.z += rvz * dt;

    const rDistCenter = Math.hypot(r.x, r.z);
    if (rDistCenter > islandR - 1) {
      r.aiTargetAngle = Math.atan2(-r.z, -r.x);
      r.x = (r.x / rDistCenter) * (islandR - 1);
      r.z = (r.z / rDistCenter) * (islandR - 1);
    }

    if (r.y > 0 || r.vy !== 0) {
      r.vy -= 26.0 * dt;
      r.y += r.vy * dt;
      if (r.y <= 0) {
        r.y = 0;
        r.vy = 0;
        r.squash = 0.3;
      }
    }

    // Rival eats nearby edible props (after 1.8s opening grace window!)
    if (roundElapsedSec > 1.8) {
      for (const p of toyProps) {
        if (p.eaten || r.radius < p.reqRadius) continue;
        if (roundElapsedSec < 4.5 && Math.hypot(p.x, p.z) < 9.0) continue;
        if (Math.hypot(p.x - r.x, p.z - r.z) < r.radius * 1.2 + p.hitRadius * 0.55) {
          startSuckingProp(p, r, false);
          break;
        }
      }
    }

    const rSc = r.radius;
    r.gobbler.root.position.set(r.x, r.y, r.z);
    r.gobbler.deformGroup.scale.set(
      rSc * (1 + r.squash * 0.45),
      rSc * (1 - r.squash * 0.38),
      rSc * (1 + r.squash * 0.45)
    );
    r.gobbler.vortexRing.scale.setScalar(rSc);
    r.gobbler.rollBallGroup.rotation.x += (rvz / rSc) * dt;
    r.gobbler.rollBallGroup.rotation.z -= (rvx / rSc) * dt;
    r.gobbler.headCrest.position.set(0, 2.34 + Math.sin(timeSec * 6.5 + r.homeAng) * 0.05, 0.28);
    r.gobbler.headCrest.rotation.x = -0.52;
    r.gobbler.dizzyHalo.visible = r.spinTimer > 0;
    if (r.gobbler.dizzyHalo.visible) {
      r.gobbler.dizzyHalo.rotation.y += dt * 10;
    }

    // Check 3D Critter-vs-Critter Bumper Clash with Player!
    const clashDist = Math.hypot(r.x - playerState.x, r.z - playerState.z);
    if (r.clashCooldown <= 0 && clashDist < (playerState.radius + r.radius) * 0.88) {
      handleCritterClash(r);
    }
  });

  // Dynamic Scale-Aware 3D Camera (Smoothly zooms out higher & wider as your Critter grows!)
  const baseFov = playerState.dashTimer > 0 ? 56 : 50;
  camera.fov += (baseFov + camTrauma.fovKick - camera.fov) * Math.min(1, dt * 8);
  camera.updateProjectionMatrix();

  const shakePow = camTrauma.shake * camTrauma.shake;
  const shakeX = (Math.random() * 2 - 1) * shakePow * 0.65;
  const shakeY = (Math.random() * 2 - 1) * shakePow * 0.55;
  const shakeZ = (Math.random() * 2 - 1) * shakePow * 0.55;

  const camHeight = 11.2 + (playerState.radius - MIN_RADIUS) * 4.8;
  const camBack = 14.8 + (playerState.radius - MIN_RADIUS) * 5.2;
  camera.position.set(
    playerState.x + shakeX,
    camHeight + shakeY,
    playerState.z + camBack + shakeZ
  );
  camera.lookAt(playerState.x, playerState.radius * 0.75, playerState.z - 2.0);

  // Update Top Bar Size Progress Markers & Live 5-Critter Rank HUD
  const pPct = radiusToProgressPct(playerState.radius);
  document.getElementById('sizeProgressFill').style.width = `${pPct}%`;
  document.getElementById('playerMarker').style.left = `${pPct}%`;

  rivals.forEach((r, idx) => {
    const rPct = radiusToProgressPct(r.radius);
    const el = document.getElementById(`rivalMarker${idx}`);
    if (el) el.style.left = `${rPct}%`;
  });

  updateLiveRankHud();
}

// 360° Touch/Mouse Virtual Joystick & Pointer Steering + Keyboard Controls
let joyOriginX = null;
let joyOriginY = null;
const keysDown = new Set();

function recomputeKeyInput() {
  let kx = 0;
  let kz = 0;
  if (keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('A')) kx -= 1;
  if (keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D')) kx += 1;
  if (keysDown.has('ArrowUp') || keysDown.has('w') || keysDown.has('W')) kz -= 1;
  if (keysDown.has('ArrowDown') || keysDown.has('s') || keysDown.has('S')) kz += 1;
  const len = Math.hypot(kx, kz);
  if (len > 0) {
    playerState.inputDx = kx / len;
    playerState.inputDz = kz / len;
  } else if (joyOriginX === null) {
    playerState.inputDx = 0;
    playerState.inputDz = 0;
  }
}

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
  hideSteerGuide();
  joyOriginX = e.clientX;
  joyOriginY = e.clientY;

  const joyBase = document.getElementById('joystickBase');
  const joyKnob = document.getElementById('joystickKnob');
  if (joyBase && joyKnob) {
    joyBase.style.left = `${joyOriginX}px`;
    joyBase.style.top = `${joyOriginY}px`;
    joyBase.classList.remove('hidden');
    joyKnob.style.transform = 'translate(-50%, -50%)';
  }

  // Also steer immediately toward where the player tapped relative to screen center!
  const cx = window.innerWidth * 0.5;
  const cy = window.innerHeight * 0.54;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > 18) {
    playerState.inputDx = dx / dist;
    playerState.inputDz = dy / dist;
  }
});

window.addEventListener('pointermove', (e) => {
  if (joyOriginX === null) return;
  const dx = e.clientX - joyOriginX;
  const dy = e.clientY - joyOriginY;
  const dist = Math.hypot(dx, dy);
  const maxR = 44;

  if (dist > 6) {
    playerState.inputDx = dx / dist;
    playerState.inputDz = dy / dist;
  }

  const clampedDist = Math.min(maxR, dist);
  const kx = dist > 0 ? (dx / dist) * clampedDist : 0;
  const ky = dist > 0 ? (dy / dist) * clampedDist : 0;
  const joyKnob = document.getElementById('joystickKnob');
  if (joyKnob) {
    joyKnob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
  }
});

window.addEventListener('pointerup', () => {
  joyOriginX = null;
  joyOriginY = null;
  const joyBase = document.getElementById('joystickBase');
  if (joyBase) joyBase.classList.add('hidden');
  recomputeKeyInput();
});

window.addEventListener('keydown', (e) => {
  ensureAudio();
  hideSteerGuide();
  keysDown.add(e.key);
  recomputeKeyInput();
  if (e.key === '1') triggerMagnetVortex();
  else if (e.key === '2' || e.key === ' ') triggerDashSurge();
  else if (e.key === '3') triggerQuakeSlam();
});

window.addEventListener('keyup', (e) => {
  keysDown.delete(e.key);
  recomputeKeyInput();
});

// Bottom D-Pad & Power Pedals
function bindDirPedal(btnId, dx, dz) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    ensureAudio();
    hideSteerGuide();
    playerState.inputDx = dx;
    playerState.inputDz = dz;
  });
}

bindDirPedal('btnDirLeft', -1, 0);
bindDirPedal('btnDirRight', 1, 0);
bindDirPedal('btnDirUp', 0, -1);
bindDirPedal('btnDirDown', 0, 1);

document.getElementById('btnPowerMagnet').addEventListener('click', () => triggerMagnetVortex());
document.getElementById('btnPowerDash').addEventListener('click', () => triggerDashSurge());
document.getElementById('btnPowerQuake').addEventListener('click', () => triggerQuakeSlam());

document.getElementById('btnRestartIsland').addEventListener('click', () => {
  ensureAudio();
  document.getElementById('winModal').classList.add('hidden');
  buildIslandWorld(currentWorld);
});

document.getElementById('btnSoundToggle').addEventListener('click', (e) => {
  soundEnabled = !soundEnabled;
  e.currentTarget.textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) ensureAudio();
});

document.getElementById('btnWinReplay').addEventListener('click', () => {
  document.getElementById('winModal').classList.add('hidden');
  buildIslandWorld(currentWorld);
});

document.getElementById('btnWinNext').addEventListener('click', () => {
  if (playerLostRace) return;
  document.getElementById('winModal').classList.add('hidden');
  if (currentWorld < CRITTERS.length - 1) {
    buildIslandWorld(currentWorld + 1);
  } else {
    const grid = document.getElementById('finaleGrid');
    if (grid) {
      grid.innerHTML = CRITTERS.map((c, idx) => {
        const stars = Math.max(1, cupStars[idx] || 1);
        return `
        <div class="finale-tile">
          <img src="${c.icon}" alt="" />
          <span>${'⭐'.repeat(stars)} ${c.badge}</span>
        </div>
      `;
      }).join('');
    }
    document.getElementById('finaleModal').classList.remove('hidden');
  }
});

document.getElementById('btnFinaleClose').addEventListener('click', () => {
  document.getElementById('finaleModal').classList.add('hidden');
  buildIslandWorld(0);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Expose Clean Automation & Telemetry API for Multi-Round Headless Verification
window.__gobbleGame = {
  getState: () => {
    const { standings, currentRank, projectedStars } = updateLiveRankHud();
    return {
      worldIdx: currentWorld,
      worldId: CRITTERS[currentWorld].id,
      timeLeft: roundTimeRemaining,
      raceFinished,
      playerFinishRank,
      playerLostRace,
      currentRank,
      projectedStars,
      playerRadius: Number(playerState.radius.toFixed(2)),
      playerTier: playerState.tier,
      gobbledCount: playerState.gobbledCount,
      stuckToysCount: playerGobbler ? playerGobbler.stuckCount : 0,
      propsRemaining: toyProps.filter((p) => !p.eaten).length,
      standings: standings.map((s, i) => ({
        rank: i + 1,
        id: s.id,
        isPlayer: s.isPlayer,
        radius: Number(s.radius.toFixed(2)),
        gobbled: s.gobbledCount
      }))
    };
  },
  steer: (dx, dz) => {
    hideSteerGuide();
    const len = Math.hypot(dx, dz) || 1;
    playerState.inputDx = dx / len;
    playerState.inputDz = dz / len;
  },
  autoSeekNearestEdible: () => {
    hideSteerGuide();
    let best = null;
    let bestD = Infinity;
    for (const p of toyProps) {
      if (p.eaten || playerState.radius < p.reqRadius) continue;
      const d = Math.hypot(p.x - playerState.x, p.z - playerState.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best) {
      const ang = Math.atan2(best.z - playerState.z, best.x - playerState.x);
      playerState.inputDx = Math.cos(ang);
      playerState.inputDz = Math.sin(ang);
    }
  },
  triggerPower: (kind) => {
    if (kind === 'magnet') triggerMagnetVortex();
    else if (kind === 'dash') triggerDashSurge();
    else if (kind === 'quake') triggerQuakeSlam();
  },
  forceFinishWithRadii: (playerRad, rivalRadii) => {
    playerState.radius = playerRad;
    rivalRadii.forEach((rr, idx) => {
      if (rivals[idx]) rivals[idx].radius = rr;
    });
    finishIslandRound();
  },
  switchWorld: (idx) => {
    document.getElementById('winModal').classList.add('hidden');
    buildIslandWorld(idx);
  }
};

let lastTime = performance.now();
function animate(now) {
  const dt = Math.min(0.04, (now - lastTime) / 1000);
  lastTime = now;
  updateGame3D(dt, now / 1000);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

buildIslandWorld(0);
requestAnimationFrame(animate);
