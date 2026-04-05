let holeIdCounter = 0;
let originalHoleRef = null;
let secondHoleRef = null;
let isOriginalAnimating = false;
let isScurrying = false;
let hasMouseScurried = false;
let isPhase2 = false;

const MOUSE_HTML = `
  <div class="mouse-head">
    <div class="ear left-ear"></div>
    <div class="ear right-ear"></div>
    <div class="face">
      <div class="eye left-eye"></div>
      <div class="eye right-eye"></div>
      <div class="nose"></div>
      <div class="whiskers left-whiskers"><span></span><span></span><span></span></div>
      <div class="whiskers right-whiskers"><span></span><span></span><span></span></div>
    </div>
  </div>`;

function createHole(x, y, isOriginal) {
  const container = document.createElement('div');
  container.className = 'hole-container';

  if (isOriginal) {
    container.style.bottom = '40px';
    container.style.right = '60px';
  } else {
    container.style.left = (x - 24) + 'px';
    container.style.top = (y - 24) + 'px';
  }

  const pathId = 'text-circle-' + (holeIdCounter++);
  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'rotating-text');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width', '100');
  svg.setAttribute('height', '100');

  const defs = document.createElementNS(svgNS, 'defs');
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('id', pathId);
  path.setAttribute('d', 'M 50,50 m -33,0 a 33,33 0 1,1 66,0 a 33,33 0 1,1 -66,0');
  defs.appendChild(path);
  svg.appendChild(defs);

  const text = document.createElementNS(svgNS, 'text');
  text.setAttribute('font-family', "'Courier New', Courier, monospace");
  text.setAttribute('font-size', '10');
  text.setAttribute('fill', '#333');

  const textPath = document.createElementNS(svgNS, 'textPath');
  textPath.setAttribute('href', '#' + pathId);
  textPath.setAttribute('textLength', '207');
  textPath.setAttribute('spacing', 'exact');
  textPath.textContent = 'dj bevan\u00b7dj bevan\u00b7dj bevan\u00b7';
  text.appendChild(textPath);
  svg.appendChild(text);

  const mouse = document.createElement('div');
  mouse.className = 'mouse';
  mouse.innerHTML = MOUSE_HTML;

  const hole = document.createElement('div');
  hole.className = 'hole';

  container.appendChild(svg);
  container.appendChild(mouse);
  container.appendChild(hole);
  document.body.appendChild(container);

  container.addEventListener('click', (e) => {
    e.stopPropagation();

    if (isOriginal) {
      if (isOriginalAnimating || isScurrying) return;

      // Mouse peek, then open to black screen
      isOriginalAnimating = true;
      mouse.classList.add('peeking');
      mouse.addEventListener('animationend', () => {
        mouse.classList.remove('peeking');
        isOriginalAnimating = false;
        triggerBlackExpansion();
      }, { once: true });
    } else {
      // Clicking second hole: implode it
      if (container.classList.contains('imploding')) return;
      implodeHole(container);
    }
  });

  // Auto-play simple peek on new dynamic holes, then scurry
  if (!isOriginal) {
    mouse.classList.add('peek-only');
    mouse.addEventListener('animationend', () => {
      mouse.classList.remove('peek-only');
      startScurry();
    }, { once: true });
  }

  return container;
}

// ===== Implode the second hole =====

function implodeHole(container) {
  const mouse = container.querySelector('.mouse');
  if (mouse) mouse.style.display = 'none';

  container.classList.add('imploding');

  const rect = container.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Spawn exploding circles after the suck-in finishes
  setTimeout(() => {
    createExplodingCircles(cx, cy);
  }, 320);

  setTimeout(() => {
    container.remove();
    if (secondHoleRef === container) {
      secondHoleRef = null;
      hasMouseScurried = false;
    }
  }, 900);
}

function createExplodingCircles(cx, cy) {
  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('div');
    dot.className = 'explode-dot';
    dot.style.left = cx + 'px';
    dot.style.top = cy + 'px';

    const size = 3 + Math.random() * 5;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';

    document.body.appendChild(dot);

    const angle = (Math.PI * 2 / 18) * i + (Math.random() * 0.3 - 0.15);
    const distance = 40 + Math.random() * 50;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    dot.animate([
      {
        transform: 'translate(-50%, -50%) scale(1)',
        background: 'radial-gradient(circle, #111 0%, #111 60%, transparent 100%)'
      },
      {
        transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.3)`,
        background: 'radial-gradient(circle, #111 0%, transparent 40%, transparent 100%)'
      }
    ], { duration: 550, easing: 'ease-out', fill: 'forwards' });

    setTimeout(() => dot.remove(), 600);
  }
}

// ===== Scurry animation =====

function startScurry() {
  if (!secondHoleRef || !originalHoleRef || isScurrying) return;

  isScurrying = true;
  hasMouseScurried = true;

  const fromRect = secondHoleRef.getBoundingClientRect();
  const toRect = originalHoleRef.getBoundingClientRect();

  const fromX = fromRect.left + fromRect.width / 2;
  const fromY = fromRect.top + fromRect.height / 2;
  const toX = toRect.left + toRect.width / 2;
  const toY = toRect.top + toRect.height / 2;

  // Create the scurrying mouse
  const scurryMouse = createScurryMouseElement();
  document.body.appendChild(scurryMouse);

  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  const angleDeg = angle * (180 / Math.PI);
  const distance = Math.hypot(dx, dy);
  const duration = Math.max(800, distance * 2.5);
  const flipY = Math.abs(angle) > Math.PI / 2;

  const trailText = 'dj bevan';
  let charIndex = 0;
  let lastTrailTime = 0;
  const startTime = performance.now();

  const trailStopThreshold = 0.85;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const currentX = fromX + dx * eased;
    const currentY = fromY + dy * eased;

    const scaleStr = flipY ? ' scaleY(-1)' : '';
    scurryMouse.style.left = currentX + 'px';
    scurryMouse.style.top = currentY + 'px';
    scurryMouse.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)${scaleStr}`;

    // Drop trail characters
    if (progress < trailStopThreshold && now - lastTrailTime > 70) {
      const char = trailText[charIndex % trailText.length];
      if (char !== ' ') {
        dropTrailChar(currentX, currentY + 12, char);
      }
      charIndex++;
      lastTrailTime = now;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      scurryMouse.remove();
      isScurrying = false;
      triggerBlackExpansion();
    }
  }

  requestAnimationFrame(animate);
}

function createScurryMouseElement() {
  const el = document.createElement('div');
  el.className = 'scurry-mouse';
  el.innerHTML = `
    <svg class="scurry-tail" width="16" height="10" viewBox="0 0 16 10">
      <path d="M 16,5 Q 11,0 8,5 Q 5,10 0,5" stroke="#999" fill="none" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <div class="scurry-body">
      <div class="scurry-head">
        <div class="scurry-ear"></div>
        <div class="scurry-eye"></div>
        <div class="scurry-cheese"></div>
      </div>
    </div>`;
  return el;
}

function dropTrailChar(x, y, char) {
  const el = document.createElement('span');
  el.className = 'trail-char';
  el.textContent = char;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 500);
}

// ===== Black expansion after scurry =====

function triggerBlackExpansion() {
  const rect = originalHoleRef.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const overlay = document.createElement('div');
  overlay.className = 'black-expand';
  overlay.style.clipPath = `circle(24px at ${cx}px ${cy}px)`;

  // Video inside overlay so it's only visible within the expanding circle
  const vid = document.createElement('video');
  vid.src = 'CharacterSpin_Inverted.mov';
  vid.className = 'phase2-video';
  vid.muted = true;
  vid.playsInline = true;
  vid.preload = 'auto';
  // Show first frame but don't play
  vid.currentTime = 0;
  overlay.appendChild(vid);

  document.body.appendChild(overlay);

  const maxRadius = Math.hypot(
    Math.max(cx, window.innerWidth - cx),
    Math.max(cy, window.innerHeight - cy)
  );

  overlay.animate([
    { clipPath: `circle(24px at ${cx}px ${cy}px)` },
    { clipPath: `circle(${maxRadius}px at ${cx}px ${cy}px)` }
  ], { duration: 600, easing: 'ease-in', fill: 'forwards' });

  setTimeout(() => {
    if (originalHoleRef) originalHoleRef.remove();
    if (secondHoleRef) secondHoleRef.remove();
    originalHoleRef = null;
    secondHoleRef = null;

    document.body.style.background = '#000';
    document.body.appendChild(vid);
    overlay.remove();

    enterPhase2(vid);
  }, 650);
}


function createBlueOrb() {
  const orb = document.createElement('div');
  orb.className = 'blue-orb';

  const glow = document.createElement('div');
  glow.className = 'blue-orb-glow';
  orb.appendChild(glow);

  const glow2 = document.createElement('div');
  glow2.className = 'blue-orb-glow2';
  orb.appendChild(glow2);

  // Animated fine noise canvas (200% smaller = 170px for tinier pixels)
  const noiseWrap = document.createElement('div');
  noiseWrap.className = 'blue-orb-noise';
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  noiseWrap.appendChild(canvas);
  orb.appendChild(noiseWrap);

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const d = imageData.data;
  const cx = size / 2, cy = size / 2, maxR = size / 2;

  const falloffMap = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const t = dist / maxR;
      falloffMap[y * size + x] = Math.max(0, 1 - t * t * (3 - 2 * t));
    }
  }

  function renderNoise() {
    for (let i = 0; i < d.length; i += 4) {
      const pi = i / 4;
      const falloff = falloffMap[pi];
      if (falloff < 0.001) { d[i+3] = 0; continue; }
      const n = (Math.random() - 0.5) * 140;
      d[i]     = 70 + n * 0.15;
      d[i + 1] = 100 + n * 0.15;
      d[i + 2] = 180 + n * 0.35;
      d[i + 3] = falloff * (90 + n * 0.2);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  let noiseFrame = 0;
  function tickNoise() {
    noiseFrame++;
    if (noiseFrame % 7 === 0) renderNoise();
    requestAnimationFrame(tickNoise);
  }
  renderNoise();
  requestAnimationFrame(tickNoise);

  document.body.appendChild(orb);

  let targetX = -450, targetY = -450;
  let currentX = -450, currentY = -450;
  const stiffness = 0.0024;
  const damping = 0.92;
  let velX = 0, velY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function tick() {
    const ax = (targetX - currentX) * stiffness;
    const ay = (targetY - currentY) * stiffness;
    velX = (velX + ax) * damping;
    velY = (velY + ay) * damping;
    currentX += velX;
    currentY += velY;
    orb.style.left = currentX + 'px';
    orb.style.top = currentY + 'px';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function createScreenNoise() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:150;opacity:0.04;';
  const w = 256, h = 256;
  canvas.width = w;
  canvas.height = h;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(w, h);
  const d = imageData.data;

  function render() {
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 200;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 60;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  let frame = 0;
  function loop() {
    frame++;
    if (frame % 4 === 0) render();
    requestAnimationFrame(loop);
  }
  render();
  requestAnimationFrame(loop);
}

function enterPhase2(videoEl) {
  isPhase2 = true;
  localStorage.setItem('djbevan_phase', '2');

  // Animated screen noise
  createScreenNoise();
  createBlueOrb();

  // Build nav
  const nav = document.createElement('div');
  nav.className = 'phase2-nav';

  const nameEl = document.createElement('div');
  nameEl.className = 'phase2-name';
  nameEl.textContent = 'dj bevan';

  const links = document.createElement('div');
  links.className = 'phase2-links';

  // About link + paragraph
  const about = document.createElement('a');
  about.href = '#';
  about.textContent = 'about';

  const aboutText = document.createElement('div');
  aboutText.className = 'phase2-about';
  aboutText.textContent = "i'm a junior at upenn studying film and economics. i stumble over cracks too frequently. i attempt a whistle invariably. i'm a performative wino who slobbers over arthouse films and lathers dust on the books beside my bed. procrastination is my game, and impulse is my name. but competition motivated the impulse to create, so screw around with my website before mice seize it.";

  let aboutOpen = false;

  function closeAbout() {
    if (!aboutOpen) return;
    aboutOpen = false;
    aboutText.classList.remove('open');
    links.classList.remove('about-open');
    about.classList.remove('active-tab');
    aboutVid.pause();
    aboutVid.style.display = 'none';
    if (videoEl) videoEl.style.display = '';
  }

  function showAbout(showText) {
    aboutOpen = true;
    if (showText) {
      about.classList.add('active-tab');
      aboutText.classList.add('open');
      links.classList.add('about-open');
    }
    // Hide all other videos, play about_idle
    if (videoEl) videoEl.style.display = 'none';
    reverseVid.style.display = 'none';
    aboutVid.style.display = '';
    aboutVid.currentTime = 0;
    aboutVid.play();
  }

  about.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (aboutOpen) {
      closeAbout();
    } else if (statsOpen) {
      // Close stats with reverse video, then open about
      closeStats(() => {
        showAbout(true);
      });
    } else if (videoPlaying) {
      // Wait for current video to finish before playing about_idle
      return;
    } else {
      showAbout(true);
    }
  });

  // About idle video (hidden until needed)
  const aboutVid = document.createElement('video');
  aboutVid.src = 'about_idle.mov';
  aboutVid.className = 'phase2-video';
  aboutVid.muted = true;
  aboutVid.playsInline = true;
  aboutVid.preload = 'auto';
  aboutVid.loop = false;
  aboutVid.style.display = 'none';
  aboutVid.addEventListener('ended', () => {
    aboutVid.currentTime = aboutVid.duration;
    aboutVid.pause();
  });
  document.body.appendChild(aboutVid);

  // Reverse video element (hidden until needed)
  const reverseVid = document.createElement('video');
  reverseVid.src = 'reverse.mov';
  reverseVid.className = 'phase2-video';
  reverseVid.muted = true;
  reverseVid.playsInline = true;
  reverseVid.preload = 'auto';
  reverseVid.style.display = 'none';
  document.body.appendChild(reverseVid);

  // Click center video to trigger about_idle (only at rest)
  function isVideoAtRest(v) {
    return v && v.paused && (v.currentTime < 0.1 || v.currentTime >= v.duration - 0.1);
  }

  if (videoEl) {
    videoEl.style.pointerEvents = 'auto';
    videoEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isVideoAtRest(videoEl) && !aboutOpen && !statsOpen) {
        showAbout();
      }
    });
  }

  reverseVid.style.pointerEvents = 'auto';
  reverseVid.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isVideoAtRest(reverseVid) && !aboutOpen && !statsOpen) {
      showAbout();
    }
  });

  // Stats panel
  const statsPanel = document.createElement('div');
  statsPanel.className = 'phase2-stats';

  // Local time helper
  function getLocalTime() {
    const now = new Date();
    const pragueTime = now.toLocaleString('en-GB', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', hour12: false });
    return 'prague, ' + pragueTime;
  }

  const statsTable = document.createElement('table');
  const statsData = [
    ['age:', '21'],
    ['home:', 'santa monica, ca'],
    ['local time:', getLocalTime()],
    ['movies watched this year:', '...'],
    ['books read this year:', '6'],
    ['toes stubbed today:', '3'],
    ['girlfriends:', '-1'],
  ];

  statsData.forEach(([label, value]) => {
    const row = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = label;
    const td2 = document.createElement('td');
    td2.textContent = value;
    row.appendChild(td1);
    row.appendChild(td2);
    statsTable.appendChild(row);
    if (label === 'movies watched this year:') td2.id = 'stats-movies';
    if (label === 'local time:') td2.id = 'stats-time';
  });

  statsPanel.appendChild(statsTable);

  // Bar stats
  const barStats = [
    ['strength:', 3],
    ['metabolism:', 5],
    ['eye contact:', 4],
    ['stinginess:', 5],
    ['intelligence:', 4],
    ['libido:', 1],
    ['luck:', 5],
  ];

  const barsContainer = document.createElement('div');
  barsContainer.className = 'stats-bars';
  const allPips = [];

  barStats.forEach(([label, filled]) => {
    const row = document.createElement('div');
    row.className = 'stats-bar-row';

    const lbl = document.createElement('span');
    lbl.className = 'stats-bar-label';
    lbl.textContent = label;
    row.appendChild(lbl);

    const pips = document.createElement('div');
    pips.className = 'stats-bar-pips';
    const rowPips = [];

    for (let i = 0; i < 5; i++) {
      const pip = document.createElement('div');
      pip.className = 'stats-pip';
      pips.appendChild(pip);
      rowPips.push({ el: pip, shouldFill: i < filled });
    }

    allPips.push(rowPips);
    row.appendChild(pips);
    barsContainer.appendChild(row);
  });

  statsPanel.appendChild(barsContainer);

  function animateBars() {
    // Reset all pips
    allPips.forEach(row => row.forEach(p => p.el.classList.remove('filled')));

    let step = 0;
    const maxSteps = 5;

    function tick() {
      if (step >= maxSteps) return;
      allPips.forEach(row => {
        if (row[step] && row[step].shouldFill) {
          row[step].el.classList.add('filled');
        }
      });
      step++;
      setTimeout(tick, 200);
    }
    setTimeout(tick, 300);
  }

  function resetBars() {
    allPips.forEach(row => row.forEach(p => p.el.classList.remove('filled')));
  }

  // Fetch yearly film count from Letterboxd RSS
  const WORKER_URL = 'https://letterboxd-counter.djbevan.workers.dev';
  fetch(WORKER_URL)
    .then(r => r.json())
    .then(data => {
      const el = document.getElementById('stats-movies');
      if (el) el.textContent = data.count || 0;
    })
    .catch(() => {
      const el = document.getElementById('stats-movies');
      if (el) el.textContent = '?';
    });

  // Update local time every minute
  setInterval(() => {
    const el = document.getElementById('stats-time');
    if (el) el.textContent = getLocalTime();
  }, 60000);

  let statsOpen = false;
  let videoPlaying = false; // true while CharacterSpin or reverse is mid-play

  let spinEndedHandler = null;

  function openStats() {
    statsOpen = true;
    stats.classList.add('active-tab');
    statsPanel.classList.add('open');
    links.classList.add('stats-open');
    animateBars();
    if (videoEl) {
      videoPlaying = true;
      videoEl.classList.add('shifted');
      videoEl.currentTime = 0;
      videoEl.play();
      spinEndedHandler = () => {
        videoEl.currentTime = videoEl.duration;
        videoEl.pause();
        videoPlaying = false;
      };
      videoEl.addEventListener('ended', spinEndedHandler, { once: true });
    }
  }

  function closeStats(onComplete) {
    if (!statsOpen) { if (onComplete) onComplete(); return; }

    function doClose() {
      statsOpen = false;
      stats.classList.remove('active-tab');
      statsPanel.classList.remove('open');
      links.classList.remove('stats-open');
      resetBars();
      // Play reverse video starting in shifted position
      if (videoEl) {
        videoPlaying = true;
        reverseVid.style.display = '';
        reverseVid.classList.add('shifted');
        videoEl.style.display = 'none';
        reverseVid.currentTime = 0;
        reverseVid.play();
        // Slide back to center after a frame
        requestAnimationFrame(() => {
          reverseVid.classList.remove('shifted');
        });
        reverseVid.addEventListener('ended', () => {
          reverseVid.currentTime = reverseVid.duration;
          reverseVid.pause();
          videoPlaying = false;
          // Swap back for next time
          reverseVid.style.display = 'none';
          videoEl.style.display = '';
          videoEl.classList.remove('shifted');
          videoEl.currentTime = 0;
          if (onComplete) onComplete();
        }, { once: true });
      } else {
        if (onComplete) onComplete();
      }
    }

    // If CharacterSpin is still playing, wait for it to finish before closing
    if (videoPlaying && videoEl && !videoEl.paused) {
      // Remove the openStats handler so it doesn't conflict
      if (spinEndedHandler) {
        videoEl.removeEventListener('ended', spinEndedHandler);
        spinEndedHandler = null;
      }
      videoEl.addEventListener('ended', () => {
        videoEl.currentTime = videoEl.duration;
        videoEl.pause();
        videoPlaying = false;
        doClose();
      }, { once: true });
    } else {
      doClose();
    }
  }

  const stats = document.createElement('a');
  stats.href = '#';
  stats.textContent = 'stats';
  stats.className = 'phase2-link-item phase2-stats-toggle';
  stats.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoPlaying && !statsOpen) return; // don't open stats while video is mid-play
    if (statsOpen) {
      closeStats();
    } else {
      openStats();
    }
  });

  const linkedin = document.createElement('a');
  linkedin.href = 'https://www.linkedin.com/in/djbevan/';
  linkedin.target = '_blank';
  linkedin.textContent = 'linkedin';
  linkedin.className = 'phase2-link-item';

  const letterboxd = document.createElement('a');
  letterboxd.href = 'https://letterboxd.com/djbevan613/';
  letterboxd.target = '_blank';
  letterboxd.textContent = 'letterboxd';
  letterboxd.className = 'phase2-link-item';

  const photo = document.createElement('a');
  photo.href = '#';
  photo.textContent = 'photos';
  photo.className = 'phase2-link-item';
  photo.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openPhotoGallery();
  });

  links.appendChild(about);
  links.appendChild(aboutText);
  links.appendChild(linkedin);
  links.appendChild(letterboxd);
  links.appendChild(photo);
  links.appendChild(stats);
  links.appendChild(statsPanel);

  // Lock icon – top-right corner
  const lockIcon = document.createElement('div');
  lockIcon.className = 'lock-icon';
  lockIcon.innerHTML = `<svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="10.5" width="17" height="12" rx="2" stroke="white" stroke-width="1.5" fill="none"/>
    <path d="M5.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`;
  lockIcon.addEventListener('click', () => {
    localStorage.removeItem('djbevan_phase');
    location.reload();
  });
  document.body.appendChild(lockIcon);

  links.classList.add('open');

  nameEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (statsOpen) {
      closeStats();
    } else if (aboutOpen) {
      closeAbout();
    }
  });

  nav.appendChild(nameEl);
  nav.appendChild(links);
  document.body.appendChild(nav);

  // Start mouse parade after 45s of no mouse movement
  let idleTimer = setTimeout(startParade, 45000);

  document.addEventListener('mousemove', () => {
    if (!isPhase2) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startParade, 45000);
  });
}

// ===== Phase 2: mouse parade =====

function startParade() {
  const screenWidth = window.innerWidth;
  const y = window.innerHeight - 40;
  const startX = -40;
  const endX = screenWidth + 40;
  const totalDistance = endX - startX;
  const speed = 250;
  const duration = (totalDistance / speed) * 1000;
  const leaderGapDelay = ((screenWidth * 0.15) / speed) * 1000;
  const followerGapDelay = ((screenWidth * 0.03) / speed) * 1000;

  const mice = [];

  for (let i = 0; i < 4; i++) {
    const el = createParadeMouseElement(i === 0);
    el.style.left = startX + 'px';
    el.style.top = y + 'px';
    el.style.display = 'none';
    document.body.appendChild(el);
    const delay = i === 0 ? 0 : leaderGapDelay + (i - 1) * followerGapDelay;
    mice.push({ el, delay, done: false });
  }

  const animStart = performance.now();

  function animate(now) {
    let allDone = true;

    for (const m of mice) {
      if (m.done) continue;

      const elapsed = now - animStart - m.delay;

      if (elapsed < 0) {
        allDone = false;
        continue;
      }

      m.el.style.display = '';
      const progress = elapsed / duration;

      if (progress >= 1) {
        m.el.remove();
        m.done = true;
        continue;
      }

      allDone = false;
      const x = startX + totalDistance * progress;
      m.el.style.left = x + 'px';
    }

    if (!allDone) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function createParadeMouseElement(hasCheese) {
  const el = document.createElement('div');
  el.className = 'scurry-mouse';
  el.innerHTML = `
    <svg class="scurry-tail" width="16" height="10" viewBox="0 0 16 10">
      <path d="M 16,5 Q 11,0 8,5 Q 5,10 0,5" stroke="#999" fill="none" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <div class="scurry-body">
      <div class="scurry-head">
        <div class="scurry-ear"></div>
        <div class="scurry-eye"></div>
        ${hasCheese ? '<div class="scurry-cheese"></div>' : ''}
      </div>
    </div>`;
  return el;
}

// ===== Photo gallery =====

const PHOTO_FILES = ['photos/film1.jpg', 'photos/film2.jpg', 'photos/film3.jpg'];
let galleryOpen = false;

function openPhotoGallery() {
  if (galleryOpen) return;
  galleryOpen = true;

  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';

  const stack = document.createElement('div');
  stack.className = 'photo-stack';

  const cards = [];
  const stackRotations = [-3, 1.5, -1];

  PHOTO_FILES.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-card';
    wrap.style.animationDelay = (i * 0.15) + 's';

    const img = document.createElement('img');
    img.src = src;
    wrap.appendChild(img);
    stack.appendChild(wrap);
    cards.push(wrap);
  });

  // Circular order: all cards always in play
  let order = cards.map((_, i) => i); // last = top
  let animating = false;

  function updateStack() {
    order.forEach((cardIdx, stackPos) => {
      const card = cards[cardIdx];
      card.style.display = '';
      card.style.zIndex = stackPos + 1;
      const rot = stackRotations[cardIdx] || 0;
      const offset = (order.length - 1 - stackPos) * 3;
      card.style.transform = `rotate(${rot}deg) translateY(${offset}px)`;
      card.style.opacity = '1';
      card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
    });
  }

  function goNext() {
    if (animating || order.length < 2) return;
    animating = true;
    const topIdx = order.pop();
    const card = cards[topIdx];
    card.style.transform = 'translateX(120%) rotate(15deg)';
    card.style.opacity = '0';
    setTimeout(() => {
      order.unshift(topIdx);
      updateStack();
      animating = false;
    }, 350);
  }

  function goPrev() {
    if (animating || order.length < 2) return;
    animating = true;
    const bottomIdx = order.shift();
    const card = cards[bottomIdx];
    card.style.transition = 'none';
    card.style.zIndex = order.length + 2;
    card.style.transform = 'translateX(-120%) rotate(-15deg)';
    card.style.opacity = '0';
    card.style.display = '';
    // Force reflow then animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        order.push(bottomIdx);
        card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        updateStack();
        setTimeout(() => { animating = false; }, 350);
      });
    });
  }

  function swipeUp() {
    if (animating || order.length < 2) return;
    animating = true;
    const topIdx = order.pop();
    const card = cards[topIdx];
    card.style.transform = 'translateY(-120%) rotate(-5deg)';
    card.style.opacity = '0';
    setTimeout(() => {
      order.unshift(topIdx);
      updateStack();
      animating = false;
    }, 350);
  }

  // Arrow buttons
  const leftArrow = document.createElement('div');
  leftArrow.className = 'photo-arrow photo-arrow-left';
  leftArrow.textContent = '\u2039';
  leftArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    goPrev();
  });

  const rightArrow = document.createElement('div');
  rightArrow.className = 'photo-arrow photo-arrow-right';
  rightArrow.textContent = '\u203A';
  rightArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    goNext();
  });

  // Drag handling on each card
  cards.forEach((card) => {
    let startX = 0, startY = 0, dragging = false, dx = 0, dy = 0;

    card.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      dx = 0;
      dy = 0;
      card.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      const cardIdx = cards.indexOf(card);
      const rot = stackRotations[cardIdx] || 0;
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot + dx * 0.05}deg)`;
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';

      const threshold = 80;

      if (dy < -threshold && Math.abs(dy) > Math.abs(dx)) {
        swipeUp();
      } else if (dx > threshold) {
        goNext();
      } else if (dx < -threshold) {
        goPrev();
      } else {
        updateStack();
      }
    });

    card.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Fade out all videos
  document.querySelectorAll('.phase2-video').forEach(v => v.style.opacity = '0');

  // Keyboard arrow support
  function handleKey(e) {
    if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'ArrowRight') goNext();
    else if (e.key === 'Escape') closeGallery();
  }
  document.addEventListener('keydown', handleKey);

  function closeGallery() {
    overlay.classList.add('closing');
    document.querySelectorAll('.phase2-video').forEach(v => v.style.opacity = '');
    document.removeEventListener('keydown', handleKey);
    setTimeout(() => {
      overlay.remove();
      galleryOpen = false;
    }, 400);
  }

  // Click outside cards closes gallery
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeGallery();
    }
  });

  overlay.appendChild(leftArrow);
  overlay.appendChild(stack);
  overlay.appendChild(rightArrow);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    updateStack();
  });
}

// ===== Init =====

if (localStorage.getItem('djbevan_phase') === '2') {
  // Skip straight to black screen
  document.body.style.background = '#000';

  const vid = document.createElement('video');
  vid.src = 'CharacterSpin_Inverted.mov';
  vid.className = 'phase2-video';
  vid.muted = true;
  vid.playsInline = true;
  vid.preload = 'auto';
  vid.currentTime = 0;
  document.body.appendChild(vid);

  enterPhase2(vid);
} else {
  originalHoleRef = createHole(0, 0, true);

  // Auto-trigger peek 7s after page load
  setTimeout(() => {
    if (isPhase2 || isOriginalAnimating || isScurrying || secondHoleRef) return;
    const mouse = originalHoleRef.querySelector('.mouse');
    if (!mouse) return;
    isOriginalAnimating = true;
    mouse.classList.add('peeking');
    mouse.addEventListener('animationend', () => {
      mouse.classList.remove('peeking');
      isOriginalAnimating = false;
      triggerBlackExpansion();
    }, { once: true });
  }, 7000);

  document.body.addEventListener('click', (e) => {
    if (isPhase2) return;
    if (e.target !== document.body) return;
    if (secondHoleRef || isScurrying) return;
    secondHoleRef = createHole(e.clientX, e.clientY, false);
    hasMouseScurried = false;
  });
}
