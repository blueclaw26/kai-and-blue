/* ===== Fog of War Map ===== */
(function () {
  'use strict';

  // --- Constants ---
  const STORAGE_KEY = 'fog-explored';
  const STORAGE_TRAIL = 'fog-trail';
  const GRID_STEP = 0.0003;       // ~30 m grid snap
  const CLEAR_RADIUS_M = 30;      // metres per cleared circle
  const DEFAULT_CENTER = [35.6812, 139.7671];
  const DEFAULT_ZOOM = 15;

  // --- State ---
  let map, fogCanvas, fogCtx;
  let explored = new Set();       // "lat,lng" grid keys
  let trail = [];                 // ordered [{lat,lng},...] for distance
  let todayKeys = new Set();
  let watchId = null;
  let posMarker = null;
  let totalDistance = 0;

  // --- Helpers ---
  function gridKey(lat, lng) {
    const gLat = (Math.round(lat / GRID_STEP) * GRID_STEP).toFixed(5);
    const gLng = (Math.round(lng / GRID_STEP) * GRID_STEP).toFixed(5);
    return gLat + ',' + gLng;
  }

  function parseKey(key) {
    const [lat, lng] = key.split(',').map(Number);
    return L.latLng(lat, lng);
  }

  function haversine(a, b) {
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  // --- Persistence ---
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...explored]));
      localStorage.setItem(STORAGE_TRAIL, JSON.stringify(trail));
    } catch (_) { /* quota */ }
  }

  function load() {
    try {
      const keys = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (keys) keys.forEach(k => explored.add(k));
      const t = JSON.parse(localStorage.getItem(STORAGE_TRAIL));
      if (t) {
        trail = t;
        totalDistance = 0;
        for (let i = 1; i < trail.length; i++) {
          totalDistance += haversine(trail[i - 1], trail[i]);
        }
      }
    } catch (_) { /* corrupt */ }
  }

  function clearData() {
    explored.clear();
    trail = [];
    todayKeys.clear();
    totalDistance = 0;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TRAIL);
    updateStats();
    redrawFog();
  }

  // --- Stats ---
  function updateStats() {
    document.getElementById('distance').textContent =
      (totalDistance / 1000).toFixed(2) + ' km';
    document.getElementById('points').textContent = explored.size;
    document.getElementById('today-points').textContent = todayKeys.size;
  }

  // --- Fog Overlay ---
  function initFog() {
    // Create canvas as overlay on map container
    const container = map.getContainer();
    fogCanvas = document.createElement('canvas');
    fogCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:399;';
    container.appendChild(fogCanvas);

    function resize() {
      fogCanvas.width = container.clientWidth;
      fogCanvas.height = container.clientHeight;
      redrawFog();
    }

    fogCtx = fogCanvas.getContext('2d');
    resize();

    window.addEventListener('resize', resize);
    map.on('move zoom viewreset zoomend moveend', redrawFog);

    redrawFog();
  }

  function metersToPixels(meters, lat) {
    const zoom = map.getZoom();
    const scale = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
    return meters / scale;
  }

  function redrawFog() {
    if (!fogCtx) return;
    const w = fogCanvas.width;
    const h = fogCanvas.height;
    if (w === 0 || h === 0) return;

    // Clear canvas completely first, then draw fog
    fogCtx.clearRect(0, 0, w, h);
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    fogCtx.fillRect(0, 0, w, h);

    // Cut explored grid cells (square tiles)
    fogCtx.globalCompositeOperation = 'destination-out';
    fogCtx.fillStyle = 'rgba(255, 255, 255, 1)';

    explored.forEach(key => {
      const latlng = parseKey(key);
      // Calculate the full grid cell bounds
      const cellLat = latlng.lat;
      const cellLng = latlng.lng;
      const halfStep = GRID_STEP / 2;
      
      // Four corners of the grid cell
      const nw = map.latLngToContainerPoint([cellLat + halfStep, cellLng - halfStep]);
      const se = map.latLngToContainerPoint([cellLat - halfStep, cellLng + halfStep]);
      
      const cellW = se.x - nw.x;
      const cellH = se.y - nw.y;

      // Skip off-screen cells
      if (se.x < 0 || nw.x > w || se.y < 0 || nw.y > h) return;

      fogCtx.fillRect(nw.x, nw.y, cellW, cellH);
    });
  }

  // --- GPS ---
  function addPoint(lat, lng) {
    const key = gridKey(lat, lng);
    const isNew = !explored.has(key);

    explored.add(key);

    const pos = { lat, lng };
    if (trail.length > 0) {
      const last = trail[trail.length - 1];
      const d = haversine(last, pos);
      // Skip if too close (noise) or impossibly far (GPS jump)
      if (d < 2 || d > 500) return;
      totalDistance += d;
    }
    trail.push(pos);

    if (isNew) {
      todayKeys.add(key);
    }

    save();
    updateStats();
    redrawFog();
  }

  function startTracking() {
    if (watchId !== null) return;
    if (!navigator.geolocation) {
      alert('このブラウザではGPSが使えません');
      return;
    }

    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 100) return;

        updatePositionMarker(latitude, longitude);
        addPoint(latitude, longitude);
        map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
      },
      (err) => {
        console.warn('GPS error:', err.message);
        alert('GPS取得エラー: ' + err.message + '\n\nブラウザの位置情報を許可してください。');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );
  }

  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
  }

  function updatePositionMarker(lat, lng) {
    if (!posMarker) {
      const icon = L.divIcon({
        className: '',
        html: '<div class="pos-dot"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      posMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
    } else {
      posMarker.setLatLng([lat, lng]);
    }
  }

  // --- Init ---
  function init() {
    map = L.map('map', {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Locate button
    const LocateControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function () {
        const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        btn.innerHTML = '<a href="#" title="現在地" style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:20px;text-decoration:none;background:#fff;border-radius:8px;">📍</a>';
        btn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          map.locate({ setView: true, maxZoom: 17 });
        };
        return btn;
      }
    });
    map.addControl(new LocateControl());

    load();
    initFog();
    updateStats();

    // Controls
    document.getElementById('btn-start').addEventListener('click', startTracking);
    document.getElementById('btn-stop').addEventListener('click', stopTracking);
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('すべての探索データをリセットしますか？')) {
        stopTracking();
        clearData();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
