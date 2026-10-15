'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const steps = [
    { kicker: 'Bir ihtiyacı soruya çevirmek', title: 'Alanı biliyoruz.\nKenarları arıyoruz.', body: 'Kısa kenara x diyelim. Uzun kenar x + 10 olur. İkisinin çarpımı 39. Bu hikâyenin bugünkü başlangıcı.', insight: 'Önce bilineni ve bilinmeyeni ayır.', left: 'x × (x + 10)', right: '39', next: 'Şekle bak', note: 'Atölye örneği: alanı biliyoruz, kenarları arıyoruz.', voice: 'Dikdörtgen bir atölye tasarlıyoruz. Alanı otuz dokuz metrekare. Uzun kenar, kısa kenardan on metre fazla. Kısa kenara iks diyelim. Kenarların uzunluklarını nasıl buluruz?' },
    { kicker: 'Hârizmî’nin sayı ilişkisi', title: 'Bir kare.\nOn tane kök.', body: 'Dikdörtgenin içinde x² büyüklüğünde bir kare ve 10x büyüklüğünde bir şerit var. Toplam alan değişmedi: hâlâ 39.', insight: 'Özgün metin bu ilişkiyi kelimelerle anlatır.', left: 'x² + 10x', right: '39', next: 'Şeridi böl', note: 'x²: kare. 10x: kısa kenarın on katı.', voice: 'Hârizmî, bir kare ile onun on kökünün toplamının otuz dokuz olduğunu söylüyor. Bugünkü gösterimimizde karenin alanı iks kare, şeridin alanı on iks. Toplamları otuz dokuz.' },
    { kicker: 'Alanı koruyarak ayırmak', title: 'Bir şeritten\niki eşit parça.', body: '10 metre genişliğindeki şeridi ikiye bölelim. İki parça da 5 × x büyüklüğünde. Hiçbir alan eklemedik veya çıkarmadık.', insight: '10x = 5x + 5x', left: 'x² + 5x + 5x', right: '39', next: 'Parçayı taşı', note: 'İki şeridin toplam alanı yine 10x.', voice: 'On ikslik şeridi ikiye bölelim. Her parçanın alanı beş iks. Karenin ve iki şeridin toplamı yine otuz dokuz. Bir parçayı şimdi karenin altına taşıyalım.' },
    { kicker: 'Şeklin söylediği şeyi görmek', title: 'Bir kareye\nbir köşe kaldı.', body: 'Şeritlerden birini döndürüp alta taşıdık. Tam bir kare yapmak için boş köşeye 5 × 5 büyüklüğünde bir parça gerekiyor.', insight: 'Eksik köşenin alanı: 25.', left: 'x² + 10x', right: '39', next: 'Köşeyi tamamla', note: 'Köşe boşken toplam alan hâlâ 39.', voice: 'Şeridi taşıyınca bir köşesi eksik kare görüyoruz. Köşenin iki kenarı da beş. Bu yüzden eksik parçanın alanı yirmi beş. Köşeyi doldurursak toplam alanı da artırmalıyız.' },
    { kicker: 'Eşitliğin iki tarafını korumak', title: 'Köşeye 25.\nToplama da 25.', body: 'Şekle 25 alan ekledik; eşitliğin sağ tarafına da 25 ekliyoruz. Yeni karenin alanı 39 + 25 = 64. Bir kenarı x + 5.', insight: '(x + 5)² = 64', left: 'x² + 10x + 25', right: '39 + 25', next: 'Sonucu bul', note: 'Tamamlanan karenin alanı 64; kenarı x + 5.', voice: 'Köşeye yirmi beş ekledik. Eşitliğin sağ tarafına da yirmi beş ekliyoruz. Otuz dokuz artı yirmi beş, altmış dört. Artık tam bir karemiz var. Bir kenarı iks artı beş.' },
    { kicker: 'Çözümü ilk soruya geri götürmek', title: 'Kök 3.\nİlk kare 9.', body: '64 alanlı karenin kenarı 8. Eklediğimiz 5’i çıkarınca x = 3. Atölye 3 metreye 13 metre: alanı 39, kenar farkı 10.', insight: 'Cevabı her iki koşulla kontrol et.', left: 'x = 8 − 5', right: '3', next: 'Baştan keşfet', note: 'Hârizmî’nin örneğinde kare 9, onun kökü 3.', voice: 'Altmış dört alanlı karenin kenarı sekizdir. Eklediğimiz beşi çıkarınca üç kalır. Aranan kök üç, ilk karenin alanı dokuz. Atölyenin kenarları üç ve on üç metre. Üç çarpı on üç otuz dokuz. On üç eksi üç on. Her iki koşul sağlandı.' }
  ];
  let step = 0, timer = null, speaking = false, presentation = false, audio = null;
  const svgNS = 'http://www.w3.org/2000/svg';
  function place(el, x, y, angle = 0) { el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`; }
  function rectSize(id, w, h) { $(id).setAttribute('width', w); $(id).setAttribute('height', h); }
  function label(id, x, y, value) { $(id).setAttribute('x', x); $(id).setAttribute('y', y); $(id).textContent = value; }
  function dim(x, y, text) { const t = document.createElementNS(svgNS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.textContent = text; $('dimension-labels').append(t); }
  function drawGeometry() {
    const q = 120, p = 200, moved = step >= 3;
    const x = moved ? 220 : 120, y = moved ? 60 : 160;
    rectSize('square-rect', q, q); rectSize('a-rect', p, q); rectSize('b-rect', p, q); rectSize('corner-rect', p, p);
    place($('part-square'), x, y); place($('part-a'), x + q, y); place($('part-b'), moved ? x + q : x + q + p, moved ? y + q : y, moved ? 90 : 0);
    place($('part-corner'), x + q, y + q);
    label('square-label', q / 2, q / 2, step === 5 ? '9' : 'x²');
    label('a-label', p / 2, q / 2, step === 5 ? '15' : '5x');
    label('b-label', p / 2, q / 2, step === 5 ? '15' : '5x');
    $('b-label').setAttribute('transform', moved ? `rotate(-90 ${p / 2} ${q / 2})` : '');
    label('corner-label', p / 2, p / 2, '25');
    const corner = $('corner-outline'); corner.setAttribute('x', x + q); corner.setAttribute('y', y + q); corner.setAttribute('width', p); corner.setAttribute('height', p); corner.style.opacity = step === 3 ? '1' : '0';
    $('part-corner').style.opacity = step >= 4 ? '1' : '0';
    $('part-square').style.opacity = step === 0 ? '.65' : '1';
    $('part-a').style.opacity = step === 0 ? '.4' : '1'; $('part-b').style.opacity = step === 0 ? '.4' : '1';
    $('a-label').style.opacity = step >= 2 ? '1' : '0'; $('b-label').style.opacity = step >= 2 ? '1' : '0'; $('square-label').style.opacity = step === 0 ? '0' : '1';
    const dims = $('dimension-labels'); dims.replaceChildren();
    if (!moved) { dim(x - 24, y + q / 2, 'x'); dim(x + q / 2, y - 23, 'x'); dim(x + q + p, y - 23, step < 2 ? '10' : '5 + 5'); }
    else { dim(x + q / 2, y - 22, step === 5 ? '3' : 'x'); dim(x + q + p / 2, y - 22, '5'); dim(x - 22, y + q / 2, step === 5 ? '3' : 'x'); dim(x - 22, y + q + p / 2, '5'); if (step >= 4) dim(x + (q + p) / 2, y + q + p + 27, step === 5 ? '8' : 'x + 5'); }
    $('canvas-note').textContent = steps[step].note;
    $('geometry-title').textContent = steps[step].title.replace('\n', ' ');
    $('geometry-desc').textContent = steps[step].body;
  }
  function render() {
    const s = steps[step];
    $('stage-count').textContent = `${String(step + 1).padStart(2, '0')} / 06`;
    $('stage-kicker').textContent = s.kicker;
    $('stage-title').replaceChildren(...s.title.split('\n').flatMap((line, i) => i ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
    $('stage-body').textContent = s.body; $('stage-insight').textContent = s.insight;
    $('equation-left').textContent = s.left; $('equation-right').textContent = s.right;
    $('next').innerHTML = `${s.next} <span aria-hidden="true">${step === 5 ? '↺' : '→'}</span>`;
    $('previous').disabled = step === 0;
    document.querySelectorAll('[data-step]').forEach(b => { const n = Number(b.dataset.step); if (n === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('passed', n < step); });
    drawGeometry();
  }
  function cancelSpeech() { if (audio) { audio.pause(); audio.currentTime = 0; audio = null; } speaking = false; $('listen').textContent = '♬ Bu adımı dinle'; $('listen').setAttribute('aria-pressed', 'false'); }
  function stopPlay() { clearTimeout(timer); timer = null; $('autoplay').textContent = '▶ Baştan oynat'; $('autoplay').setAttribute('aria-pressed', 'false'); }
  function go(n, manual = true) { if (manual) { stopPlay(); cancelSpeech(); } step = Math.max(0, Math.min(5, n)); $('voice-status').textContent = ''; render(); }
  $('next').addEventListener('click', () => go(step === 5 ? 0 : step + 1));
  $('previous').addEventListener('click', () => go(step - 1));
  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => go(Number(b.dataset.step))));
  $('autoplay').addEventListener('click', () => {
    if (timer) { stopPlay(); return; }
    cancelSpeech(); step = 0; render(); $('autoplay').textContent = 'Ⅱ Oynatmayı durdur'; $('autoplay').setAttribute('aria-pressed', 'true');
    const advance = () => { if (step === 5) { stopPlay(); return; } step++; render(); timer = setTimeout(advance, 8000); };
    timer = setTimeout(advance, 8000);
  });
  $('listen').addEventListener('click', () => {
    stopPlay(); if (speaking) { cancelSpeech(); return; }
    cancelSpeech(); audio = new Audio(`assets/step-${step + 1}.mp3`);
    speaking = true; $('listen').textContent = '■ Sesi durdur'; $('listen').setAttribute('aria-pressed', 'true');
    $('voice-status').textContent = 'Türkçe anlatım: Ahmet';
    audio.onended = () => { speaking = false; $('listen').textContent = '♬ Bu adımı dinle'; $('listen').setAttribute('aria-pressed', 'false'); };
    audio.onerror = () => { speaking = false; $('listen').textContent = '♬ Bu adımı dinle'; $('voice-status').textContent = 'Ses yüklenemedi. Bir süre sonra tekrar deneyebilirsin.'; };
    audio.play().catch(() => { speaking = false; $('listen').textContent = '♬ Bu adımı dinle'; $('voice-status').textContent = 'Ses oynatılamadı. Dinle düğmesine tekrar basabilirsin.'; });
  });
  const format = n => Number.isInteger(n) ? String(n) : n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  function updateArea(area) {
    const root = Math.sqrt(area + 25) - 5, long = root + 10, width = 460, height = width * root / long, y = 130 - height / 2;
    document.querySelectorAll('[data-area]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.area) === area)));
    $('area').value = String(area); const r = $('workshop-rect'); r.setAttribute('height', height); r.setAttribute('y', y);
    $('workshop-door').setAttribute('d', `M100 ${y + height}h38`);
    $('workshop-area').textContent = `${area} m²`; $('workshop-area').setAttribute('y', 138);
    $('workshop-short').textContent = `${format(root)} m`; $('workshop-short').setAttribute('y', 138);
    $('workshop-long').textContent = `${format(long)} m`; $('workshop-long').setAttribute('y', y + height + 35);
    $('workshop-svg').setAttribute('aria-label', `${format(root)} metreye ${format(long)} metre atölye; alan ${area} metrekare`);
    $('area-check').textContent = `${format(root)} × ${format(long)} = ${area}`;
    $('difference-check').textContent = `${format(long)} − ${format(root)} = 10`;
    $('result-method').textContent = `√(${area} + 25) − 5 = ${format(root)}`;
  }
  document.querySelectorAll('[data-area]').forEach(b => b.addEventListener('click', () => updateArea(Number(b.dataset.area))));
  $('area').addEventListener('change', () => updateArea(Number($('area').value)));
  $('presentation').addEventListener('click', () => { presentation = !presentation; document.body.classList.toggle('presenting', presentation); $('presentation').textContent = presentation ? 'Sunumdan çık ↙' : 'Sunum modu ↗'; $('presentation').setAttribute('aria-pressed', String(presentation)); if (presentation) $('anlati').scrollIntoView({ behavior: 'instant' }); });
  document.addEventListener('keydown', e => { if (!presentation || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') { e.preventDefault(); go(step === 5 ? 0 : step + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(step - 1); } if (e.key === 'Escape') { $('presentation').click(); stopPlay(); cancelSpeech(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopPlay(); cancelSpeech(); } });
  render(); updateArea(39);
})();
