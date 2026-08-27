/* ─────────────────────────────────────────────────────────────
   НАСТРОЙКА ФОРМЫ ЗАЯВОК
   Замените ВАШ_КОД на код формы из formspree.io
   Пример: 'https://formspree.io/f/xrgkabcd'
   Пока код не заменён, заявка открывается в почтовой программе.
   ───────────────────────────────────────────────────────────── */
var FORM_ENDPOINT = 'https://formspree.io/f/ВАШ_КОД';

(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };

  /* появление блоков при прокрутке */
  var items = document.querySelectorAll('.reveal');
  if(reduce || !('IntersectionObserver' in window)){
    items.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var sibs = Array.prototype.filter.call(e.target.parentElement.children, function(c){ return c.classList.contains('reveal'); });
        var i = sibs.indexOf(e.target);
        e.target.style.transitionDelay = (i > 0 ? Math.min(i,6)*70 : 0) + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, {threshold:.12, rootMargin:'0px 0px -60px 0px'});
    items.forEach(function(el){ io.observe(el); });
  }

  /* шапка и индикатор прокрутки */
  var hdr = $('hdr'), pr = $('progress'), tick = false;
  function onScroll(){
    var y = window.scrollY;
    if(hdr) hdr.classList.toggle('stuck', y > 10);
    if(pr){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      pr.style.width = (h > 0 ? (y/h)*100 : 0) + '%';
    }
    tick = false;
  }
  window.addEventListener('scroll', function(){ if(!tick){ requestAnimationFrame(onScroll); tick = true; } }, {passive:true});
  onScroll();

  /* меню услуг и бургер */
  var drop = $('drop'), nav = $('nav'), burger = $('burger');
  if(drop){
    drop.querySelector('button').addEventListener('click', function(e){ e.stopPropagation(); drop.classList.toggle('open'); });
    document.addEventListener('click', function(e){ if(!drop.contains(e.target)) drop.classList.remove('open'); });
  }
  if(burger && nav){
    burger.addEventListener('click', function(){
      var on = nav.classList.toggle('open');
      burger.classList.toggle('on', on);
      document.body.classList.toggle('lock', on);
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        nav.classList.remove('open'); burger.classList.remove('on');
        document.body.classList.remove('lock');
        if(drop) drop.classList.remove('open');
      });
    });
  }

  /* слайдер услуг (только на главной) */
  var rail = $('rail');
  if(rail){
    var prev = $('prev'), next = $('next'), cur = $('cur'), cards = rail.children;
    $('total').textContent = String(cards.length).padStart(2,'0');
    var step = function(){ return cards[0].offsetWidth + 19; };
    var upd = function(){
      var i = Math.round(rail.scrollLeft / step()) + 1;
      cur.textContent = String(Math.min(i, cards.length)).padStart(2,'0');
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft > rail.scrollWidth - rail.clientWidth - 8;
    };
    prev.addEventListener('click', function(){ rail.scrollBy({left:-step(), behavior: reduce ? 'auto' : 'smooth'}); });
    next.addEventListener('click', function(){ rail.scrollBy({left: step(), behavior: reduce ? 'auto' : 'smooth'}); });
    rail.addEventListener('scroll', function(){ requestAnimationFrame(upd); }, {passive:true});
    window.addEventListener('resize', upd);
    upd();
  }

  /* модальное окно заявки */
  var ov = $('overlay');
  if(ov){
    var open = function(){
      ov.classList.add('open'); document.body.classList.add('lock');
      setTimeout(function(){ var f = $('fname'); if(f) f.focus(); }, 300);
    };
    var close = function(){ ov.classList.remove('open'); document.body.classList.remove('lock'); };
    document.querySelectorAll('[data-modal]').forEach(function(b){ b.addEventListener('click', open); });
    $('close').addEventListener('click', close);
    ov.addEventListener('click', function(e){ if(e.target === ov) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
    var note = $('formnote');
    var say = function(text, ok){
      if(!note) return;
      note.textContent = text;
      note.className = 'formnote' + (ok ? ' ok' : ' err');
    };
    var collect = function(){
      return {
        name: $('fname').value.trim(),
        phone: $('fphone').value.trim(),
        email: $('fmail') ? $('fmail').value.trim() : '',
        text: $('ftext').value.trim(),
        service: document.body.dataset.service || 'Главная страница'
      };
    };

    var mailBtn = $('sendMail');
    if(mailBtn){
      mailBtn.addEventListener('click', function(){
        var d = collect();
        if(!d.phone && !d.email){ say('Укажите телефон или почту, чтобы мы могли ответить.', false); return; }
        if(FORM_ENDPOINT.indexOf('ВАШ_КОД') !== -1){
          // форма ещё не подключена — отправляем письмом через почтовый клиент
          var body = 'Услуга: ' + d.service + '\nИмя: ' + (d.name || '—') +
                     '\nТелефон: ' + (d.phone || '—') + '\nПочта: ' + (d.email || '—') +
                     '\nВопрос: ' + (d.text || '—');
          window.location.href = 'mailto:office@sudexp.kz?subject=' +
            encodeURIComponent('Заявка с сайта: ' + d.service) + '&body=' + encodeURIComponent(body);
          return;
        }
        mailBtn.disabled = true;
        say('Отправляем…', true);
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: JSON.stringify({
            'Услуга': d.service, 'Имя': d.name, 'Телефон': d.phone,
            'Почта': d.email, 'Вопрос': d.text
          })
        }).then(function(r){
          mailBtn.disabled = false;
          if(r.ok){
            say('Заявка отправлена. Мы свяжемся с вами в рабочее время.', true);
            $('fname').value = ''; $('fphone').value = ''; $('ftext').value = '';
            if($('fmail')) $('fmail').value = '';
          } else {
            say('Не удалось отправить. Позвоните нам: +7 702 367 77 71', false);
          }
        }).catch(function(){
          mailBtn.disabled = false;
          say('Не удалось отправить. Позвоните нам: +7 702 367 77 71', false);
        });
      });
    }
  }

  var y = $('year'); if(y) y.textContent = new Date().getFullYear();

  if(reduce) return;

  /* анимация цифр */
  var nums = document.querySelectorAll('[data-count]');
  if(nums.length){
    var nio = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var el = e.target, target = parseInt(el.dataset.count,10),
            start = el.dataset.plain ? target - 40 : 0, t0 = null, dur = 1100;
        function f(ts){
          if(!t0) t0 = ts;
          var p = Math.min((ts-t0)/dur,1), ease = 1 - Math.pow(1-p,3);
          el.textContent = Math.round(start + (target-start)*ease);
          if(p < 1) requestAnimationFrame(f);
        }
        requestAnimationFrame(f); nio.unobserve(el);
      });
    }, {threshold:.6});
    nums.forEach(function(el){ nio.observe(el); });
  }

  /* наклон карточки заключения */
  var doc = $('doc');
  if(doc && window.matchMedia('(hover:hover)').matches){
    doc.addEventListener('mousemove', function(ev){
      var r = doc.getBoundingClientRect();
      var x = (ev.clientX-r.left)/r.width - .5, y2 = (ev.clientY-r.top)/r.height - .5;
      doc.style.transform = 'perspective(900px) rotateY(' + (x*5).toFixed(2) + 'deg) rotateX(' + (-y2*5).toFixed(2) + 'deg) translateY(-4px)';
    });
    doc.addEventListener('mouseleave', function(){ doc.style.transform = ''; });
  }
})();
