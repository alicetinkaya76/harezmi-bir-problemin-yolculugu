(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const supplied = window.IDRISI_MAPS;
  const maps = Array.isArray(supplied) ? supplied : (supplied && Array.isArray(supplied.maps) ? supplied.maps : []);
  const usableMaps = maps.filter(map => map && typeof map.id === 'string' && typeof map.title === 'string' && typeof map.image === 'string');
  const select = byId('map-select');
  const image = byId('map-image');
  const viewport = byId('map-viewport');
  const empty = byId('map-empty');
  const originalButton = byId('orientation-original');
  const northButton = byId('orientation-north');
  const zoomOut = byId('zoom-out');
  const zoomIn = byId('zoom-in');
  let selected;
  let northUp = false;
  let zoom = 1;

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  function setLink(element, value, text) {
    const href = safeUrl(value);
    if (text) element.textContent = text;
    element.hidden = !href;
    if (href) element.href = href;
    else element.removeAttribute('href');
  }

  function updateView() {
    const rotated = northUp && selected.northUpRequiresRotation === true;
    image.classList.toggle('is-north-up', rotated);
    image.style.width = `${zoom * 100}%`;
    const desiredImage = zoom > 1 ? (selected.fullImage || selected.image) : selected.image;
    const desiredUrl = safeUrl(desiredImage);
    if (desiredUrl && image.src !== desiredUrl) image.src = desiredUrl;
    originalButton.setAttribute('aria-pressed', String(!northUp));
    northButton.setAttribute('aria-pressed', String(northUp));
    byId('zoom-level').textContent = `%${Math.round(zoom * 100)}`;
    zoomOut.disabled = zoom <= 1;
    zoomIn.disabled = zoom >= 4;
    const originalDirection = selected.northUpRequiresRotation === true ? 'Özgün haritada güney yukarıda.' : 'Görsel kaynak yönünde gösteriliyor.';
    byId('orientation-status').textContent = northUp
      ? (rotated ? 'Kuzey yukarı: görsel 180° çevrildi; yazılar da birlikte döner.' : 'Kuzey yukarı görünümü: bu görselin çevrilmesi gerekmiyor.')
      : originalDirection;
  }

  function chooseMap(map, changeHash = false) {
    selected = map;
    northUp = false;
    zoom = 1;
    select.value = map.id;
    byId('map-title').textContent = map.title;
    byId('map-position').textContent = `${usableMaps.indexOf(map) + 1} / ${usableMaps.length} · HARİTA SEÇKİSİ`;
    byId('map-date').textContent = map.dateLabel || 'Tarih bilgisi kaynak kaydında verilmiştir.';
    byId('map-rights').textContent = map.rights || 'Kullanım bilgisi için kaynak kaydına bakınız.';
    setLink(byId('map-source'), map.sourceUrl, map.sourceLabel || 'Kaynak kaydını aç ↗');
    setLink(byId('map-original'), map.fullImage || map.image, 'Tam boy görseli aç ↗');
    setLink(byId('map-image-record'), map.imageRecordUrl, 'Görüntü ve hak kaydı ↗');
    setLink(byId('map-manuscript'), map.manuscriptUrl || map.sourceUrl, 'Kaynak eserin tamamını aç ↗');
    const description = byId('map-description');
    description.replaceChildren();
    for (const text of (Array.isArray(map.description) ? map.description : [])) {
      if (typeof text !== 'string') continue;
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      description.append(paragraph);
    }
    image.alt = map.alt || map.title;
    empty.hidden = false;
    empty.textContent = 'Harita görüntüsü yükleniyor.';
    image.hidden = true;
    const imageUrl = safeUrl(map.image);
    if (imageUrl) image.src = imageUrl;
    else {
      image.removeAttribute('src');
      empty.textContent = 'Harita görüntüsü açılamadı. Kaynak kaydını kullanabilirsin.';
    }
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
    originalButton.disabled = false;
    northButton.disabled = false;
    updateView();
    if (changeHash) history.replaceState(null, '', `#${encodeURIComponent(map.id)}`);
  }

  image.addEventListener('load', () => {
    image.hidden = false;
    empty.hidden = true;
  });
  image.addEventListener('error', () => {
    image.hidden = true;
    empty.hidden = false;
    empty.textContent = 'Harita görüntüsü yüklenemedi. Aşağıdaki kaynak bağlantısından açabilirsin.';
  });

  if (!usableMaps.length) {
    select.replaceChildren(new Option('Harita kaydı bulunamadı', ''));
    empty.textContent = 'Harita kayıtları şu anda yüklenemedi. Sayfayı yeniden açmayı deneyebilirsin.';
    return;
  }

  select.replaceChildren(...usableMaps.map(map => new Option(map.title, map.id)));
  select.disabled = false;
  function fromHash() {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { /* Unknown hash uses the first map. */ }
    return usableMaps.find(map => map.id === id) || usableMaps[0];
  }
  select.addEventListener('change', () => chooseMap(usableMaps.find(map => map.id === select.value) || usableMaps[0], true));
  originalButton.addEventListener('click', () => { northUp = false; updateView(); });
  northButton.addEventListener('click', () => { northUp = true; updateView(); });
  zoomOut.addEventListener('click', () => { zoom = Math.max(1, zoom - 0.5); updateView(); });
  zoomIn.addEventListener('click', () => { zoom = Math.min(4, zoom + 0.5); updateView(); });
  window.addEventListener('hashchange', () => {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const map = usableMaps.find(item => item.id === id);
    if (map) chooseMap(map);
  });
  chooseMap(fromHash());
})();
