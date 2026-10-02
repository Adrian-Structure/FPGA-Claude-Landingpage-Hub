/* KI-Kennzeichnung unmittelbar am Bild (Art. 50 Abs. 5 VO (EU) 2024/1689).

   WICHTIG — die Lehre aus dem ersten Versuch:
   Das Bild wird NICHT umhuellt und sein Stil NICHT angefasst. Eine Huelle mit
   eigener Hoehe ueberschreibt das height:auto der Bilder und staucht oder zieht
   sie. Stattdessen wird nur das Elternelement zum Bezugsrahmen gemacht
   (position:relative, falls es noch static ist) und das Label frei darueber
   gelegt. Das Bild behaelt seine Masse zu hundert Prozent.

   Lazy geladene Bilder haben beim Seitenstart noch keine Masse — die werden
   erst nach ihrem load-Ereignis gekennzeichnet, sonst fehlt das Label auf
   allem, was unterhalb des Sichtfensters liegt. */
(function () {
  var BASIS = (function () {
    var e = document.currentScript;
    if (e && e.src) return e.src.replace(/[^/]*$/, '');
    return '/app-assets/';
  })();

  var VERHAELTNIS = 1789.84 / 566.93;   /* Seitenverhaeltnis des Labels */
  var BREIT = 132, SCHMAL = 96, ABSTAND = 10;
  var EN = (document.documentElement.lang || 'de').slice(0, 2) === 'en';
  var TEXT = EN
    ? 'AI generated - this image was created with artificial intelligence'
    : 'KI-generiert - dieses Bild wurde mit Kuenstlicher Intelligenz erzeugt';

  function zuKlein(img) {
    var b = img.naturalWidth || parseInt(img.getAttribute('width'), 10) || img.offsetWidth || 0;
    return b > 0 && b < 200;
  }

  function rahmen(el) {
    var p = el.parentElement;
    if (!p) return null;
    if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
    return p;
  }

  function setzen(img, label, p) {
    var ri = img.getBoundingClientRect(), rp = p.getBoundingClientRect();
    if (!ri.width || !ri.height) { label.style.display = 'none'; return; }
    var cs = getComputedStyle(p);
    var bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0;
    var w = ri.width < 320 ? SCHMAL : BREIT;
    var h = Math.round(w / VERHAELTNIS);
    label.style.display = '';
    label.style.width = w + 'px';
    label.style.height = h + 'px';
    label.style.left = Math.round(ri.left - rp.left - bl + ABSTAND) + 'px';
    label.style.top = Math.round(ri.bottom - rp.top - bt - h - ABSTAND) + 'px';
  }

  function kennzeichnen(img) {
    if (img.dataset.asKi) return;
    if (img.closest('.as-demohinweis') || img.classList.contains('as-kibadge')) return;
    if (zuKlein(img)) return;
    var p = rahmen(img);
    if (!p) return;
    img.dataset.asKi = '1';

    var label = document.createElement('img');
    label.className = 'as-kibadge';
    label.src = BASIS + 'labels/label-ai-generated-black.svg';
    label.alt = TEXT;
    label.setAttribute('loading', 'lazy');
    label.style.cssText = 'position:absolute;z-index:5;pointer-events:none;display:block;' +
      'filter:drop-shadow(0 1px 5px rgba(0,0,0,.5))';
    p.appendChild(label);

    var neu = function () { setzen(img, label, p); };
    neu();
    if (window.ResizeObserver) { try { new ResizeObserver(neu).observe(img); } catch (e) {} }
    window.addEventListener('resize', neu);
    if (!img.complete) img.addEventListener('load', neu);
  }

  function lauf() {
    var n = document.images;
    for (var i = 0; i < n.length; i++) {
      var img = n[i];
      if (img.classList.contains('as-kibadge')) continue;
      if (img.complete && img.naturalWidth) kennzeichnen(img);
      else if (!img.dataset.asWartet) {
        img.dataset.asWartet = '1';
        img.addEventListener('load', function () { kennzeichnen(this); });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lauf);
  else lauf();
  window.addEventListener('load', lauf);
})();
