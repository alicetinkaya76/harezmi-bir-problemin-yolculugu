(() => {
  'use strict';
  const book = window.HAREZMI_BOOK;
  const $ = id => document.getElementById(id);
  if (!book?.pages?.length) { $('page-title').textContent = 'Kitap verisi yüklenemedi. Lütfen sayfayı yenileyin.'; return; }
  const pages = book.pages;
  const byId = new Map(pages.map((p, i) => [p.id, i]));
  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem('harezmi-book-' + key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem('harezmi-book-' + key, JSON.stringify(value)); return true; } catch { return false; } }
  };
  let notes = storage.get('notes', {}), index = 0;
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) notes = {};
  let fontSize = Math.max(15, Math.min(23, Number(storage.get('font', 17)) || 17));
  let searchTimer;
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/[أإآ]/g, 'ا');
  const searchIndex = pages.map(p => ({ar:normalize(p.ar), tr:normalize(p.tr), explain:normalize(p.explain)}));
  const sourceURL = page => 'https://ar.wikisource.org/wiki/' + encodeURIComponent('صفحة:المختصر في حساب الجبر والمقابلة (1937).pdf/' + page);
  const scanPath = page => 'assets/book-pages/p' + String(page).padStart(3, '0') + '.jpg';
  function today(page) {
    if (page.pdf_page <= 22) return 'Bir araştırmayı yayımlamak, zor bir yöntemi öğretmek ve önceki çalışmadaki hatayı düzeltmek: önsözün üç katkısını bugün ders kitaplarında, açık bilimde ve yazılım geliştirmede de düşünebiliriz. Bu, bugünden kurduğumuz bir benzetmedir.';
    if (page.pdf_page < 34) return 'Bir tasarımda bilinmeyen uzunluğu x seçmek, alan koşulunu denkleme çevirmek ve sonucu ilk koşullarda sınamak. Bugünkü matematiksel modellemede de aynı sorular var: Bilinmeyen ne? Hangi değerler anlamlı? Bulduğumuz sonuç koşulları sağlıyor mu?';
    if (page.pdf_page < 41) return 'Parantez açmak, benzer terimleri toplamak ve köklü ifadeyi sadeleştirmek: bir hesap tablosu veya cebir yazılımı bu işlemleri yapabilir. Metindeki küçük adımlar, aracın verdiği sonucu nasıl kontrol edebileceğimizi gösterir.';
    if (page.pdf_page < 60) return 'Sözel bir koşulu önce değişkenlere, sonra denkleme çevirmek. Bir ölçü, toplam veya çarpım bilinirken parçaları bulmak; bugünkü planlama ve tasarım sorularında da karşımıza çıkar. Her sonucu özgün problemde yerine koyarak kontrol edebiliriz.';
    if (page.pdf_page === 60) return 'Birim fiyatı ve bilinmeyen toplamı hesaplamak. Bugün bir elektronik tabloda miktar, fiyat ve tutarı ayrı sütunlara koyar; orantının gerçekten geçerli olup olmadığını ve birimleri kontrol ederiz.';
    if (page.pdf_page < 74) return 'Bir arazinin alanını veya bir yapının hacmini hesaplamak. Bugün çizim ve tasarım yazılımları da şekli ölçülebilir parçalara ayırır. Ölçüm, birim ve yaklaşık değer seçimi sonucun doğruluğunu belirler.';
    if (page.pdf_page < 99) return 'Paylara bağlı tahsisleri bir elektronik tabloda modellemek. Örneğin toplam bütçe, ayrılan miktarlar ve kalan paylar birbirine bağlanır; toplamın korunması kontrol edilir. Bu benzetme matematik yapısına aittir, tarihsel miras kurallarının günümüzde geçerli olduğunu söylemez.';
    return 'Bir hesap sonucunun başka bir hesaba geri bağlanması, bugünkü bağımlılık şemalarına benzer. Bilinmeyenleri aynı anda kurulan denklemlerle çözer, ardından her tahsis ve geri dönüşü baştan kontrol ederiz. Buradaki benzetme tarihsel örneklerin matematik yapısıyla sınırlıdır.';
  }
  const svg = (title, body, caption) => `<svg viewBox="0 0 360 280" role="img" xmlns="http://www.w3.org/2000/svg"><title>${title}</title><style>text{font-family:Georgia,serif;fill:#244637;font-size:17px;text-anchor:middle} .s{font-size:12px}.l{stroke:#427761;stroke-width:2;fill:none}.t{fill:#85c6ad;stroke:#477d65;stroke-width:1}.g{fill:#e9c67e;stroke:#b49559;stroke-width:1}.c{fill:#e4a28c;stroke:#bd7865;stroke-width:1}</style>${body}</svg><p class="visual-caption">${caption}</p>`;
  const visuals = {
    terms: '<div class="term-cards"><div><strong>x²</strong>mâl · kare</div><div><strong>x</strong>cezr · kök</div><div><strong>c</strong>yalın sayı</div></div><p class="visual-caption">Cebir bölümü için modern harfli gösterim. Mali bahislerde “mâl” ayrıca mal veya tereke anlamındadır.</p>',
    'six-types': '<div class="type-list"><span>ax² = bx</span><span>ax² = c</span><span>bx = c</span><span>ax² + bx = c</span><span>ax² + c = bx</span><span>bx + c = ax²</span></div><p class="visual-caption">Altı denklem türünün modern gösterimi. Burada a, b ve c pozitif katsayılardır; metin işlemleri kelimelerle anlatır.</p>',
    'complete-square': svg('İki şeritle kare tamamlama', '<rect class="t" x="60" y="35" width="90" height="90"/><rect class="g" x="150" y="35" width="150" height="90"/><rect class="g" x="60" y="125" width="90" height="150"/><rect class="c" x="150" y="125" width="150" height="150"/><text x="105" y="87">x²</text><text x="225" y="87">5x</text><text x="105" y="205">5x</text><text x="225" y="205">25</text><text class="s" x="180" y="20">(x + 5)² = 39 + 25 = 64</text>', 'x² + 10x = 39 örneğinin iki şeritli geometrik kanıtı, modern bir çizimle. Eklenen köşe 25, büyük karenin kenarı 8, aranan kenar 3 olur.'),
    'four-sides': svg('Dört yandan kare tamamlama', '<rect class="t" x="127" y="87" width="90" height="90"/><path class="g" d="M127 12h90v75h-90zM127 177h90v75h-90zM52 87h75v90H52zM217 87h75v90h-75z"/><path class="c" d="M52 12h75v75H52zM217 12h75v75h-75zM52 177h75v75H52zM217 177h75v75h-75z"/><text x="172" y="139">x²</text><text class="s" x="172" y="54">2,5x</text><text class="s" x="172" y="217">2,5x</text><text class="s" x="88" y="137">2,5x</text><text class="s" x="254" y="137">2,5x</text><text class="s" x="90" y="54">6,25</text><text class="s" x="255" y="54">6,25</text><text class="s" x="90" y="217">6,25</text><text class="s" x="255" y="217">6,25</text><text class="s" x="173" y="275">Dört köşe: 4 × 6,25 = 25</text>', 'Metindeki dört yandan ekleme kanıtının modern çizimi. On kök, dört adet 2,5x şeride ayrılır; köşeler eklenince tam kare oluşur.'),
    'two-roots': svg('Aynı denklemin iki pozitif kökü', '<path class="l" d="M35 160H325M80 153v14M280 153v14"/><circle cx="80" cy="160" r="8" fill="#4b987c"/><circle cx="280" cy="160" r="8" fill="#bd795f"/><text x="180" y="55" style="font-size:24px">x² + 21 = 10x</text><text x="80" y="200">x = 3</text><text x="280" y="200">x = 7</text><text class="s" x="180" y="105">(x − 5)² = 4</text><text class="s" x="180" y="245">5 − 2 = 3 · 5 + 2 = 7</text>', 'Metnin iki çözüm verdiği örnek: aynı koşulu 3 ve 7 sağlar. Bu şema, ilgili denklem türünü açıklayan modern bir gösterimdir.'),
    distributive: svg('Çarpmanın alanlara dağılması', '<rect class="t" x="50" y="25" width="160" height="160"/><path class="g" d="M210 25h90v160h-90zM50 185h160v90H50z"/><rect class="c" x="210" y="185" width="90" height="90"/><text x="130" y="115">a²</text><text x="255" y="115">ab</text><text x="130" y="230">ab</text><text x="255" y="230">b²</text>', 'Genel modern model: (a + b)² = a² + 2ab + b². Alanları ayrı ayrı saymak, metindeki dağıtma işlemlerini görünür kılar.'),
    'root-product': svg('Bir kenar iki katına çıkınca alan dört kat olur', '<rect class="t" x="30" y="100" width="85" height="85"/><rect class="g" x="165" y="50" width="170" height="170"/><text x="72" y="150">9</text><text x="250" y="143">36</text><text class="s" x="72" y="207">kenar 3</text><text class="s" x="250" y="245">kenar 6</text>', 'Genel modern örnek: 2√9 = 6 = √36. Kökün dışındaki katsayı, kökün içine karesiyle girer.'),
    segments: svg('Onun iki parçaya ayrılması', '<rect class="t" x="30" y="100" width="110" height="65"/><rect class="g" x="140" y="100" width="190" height="65"/><text x="85" y="139">x</text><text x="235" y="139">10 − x</text><path class="l" d="M30 80V65H330v15"/><text x="180" y="47">10</text><text class="s" x="180" y="213">x + (10 − x) = 10</text>', 'Genel modern şema: toplam sabitken bir parçayı x seçmek, diğerini 10 − x olarak belirler. Metindeki parçalara ayırma problemlerini böyle izleyebiliriz.'),
    proportion: svg('Dört miktar arasında orantı', '<rect class="t" x="35" y="40" width="130" height="75"/><rect class="g" x="195" y="40" width="130" height="75"/><rect class="t" x="35" y="145" width="130" height="75"/><rect class="c" x="195" y="145" width="130" height="75"/><text x="100" y="85">a</text><text x="260" y="85">b</text><text x="100" y="190">c</text><text x="260" y="190">?</text><text x="180" y="86">↔</text><text x="180" y="190">↔</text><text class="s" x="180" y="260">a : b = c : ? → ? = bc/a</text>', 'Genel modern orantı şeması. Miktar ve fiyat gibi birimler aynı sütunda tutulur; hangi sayının hangi büyüklüğe ait olduğu ayrıca kontrol edilir.'),
    triangle: svg('Üçgenin tabanı ve yüksekliği', '<path class="t" d="M35 225L150 35L325 225z"/><path d="M150 35V225" stroke="#bd785d" stroke-width="2" stroke-dasharray="5 5" fill="none"/><path class="l" d="M150 210h15v15"/><text x="180" y="255">taban b</text><text class="s" x="131" y="145">h</text><text class="s" x="260" y="65">A = bh/2</text>', 'Genel modern çizim. Yükseklik, seçilen tabana dik uzaklıktır; eğik kenarın uzunluğu değildir. Alan, aynı tabanlı dikdörtgenin yarısıdır.'),
    circle: svg('Dairede yarıçap ve alan', '<circle class="t" cx="180" cy="125" r="95"/><path class="l" d="M180 125H275"/><circle cx="180" cy="125" r="3" fill="#244637"/><text x="225" y="115">r</text><text x="180" y="255">A = πr²</text>', 'Modern gösterim: A = πr². Metindeki 22/7, √10 ve 3,1416 değerleri π için yaklaşık değerlerdir; birbirinden ayrı yaklaşımlar olarak okunmalıdır.'),
    pyramid: svg('Kesik kare piramidin ölçüleri', '<path d="M55 200L205 250L315 185L165 140z" class="g"/><path d="M125 55L200 80L255 48L180 25z" class="t"/><path class="l" d="M55 200L125 55M205 250L200 80M315 185L255 48M165 140L180 25"/><path stroke="#bd785d" stroke-dasharray="5 5" stroke-width="2" d="M180 50V185"/><text class="s" x="166" y="120">h</text><text class="s" x="130" y="250">a</text><text class="s" x="150" y="43">b</text><text class="s" x="180" y="278">V = h(a² + ab + b²)/3</text>', 'Modern kesik kare piramit şeması; a ve b taban karelerinin kenarları, h dik yüksekliktir. Perspektif çizimi ölçekli değildir.'),
    shares: svg('Tereke, vasiyet ve kalan paylar', '<rect x="80" y="15" width="200" height="50" rx="4" class="t"/><text x="180" y="46">Toplam mal M</text><path class="l" d="M180 65v24M180 89H90v16M180 89h90v16M270 155v25"/><rect x="20" y="105" width="140" height="50" rx="4" class="c"/><text x="90" y="137">Vasiyet V</text><rect x="200" y="105" width="140" height="50" rx="4" class="g"/><text x="270" y="137">Kalan M − V</text><rect x="190" y="180" width="150" height="55" rx="4" class="t"/><text class="s" x="265" y="213">Metindeki miras payları</text><text class="s" x="180" y="266">Tahsisler + kalan paylar = toplam mal</text>', 'Genel modern hesap şeması. Her örnekteki pay oranları ve hukuki varsayımlar tarihsel metne aittir; şema yalnız miktarların nasıl izlendiğini gösterir.'),
    cycle: svg('Birbirine bağlı miktarlar', '<rect class="t" x="40" y="40" width="120" height="65" rx="5"/><rect class="g" x="200" y="155" width="120" height="65" rx="5"/><text x="100" y="79">x</text><text x="260" y="194">βx</text><path class="l" d="M160 72H260v70l-6-9m6 9 6-9M200 188H100v-69l-6 9m6-9 6 9"/><text class="s" x="180" y="260">x = A + βx → x(1 − β) = A</text>', 'Genel modern bağımlılık modeli. Devir hesabında bir tahsis başka bir tahsisi etkileyip başlangıç hesabını değiştirir; örneğe özgü denklem aşağıda ayrıca verilir.')
  };
  function squareCompletion() {
    const figure = document.createElement('div');
    figure.className = 'square-completion';
    figure.innerHTML = svg('Kare ve iki şeridin alanı 39', '<rect class="t" x="60" y="35" width="90" height="90"/><rect class="g" x="150" y="35" width="150" height="90"/><rect class="g" x="60" y="125" width="90" height="150"/><rect class="completion-corner" x="150" y="125" width="150" height="150" fill="transparent" stroke="#bd7865" stroke-width="1.5" stroke-dasharray="5 4"/><text x="105" y="87">x²</text><text x="225" y="87">5x</text><text x="105" y="205">5x</text><text class="completion-number" x="225" y="205" opacity="0">25</text><text class="s completion-equation" x="180" y="20">x² + 10x = 39</text>', 'Kare ile iki 5x şeridinin toplam alanı 39. Büyük kareyi tamamlamak için boş köşeyi ekleyelim.');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'completion-toggle';
    button.textContent = 'Köşeyi tamamla';
    button.setAttribute('aria-pressed', 'false');
    const caption = figure.querySelector('.visual-caption');
    caption.setAttribute('aria-live', 'polite');
    figure.insertBefore(button, caption);
    let completed = false;
    button.addEventListener('click', () => {
      completed = !completed;
      figure.dataset.completed = String(completed);
      figure.querySelector('.completion-corner').setAttribute('fill', completed ? '#e4a28c' : 'transparent');
      figure.querySelector('.completion-corner').setAttribute('stroke-dasharray', completed ? 'none' : '5 4');
      figure.querySelector('.completion-number').setAttribute('opacity', completed ? '1' : '0');
      figure.querySelector('.completion-equation').textContent = completed ? '(x + 5)² = 39 + 25 = 64' : 'x² + 10x = 39';
      figure.querySelector('title').textContent = completed ? '25 birimlik köşe eklenince tam karenin alanı 64 olur' : 'Kare ve iki şeridin alanı 39';
      button.textContent = completed ? 'Başa dön' : 'Köşeyi tamamla';
      button.setAttribute('aria-pressed', String(completed));
      caption.textContent = completed ? '5 × 5 = 25 köşesini ekledik. Büyük karenin alanı 64, kenarı 8 olur. Aranan kenar x = 8 − 5 = 3. Metindeki kanıtın modern çizimi.' : 'Kare ile iki 5x şeridinin toplam alanı 39. Büyük kareyi tamamlamak için boş köşeyi ekleyelim.';
    });
    return figure;
  }
  function paragraphs(target, value) {
    target.replaceChildren(...value.split(/\n\s*\n/).map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
  }
  const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  function jumpToReading() {
    document.querySelector('.page-navigation').scrollIntoView({block:'start', behavior:scrollBehavior()});
  }
  function navigate(next) { render(next); jumpToReading(); }
  function setColumn(column) {
    $('reading').dataset.activeColumn = column;
    document.querySelectorAll('[data-column]').forEach(tab => { tab.setAttribute('aria-selected', String(tab.dataset.column === column)); tab.tabIndex = tab.dataset.column === column ? 0 : -1; });
    if (window.matchMedia('(max-width: 1000px)').matches) jumpToReading();
  }
  function openScan(page = pages[index].pdf_page) {
    $('scan-title').textContent = '1937 baskısı · PDF görüntüsü ' + page;
    $('scan-full').src = scanPath(page);
    $('scan-original').href = scanPath(page);
    $('scan-full').alt = '1937 baskısının ' + page + '. PDF görüntüsü';
    $('scan-origin').href = sourceURL(page);
    $('scan-dialog').showModal();
  }
  function render(next, updateHash = true) {
    index = Math.max(0, Math.min(pages.length - 1, next));
    const p = pages[index];
    $('chapter-select').value = p.chapterId;
    $('page-select').value = p.id;
    $('page-position').textContent = `${index + 1} / ${pages.length} · PDF görüntüsü ${p.pdf_page}`;
    $('bottom-position').textContent = `${index + 1} / ${pages.length}`;
    $('page-title').textContent = p.title;
    document.title = p.title + ' · Hârizmî';
    paragraphs($('arabic-text'), p.ar);
    paragraphs($('turkish-text'), p.tr);
    paragraphs($('modern-explanation'), p.explain);
    $('modern-application').textContent = today(p);
    $('modern-visual').innerHTML = visuals[p.visual] || '';
    if (p.id === 'p029') $('modern-visual').replaceChildren(squareCompletion());
    $('modern-formulas').replaceChildren(...p.formulas.map(formula => { const el = document.createElement('p'); el.textContent = formula; return el; }));
    $('scan-preview').src = scanPath(p.pdf_page);
    $('arabic-source-link').href = sourceURL(p.pdf_page);
    $('personal-note').value = typeof notes[p.id] === 'string' ? notes[p.id] : '';
    $('note-status').textContent = 'Notlar yalnız bu tarayıcıda saklanır.';
    $('facsimile-link').replaceChildren();
    const extra = p.pdf_page === 21 ? 20 : [30, 32].includes(p.pdf_page) ? 31 : null;
    if (extra) {
      const button = document.createElement('button'); button.className = 'facsimile-button'; button.type = 'button'; button.textContent = `Elyazması faksimilesini de gör · PDF ${extra} ↗`; button.addEventListener('click', () => openScan(extra)); $('facsimile-link').append(button);
    }
    ['previous-page', 'bottom-previous'].forEach(id => $(id).disabled = index === 0);
    ['next-page', 'bottom-next'].forEach(id => $(id).disabled = index === pages.length - 1);
    if (updateHash) history.replaceState(null, '', '#' + p.id);
    storage.set('last', p.id);
  }
  function applyFont() {
    document.documentElement.style.setProperty('--reading-size', fontSize + 'px');
    $('font-down').disabled = fontSize <= 15; $('font-up').disabled = fontSize >= 23;
    storage.set('font', fontSize);
  }
  function search() {
    const query = normalize($('book-search').value.trim());
    const target = $('search-results'); target.replaceChildren(); target.hidden = !query;
    if (!query) return;
    const found = [];
    searchIndex.forEach((page, i) => {
      const column = ['tr', 'ar', 'explain'].find(key => page[key].includes(query));
      if (column) found.push({i, column});
    });
    const count = document.createElement('p'); count.className = 'no-results'; count.textContent = found.length ? `${found.length} sayfada bulundu${found.length > 30 ? ' · İlk 30 sonuç gösteriliyor' : ''}` : 'Bu aramayla eşleşen sayfa bulunamadı.'; target.append(count);
    found.slice(0, 30).forEach(({i, column}) => {
      const p = pages[i], button = document.createElement('button'), title = document.createElement('strong'), snippet = document.createElement('span');
      button.type = 'button'; title.textContent = `PDF ${p.pdf_page} · ${p.title}`;
      const text = p[column], position = Math.max(0, normalize(text).indexOf(query) - 35);
      snippet.textContent = (position ? '…' : '') + text.slice(position, position + 130).replace(/\n/g, ' ') + '…';
      if (column === 'ar') { snippet.lang = 'ar'; snippet.dir = 'rtl'; }
      button.append(title, snippet); button.addEventListener('click', () => { render(i); setColumn(column); target.hidden = true; jumpToReading(); }); target.append(button);
    });
  }
  book.chapters.forEach(chapter => { const option = document.createElement('option'); option.value = chapter.id; option.textContent = chapter.title; $('chapter-select').append(option); });
  pages.forEach(p => { const option = document.createElement('option'); option.value = p.id; option.textContent = `PDF ${p.pdf_page}`; $('page-select').append(option); });
  $('total-count').textContent = pages.length;
  $('chapter-select').addEventListener('change', () => navigate(pages.findIndex(p => p.chapterId === $('chapter-select').value)));
  $('page-select').addEventListener('change', () => navigate(byId.get($('page-select').value)));
  ['previous-page','bottom-previous'].forEach(id => $(id).addEventListener('click', () => navigate(index - 1)));
  ['next-page','bottom-next'].forEach(id => $(id).addEventListener('click', () => navigate(index + 1)));
  document.querySelectorAll('[data-column]').forEach(tab => {
    tab.addEventListener('click', () => setColumn(tab.dataset.column));
    tab.addEventListener('keydown', event => { if (!['ArrowLeft','ArrowRight'].includes(event.key)) return; event.preventDefault(); const tabs = [...document.querySelectorAll('[data-column]')]; const next = tabs[(tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3]; setColumn(next.dataset.column); next.focus(); });
  });
  $('font-down').addEventListener('click', () => { fontSize = Math.max(15, fontSize - 1); applyFont(); });
  $('font-up').addEventListener('click', () => { fontSize = Math.min(23, fontSize + 1); applyFont(); });
  $('book-search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(search, 180); });
  $('book-search').addEventListener('focus', () => { if ($('book-search').value.trim()) search(); });
  $('book-search').addEventListener('keydown', event => { if (event.key === 'Escape') $('search-results').hidden = true; });
  document.addEventListener('click', event => { if (!event.target.closest('.search-field')) $('search-results').hidden = true; });
  document.querySelectorAll('.open-scan').forEach(button => button.addEventListener('click', () => openScan()));
  $('glossary-button').addEventListener('click', () => $('glossary-dialog').showModal());
  ['about-button','footer-about'].forEach(id => $(id).addEventListener('click', () => $('about-dialog').showModal()));
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); }));
  $('personal-note').addEventListener('input', () => {
    const value = $('personal-note').value; if (value) notes[pages[index].id] = value; else delete notes[pages[index].id];
    $('note-status').textContent = storage.set('notes', notes) ? 'Kaydedildi · Yalnız bu tarayıcıda saklanır.' : 'Tarayıcı kaydetmeye izin vermedi. Notunu indirmeyi unutma.';
  });
  function download(filename, value) {
    const url = URL.createObjectURL(new Blob([value], {type:'application/json;charset=utf-8'})); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  $('export-notes').addEventListener('click', () => download('harezmi-sunum-notlarim.json', JSON.stringify({book:'harezmi-jabr-1937', exportedAt:new Date().toISOString(), notes}, null, 2)));
  $('import-notes-button').addEventListener('click', () => $('import-notes').click());
  function importStatus(message) {
    $('import-status').textContent = message;
    $('import-status').scrollIntoView({block:'nearest',behavior:scrollBehavior()});
  }
  $('import-notes').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 2e6) throw Error('Dosya çok büyük.');
      const data = JSON.parse(await file.text());
      if (data.book !== 'harezmi-jabr-1937' || !data.notes || typeof data.notes !== 'object' || Array.isArray(data.notes)) throw Error('Bu kitap için hazırlanmış bir not dosyası seç.');
      let count = 0; Object.entries(data.notes).forEach(([id,value]) => { if (byId.has(id) && typeof value === 'string') { notes[id] = value.slice(0, 100000); count++; } });
      const saved = storage.set('notes', notes); render(index);
      importStatus(`${count} sayfanın notu geri yüklendi.${saved ? '' : ' Kalıcı kayıt için tarayıcı izin vermedi.'}`);
    } catch(error) { importStatus('Notlar yüklenemedi: ' + error.message); }
    event.target.value = '';
  });
  window.addEventListener('hashchange', () => { const next = byId.get(location.hash.slice(1)); if (next !== undefined) { render(next, false); jumpToReading(); } });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) || document.querySelector('dialog[open]')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); navigate(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(index - 1); }
  });
  applyFont();
  render(byId.get(location.hash.slice(1)) ?? byId.get(storage.get('last', '')) ?? 0);
})();
