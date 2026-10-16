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
    byId('compare-title').textContent = isSicily?'Sicilya · üst üste karşılaştır':'Dünya · aynı yerleri bul';
    byId('compare-intro').textContent = isSicily
      ?'Aynı adaya iki farklı çizimle bak. Tarihî görüntüyü saydamlaştırarak modern kıyı çizgisiyle karşılaştır. Bu görünümde tarihî görsel üç kent işaretine göre yaklaşık hizalanmıştır.'
      :'Tarihî ve modern görünümde aynı yerleri bulalım. Her iki haritada da kuzey yukarıda. Dönemin çizimi tek bir ölçekte olmadığı için dünya haritalarını yan yana okuyoruz.';
    byId('back-to-map').href = `idrisi.html#${isSicily?'sicilya':'dunya'}`;
    if (isSicily) initializeSicily();
    if (changeHash) history.replaceState(null,'',`#${isSicily?'sicilya':'dunya'}`);
  }
  baseMap(byId('world-modern'),data.world);
  makePlaceButtons(byId('world-places'),worldPlaces,chooseWorld);
  makePlaceButtons(byId('sicily-places'),sicilyPlaces,chooseSicily);
  chooseWorld(selectedWorld);
  byId('compare-select').disabled = false;
  byId('compare-select').addEventListener('change',event=>chooseComparison(event.target.value,true));
  byId('history-opacity').addEventListener('input',updateOpacity);
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
