(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const data = window.IDRISI_MODERN;
  if (!data || !data.world || !data.sicily) {
    byId('load-error').hidden = false;
    return;
  }
  const NS = 'http://www.w3.org/2000/svg';
  const worldPlaces = [
    {name:'Cebelitarık Boğazı',old:[1200,292],geo:[-5.6,35.95],note:'Akdeniz’in Atlas Okyanusu’na açılan dar kapısını bul. Tarihî haritada da bu bağlantı seçilebilir. Denizin genel biçimi ve çevresindeki mesafeler ise modern çizimle aynı değildir.'},
    {name:'Sicilya',old:[1033,326],geo:[14,37.6],note:'İtalya’nın güneyindeki bu ada, iki haritada da Akdeniz’in ortasında yer alır. II. Ruggiero’nun sarayının bulunduğu Palermo da buradadır. Adanın ayrıntısını görmek için yukarıdan “Sicilya” karşılaştırmasına geçebilirsin.'},
    {name:'Nil deltası',old:[771,249],geo:[31,30.9],note:'Nil’in Akdeniz’e ulaşırken kollara ayrıldığı bölgeyi izle. Tarihî haritada nehir ağı belirgindir. Bir nehri tanıyabilmek ile onun bütün uzunluğunu doğru ölçekle çizebilmek farklı başarılardır.'},
    {name:'Kızıldeniz',old:[675,177],geo:[38.5,20],note:'Afrika ile Arabistan arasındaki uzun denizi bul. İki haritada da ayırt edilebilir; biçimi ve genişliği değişir. Deniz yollarını anlatan bir coğrafya eserinde bu bağlantıları görebilmek önemlidir.'},
    {name:'Hazar Denizi',old:[485,394],geo:[51,42],note:'Karaların ortasındaki büyük iç denize bak. Tarihî çizimdeki biçimini modern kıyıyla karşılaştır. Aynı yeri tanıyoruz; aynı şekli veya aynı ölçeği görmüyoruz.'},
    {name:'Hindistan',old:[310,185],geo:[78,22],note:'Asya’nın güneyindeki geniş bölgeyi iki haritada bul. Tarihî haritada yarımadanın boyutları, kıyıları ve çevresindeki adalar modern görünümden belirgin biçimde farklıdır. İşaret bir kenti değil, geniş Hindistan bölgesini gösterir.'}
  ];
  // Historical symbol centers: BnF Idrisi4.pdf, page 5, read on the 1280 × 868 image.
  // Modern approximate city points: Natural Earth populated places (Palermo, Siracusa),
  // GeoNames Agrigento (37.31065 N, 13.57661 E). These are teaching anchors, not survey points.
  const sicilyPlaces = [
    {name:'Palermo',old:[600,506],geo:[13.348081,38.126969],note:'Adanın kuzey kıyısındaki Palermo, II. Ruggiero’nun sarayının bulunduğu kenttir. Tarihî kent işareti, BnF’nin açıklamalı görseline göre seçildi. Çevresindeki kıyıya bak: işaret hizalansa da kıyının bütünü aynı biçimi almıyor.'},
    {name:'Siraküza',old:[235,396],geo:[15.28996,37.070359],note:'Siraküza (Siracusa / Syracuse), Sicilya’nın doğu kıyısındadır. BnF’nin etiketlediği tarihî kent işareti burada modern kent konumuna getirildi. Kaydırıcıyı oynatarak adanın doğu kıyısındaki biçim farkını izle.'},
    {name:'Agrigento',old:[440,284],geo:[13.57661,37.31065],note:'Agrigento adanın güney kesimindedir. Bu üçüncü işaret, görselin yaklaşık hizasını belirler. İki kentle yön ve boyut karşılaştırılabilir; üçüncü kentle ayrıca esnetme belirlenir. Bu yüzden işaretlerin çakışması bağımsız bir doğruluk testi değildir.'}
  ];
  let zoom = 1;
  let selectedWorld = 0;
  let selectedSicily = 0;
  let sicilyReady = false;
  let historicalImage;
  let coastOutline;
  let worldReady = false;
  let worldImage;
  let worldCoast;
  let worldMatrix;
  let worldZoom = 1;

  function svgNode(name, attributes = {}) {
    const element = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
  }
  function project(map, geo) {
    const [west,,east,north] = map.bounds;
    return [(geo[0]-west)*map.width/(east-west),(north-geo[1])*map.width/((east-west)*map.cos)];
  }
  function baseMap(svg, map) {
    svg.setAttribute('viewBox', `0 0 ${map.width} ${map.height}`);
    svg.append(svgNode('rect',{width:map.width,height:map.height,fill:'#e6eff0'}));
    svg.append(svgNode('path',{d:map.landPath,fill:'#dce0ca',stroke:'#718a73','stroke-width':0.9,'fill-rule':'evenodd'}));
  }
  function positionPin(pin, point, width, height) {
    pin.style.left = `${100*point[0]/width}%`;
    pin.style.top = `${100*point[1]/height}%`;
  }
  function makePlaceButtons(container, places, onSelect) {
    places.forEach((place,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed',String(index===0));
      const number = document.createElement('span');
      number.className = 'place-number';
      number.textContent = `${index+1} `;
      button.append(number,document.createTextNode(place.name));
      button.addEventListener('click',()=>onSelect(index));
      container.append(button);
    });
  }
  function selectPlace(container, index) {
    [...container.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  }
  function chooseWorld(index) {
    selectedWorld = index;
    const place = worldPlaces[index];
    const oldPin = byId('world-old-point');
    const newPin = byId('world-new-point');
    oldPin.textContent = newPin.textContent = String(index+1);
    oldPin.dataset.number = newPin.dataset.number = String(index+1);
    positionPin(oldPin,[1280-place.old[0],591-place.old[1]],1280,591);
    positionPin(newPin,project(data.world,place.geo),data.world.width,data.world.height);
    selectPlace(byId('world-places'),index);
    byId('world-place-title').textContent = `${index+1} · ${place.name}`;
    byId('world-place-note').textContent = place.note;
    if (worldReady) {
      const [a,b,c,d,e,f] = worldMatrix;
      const [x,y] = place.old;
      const historicalPoint = [a*x+c*y+e,b*x+d*y+f];
      [...byId('world-overlay-pins').children].forEach((pin,i)=>{
        pin.textContent = pin.dataset.number = String(index+1);
        positionPin(pin,i===0?project(data.world,place.geo):historicalPoint,data.world.width,data.world.height);
      });
    }
  }
  function chooseSicily(index) {
    selectedSicily = index;
    selectPlace(byId('sicily-places'),index);
    [...byId('sicily-pins').children].forEach((pin,i)=>pin.classList.toggle('is-selected',i===index));
    byId('sicily-place-title').textContent = `${index+1} · ${sicilyPlaces[index].name}`;
    byId('sicily-place-note').textContent = sicilyPlaces[index].note;
  }
  // Affine transform of the historical image; the modern geometry remains unchanged.
  function affineFromThree(source, target) {
    const [[x1,y1],[x2,y2],[x3,y3]] = source;
    const denominator = x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2);
    function coefficients(values) {
      const [v1,v2,v3] = values;
      return [
        (v1*(y2-y3)+v2*(y3-y1)+v3*(y1-y2))/denominator,
        (v1*(x3-x2)+v2*(x1-x3)+v3*(x2-x1))/denominator,
        (v1*(x2*y3-x3*y2)+v2*(x3*y1-x1*y3)+v3*(x1*y2-x2*y1))/denominator
      ];
    }
    const [a,c,e] = coefficients(target.map(p=>p[0]));
    const [b,d,f] = coefficients(target.map(p=>p[1]));
    return [a,b,c,d,e,f];
  }
  // Fit all six approximate regions together; individual pairs deliberately retain residuals.
  // Normalize image coordinates before solving the small least-squares system.
  function worldAffine() {
    const samples = worldPlaces.map(place=>({u:place.old[0]/1280,v:place.old[1]/591,target:project(data.world,place.geo)}));
    const normal = Array.from({length:3},()=>[0,0,0]);
    const right = [[0,0,0],[0,0,0]];
    for (const sample of samples) {
      const row = [sample.u,sample.v,1];
      for (let i=0;i<3;i++) {
        for (let j=0;j<3;j++) normal[i][j] += row[i]*row[j];
        for (let axis=0;axis<2;axis++) right[axis][i] += row[i]*sample.target[axis];
      }
    }
    function solve(values) {
      const rows = normal.map((row,i)=>[...row,values[i]]);
      for (let col=0;col<3;col++) {
        let pivot = col;
        for (let row=col+1;row<3;row++) if (Math.abs(rows[row][col])>Math.abs(rows[pivot][col])) pivot=row;
        [rows[col],rows[pivot]] = [rows[pivot],rows[col]];
        if (Math.abs(rows[col][col])<1e-10) throw new Error('Harita hizalaması hesaplanamadı.');
        const divisor = rows[col][col];
        rows[col] = rows[col].map(value=>value/divisor);
        for (let row=0;row<3;row++) {
          if (row===col) continue;
          const factor = rows[row][col];
          rows[row] = rows[row].map((value,j)=>value-factor*rows[col][j]);
        }
      }
      return rows.map(row=>row[3]);
    }
    const [a,c,e] = solve(right[0]);
    const [b,d,f] = solve(right[1]);
    return [a/1280,b/1280,c/591,d/591,e,f];
  }
  function initializeWorld() {
    if (worldReady) return;
    worldMatrix = worldAffine();
    worldReady = true;
    const svg = byId('world-map');
    const map = data.world;
    baseMap(svg,map);
    worldImage = svgNode('image',{href:'assets/idrisi-maps/world-miller-preview.jpg',width:1280,height:591,transform:`matrix(${worldMatrix.join(' ')})`,opacity:0.55});
    worldImage.addEventListener('error',()=>{byId('world-image-error').hidden=false;});
    worldImage.addEventListener('load',()=>{byId('world-image-error').hidden=true;});
    svg.append(worldImage);
    worldCoast = svgNode('path',{d:map.landPath,fill:'none',stroke:'#1e6553','stroke-width':1.4,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'});
    svg.append(worldCoast);
    for (const type of ['modern','historical']) {
      const pin = document.createElement('span');
      pin.className = `place-pin is-${type}`;
      byId('world-overlay-pins').append(pin);
    }
    chooseWorld(selectedWorld);
    updateWorldOpacity();
  }
  function updateWorldOpacity() {
    const value = Number(byId('world-opacity').value);
    byId('world-opacity-value').textContent = `%${value}`;
    byId('world-show-old').setAttribute('aria-pressed',String(value===100));
    byId('world-show-modern').setAttribute('aria-pressed',String(value===0));
    byId('world-show-both').setAttribute('aria-pressed',String(value>0&&value<100));
    if (!worldReady) return;
    worldImage.setAttribute('opacity',String(value/100));
    worldCoast.setAttribute('visibility',value===100?'hidden':'visible');
    byId('world-map').querySelector('path').setAttribute('visibility',value===100?'hidden':'visible');
    byId('world-overlay-pins').children[0].hidden = value===100;
    byId('world-overlay-pins').children[1].hidden = value===0;
  }
  function chooseWorldMode(overlay) {
    byId('world-overlay').hidden = !overlay;
    byId('world-pair').hidden = overlay;
    byId('world-mode-overlay').setAttribute('aria-pressed',String(overlay));
    byId('world-mode-pair').setAttribute('aria-pressed',String(!overlay));
  }
  function updateWorldZoom(change) {
    worldZoom = Math.max(1,Math.min(3,worldZoom+change));
    byId('world-overlay-board').style.width = `${worldZoom*100}%`;
    byId('world-zoom-value').textContent = `%${worldZoom*100}`;
    byId('world-zoom-out').disabled = worldZoom===1;
    byId('world-zoom-in').disabled = worldZoom===3;
    worldImage.setAttribute('href',worldZoom>1?'assets/idrisi-maps/world-miller-1928.jpg':'assets/idrisi-maps/world-miller-preview.jpg');
    if (worldZoom===1) {byId('world-viewport').scrollLeft=0;byId('world-viewport').scrollTop=0;}
  }
  function initializeSicily() {
    if (sicilyReady) return;
    sicilyReady = true;
    const map = data.sicily;
    const svg = byId('sicily-map');
    baseMap(svg,map);
    const targets = sicilyPlaces.map(p=>project(map,p.geo));
    const matrix = affineFromThree(sicilyPlaces.map(p=>p.old),targets);
    historicalImage = svgNode('image',{href:'assets/idrisi-maps/sicily-preview.jpg',width:1280,height:868,transform:`matrix(${matrix.join(' ')})`,opacity:0.55});
    historicalImage.addEventListener('error',()=>{byId('image-error').hidden=false;});
    svg.append(historicalImage);
    coastOutline = svgNode('path',{d:map.landPath,fill:'none',stroke:'#1e6553','stroke-width':2,'vector-effect':'non-scaling-stroke','fill-rule':'evenodd'});
    svg.append(coastOutline);
    const pins = byId('sicily-pins');
    targets.forEach((point,index)=>{
      const pin = document.createElement('span');
      pin.className = 'place-pin';
      pin.textContent = String(index+1);
      positionPin(pin,point,map.width,map.height);
      pins.append(pin);
    });
    chooseSicily(selectedSicily);
    updateOpacity();
  }
  function updateOpacity() {
    const value = Number(byId('history-opacity').value);
    byId('opacity-value').textContent = `%${value}`;
    byId('show-old').setAttribute('aria-pressed',String(value===100));
    byId('show-modern').setAttribute('aria-pressed',String(value===0));
    byId('show-both').setAttribute('aria-pressed',String(value>0&&value<100));
    if (historicalImage) historicalImage.setAttribute('opacity',String(value/100));
    if (coastOutline) coastOutline.setAttribute('visibility',value===100?'hidden':'visible');
    if (sicilyReady) byId('sicily-map').querySelector('path').setAttribute('visibility',value===100?'hidden':'visible');
  }
  function chooseComparison(id, changeHash=false) {
    const isSicily = id==='sicilya';
    byId('compare-select').value = isSicily?'sicilya':'dunya';
    byId('world-view').hidden = isSicily;
    byId('sicily-view').hidden = !isSicily;
    byId('compare-title').textContent = isSicily?'Sicilya · üst üste karşılaştır':'Dünya · üst üste karşılaştır';
    byId('compare-intro').textContent = isSicily
      ?'Aynı adaya iki farklı çizimle bak. Tarihî görüntüyü saydamlaştırarak modern kıyı çizgisiyle karşılaştır. Bu görünümde tarihî görsel üç kent işaretine göre yaklaşık hizalanmıştır.'
      :'Tarihî dünya haritasını saydamlaştırarak modern kıyılarla karşılaştır. Altı yaklaşık bölgeye göre genel bir hizalama yapıldı. Haritaların ölçek ve biçim farkları nedeniyle bütün kıyılar aynı anda örtüşmez. İstersen yan yana görünüme de geçebilirsin.';
    byId('back-to-map').href = `idrisi.html#${isSicily?'sicilya':'dunya'}`;
    if (isSicily) initializeSicily();
    else initializeWorld();
    if (changeHash) history.replaceState(null,'',`#${isSicily?'sicilya':'dunya'}`);
  }
  baseMap(byId('world-modern'),data.world);
  makePlaceButtons(byId('world-places'),worldPlaces,chooseWorld);
  makePlaceButtons(byId('sicily-places'),sicilyPlaces,chooseSicily);
  chooseWorld(selectedWorld);
  byId('compare-select').disabled = false;
  byId('compare-select').addEventListener('change',event=>chooseComparison(event.target.value,true));
  byId('history-opacity').addEventListener('input',updateOpacity);
  byId('world-opacity').addEventListener('input',updateWorldOpacity);
  byId('world-mode-overlay').addEventListener('click',()=>chooseWorldMode(true));
  byId('world-mode-pair').addEventListener('click',()=>chooseWorldMode(false));
  for (const [id,value] of [['world-show-old',100],['world-show-both',55],['world-show-modern',0]]) {
    byId(id).addEventListener('click',()=>{byId('world-opacity').value=String(value);updateWorldOpacity();});
  }
  byId('world-zoom-out').addEventListener('click',()=>updateWorldZoom(-0.5));
  byId('world-zoom-in').addEventListener('click',()=>updateWorldZoom(0.5));
  for (const [id,value] of [['show-old',100],['show-both',55],['show-modern',0]]) {
    byId(id).addEventListener('click',()=>{byId('history-opacity').value=String(value);updateOpacity();});
  }
  function updateZoom(change) {
    zoom = Math.max(1,Math.min(3,zoom+change));
    byId('sicily-board').style.width = `${zoom*100}%`;
    byId('compare-zoom-value').textContent = `%${zoom*100}`;
    byId('compare-zoom-out').disabled = zoom===1;
    byId('compare-zoom-in').disabled = zoom===3;
    if (historicalImage) historicalImage.setAttribute('href',zoom>1?'assets/idrisi-maps/sicily-arabe2221.jpg':'assets/idrisi-maps/sicily-preview.jpg');
    if (zoom===1) {byId('sicily-viewport').scrollLeft=0;byId('sicily-viewport').scrollTop=0;}
  }
  byId('compare-zoom-out').addEventListener('click',()=>updateZoom(-0.5));
  byId('compare-zoom-in').addEventListener('click',()=>updateZoom(0.5));
  window.addEventListener('hashchange',()=>{
    const id = location.hash.slice(1);
    if (['dunya','sicilya'].includes(id)) chooseComparison(id);
  });
  chooseComparison(location.hash.slice(1)==='sicilya'?'sicilya':'dunya');
})();
