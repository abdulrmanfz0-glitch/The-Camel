// Bootstrap: load three.js, then start the app (js/app.js).
import { setThree } from './three.js';

(async function () {
  'use strict';
  // "three" through the import map first, so an optional GLB loader shares this very module
  var URLS = ['three', 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js', 'https://unpkg.com/three@0.170.0/build/three.module.min.js'];
  var T = null;
  for (var i = 0; i < URLS.length && !T; i++) { try { T = await import(URLS[i]); } catch (e) { T = null; } }
  if (!T || !T.WebGLRenderer) {
    var en = /(^|[?&])lang=en/.test(location.search);
    try { en = en || localStorage.getItem('camel-lang') === 'en'; } catch (e) { /* storage blocked */ }
    var el = document.getElementById('ldErr'); el.hidden = false;
    el.textContent = en ? 'The 3D library could not be loaded. Check your connection and reload the page.' : 'تعذّر تحميل مكتبة الرسم ثلاثي الأبعاد. تحقّق من الاتصال ثم أعد تحميل الصفحة.';
    document.querySelector('.ld .bar').hidden = true;
    return;
  }
  setThree(T);
  await import('./app.js');
})();
