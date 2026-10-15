(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const book = window.ADELARD_BOOK;
  if (book?.questions?.length !== 6) { $('page-title').textContent = 'Seçki yüklenemedi. Lütfen sayfayı yenileyin.'; return; }
  const questions = book.questions, byId = new Map(questions.map((q,i) => [q.id,i]));
  const get = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } };
  let index = 0, scanIndex = 0, notes = get('adelard-six-notes', {});
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) notes = {};
  let fontSize = Math.max(15,Math.min(23,Number(get('harezmi-book-font',17)) || 17));
  const behavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const jump = () => document.querySelector('.page-navigation').scrollIntoView({block:'start',behavior:behavior()});
  const mobileLayout = matchMedia('(max-width:1000px)');
  function panelSemantics() {
    ['explain','tr','la'].forEach(column=>{
      const panel=$('column-'+column);
      if(mobileLayout.matches){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+column);}
      else{panel.removeAttribute('role');panel.removeAttribute('aria-labelledby');}
    });
  }
  mobileLayout.addEventListener('change',panelSemantics); panelSemantics();
  function paragraphs(target,value) {
    const parts = Array.isArray(value) ? value : value.split(/\n\s*\n/);
    target.replaceChildren(...parts.map(text => {
      const p=document.createElement('p'), speaker=text.match(/^(Nepos|Adelardus|Yeğen|Adelard):\s*/);
      if (speaker) { const strong=document.createElement('strong'); strong.textContent=speaker[0]; p.append(strong,document.createTextNode(text.slice(speaker[0].length))); }
      else p.textContent=text;
      return p;
    }));
  }
  function svg(title,content,caption) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" role="img"><title>${title}</title>${content}</svg><p class="visual-caption">${caption}</p>`;
  }
  const diagrams = {
    graft: svg('Anaç ve aşı kalemi', '<path d="M180 170v-55M180 169l-40 28m40-28 37 32m-37-32-5 34" stroke="#9b7852" stroke-width="13" fill="none"/><path d="M180 114V65m0 28-42-26m42 15 43-34" stroke="#528965" stroke-width="10" fill="none"/><circle cx="137" cy="62" r="14" fill="#e2bd70"/><circle cx="228" cy="43" r="14" fill="#e2bd70"/><path d="M158 114h44" stroke="#c88269" stroke-width="5"/><text x="81" y="153">Anaç</text><text x="282" y="65">Kalem</text><text class="small" x="279" y="119">Aşı noktası</text><path d="M214 114h-11M247 68h-9M106 150h57" stroke="#688263" fill="none"/>', 'Aynı ağaç üzerinde iki genetik yapı. Meyvenin çeşidi esas olarak kalemden gelir; anaç da büyümeyi ve dayanıklılığı etkileyebilir.'),
    sound: svg('Ses dalgası ve hava parçacıkları', '<g fill="#89b79b">'+[35,47,59,92,126,138,150,184,217,229,241,275,310,322,334].map(x=>[90,111,132].map(y=>`<circle cx="${x}" cy="${y}" r="4"/>`).join('')).join('')+'</g><circle cx="138" cy="111" r="6" fill="#be7f65"/><path d="M122 158h32m-32 0 6-5m-6 5 6 5m26-5-6-5m6 5-6 5M135 43h125m0 0-7-5m7 5-7 5" stroke="#416d4e" stroke-width="2" fill="none"/><text class="small" x="190" y="25">Dalganın yayılma yönü</text><text class="small" x="179" y="189">Parçacığın hareketi: ileri – geri</text>', 'Şema bir anı gösterir. Basınç değişimi ilerlerken hava parçacıkları bulundukları yerin çevresinde titreşir.'),
    gravity: svg('İdeal bir Dünya tünelinde hareket', '<circle cx="180" cy="109" r="89" fill="#d3e4cc" stroke="#8faa80"/><path d="M180 20v178" stroke="#fafbf3" stroke-width="15"/><path d="M180 20v178" stroke="#6f8963" stroke-dasharray="4 5" fill="none"/><circle cx="180" cy="109" r="4" fill="#547a50"/><circle cx="180" cy="43" r="8" fill="#c28268"/><path d="M205 57v108m0 0-6-9m6 9 6-9M155 165V57m0 0-6 9m6-9 6 9" stroke="#547a50" stroke-width="2" fill="none"/><text class="small" x="271" y="114">Merkez</text><text class="small" x="180" y="224">Havasız · Sürtünmesiz · Dönmeyen model</text>', 'Bu ideal modelde taş merkeze gelirken hızlanır; merkezden geçip karşı tarafta yavaşlar. Kuvvetin sıfır olması, hızın sıfır olması değildir.'),
    vessel: svg('Hava girişine göre suyun akışı', '<path d="M37 47h115v120H37zM207 47h115v120H207z" fill="#f8faf3" stroke="#77906a" stroke-width="2"/><path d="M39 90h111v75H39zM209 90h111v75H209z" fill="#a4cbc5"/><path d="M79 47h30" stroke="#c17d65" stroke-width="7"/><path d="M77 167h32M247 47h32M247 167h32" stroke="#eef1e8" stroke-width="5"/><path d="M265 14v54m0 0-5-8m5 8 5-8M250 173v21m15-21v29m15-29v21" stroke="#4b887b" stroke-width="2" fill="none"/><text class="small" x="94" y="23">Üstü kapalı</text><text class="small" x="265" y="225">Hava girer, su akar</text><text class="small" x="94" y="204">Akış durabilir</text>', 'Delikler ve kap şematiktir. Akışın durması deliğin boyutuna, hava girişine ve basınç farkına bağlıdır; her kapta aynı sonuç beklenmez.'),
    thunder: '<div class="mini-model"><strong>1 km uzaklıkta</strong><p>⚡ Işık: yaklaşık anında</p><p>◌ Ses: yaklaşık 3 saniye sonra</p></div><p class="visual-caption">Aynı olayı farklı zamanlarda algılarız; burada belirleyici fark ışığın ve sesin yayılma hızıdır. Sayılar yaklaşık değerlerdir.</p>',
    meteor: svg('Atmosfere giren parça ve ışık izi', '<path d="M-10 224Q180 90 370 224" fill="#b9d5c7" stroke="#719a7f" stroke-width="2"/><path d="M-10 200Q180 58 370 200" fill="none" stroke="#91b9a7" stroke-dasharray="5 6"/><g fill="#7a9571"><circle cx="39" cy="32" r="2"/><circle cx="290" cy="20" r="2"/><circle cx="323" cy="75" r="2"/><circle cx="81" cy="78" r="2"/></g><path d="M144 43l64 92" stroke="#d0b26b" stroke-width="7"/><path d="M162 66l46 69" stroke="#c17b64" stroke-width="4"/><circle cx="208" cy="135" r="5" fill="#9c674e"/><text class="small" x="82" y="128">Uzaydan gelen parça</text><text class="small" x="263" y="177">Atmosfer</text><text class="small" x="181" y="219">Kısa ışık izi: meteor</text>', 'Yıldızlar yerinde kalır. Atmosfere hızla giren küçük bir parça, kısa bir ışık olayına yol açar. Çizim ölçekli değildir.')
  };
  function setColumn(column) {
    $('reading').dataset.activeColumn=column;
    document.querySelectorAll('[data-column]').forEach(tab=>{const active=tab.dataset.column===column;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    if (matchMedia('(max-width:1000px)').matches) jump();
  }
  function render(next,updateHash=true) {
    index=Math.max(0,Math.min(questions.length-1,next)); const q=questions[index];
    $('question-select').value=q.id; $('page-title').textContent=q.title;
    $('page-position').textContent=`${index+1} / 6 · Soru ${q.roman}`; $('bottom-position').textContent=`${index+1} / 6`;
    document.title=q.title+' · Adelard';
    $('latin-title').textContent=q.latinTitle; paragraphs($('latin-text'),q.latin); paragraphs($('turkish-text'),q.tr);
    $('modern-title').textContent=q.modernTitle; paragraphs($('modern-explanation'),q.modern); $('discussion').textContent=q.discussion;
    $('modern-visual').innerHTML=diagrams[q.visual] || '';
    $('text-notes').replaceChildren(...q.notes.map(note=>{const li=document.createElement('li');li.textContent=note;return li;}));
    $('modern-sources').replaceChildren(...q.sources.map(source=>{const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener';a.textContent=source.label+' ↗';li.append(a);return li;}));
    $('personal-note').value=typeof notes[q.id]==='string'?notes[q.id]:''; $('note-status').textContent='Notlar yalnız bu tarayıcıda saklanır.';
    ['previous-page','bottom-previous'].forEach(id=>$(id).disabled=index===0); ['next-page','bottom-next'].forEach(id=>$(id).disabled=index===5);
    if(updateHash)history.replaceState(null,'','#'+q.id); save('adelard-six-last',q.id);
  }
  function navigate(next) { render(next); jump(); }
  function scanRender(next) {
    const q=questions[index]; scanIndex=Math.max(0,Math.min(q.pdfPages.length-1,next)); const page=q.pdfPages[scanIndex],path=`assets/adelard-pages/p${String(page).padStart(3,'0')}.jpg`;
    $('scan-title').textContent='Erken Latince baskı · PDF '+page; $('scan-position').textContent=`${scanIndex+1} / ${q.pdfPages.length} kaynak görüntüsü`;
    $('scan-full').src=path; $('scan-original').href=path; $('scan-full').alt=`Adelard kaynak baskısı, PDF görüntüsü ${page}`;
    $('scan-previous').disabled=scanIndex===0; $('scan-next').disabled=scanIndex===q.pdfPages.length-1;
  }
  function applyFont(){document.documentElement.style.setProperty('--reading-size',fontSize+'px');$('font-down').disabled=fontSize<=15;$('font-up').disabled=fontSize>=23;save('harezmi-book-font',fontSize);}
  questions.forEach((q,i)=>{const option=document.createElement('option');option.value=q.id;option.textContent=`${i+1}. ${q.title}`;$('question-select').append(option);});
  $('question-select').addEventListener('change',()=>navigate(byId.get($('question-select').value)));
  ['previous-page','bottom-previous'].forEach(id=>$(id).addEventListener('click',()=>navigate(index-1))); ['next-page','bottom-next'].forEach(id=>$(id).addEventListener('click',()=>navigate(index+1)));
  document.querySelectorAll('[data-column]').forEach(tab=>{tab.addEventListener('click',()=>setColumn(tab.dataset.column));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const tabs=[...document.querySelectorAll('[data-column]')],next=tabs[(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:2))%3];setColumn(next.dataset.column);next.focus();});});
  $('font-down').addEventListener('click',()=>{fontSize=Math.max(15,fontSize-1);applyFont();}); $('font-up').addEventListener('click',()=>{fontSize=Math.min(23,fontSize+1);applyFont();});
  $('open-scan').addEventListener('click',()=>{scanRender(0);$('scan-dialog').showModal();});
  $('scan-previous').addEventListener('click',()=>scanRender(scanIndex-1));$('scan-next').addEventListener('click',()=>scanRender(scanIndex+1));
  ['about-button','footer-about'].forEach(id=>$(id).addEventListener('click',()=>$('about-dialog').showModal()));
  document.querySelectorAll('.close-dialog').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}));
  $('personal-note').addEventListener('input',()=>{const value=$('personal-note').value;if(value)notes[questions[index].id]=value;else delete notes[questions[index].id];$('note-status').textContent=save('adelard-six-notes',notes)?'Kaydedildi · Yalnız bu tarayıcıda saklanır.':'Kalıcı kayıt yapılamadı. Notlarını indirerek saklayabilirsin.';});
  $('export-notes').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({book:'adelard-six-questions',notes},null,2)],{type:'application/json;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='adelard-sunum-notlarim.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
  $('import-notes-button').addEventListener('click',()=>$('import-notes').click());
  $('import-notes').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>2e6)throw Error('Dosya çok büyük.');const data=JSON.parse(await file.text());if(data.book!=='adelard-six-questions'||!data.notes||typeof data.notes!=='object'||Array.isArray(data.notes))throw Error('Adelard seçkisine ait bir not dosyası seç.');let count=0;Object.entries(data.notes).forEach(([id,value])=>{if(byId.has(id)&&typeof value==='string'){notes[id]=value.slice(0,100000);count++;}});const saved=save('adelard-six-notes',notes);render(index);$('import-status').textContent=`${count} sorunun notu geri yüklendi.${saved?'':' Kalıcı kayıt yapılamadı.'}`;}catch(error){$('import-status').textContent='Notlar yüklenemedi: '+error.message;}$('import-status').scrollIntoView({block:'nearest',behavior:behavior()});event.target.value='';});
  window.addEventListener('hashchange',()=>{const next=byId.get(location.hash.slice(1));if(next!==undefined){render(next,false);jump();}});
  document.addEventListener('keydown',event=>{if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||/INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName)||document.querySelector('dialog[open]'))return;if(event.key==='ArrowRight'){event.preventDefault();navigate(index+1);}if(event.key==='ArrowLeft'){event.preventDefault();navigate(index-1);}});
  applyFont(); render(byId.get(location.hash.slice(1))??byId.get(get('adelard-six-last',''))??0);
})();
