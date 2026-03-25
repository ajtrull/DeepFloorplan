/* ============================================================
   WORLDVIEW // app.js — Intelligence Platform Core
   ============================================================ */

'use strict';

/* ── Hardcoded TLE data for key satellites (updated periodically) ── */
const SATELLITE_TLES = [
  {
    name: 'ISS (ZARYA)',
    tle1: '1 25544U 98067A   24001.50000000  .00009826  00000+0  18200-3 0  9990',
    tle2: '2 25544  51.6435 166.9555 0004865 198.0207 162.0865 15.50014001375618',
    type: 'station',
  },
  {
    name: 'HUBBLE',
    tle1: '1 20580U 90037B   24001.50000000  .00000882  00000+0  38650-4 0  9991',
    tle2: '2 20580  28.4694 245.3567 0002695 184.4062 175.6902 15.09700592302432',
    type: 'telescope',
  },
  {
    name: 'STARLINK-1007',
    tle1: '1 44713U 19074A   24001.50000000  .00002182  00000+0  14764-3 0  9995',
    tle2: '2 44713  53.0549 110.4346 0001401  93.9082 266.2111 15.06450200225023',
    type: 'starlink',
  },
  {
    name: 'NOAA 19',
    tle1: '1 33591U 09005A   24001.50000000  .00000063  00000+0  62978-4 0  9998',
    tle2: '2 33591  99.1920 359.4421 0013939 183.8043 176.2986 14.12373940773765',
    type: 'weather',
  },
  {
    name: 'GPS BIIF-1',
    tle1: '1 37753U 11036A   24001.50000000 -.00000025  00000+0  00000+0 0  9998',
    tle2: '2 37753  55.4016  37.4984 0113832 209.8540 149.5620  2.00563219  93271',
    type: 'gps',
  },
  {
    name: 'TERRA',
    tle1: '1 25994U 99068A   24001.50000000  .00000019  00000+0  28213-5 0  9998',
    tle2: '2 25994  98.2083 166.4571 0001268  73.6416 286.4877 14.57132960278781',
    type: 'earth-obs',
  },
  {
    name: 'GOES-16',
    tle1: '1 41866U 16071A   24001.50000000 -.00000291  00000+0  00000+0 0  9997',
    tle2: '2 41866   0.0495  76.1337 0000963 219.7048 168.6175  1.00271770  26620',
    type: 'weather',
  },
  {
    name: 'STARLINK-2040',
    tle1: '1 48655U 21035J   24001.50000000  .00003710  00000+0  23820-3 0  9997',
    tle2: '2 48655  53.0553  59.6831 0001200  66.5090 293.6068 15.07053370151083',
    type: 'starlink',
  },
];

/* ── Mock CCTV camera locations ── */
const CCTV_LOCATIONS = [
  { lat:51.5074, lng:-0.1278, id:'LON-001', status:'ONLINE' },
  { lat:40.7128, lng:-74.0060, id:'NYC-042', status:'ONLINE' },
  { lat:48.8566, lng:2.3522,  id:'PAR-017', status:'DEGRADED' },
  { lat:35.6762, lng:139.6503,id:'TYO-093', status:'ONLINE' },
  { lat:37.7749, lng:-122.4194,id:'SFO-021',status:'ONLINE' },
  { lat:55.7558, lng:37.6173, id:'MSC-008', status:'ONLINE' },
  { lat:22.3193, lng:114.1694,id:'HKG-055', status:'OFFLINE' },
  { lat:-33.8688,lng:151.2093,id:'SYD-034', status:'ONLINE' },
  { lat:19.4326, lng:-99.1332,id:'MEX-011', status:'ONLINE' },
  { lat:1.3521,  lng:103.8198,id:'SNG-077', status:'ONLINE' },
  { lat:-23.5505,lng:-46.6333,id:'SAO-023', status:'DEGRADED' },
  { lat:28.6139, lng:77.2090, id:'DEL-045', status:'ONLINE' },
];

/* ── Mock traffic hotspots ── */
const TRAFFIC_ZONES = [
  { lat:40.7128, lng:-74.0060, level:'high',   label:'Manhattan' },
  { lat:51.5074, lng:-0.1278,  level:'medium', label:'Central London' },
  { lat:48.8566, lng:2.3522,   level:'high',   label:'Paris Ring' },
  { lat:35.6762, lng:139.6503, level:'medium', label:'Tokyo Metro' },
  { lat:37.7749, lng:-122.4194,level:'low',    label:'SF Downtown' },
  { lat:52.5200, lng:13.4050,  level:'low',    label:'Berlin' },
  { lat:41.9028, lng:12.4964,  level:'medium', label:'Rome' },
  { lat:-33.8688,lng:151.2093, level:'medium', label:'Sydney' },
  { lat:55.7558, lng:37.6173,  level:'high',   label:'Moscow Ring' },
  { lat:39.9042, lng:116.4074, level:'high',   label:'Beijing' },
  { lat:25.2048, lng:55.2708,  level:'medium', label:'Dubai' },
  { lat:34.0522, lng:-118.2437,level:'high',   label:'Los Angeles' },
];

/* ── View modes ── */
const VIEW_MODES = [
  { id:'full',  label:'Full',  cls:'mode-full'  },
  { id:'crt',   label:'CRT',   cls:'mode-crt'   },
  { id:'nvg',   label:'NVG',   cls:'mode-nvg'   },
  { id:'flir',  label:'FLIR',  cls:'mode-flir'  },
  { id:'anime', label:'Anime', cls:'mode-anime' },
  { id:'noir',  label:'Noir',  cls:'mode-noir'  },
  { id:'space', label:'Space', cls:'mode-space' },
  { id:'ai',    label:'AI Edit',cls:'mode-ai'   },
];

/* ── Layer definitions ── */
const LAYER_DEFS = [
  { id:'flights',    name:'Live Flights',    icon:'✈', color:'#00ff88', active:true  },
  { id:'quakes',     name:'Earthquakes 24h', icon:'⚡', color:'#ff4444', active:true  },
  { id:'satellites', name:'Satellites',      icon:'◎', color:'#4488ff', active:true  },
  { id:'traffic',    name:'Street Traffic',  icon:'▣', color:'#ffaa00', active:false },
  { id:'weather',    name:'Weather Radar',   icon:'☁', color:'#88aaff', active:false },
  { id:'cctv',       name:'CCTV Mesh',       icon:'⊡', color:'#ff8800', active:false },
];

/* ============================================================
   WORLDVIEW APPLICATION
   ============================================================ */
class WorldView {
  constructor() {
    this.map = null;
    this.markers = { flights:{}, quakes:{}, satellites:{}, cctv:{}, traffic:{} };
    this.layerGroups = {};
    this.layers = {};
    this.viewMode = 'crt';
    this.data = { flights:[], quakes:[], satellites:[], weather:null };
    this.counts = { flights:0, quakes:0, sats:0, cctv:0 };
    this.distortionHistory = [];
    this.compassAngle = 0;
    this.intervals = [];
    this.weatherLayer = null;
    this.noiseAnimId = null;
    this.activityFeed = [];
    this.apiStatus = {
      opensky:    'unknown',
      usgs:       'unknown',
      rainviewer: 'unknown',
      celestrak:  'online',
    };
    this.launchDone = false;
  }

  /* ── Entry point ── */
  init() {
    this.runLaunchSequence().then(() => this.initApp());
    console.log('[WORLDVIEW] Boot sequence started.');
  }

  initApp() {
    this.dismissLaunchScreen();
    this.initMap();
    this.buildLayerUI();
    this.buildViewModeUI();
    this.buildDashboardLayerBtns();
    this.buildDashboardViewModeBtns();
    this.initNoise();
    this.initDistortionChart();
    this.initCompass();
    this.startClock();
    this.loadAllLayers();
    this.scheduleRefreshes();
    this.bindEvents();
    this.bindDashboardEvents();
    this.syncDashboardMetrics();
    console.log('[WORLDVIEW] System online.');
  }

  /* ── Launch screen sequence ── */
  runLaunchSequence() {
    return new Promise(resolve => {
      const BOOT_LINES = [
        { text: 'BIOS v4.2.1 PANOPTICON EDITION — POST COMPLETE',         cls: 'dim-line',   delay: 0    },
        { text: 'INITIALIZING PANOPTICON SUBSYSTEM...',                    cls: '',           delay: 400  },
        { text: 'ESTABLISHING SATELLITE UPLINK — KU BAND 14.5 GHz...',    cls: '',           delay: 900  },
        { text: 'AUTHENTICATING OPERATOR CREDENTIALS...',                  cls: '',           delay: 1400 },
        { text: 'ACCESS LEVEL: TS/SCI COMPARTMENTED — GRANTED',           cls: 'alert-line', delay: 1900 },
        { text: 'LOADING GEOSPATIAL ENGINE — LEAFLET v1.9.4...',          cls: '',           delay: 2400 },
        { text: 'LINKING OPENSKY NETWORK — ADS-B TRANSPONDER ARRAY...',   cls: '',           delay: 2900 },
        { text: 'QUERYING USGS SEISMIC SENSOR NETWORK...',                cls: '',           delay: 3300 },
        { text: 'LOADING THREAT DATABASE — 0-DAY INDEX NOMINAL...',       cls: 'warn-line',  delay: 3700 },
        { text: 'CCTV MESH SYNCHRONIZATION — 12 NODES DETECTED...',      cls: '',           delay: 4100 },
        { text: 'WEATHER RADAR TILES — RAINVIEWER API READY...',          cls: '',           delay: 4500 },
        { text: 'SATELLITE PROPAGATION ENGINE (satellite.js) ONLINE...',  cls: '',           delay: 4800 },
        { text: 'PANOPTIC DETECTION: ACTIVE',                             cls: 'alert-line', delay: 5100 },
        { text: '>>> WORLDVIEW GEOSPATIAL INTELLIGENCE SYSTEM READY <<<', cls: '',           delay: 5400 },
      ];

      const linesContainer = document.getElementById('launch-lines');
      const progressBar    = document.getElementById('launch-progress-bar');
      const progressPct    = document.getElementById('launch-progress-pct');
      const enterWrap      = document.getElementById('launch-enter-wrap');
      const enterBtn       = document.getElementById('launch-enter-btn');
      const terminal       = document.getElementById('launch-terminal');

      const total = BOOT_LINES.length;
      let autoTimer = null;

      const typeLine = (text, cls, onDone) => {
        const div = document.createElement('div');
        div.className = `launch-line${cls ? ' ' + cls : ''}`;
        linesContainer.appendChild(div);

        let i = 0;
        const charDelay = Math.max(12, 28 - text.length * 0.1);

        const typeNext = () => {
          if (i < text.length) {
            div.textContent = text.slice(0, ++i);
            setTimeout(typeNext, charDelay);
          } else {
            if (onDone) onDone();
          }
        };
        typeNext();
      };

      BOOT_LINES.forEach((item, idx) => {
        setTimeout(() => {
          const pct = Math.round(((idx + 1) / total) * 100);
          typeLine(item.text, item.cls, () => {
            progressBar.style.width = pct + '%';
            progressPct.textContent = pct + '%';
            terminal.scrollTop = terminal.scrollHeight;
          });
        }, item.delay);
      });

      const lastDelay = BOOT_LINES[BOOT_LINES.length - 1].delay + 700;
      setTimeout(() => {
        enterWrap.classList.add('visible');
        autoTimer = setTimeout(() => dismiss(), 5500);
      }, lastDelay);

      const dismiss = () => {
        if (autoTimer) clearTimeout(autoTimer);
        this.dismissLaunchScreen();
        resolve();
      };

      enterBtn.addEventListener('click', dismiss, { once: true });
    });
  }

  dismissLaunchScreen() {
    if (this.launchDone) return;
    this.launchDone = true;
    const screen = document.getElementById('launch-screen');
    screen.classList.add('fade-out');
    setTimeout(() => screen.classList.add('hidden'), 850);
  }

  /* ── Map ── */
  initMap() {
    this.map = L.map('map', {
      center: [20, 10],
      zoom: 3,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(this.map);

    // Create layer groups
    ['flights','quakes','satellites','cctv','traffic','weather'].forEach(id => {
      this.layerGroups[id] = L.layerGroup().addTo(this.map);
    });
    // Some start hidden
    ['traffic','cctv','weather'].forEach(id => this.map.removeLayer(this.layerGroups[id]));

    // Map events
    this.map.on('mousemove', e => this.onMapMouseMove(e));
    this.map.on('zoomend',   () => this.onZoomChange());
    this.map.on('moveend',   () => this.onMapMove());
  }

  onMapMouseMove(e) {
    const { lat, lng } = e.latlng;
    document.getElementById('lat-display').textContent =
      `${Math.abs(lat).toFixed(4)}°${lat>=0?'N':'S'}`;
    document.getElementById('lng-display').textContent =
      `${Math.abs(lng).toFixed(4)}°${lng>=0?'E':'W'}`;

    // Altitude cursor (mock: based on latitude)
    const altPct = ((lat + 90) / 180) * 100;
    document.getElementById('alt-cursor').style.top = `${100 - altPct}%`;
    document.getElementById('alt-display').textContent =
      Math.round(450 + lat * 2).toString();
  }

  onZoomChange() {
    document.getElementById('zoom-display').textContent =
      `ZOOM: ${this.map.getZoom()}`;
  }

  onMapMove() {
    const c = this.map.getCenter();
    document.getElementById('center-coords').textContent =
      `LAT: ${c.lat.toFixed(3)} | LNG: ${c.lng.toFixed(3)}`;
  }

  /* ── Layer UI ── */
  buildLayerUI() {
    const list = document.getElementById('layer-list');
    list.innerHTML = '';
    LAYER_DEFS.forEach(def => {
      this.layers[def.id] = { ...def };
      const li = document.createElement('li');
      li.className = `layer-item${def.active ? ' active' : ''}`;
      li.dataset.id = def.id;
      li.style.color = def.color;
      li.innerHTML = `
        <div class="layer-toggle"></div>
        <span class="layer-icon">${def.icon}</span>
        <div class="layer-info">
          <div class="layer-name">${def.name}</div>
          <div class="layer-count" id="lc-${def.id}">···</div>
        </div>
        <div class="layer-dot"></div>
      `;
      li.addEventListener('click', () => this.toggleLayer(def.id));
      list.appendChild(li);
    });
  }

  toggleLayer(id) {
    const layer = this.layers[id];
    layer.active = !layer.active;
    const li = document.querySelector(`.layer-item[data-id="${id}"]`);
    li.classList.toggle('active', layer.active);

    if (layer.active) {
      this.map.addLayer(this.layerGroups[id]);
    } else {
      this.map.removeLayer(this.layerGroups[id]);
    }

    // Special: weather triggers tile layer
    if (id === 'weather') {
      if (layer.active) this.loadWeatherLayer();
      else if (this.weatherLayer) { this.map.removeLayer(this.weatherLayer); this.weatherLayer = null; }
    }

    // Sync dashboard layer button
    const dashBtn = document.querySelector(`.dash-layer-btn[data-id="${id}"]`);
    if (dashBtn) dashBtn.classList.toggle('active', layer.active);
  }

  /* ── View Mode UI ── */
  buildViewModeUI() {
    const container = document.getElementById('view-modes');
    VIEW_MODES.forEach(vm => {
      const btn = document.createElement('button');
      btn.className = `vm-btn${vm.id === this.viewMode ? ' active' : ''}`;
      btn.textContent = vm.label;
      btn.addEventListener('click', () => this.setViewMode(vm.id));
      container.appendChild(btn);
    });
  }

  setViewMode(id) {
    // Remove all mode classes
    VIEW_MODES.forEach(vm => document.body.classList.remove(vm.cls));
    const vm = VIEW_MODES.find(v => v.id === id);
    if (vm) document.body.classList.add(vm.cls);
    this.viewMode = id;

    // Update buttons
    document.querySelectorAll('.vm-btn').forEach((btn, i) => {
      btn.classList.toggle('active', VIEW_MODES[i].id === id);
    });

    // Update badge
    document.getElementById('mode-badge-display').textContent = vm?.label.toUpperCase() || 'FULL';

    // Sync dashboard view mode buttons
    document.querySelectorAll('.dash-vm-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === id);
    });
  }

  /* ── Clock ── */
  startClock() {
    const el = document.getElementById('timestamp-display');
    const tick = () => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2,'0');
      const mm = String(now.getUTCMinutes()).padStart(2,'0');
      const ss = String(now.getUTCSeconds()).padStart(2,'0');
      el.textContent = `${hh}:${mm}:${ss} UTC`;
    };
    tick();
    this.intervals.push(setInterval(tick, 1000));
  }

  /* ── Load all data layers ── */
  loadAllLayers() {
    this.loadFlights();
    this.loadEarthquakes();
    this.loadSatellites();
    this.loadCCTV();
    this.loadTraffic();
  }

  scheduleRefreshes() {
    // Flights refresh every 45s
    this.intervals.push(setInterval(() => this.loadFlights(), 45000));
    // Earthquake refresh every 2m
    this.intervals.push(setInterval(() => this.loadEarthquakes(), 120000));
    // Satellites update every 5s (position propagation)
    this.intervals.push(setInterval(() => this.updateSatellitePositions(), 5000));
    // Distortion chart
    this.intervals.push(setInterval(() => this.updateDistortion(), 1500));
    // Compass drift
    this.intervals.push(setInterval(() => this.updateCompass(), 3000));
    // Signal strength animation
    this.intervals.push(setInterval(() => this.animateSignal(), 4000));
  }

  /* ── Flights (OpenSky Network) ── */
  async loadFlights() {
    const statusEl = document.getElementById('update-status');
    statusEl.textContent = 'FETCHING FLIGHT DATA···';

    try {
      const response = await fetch(
        'https://opensky-network.org/api/states/all?lamin=20&lomin=-130&lamax=70&lomax=45',
        { signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) throw new Error('API error');
      const json = await response.json();
      this.renderFlights(json.states || []);
      this.setApiStatus('opensky', 'online');
      this.pushFeedEvent('flight', `Flight data refreshed — <strong>${this.counts.flights}</strong> airborne`);
    } catch (err) {
      // Fallback: generate mock flights if API fails
      console.warn('[WORLDVIEW] OpenSky API unavailable, using mock data:', err.message);
      this.renderFlights(this.generateMockFlights());
      this.setApiStatus('opensky', 'offline');
      this.pushFeedEvent('flight', `Flight data refreshed — <strong>${this.counts.flights}</strong> airborne (mock)`);
    }

    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2,'0');
    const mm = String(now.getUTCMinutes()).padStart(2,'0');
    statusEl.textContent = `LAST UPDATE: ${hh}:${mm} UTC`;
  }

  generateMockFlights() {
    // Generate realistic-looking flight data for the North Atlantic corridor
    const routes = [
      [51,  -1,  40, -74],  // London → NYC
      [48,   2,  33,-118],  // Paris → LA
      [40, -74,  51,  -1],  // NYC → London
      [53,  -6,  40, -74],  // Dublin → NYC
      [52,  13,  40, -74],  // Berlin → NYC
      [48,  16,  33,-118],  // Vienna → LA
      [41,  28,  40, -74],  // Istanbul → NYC
      [25,  55,  51,  -1],  // Dubai → London
      [35, 139,  37, -122], // Tokyo → SF
      [22, 114,  37, -122], // HK → SF
      [37, -122, 35, 139],  // SF → Tokyo
      [33,-118,  48,   2],  // LA → Paris
    ];
    return routes.map((r, i) => {
      const progress = Math.random();
      const lat = r[0] + (r[2]-r[0]) * progress + (Math.random()-0.5)*2;
      const lng = r[1] + (r[3]-r[1]) * progress + (Math.random()-0.5)*2;
      const hdg = Math.atan2(r[3]-r[1], r[2]-r[0]) * 180/Math.PI;
      return [
        `MOCK${i}`,                // ICAO24
        `FLIGHT${1000+i}`,        // callsign
        'XX',                      // origin country
        null, null,
        lng, lat,                  // longitude, latitude
        10000 + Math.random()*2000,// baro_altitude
        false,                     // on_ground
        800 + Math.random()*100,   // velocity
        (hdg + 360) % 360,         // true_track
      ];
    });
  }

  renderFlights(states) {
    this.layerGroups.flights.clearLayers();
    let count = 0;
    const maxFlights = 300;

    (states || []).slice(0, maxFlights).forEach(s => {
      const callsign = (s[1] || '').trim();
      const lng = s[5], lat = s[6], onGround = s[8];
      const vel = s[9], track = s[10], alt = s[7];

      if (!lat || !lng || onGround) return;

      const icon = L.divIcon({
        className: 'flight-icon',
        html: `<span style="display:inline-block;transform:rotate(${track || 0}deg);font-size:14px;color:#00ff88;text-shadow:0 0 6px #00ff88">✈</span>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const altKm = alt ? (alt / 1000).toFixed(1) : '--';
      const velKnots = vel ? Math.round(vel * 1.94384) : '--';

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(`
          <div class="popup-title">${callsign || 'UNKNOWN'}</div>
          <div class="popup-row"><span class="popup-label">ICAO24</span><span class="popup-val">${s[0]}</span></div>
          <div class="popup-row"><span class="popup-label">ALT</span><span class="popup-val">${altKm} km</span></div>
          <div class="popup-row"><span class="popup-label">SPEED</span><span class="popup-val">${velKnots} kt</span></div>
          <div class="popup-row"><span class="popup-label">HDG</span><span class="popup-val">${Math.round(track || 0)}°</span></div>
          <div class="popup-row"><span class="popup-label">ORIGIN</span><span class="popup-val">${s[2] || '??'}</span></div>
        `)
        .addTo(this.layerGroups.flights);

      count++;
    });

    this.counts.flights = count;
    this.updateStats();
    document.getElementById('lc-flights').textContent = `${count} airborne`;
    document.getElementById('data-count').textContent = `TRACKING ${this.getTotalCount()} OBJECTS`;
  }

  /* ── Earthquakes (USGS) ── */
  async loadEarthquakes() {
    try {
      const r = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
        { signal: AbortSignal.timeout(10000) }
      );
      const json = await r.json();
      this.renderEarthquakes(json.features || []);
      this.setApiStatus('usgs', 'online');
    } catch (err) {
      console.warn('[WORLDVIEW] USGS unavailable:', err.message);
      this.renderEarthquakes(this.generateMockQuakes());
      this.setApiStatus('usgs', 'offline');
    }
  }

  generateMockQuakes() {
    const zones = [
      [35,139],[38,144],[-33,-71],[37,-122],[38,142],
      [28,84],[4,96],[-8,115],[59,153],[20,-156],
    ];
    return zones.map((z, i) => ({
      properties: {
        mag: 2 + Math.random() * 5,
        place: `${(Math.random()*200+10).toFixed(0)}km from Zone ${i}`,
        time: Date.now() - Math.random() * 86400000,
      },
      geometry: { coordinates: [z[1] + (Math.random()-0.5)*2, z[0] + (Math.random()-0.5)*2] },
    }));
  }

  renderEarthquakes(features) {
    this.layerGroups.quakes.clearLayers();
    let count = 0;

    features.forEach(f => {
      const [lng, lat] = f.geometry.coordinates;
      const mag = f.properties.mag || 0;
      const place = f.properties.place || 'Unknown';
      const time = new Date(f.properties.time);

      const size = Math.max(8, mag * 5);
      const opacity = Math.min(1, 0.4 + mag * 0.1);
      const color = mag >= 6 ? '#ff2222' : mag >= 4 ? '#ffaa00' : '#ff4444';

      const icon = L.divIcon({
        className: '',
        html: `<div class="quake-icon" style="width:${size}px;height:${size}px;border-color:${color};background:radial-gradient(circle,${color}55 0%,transparent 70%);opacity:${opacity}"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });

      const hh = String(time.getUTCHours()).padStart(2,'0');
      const mm = String(time.getUTCMinutes()).padStart(2,'0');

      L.marker([lat, lng], { icon })
        .bindPopup(`
          <div class="popup-title ${mag>=5?'popup-alert':''}">M${mag.toFixed(1)} SEISMIC EVENT</div>
          <div class="popup-row"><span class="popup-label">LOCATION</span><span class="popup-val">${place}</span></div>
          <div class="popup-row"><span class="popup-label">MAGNITUDE</span><span class="popup-val ${mag>=5?'popup-alert':''}">${mag.toFixed(1)}</span></div>
          <div class="popup-row"><span class="popup-label">UTC TIME</span><span class="popup-val">${hh}:${mm}</span></div>
          <div class="popup-row"><span class="popup-label">DEPTH</span><span class="popup-val">${(f.geometry.coordinates[2]||0).toFixed(1)} km</span></div>
        `)
        .addTo(this.layerGroups.quakes);

      count++;
    });

    this.counts.quakes = count;
    this.updateStats();
    document.getElementById('lc-quakes').textContent = `${count} events`;
    document.getElementById('data-count').textContent = `TRACKING ${this.getTotalCount()} OBJECTS`;

    this.pushFeedEvent('quake', `Seismic feed updated — <strong>${count} events</strong> detected`);

    // Update alert panel if high-magnitude quakes exist
    const bigOnes = features.filter(f => f.properties.mag >= 5);
    if (bigOnes.length) {
      document.querySelector('.pulse-alert').textContent =
        `◉ M${bigOnes[0].properties.mag.toFixed(1)} QUAKE DETECTED`;
      this.pushFeedEvent('quake', `<strong>M${bigOnes[0].properties.mag.toFixed(1)} QUAKE</strong> — ${bigOnes[0].properties.place || 'Unknown region'}`);
    }
  }

  /* ── Satellites (TLE + satellite.js propagation) ── */
  loadSatellites() {
    SATELLITE_TLES.forEach(sat => {
      this.markers.satellites[sat.name] = null;
    });
    this.updateSatellitePositions();
  }

  updateSatellitePositions() {
    this.layerGroups.satellites.clearLayers();
    const now = new Date();
    let count = 0;

    SATELLITE_TLES.forEach(sat => {
      try {
        // Use satellite.js if available
        let lat, lng, alt;
        if (typeof satellite !== 'undefined') {
          const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
          const pv = satellite.propagate(satrec, now);
          if (!pv.position) return;
          const gmst = satellite.gstime(now);
          const geo = satellite.eciToGeodetic(pv.position, gmst);
          lat = satellite.degreesLat(geo.latitude);
          lng = satellite.degreesLong(geo.longitude);
          alt = geo.height; // km
        } else {
          // Rough fallback position
          lat = (Math.random() - 0.5) * 160;
          lng = (Math.random() - 0.5) * 360;
          alt = 400 + Math.random() * 200;
        }

        const typeColors = {
          station:   '#ffffff',
          telescope: '#aaddff',
          starlink:  '#4488ff',
          weather:   '#88aaff',
          gps:       '#ffaa00',
          'earth-obs': '#00ffcc',
        };
        const color = typeColors[sat.type] || '#4488ff';
        const glyph = sat.type === 'station' ? '◎' : sat.type === 'starlink' ? '◈' : '◇';

        const icon = L.divIcon({
          className: 'sat-icon',
          html: `<span style="color:${color};text-shadow:0 0 8px ${color};font-size:13px">${glyph}</span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        L.marker([lat, lng], { icon })
          .bindPopup(`
            <div class="popup-title">${sat.name}</div>
            <div class="popup-row"><span class="popup-label">TYPE</span><span class="popup-val">${sat.type.toUpperCase()}</span></div>
            <div class="popup-row"><span class="popup-label">ALT</span><span class="popup-val">${alt ? alt.toFixed(0) : '--'} km</span></div>
            <div class="popup-row"><span class="popup-label">LAT</span><span class="popup-val">${lat.toFixed(2)}°</span></div>
            <div class="popup-row"><span class="popup-label">LNG</span><span class="popup-val">${lng.toFixed(2)}°</span></div>
            <div class="popup-row"><span class="popup-label">STATUS</span><span class="popup-val" style="color:#00ff88">TRACKED</span></div>
          `)
          .addTo(this.layerGroups.satellites);

        count++;
      } catch (e) {
        console.warn('[WORLDVIEW] Satellite propagation error:', sat.name, e.message);
      }
    });

    this.counts.sats = count;
    this.updateStats();
    document.getElementById('lc-satellites').textContent = `${count} tracked`;
    document.getElementById('data-count').textContent = `TRACKING ${this.getTotalCount()} OBJECTS`;
  }

  /* ── CCTV ── */
  loadCCTV() {
    this.layerGroups.cctv.clearLayers();
    let count = 0;

    CCTV_LOCATIONS.forEach(cam => {
      const statusColor = cam.status === 'ONLINE' ? '#ff8800' : cam.status === 'DEGRADED' ? '#ffaa00' : '#ff4444';

      const icon = L.divIcon({
        className: 'cctv-icon',
        html: `<span style="color:${statusColor};text-shadow:0 0 6px ${statusColor};font-size:12px">⊡</span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([cam.lat, cam.lng], { icon })
        .bindPopup(`
          <div class="popup-title">CCTV NODE ${cam.id}</div>
          <div class="popup-row"><span class="popup-label">STATUS</span><span class="popup-val ${cam.status==='ONLINE'?'':'popup-alert'}">${cam.status}</span></div>
          <div class="popup-row"><span class="popup-label">LAT</span><span class="popup-val">${cam.lat.toFixed(4)}°</span></div>
          <div class="popup-row"><span class="popup-label">LNG</span><span class="popup-val">${cam.lng.toFixed(4)}°</span></div>
        `)
        .addTo(this.layerGroups.cctv);

      count++;
    });

    this.counts.cctv = count;
    this.updateStats();
    document.getElementById('lc-cctv').textContent = `${count} nodes`;
  }

  /* ── Traffic ── */
  loadTraffic() {
    this.layerGroups.traffic.clearLayers();
    const colors = { high:'#ff4444', medium:'#ffaa00', low:'#00ff88' };

    TRAFFIC_ZONES.forEach(zone => {
      const color = colors[zone.level];
      const size  = zone.level === 'high' ? 16 : zone.level === 'medium' ? 12 : 9;

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${color};background:${color}33;box-shadow:0 0 8px ${color}55"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });

      L.marker([zone.lat, zone.lng], { icon })
        .bindPopup(`
          <div class="popup-title">TRAFFIC ZONE</div>
          <div class="popup-row"><span class="popup-label">AREA</span><span class="popup-val">${zone.label}</span></div>
          <div class="popup-row"><span class="popup-label">CONGESTION</span><span class="popup-val ${zone.level==='high'?'popup-alert':''}">${zone.level.toUpperCase()}</span></div>
        `)
        .addTo(this.layerGroups.traffic);
    });

    document.getElementById('lc-traffic').textContent = `${TRAFFIC_ZONES.length} zones`;
  }

  /* ── Weather Radar (RainViewer) ── */
  async loadWeatherLayer() {
    if (this.weatherLayer) {
      this.map.removeLayer(this.weatherLayer);
      this.weatherLayer = null;
    }

    try {
      const r = await fetch('https://api.rainviewer.com/public/weather-maps.json',
        { signal: AbortSignal.timeout(8000) });
      const json = await r.json();
      const frames = json.radar?.past || [];
      if (!frames.length) return;

      const latest = frames[frames.length - 1];
      const tileUrl = `${json.host}${latest.path}/512/{z}/{x}/{y}/6/1_1.png`;

      this.weatherLayer = L.tileLayer(tileUrl, {
        opacity: 0.55,
        attribution: 'RainViewer',
      });

      if (this.layers.weather?.active) {
        this.weatherLayer.addTo(this.map);
      }
      this.setApiStatus('rainviewer', 'online');
    } catch (err) {
      console.warn('[WORLDVIEW] RainViewer unavailable:', err.message);
      this.setApiStatus('rainviewer', 'offline');
    }
  }

  /* ── Stats ── */
  updateStats() {
    document.getElementById('stat-flights').textContent = this.counts.flights.toString();
    document.getElementById('stat-quakes').textContent  = this.counts.quakes.toString();
    document.getElementById('stat-sats').textContent    = this.counts.sats.toString();
    document.getElementById('stat-cctv').textContent    = this.counts.cctv.toString();

    // Mirror to dashboard
    const fields = [
      ['dash-count-flights', this.counts.flights],
      ['dash-count-quakes',  this.counts.quakes],
      ['dash-count-sats',    this.counts.sats],
      ['dash-count-cctv',    this.counts.cctv],
    ];
    fields.forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val.toString();
    });
  }

  getTotalCount() {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }

  /* ── Distortion chart (canvas sparkline) ── */
  initDistortionChart() {
    this.distortionHistory = Array(30).fill(0.5).map(() => 0.3 + Math.random() * 0.4);
    this.drawDistortionChart();
  }

  updateDistortion() {
    const last = this.distortionHistory[this.distortionHistory.length - 1];
    const next = Math.max(0, Math.min(1, last + (Math.random() - 0.5) * 0.2));
    this.distortionHistory.push(next);
    this.distortionHistory.shift();
    this.drawDistortionChart();
  }

  drawDistortionChart() {
    const canvas = document.getElementById('distortion-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,136,0.1)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= h; y += h/4) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }

    // Sparkline
    const data = this.distortionHistory;
    const stepX = w / (data.length - 1);

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = h - v * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(0,255,136,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill under line
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = 'rgba(0,255,136,0.08)';
    ctx.fill();

    // Current value dot
    const lastVal = data[data.length - 1];
    ctx.beginPath();
    ctx.arc(w, h - lastVal * h, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();
  }

  /* ── Compass ── */
  initCompass() {
    this.compassAngle = 0;
    this.drawCompass();
  }

  updateCompass() {
    this.compassAngle = (this.compassAngle + (Math.random() - 0.48) * 5 + 360) % 360;
    this.drawCompass();
  }

  drawCompass() {
    const canvas = document.getElementById('compass-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2, r = Math.min(cx, cy) - 4;

    ctx.clearRect(0, 0, w, h);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,136,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cardinal labels
    const dirs = [['N',0],['E',90],['S',180],['W',270]];
    ctx.font = '9px Courier New';
    ctx.fillStyle = 'rgba(0,255,136,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    dirs.forEach(([label, deg]) => {
      const rad = (deg - 90) * Math.PI / 180;
      const x = cx + (r - 10) * Math.cos(rad);
      const y = cy + (r - 10) * Math.sin(rad);
      ctx.fillText(label, x, y);
    });

    // Tick marks
    for (let i = 0; i < 36; i++) {
      const rad = (i * 10 - 90) * Math.PI / 180;
      const inner = i % 9 === 0 ? r - 16 : r - 10;
      ctx.beginPath();
      ctx.moveTo(cx + r * Math.cos(rad), cy + r * Math.sin(rad));
      ctx.lineTo(cx + inner * Math.cos(rad), cy + inner * Math.sin(rad));
      ctx.strokeStyle = i % 9 === 0 ? 'rgba(0,255,136,0.5)' : 'rgba(0,255,136,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Needle (rotated by compassAngle)
    const needleRad = (this.compassAngle - 90) * Math.PI / 180;
    const needleLen = r - 18;

    // North (red tip)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + needleLen * Math.cos(needleRad), cy + needleLen * Math.sin(needleRad));
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // South (green tip)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - (needleLen*0.6) * Math.cos(needleRad), cy - (needleLen*0.6) * Math.sin(needleRad));
    ctx.strokeStyle = 'rgba(0,255,136,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();

    // Angle label
    ctx.font = '9px Courier New';
    ctx.fillStyle = 'rgba(0,255,136,0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(Math.round(this.compassAngle) + '°', cx, cy + r - 12);
  }

  /* ── Noise canvas (NVG grain) ── */
  initNoise() {
    const canvas = document.getElementById('noise-canvas');
    if (!canvas) return;

    const w = canvas.width  = window.innerWidth;
    const h = canvas.height = window.innerHeight;

    const drawNoise = () => {
      const imageData = canvas.getContext('2d').createImageData(w, h);
      const buf = imageData.data;
      for (let i = 0; i < buf.length; i += 4) {
        const v = Math.random() * 255;
        buf[i] = buf[i+1] = buf[i+2] = v;
        buf[i+3] = 255;
      }
      canvas.getContext('2d').putImageData(imageData, 0, 0);
      this.noiseAnimId = requestAnimationFrame(drawNoise);
    };
    drawNoise();
  }

  /* ── Signal bars animation ── */
  animateSignal() {
    const bars = document.querySelectorAll('.sig-bar');
    const strength = 3 + Math.floor(Math.random() * 3); // 3–5
    bars.forEach((bar, i) => {
      bar.classList.toggle('active', i < strength);
    });
    const labels = ['WEAK','FAIR','FAIR','GOOD','STRONG'];
    document.getElementById('sig-label').textContent = labels[strength-1] || 'STRONG';
  }

  /* ── Bind misc events ── */
  bindEvents() {
    // Window resize — update noise canvas
    window.addEventListener('resize', () => {
      const canvas = document.getElementById('noise-canvas');
      if (canvas) {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      const modeMap = {
        '1':'full','2':'crt','3':'nvg','4':'flir',
        '5':'anime','6':'noir','7':'space','8':'ai',
      };
      if (modeMap[e.key]) this.setViewMode(modeMap[e.key]);
    });

    // Satellite link dots – random blink
    this.intervals.push(setInterval(() => {
      const dots = document.querySelectorAll('.status-dot[id^="sat-dot"]');
      let linked = 0;
      dots.forEach(d => {
        const on = Math.random() > 0.3;
        d.classList.toggle('active', on);
        if (on) linked++;
      });
      const label = document.getElementById('sat-count-label');
      if (label) label.textContent = `${linked}/${dots.length} LINKED`;
    }, 5000));

    // Simulate system metric drift
    this.intervals.push(setInterval(() => {
      document.querySelectorAll('.sys-fill').forEach(fill => {
        const current = parseFloat(fill.style.width);
        const next = Math.max(5, Math.min(95, current + (Math.random()-0.5)*8));
        fill.style.width = next.toFixed(0) + '%';
        // Update label in parent
        const row = fill.closest('.sys-row');
        if (row) {
          const span = row.querySelectorAll('span')[1];
          if (span) span.textContent = next.toFixed(0) + '%';
        }
      });
      this.syncDashboardMetrics();
    }, 3000));
  }
}

  /* ── Dashboard: build layer toggle buttons ── */
  buildDashboardLayerBtns() {
    const container = document.getElementById('dash-layer-btns');
    if (!container) return;
    container.innerHTML = '';

    const countMap = {
      flights:    this.counts.flights,
      quakes:     this.counts.quakes,
      satellites: this.counts.sats,
      cctv:       this.counts.cctv,
      traffic:    TRAFFIC_ZONES.length,
      weather:    '--',
    };

    LAYER_DEFS.forEach(def => {
      const btn = document.createElement('button');
      const isActive = this.layers[def.id]?.active ?? def.active;
      btn.className = `dash-layer-btn${isActive ? ' active' : ''}`;
      btn.dataset.id = def.id;
      btn.style.color = def.color;
      btn.innerHTML = `
        <span class="dlb-icon">${def.icon}</span>
        <span class="dlb-name">${def.name.toUpperCase()}</span>
        <span class="dlb-count" id="dlb-count-${def.id}">${countMap[def.id] ?? '--'}</span>
        <span class="dlb-indicator"></span>
      `;
      btn.addEventListener('click', () => {
        this.toggleLayer(def.id);
        btn.classList.toggle('active', this.layers[def.id].active);
      });
      container.appendChild(btn);
    });
  }

  /* ── Dashboard: build view mode buttons ── */
  buildDashboardViewModeBtns() {
    const container = document.getElementById('dash-view-mode-btns');
    if (!container) return;
    container.innerHTML = '';

    VIEW_MODES.forEach(vm => {
      const btn = document.createElement('button');
      btn.className = `dash-vm-btn${vm.id === this.viewMode ? ' active' : ''}`;
      btn.dataset.id = vm.id;
      btn.textContent = vm.label.toUpperCase();
      btn.addEventListener('click', () => {
        this.setViewMode(vm.id);
      });
      container.appendChild(btn);
    });
  }

  /* ── Dashboard: bind open/close/preset events ── */
  bindDashboardEvents() {
    const panel    = document.getElementById('dashboard-panel');
    const openBtn  = document.getElementById('dashboard-btn');
    const closeBtn = document.getElementById('dashboard-close-btn');

    const openDashboard = () => {
      panel.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.classList.add('open');
          openBtn.classList.add('active');
          this.syncDashboardMetrics();
          this.renderFeed();
        });
      });
    };

    const closeDashboard = () => {
      panel.classList.remove('open');
      openBtn.classList.remove('active');
      setTimeout(() => panel.classList.add('hidden'), 360);
    };

    openBtn.addEventListener('click', openDashboard);
    closeBtn.addEventListener('click', closeDashboard);

    // Preset buttons
    document.querySelectorAll('.dash-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyPreset(btn.dataset.preset);
        closeDashboard();
      });
    });

    // Stat cards: clicking toggles that layer
    document.querySelectorAll('.dash-stat-card[data-layer]').forEach(card => {
      card.addEventListener('click', () => {
        this.toggleLayer(card.dataset.layer);
        this.buildDashboardLayerBtns();
      });
    });

    // Escape key closes dashboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closeDashboard();
      }
    });
  }

  /* ── Dashboard: apply surveillance preset ── */
  applyPreset(preset) {
    const configs = {
      minimal: { flights:true,  quakes:false, satellites:false, traffic:false, weather:false, cctv:false },
      full:    { flights:true,  quakes:true,  satellites:true,  traffic:true,  weather:true,  cctv:true  },
      threat:  { flights:false, quakes:true,  satellites:false, traffic:true,  weather:false, cctv:true  },
    };
    const config = configs[preset];
    if (!config) return;

    Object.entries(config).forEach(([id, shouldBeActive]) => {
      const layer = this.layers[id];
      if (!layer) return;
      if (layer.active !== shouldBeActive) this.toggleLayer(id);
    });

    this.buildDashboardLayerBtns();
    this.pushFeedEvent('system', `Preset applied: <strong>${preset.toUpperCase()}</strong>`);
  }

  /* ── Dashboard: sync system metric bars ── */
  syncDashboardMetrics() {
    const sideFills  = document.querySelectorAll('#left-sidebar .sys-fill');
    const dashFillIds = ['dash-cpu-fill', 'dash-net-fill', 'dash-mem-fill'];
    const dashPctIds  = ['dash-cpu-pct',  'dash-net-pct',  'dash-mem-pct'];

    sideFills.forEach((fill, i) => {
      const pct = fill.style.width || '0%';
      const dashFill = document.getElementById(dashFillIds[i]);
      const dashPct  = document.getElementById(dashPctIds[i]);
      if (dashFill) dashFill.style.width = pct;
      if (dashPct)  dashPct.textContent  = pct;
    });
  }

  /* ── Dashboard: set API status indicator ── */
  setApiStatus(api, status) {
    this.apiStatus[api] = status;
    const dot = document.getElementById(`api-dot-${api}`);
    const lbl = document.getElementById(`api-status-${api}`);
    if (!dot) return;
    dot.className = `dash-api-dot ${status}`;
    if (lbl) lbl.textContent = status.toUpperCase();
  }

  /* ── Dashboard: activity feed ── */
  pushFeedEvent(type, html) {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2,'0');
    const mm = String(now.getUTCMinutes()).padStart(2,'0');
    const ss = String(now.getUTCSeconds()).padStart(2,'0');
    const time = `${hh}:${mm}:${ss}`;

    this.activityFeed.unshift({ type, html, time });
    if (this.activityFeed.length > 10) this.activityFeed.length = 10;

    this.renderFeed();
  }

  renderFeed() {
    const feed = document.getElementById('dash-feed');
    if (!feed) return;
    feed.innerHTML = '';
    const icons = { flight:'✈', quake:'⚡', sat:'◎', system:'◈' };
    this.activityFeed.forEach(item => {
      const div = document.createElement('div');
      div.className = `dash-feed-item feed-${item.type}`;
      div.innerHTML = `
        <span class="feed-icon">${icons[item.type] || '◉'}</span>
        <span class="feed-text">${item.html}</span>
        <span class="feed-time">${item.time}</span>
      `;
      feed.appendChild(div);
    });
  }
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  const app = new WorldView();
  app.init();
  window._worldview = app; // expose for debugging
});
