// ── Pocketpedia app.js ────────────────────────────────────────────────────────
// Pure vanilla JS — no build step needed. Handles both index.html (tour list)
// and tour.html (tour detail). Data comes from two Google Sheets CSV exports.
// ─────────────────────────────────────────────────────────────────────────────

const CFG = window.POCKETPEDIA_CONFIG || {};
const TOURS_URL = CFG.TOURS_URL || '';
const STOPS_URL = CFG.STOPS_URL || '';

// ── CSV parser (handles quoted fields) ───────────────────────────────────────
function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(raw) {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  });
}

async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchTours() {
  if (!TOURS_URL || !STOPS_URL) return [];

  const [toursCsv, stopsCsv] = await Promise.all([
    fetchCsv(TOURS_URL),
    fetchCsv(STOPS_URL),
  ]);

  const stopRows = parseCsv(stopsCsv);
  const stopsByTourId = {};
  for (const row of stopRows) {
    const stop = {
      id:          row.id,
      name:        row.name,
      description: row.description,
      latitude:    parseFloat(row.latitude),
      longitude:   parseFloat(row.longitude),
      photoUrl:    row.photoUrl,
      audioUrl:    row.audioUrl,
      order:       parseInt(row.order, 10),
    };
    if (!stopsByTourId[row.tourId]) stopsByTourId[row.tourId] = [];
    stopsByTourId[row.tourId].push(stop);
  }
  Object.values(stopsByTourId).forEach((arr) =>
    arr.sort((a, b) => a.order - b.order)
  );

  return parseCsv(toursCsv).map((row) => ({
    id:              row.id,
    title:           row.title,
    theme:           row.theme,
    description:     row.description,
    coverImageUrl:   row.coverImageUrl,
    durationMinutes: parseInt(row.durationMinutes, 10),
    distanceKm:      parseFloat(row.distanceKm),
    instagramPostUrl:row.instagramPostUrl,
    stops:           stopsByTourId[row.id] || [],
  }));
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
function show(el) { el && el.classList.remove('hidden'); }
function hide(el) { el && el.classList.add('hidden'); }

function metaPill(icon, label) {
  const span = document.createElement('span');
  span.className = 'meta-pill';
  span.textContent = `${icon} ${label}`;
  return span;
}

// ── Tours list page ───────────────────────────────────────────────────────────
async function loadTours() {
  const loading  = qs('#loading');
  const errState = qs('#error-state');
  const screen   = qs('#tours-screen');
  const list     = qs('#tours-list');
  const empty    = qs('#empty-state');

  show(loading);
  hide(errState);
  hide(screen);

  try {
    const tours = await fetchTours();

    hide(loading);
    show(screen);

    if (!tours.length) { show(empty); return; }
    hide(empty);

    list.innerHTML = '';
    tours.forEach((tour) => {
      const card = document.createElement('a');
      card.className = 'tour-card';
      card.href = `tour.html?id=${encodeURIComponent(tour.id)}`;
      // Save full tour data in sessionStorage so tour.html can read it without
      // re-fetching (gracefully falls back to re-fetching if not available).
      sessionStorage.setItem(`tour:${tour.id}`, JSON.stringify(tour));

      const img = document.createElement('img');
      img.src = tour.coverImageUrl;
      img.alt = tour.title;
      img.loading = 'lazy';

      const overlay = document.createElement('div');
      overlay.className = 'card-overlay';

      const content = document.createElement('div');
      content.className = 'card-content';

      const theme = document.createElement('p');
      theme.className = 'card-theme';
      theme.textContent = tour.theme.toUpperCase();

      const title = document.createElement('h2');
      title.className = 'card-title';
      title.textContent = tour.title;

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.appendChild(metaPill('🕐', `${tour.durationMinutes} min`));
      meta.appendChild(metaPill('📍', `${tour.distanceKm} km`));
      meta.appendChild(metaPill('🏛️', `${tour.stops.length} stops`));

      content.append(theme, title, meta);
      card.append(img, overlay, content);
      list.appendChild(card);
    });
  } catch (err) {
    hide(loading);
    show(errState);
    const errText = qs('.error-text', errState);
    if (errText) errText.textContent = 'Could not load tours. Check your connection and try again.';
  }
}

// ── Tour detail page ──────────────────────────────────────────────────────────
let leafletMap = null;
let markers    = {};
let activeStopId = null;

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function buildAudioPlayer(audioUrl, stopName) {
  const container = document.createElement('div');
  container.className = 'audio-player';

  const btn = document.createElement('button');
  btn.className = 'play-btn';
  btn.textContent = '▶';

  const right = document.createElement('div');
  right.className = 'audio-right';

  const label = document.createElement('p');
  label.className = 'audio-label';
  label.textContent = `🎧 Audio guide — ${stopName}`;

  const track = document.createElement('div');
  track.className = 'progress-track';
  const fill = document.createElement('div');
  fill.className = 'progress-fill';
  fill.style.width = '0%';
  track.appendChild(fill);

  const time = document.createElement('p');
  time.className = 'audio-time';
  time.textContent = '0:00 / --:--';

  right.append(label, track, time);
  container.append(btn, right);

  // Audio element (hidden)
  const audio = new Audio();
  let loaded = false;

  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      fill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
      time.textContent = `${formatTime(audio.currentTime * 1000)} / ${formatTime(audio.duration * 1000)}`;
    }
  });
  audio.addEventListener('ended', () => {
    btn.textContent = '▶';
    audio.currentTime = 0;
    fill.style.width = '0%';
  });
  audio.addEventListener('canplay', () => {
    btn.disabled = false;
    btn.textContent = '▶';
  });

  // Seek on progress track click
  track.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  });

  btn.addEventListener('click', async () => {
    if (!loaded) {
      btn.disabled = true;
      btn.textContent = '…';
      audio.src = audioUrl;
      audio.load();
      loaded = true;
    }
    if (audio.paused) {
      await audio.play();
      btn.textContent = '⏸';
    } else {
      audio.pause();
      btn.textContent = '▶';
    }
    btn.disabled = false;
  });

  return container;
}

function buildStopCard(stop, index, tour) {
  const card = document.createElement('div');
  card.className = 'stop-card';
  card.dataset.stopId = stop.id;

  const header = document.createElement('div');
  header.className = 'stop-header';

  const badge = document.createElement('div');
  badge.className = 'stop-badge';
  badge.textContent = index;

  const name = document.createElement('p');
  name.className = 'stop-name';
  name.textContent = stop.name;

  header.append(badge, name);
  card.appendChild(header);

  if (stop.photoUrl) {
    const photo = document.createElement('img');
    photo.className = 'stop-photo';
    photo.src = stop.photoUrl;
    photo.alt = stop.name;
    photo.loading = 'lazy';
    card.appendChild(photo);
  }

  const desc = document.createElement('p');
  desc.className = 'stop-description';
  desc.textContent = stop.description;
  card.appendChild(desc);

  if (stop.audioUrl) {
    card.appendChild(buildAudioPlayer(stop.audioUrl, stop.name));
  }

  card.addEventListener('click', () => activateStop(stop.id, tour));
  return card;
}

function activateStop(stopId, tour) {
  activeStopId = stopId;

  // Update card active states
  document.querySelectorAll('.stop-card').forEach((el) => {
    el.classList.toggle('active', el.dataset.stopId === stopId);
  });

  // Pan map
  const stop = tour.stops.find((s) => s.id === stopId);
  if (stop && leafletMap) {
    leafletMap.flyTo([stop.latitude, stop.longitude], 17, { duration: 0.4 });
  }

  // Update marker colours
  Object.entries(markers).forEach(([id, { marker, defaultIcon, activeIcon }]) => {
    marker.setIcon(id === stopId ? activeIcon : defaultIcon);
  });
}

function buildMap(tour) {
  const mapEl = qs('#map');
  if (!mapEl || !window.L) return;

  const firstStop = tour.stops[0];
  const center = firstStop
    ? [firstStop.latitude, firstStop.longitude]
    : [45.7489, 21.2087]; // Timișoara fallback

  leafletMap = L.map(mapEl, { zoomControl: true }).setView(center, 15);

  // Use CartoDB Dark Matter tiles — matches the dark navy palette
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(leafletMap);

  // Draw polyline
  if (tour.stops.length > 1) {
    const coords = tour.stops.map((s) => [s.latitude, s.longitude]);
    L.polyline(coords, { color: '#E94560', weight: 2 }).addTo(leafletMap);
  }

  // Custom icon factory
  function makeIcon(color) {
    return L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  const defaultIcon = makeIcon('#F5A623');
  const activeIcon  = makeIcon('#E94560');

  tour.stops.forEach((stop, i) => {
    const marker = L.marker([stop.latitude, stop.longitude], {
      icon: i === 0 ? activeIcon : defaultIcon,
      title: `${i + 1}. ${stop.name}`,
    }).addTo(leafletMap);

    marker.bindPopup(`<strong>${i + 1}. ${stop.name}</strong>`);
    marker.on('click', () => {
      activateStop(stop.id, tour);
      marker.openPopup();
    });

    markers[stop.id] = { marker, defaultIcon, activeIcon };
  });
}

async function loadTourDetail() {
  const loading  = qs('#loading');
  const errState = qs('#error-state');
  const screen   = qs('#tour-screen');

  show(loading);
  hide(errState);
  hide(screen);

  // Get tour id from URL
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) { hide(loading); show(errState); return; }

  let tour = null;

  // Try sessionStorage first (set by index.html when user clicked a card)
  try {
    const cached = sessionStorage.getItem(`tour:${id}`);
    if (cached) tour = JSON.parse(cached);
  } catch (_) {}

  // Fall back to fetching all tours
  if (!tour) {
    try {
      const tours = await fetchTours();
      tour = tours.find((t) => t.id === id) || null;
    } catch (e) {
      hide(loading);
      show(errState);
      return;
    }
  }

  if (!tour) { hide(loading); show(errState); return; }

  // Update page title
  document.title = `${tour.title} — Pocketpedia`;

  // Hero
  const heroImg = qs('#hero-img');
  heroImg.src = tour.coverImageUrl;
  heroImg.alt = tour.title;
  qs('#hero-theme').textContent = tour.theme.toUpperCase();
  qs('#hero-title').textContent = tour.title;

  const metaRow = qs('#hero-meta');
  [
    ['🕐', `${tour.durationMinutes} min`],
    ['📍', `${tour.distanceKm} km`],
    ['🏛️', `${tour.stops.length} stops`],
  ].forEach(([icon, label]) => {
    const span = document.createElement('span');
    span.textContent = `${icon} ${label}`;
    metaRow.appendChild(span);
  });

  // Description
  qs('#tour-description').textContent = tour.description;

  // Instagram button
  if (tour.instagramPostUrl) {
    const igBtn = qs('#ig-button');
    igBtn.href = tour.instagramPostUrl;
    show(igBtn);
  }

  // Build stop cards
  const stopsList = qs('#stops-list');
  tour.stops.forEach((stop, i) => {
    stopsList.appendChild(buildStopCard(stop, i + 1, tour));
  });

  hide(loading);
  show(screen);

  // Activate first stop
  if (tour.stops.length > 0) {
    activeStopId = tour.stops[0].id;
    const firstCard = qs(`.stop-card[data-stop-id="${activeStopId}"]`);
    if (firstCard) firstCard.classList.add('active');
  }

  // Build map (Leaflet is loaded via CDN in tour.html)
  buildMap(tour);
}

// ── Entry point ───────────────────────────────────────────────────────────────
(function init() {
  const page = location.pathname;
  if (page.endsWith('tour.html')) {
    loadTourDetail();
  } else {
    // index.html or root
    loadTours();
  }
})();
