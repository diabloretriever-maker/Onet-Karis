(function () {
  'use strict';

  var IMG = 'asset/';

  // Letter: [how the letter is spoken, spoken word (null = sign tile), image file]
  // Words are spelled the way the Indonesian voice should pronounce them.
  var LETTERS = {
    A: ['a', 'Ambulans', 'a.png'],
    B: ['be', 'Buldoser', 'b.png'],
    C: ['ce', 'Kren', 'c.png'],
    D: ['de', 'Derek', 'd.png'],
    E: ['e', 'Ekskavator', 'e.png'],
    F: ['ef', 'Forklif', 'f.png'],
    G: ['ge', 'Greder', 'g.png'],
    H: ['ha', 'Helikopter', 'h.png'],
    I: ['i', 'Insinyur', 'i.png'],
    J: ['je', 'Jip', 'j.png'],
    K: ['ka', 'Kereta api', 'k.png'],
    L: ['el', 'Lampu lalu lintas', 'l.png'],
    M: ['em', 'Molen', 'm.png'],
    N: ['en', 'Nomor polisi', 'n.png'],
    O: ['o', 'Ojek', 'o.png'],
    P: ['pe', 'Pemadam kebakaran', 'p.png'],
    Q: ['ki', null, null],
    R: ['er', 'Rambu lalu lintas', 'r.png'],
    S: ['es', 'Sepeda', 's.png'],
    T: ['te', 'Truk', 't.png'],
    U: ['u', null, null],
    V: ['fe', null, null],
    W: ['we', 'Waterpas', 'w.png'],
    X: ['eks', null, null],
    Y: ['ye', null, null],
    Z: ['zet', 'Zebra kros', 'z.png']
  };
  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Number: [spoken word, vehicle image]
  var NUMBERS = [
    null,
    ['satu', 'h.png'],
    ['dua', 's.png'],
    ['tiga', 't.png'],
    ['empat', 'm.png'],
    ['lima', 'o.png'],
    ['enam', 'j.png'],
    ['tujuh', 'a.png'],
    ['delapan', 'b.png'],
    ['sembilan', 'f.png'],
    ['sepuluh', 'e.png']
  ];

  // Letter border colors (no blue; blue is for numbers).
  var PALETTE = ['#e53935', '#fb8c00', '#2e7d32', '#8e24aa', '#ec407a',
                 '#795548', '#fbc02d', '#9ccc65', '#424242', '#880e4f'];
  var NUM_COLOR = '#1e88e5';

  function nums(a, b) {
    var out = [];
    for (var i = a; i <= b; i++) { out.push('#' + i); }
    return out;
  }

  var SETS = {
    huruf: {
      title: 'Pilih huruf',
      color: '#e53935',
      list: [
        { label: 'A – F', keys: 'ABCDEF'.split(''), R: 3, C: 4 },
        { label: 'G – L', keys: 'GHIJKL'.split(''), R: 3, C: 4 },
        { label: 'M – R', keys: 'MNOPQR'.split(''), R: 3, C: 4 },
        { label: 'S – Z', keys: 'STUVWXYZ'.split(''), R: 4, C: 4 },
        { label: 'A – Z', keys: ALPHA, R: 6, C: 8, big: true }
      ]
    },
    angka: {
      title: 'Pilih angka',
      color: '#1e88e5',
      list: [
        { label: '1 – 5', keys: nums(1, 5), R: 2, C: 5 },
        { label: '6 – 10', keys: nums(6, 10), R: 2, C: 5 },
        { label: '1 – 10', keys: nums(1, 10), R: 4, C: 5, big: true }
      ]
    },
    campur: { label: 'Campur', keys: ALPHA.concat(nums(1, 10)), R: 6, C: 8, big: true }
  };

  // Learning tracks. Each group opens after the child passes its check on PASS_DAYS different days.
  var TRACKS = {
    huruf: {
      name: 'Huruf',
      groups: ['ABCDEF'.split(''), 'GHIJKL'.split(''), 'MNOPQR'.split(''), 'STUVWXYZ'.split('')],
      labels: ['A – F', 'G – L', 'M – R', 'S – Z'],
      final: SETS.huruf.list[4]
    },
    angka: {
      name: 'Angka',
      groups: [nums(1, 5), nums(6, 10)],
      labels: ['1 – 5', '6 – 10'],
      final: SETS.angka.list[2]
    }
  };
  var TRACK_NAMES = ['huruf', 'angka'];
  var PASS_DAYS = 2;
  var REVIEW = 2;
  // Board size (rows, columns) for a given number of pairs.
  var GRIDS = { 5: [2, 5], 6: [3, 4], 7: [2, 7], 8: [4, 4], 10: [4, 5] };

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (parent) { parent.appendChild(e); }
    return e;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---------- settings ----------

  function loadFlag(k) {
    try { return window.localStorage.getItem('onet.' + k) === '1'; } catch (e) { return false; }
  }
  function saveFlag(k, v) {
    try { window.localStorage.setItem('onet.' + k, v ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  var settings = { klasik: loadFlag('klasik'), muted: loadFlag('muted') };

  // ---------- saved progress ----------

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function freshProgress() {
    return { huruf: { level: 0, passes: [] }, angka: { level: 0, passes: [] } };
  }

  function loadProgress() {
    try {
      var p = JSON.parse(window.localStorage.getItem('onet.progress'));
      if (p && p.huruf && p.angka) { return p; }
    } catch (e) { /* ignore */ }
    return freshProgress();
  }

  function saveProgress() {
    try { window.localStorage.setItem('onet.progress', JSON.stringify(progress)); } catch (e) { /* ignore */ }
  }

  var progress = loadProgress();

  function trackDone(name) {
    return progress[name].level >= TRACKS[name].groups.length;
  }

  // ---------- timers ----------

  var timers = [];
  function later(fn, ms) {
    var id = setTimeout(function () {
      var i = timers.indexOf(id);
      if (i >= 0) { timers.splice(i, 1); }
      fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function clearTimers() {
    for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); }
    timers = [];
  }

  // ---------- sound effects (Web Audio) ----------

  var actx = null;

  function unlock() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return; }
    if (!actx) {
      try {
        actx = new AC();
        var buf = actx.createBuffer(1, 1, 22050);
        var src = actx.createBufferSource();
        src.buffer = buf;
        src.connect(actx.destination);
        src.start(0);
      } catch (e) { actx = null; }
    } else if (actx.state === 'suspended') {
      actx.resume();
    }
  }

  function tone(freq, dur, delay, type, vol) {
    if (!actx || settings.muted) { return; }
    var t0 = actx.currentTime + (delay || 0);
    var o = actx.createOscillator();
    var g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.25, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function sfxClick() { tone(880, 0.07, 0, 'triangle', 0.18); }
  function sfxGood() { tone(660, 0.12, 0, 'triangle', 0.22); tone(990, 0.18, 0.1, 'triangle', 0.22); }
  function sfxWrong() { tone(196, 0.2, 0, 'square', 0.06); }
  function sfxCheer() {
    var notes = [523, 659, 784, 1047, 784, 1047, 1319];
    for (var i = 0; i < notes.length; i++) {
      tone(notes[i], 0.22, i * 0.11, 'triangle', 0.22);
    }
  }

  // ---------- speech ----------

  var synth = window.speechSynthesis || null;
  var idVoice = null;
  var speechSeq = 0;

  function findVoice() {
    if (!synth) { return; }
    var vs = synth.getVoices() || [];
    idVoice = null;
    for (var i = 0; i < vs.length; i++) {
      if (/^id([\-_]|$)/i.test(vs[i].lang)) { idVoice = vs[i]; break; }
    }
    updateVoiceNote();
  }

  // Every new phrase cuts off the one still playing.
  function speak(text) {
    speechSeq++;
    if (!synth || settings.muted) { return speechSeq; }
    try {
      synth.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      u.lang = 'id-ID';
      if (idVoice) { u.voice = idVoice; }
      u.rate = 0.85;
      synth.speak(u);
    } catch (e) { /* ignore */ }
    return speechSeq;
  }

  function stopSpeech() {
    speechSeq++;
    if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } }
  }

  // ---------- input ----------

  function tap(node, fn) {
    node.addEventListener('touchend', function (e) {
      e.preventDefault();
      unlock();
      fn(e);
    }, false);
    node.addEventListener('click', function (e) {
      unlock();
      fn(e);
    }, false);
  }

  // ---------- screens ----------

  var MAIN = ['start', 'sets', 'game', 'check', 'result'];
  function show(id) {
    for (var i = 0; i < MAIN.length; i++) {
      $(MAIN[i]).className = 'screen' + (MAIN[i] === id ? ' on' : '');
    }
  }

  function goMenu() {
    clearTimers();
    stopSpeech();
    G = null;
    Q = null;
    $('end').className = 'screen';
    $('board').innerHTML = '';
    clearLines();
    refreshStart();
    show('start');
  }

  // ---------- tiles ----------

  function keyInfo(key) {
    if (key.charAt(0) === '#') {
      var n = parseInt(key.slice(1), 10);
      return { type: 'num', n: n, img: NUMBERS[n][1], color: NUM_COLOR,
               say: cap(NUMBERS[n][0]) + '.', recap: cap(NUMBERS[n][0]) + '.' };
    }
    var L = LETTERS[key];
    var idx = key.charCodeAt(0) - 65;
    var say = L[1] ? (L[0] + '. ' + L[1] + '.') : (L[0] + '.');
    return { type: L[2] ? 'letter' : 'sign', ch: key, img: L[2],
             color: PALETTE[idx % PALETTE.length], say: say, recap: say };
  }

  function buildTile(key, info) {
    var t = el('div', 'tile');
    t.style.borderColor = info.color;
    var inner = el('div', 'inner', t);
    var g, i, im;
    if (info.type === 'letter') {
      g = el('div', 'glyph', inner);
      g.textContent = key;
      im = el('img', 'pic', inner);
      im.src = IMG + info.img;
      im.alt = '';
    } else if (info.type === 'sign') {
      el('div', 'sign', inner);
      g = el('div', 'glyph sg', inner);
      g.textContent = key;
    } else {
      g = el('div', 'glyph ng' + (info.n > 5 ? ' ng2' : ''), inner);
      g.textContent = String(info.n);
      var m = el('div', 'minis' + (info.n > 5 ? ' two' : ''), inner);
      for (i = 0; i < info.n; i++) {
        if (i === 5) { el('br', null, m); }
        im = el('img', 'mini', m);
        im.src = IMG + info.img;
        im.alt = '';
      }
    }
    return t;
  }

  // ---------- game state ----------

  var G = null;
  var TOPBAR = 80;

  function startGame(set) {
    clearTimers();
    stopSpeech();
    $('end').className = 'screen';
    clearLines();

    var R = set.R, C = set.C, pairs = R * C / 2;
    var keys = shuffle(set.keys.slice()).slice(0, pairs);
    var deck = shuffle(keys.concat(keys));

    G = { set: set, R: R, C: C, classic: settings.klasik && !!set.big,
          grid: [], tiles: [], sel: null, left: R * C, cleared: {} };

    var board = $('board');
    board.innerHTML = '';
    var r, c, n = 0;
    for (r = 0; r < R; r++) {
      G.grid.push([]);
      for (c = 0; c < C; c++) {
        var key = deck[n];
        var info = keyInfo(key);
        var t = { id: n, key: key, info: info, r: r, c: c, busy: false, gone: false };
        t.el = buildTile(key, info);
        t.el.setAttribute('data-id', String(n));
        board.appendChild(t.el);
        G.grid[r].push(t);
        G.tiles.push(t);
        n++;
      }
    }
    show('game');
    layout(true);
    if (G.classic && !findAnyPair()) { shuffleBoard(true); }
  }

  function layout(noAnim) {
    if (!G) { return; }
    var W = window.innerWidth, H = window.innerHeight;
    var m = G.classic ? 1 : 0.15;
    var availW = W - 24, availH = H - TOPBAR - 12;
    var step = Math.min(availW / (G.C + 2 * m), availH / (G.R + 2 * m), 175);
    var size = Math.floor(step * 0.92);
    G.step = step;
    G.size = size;
    G.offX = (W - G.C * step) / 2;
    G.offY = TOPBAR + (availH - G.R * step) / 2;

    var board = $('board');
    if (noAnim) { board.className = 'noanim'; }
    for (var i = 0; i < G.tiles.length; i++) {
      var t = G.tiles[i];
      if (t.gone) { continue; }
      placeTile(t);
    }
    if (noAnim) {
      void board.offsetWidth;
      setTimeout(function () { board.className = ''; }, 50);
    }
    var svg = $('lines');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
  }

  function placeTile(t) {
    var s = t.el.style;
    var pad = (G.step - G.size) / 2;
    s.fontSize = G.size + 'px';
    s.width = G.size + 'px';
    s.height = G.size + 'px';
    s.left = Math.round(G.offX + t.c * G.step + pad) + 'px';
    s.top = Math.round(G.offY + t.r * G.step + pad) + 'px';
  }

  // ---------- classic path (at most two turns) ----------

  function isEmpty(r, c) {
    if (r < 0 || r >= G.R || c < 0 || c >= G.C) {
      return r >= -1 && r <= G.R && c >= -1 && c <= G.C;
    }
    return !G.grid[r][c];
  }

  function clearBetween(r1, c1, r2, c2) {
    var i, s, e;
    if (r1 === r2) {
      s = Math.min(c1, c2) + 1; e = Math.max(c1, c2);
      for (i = s; i < e; i++) { if (!isEmpty(r1, i)) { return false; } }
      return true;
    }
    if (c1 === c2) {
      s = Math.min(r1, r2) + 1; e = Math.max(r1, r2);
      for (i = s; i < e; i++) { if (!isEmpty(i, c1)) { return false; } }
      return true;
    }
    return false;
  }

  function straight(a, b) {
    return (a.r === b.r || a.c === b.c) && clearBetween(a.r, a.c, b.r, b.c);
  }

  function oneTurn(a, b) {
    var corners = [{ r: a.r, c: b.c }, { r: b.r, c: a.c }];
    for (var i = 0; i < corners.length; i++) {
      var k = corners[i];
      if ((k.r === a.r && k.c === a.c) || (k.r === b.r && k.c === b.c)) { continue; }
      if (isEmpty(k.r, k.c) && straight(a, k) && straight(k, b)) {
        return [a, k, b];
      }
    }
    return null;
  }

  function findPath(a, b) {
    var A = { r: a.r, c: a.c }, B = { r: b.r, c: b.c };
    if (straight(A, B)) { return [A, B]; }
    var p = oneTurn(A, B);
    if (p) { return p; }
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var d = 0; d < 4; d++) {
      var r = A.r + dirs[d][0], c = A.c + dirs[d][1];
      while (r >= -1 && r <= G.R && c >= -1 && c <= G.C && isEmpty(r, c)) {
        var P = { r: r, c: c };
        if (straight(P, B)) { return [A, P, B]; }
        var q = oneTurn(P, B);
        if (q) { return [A].concat(q); }
        r += dirs[d][0];
        c += dirs[d][1];
      }
    }
    return null;
  }

  function canPair(a, b) {
    return !G.classic || !!findPath(a, b);
  }

  function findAnyPair() {
    var groups = {}, i, k;
    for (i = 0; i < G.tiles.length; i++) {
      var t = G.tiles[i];
      if (t.gone || t.busy) { continue; }
      (groups[t.key] = groups[t.key] || []).push(t);
    }
    for (k in groups) {
      if (!groups.hasOwnProperty(k)) { continue; }
      var g = groups[k];
      for (i = 0; i < g.length; i++) {
        for (var j = i + 1; j < g.length; j++) {
          if (canPair(g[i], g[j])) { return [g[i], g[j]]; }
        }
      }
    }
    return null;
  }

  function anyBusy() {
    for (var i = 0; i < G.tiles.length; i++) {
      if (G.tiles[i].busy && !G.tiles[i].gone) { return true; }
    }
    return false;
  }

  // ---------- lines ----------

  var SVGNS = 'http://www.w3.org/2000/svg';

  function clearLines() {
    var svg = $('lines');
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
  }

  function drawPath(points) {
    var svg = $('lines');
    var pts = [];
    for (var i = 0; i < points.length; i++) {
      var x = G.offX + points[i].c * G.step + G.step / 2;
      var y = G.offY + points[i].r * G.step + G.step / 2;
      pts.push(Math.round(x) + ',' + Math.round(y));
    }
    var list = pts.join(' ');
    var widths = [[14, '#5d4037'], [8, '#ffeb3b']];
    for (var w = 0; w < widths.length; w++) {
      var pl = document.createElementNS(SVGNS, 'polyline');
      pl.setAttribute('points', list);
      pl.setAttribute('fill', 'none');
      pl.setAttribute('stroke', widths[w][1]);
      pl.setAttribute('stroke-width', widths[w][0]);
      pl.setAttribute('stroke-linejoin', 'round');
      pl.setAttribute('stroke-linecap', 'round');
      svg.appendChild(pl);
    }
    later(clearLines, 450);
  }

  // ---------- play ----------

  function tileFrom(target) {
    var board = $('board');
    while (target && target !== board) {
      if (target.getAttribute && target.getAttribute('data-id') !== null) {
        return G ? G.tiles[parseInt(target.getAttribute('data-id'), 10)] : null;
      }
      target = target.parentNode;
    }
    return null;
  }

  function addTemp(t, cls, ms) {
    t.el.classList.remove(cls);
    void t.el.offsetWidth;
    t.el.classList.add(cls);
    later(function () { t.el.classList.remove(cls); }, ms);
  }

  function onTile(t) {
    if (!G || !t || t.busy || t.gone) { return; }
    sfxClick();

    if (G.sel === t) {
      t.el.classList.remove('sel');
      G.sel = null;
      return;
    }

    if (!G.sel) {
      speak(t.info.say);
      G.sel = t;
      t.el.classList.add('sel');
      return;
    }

    var a = G.sel;
    G.sel = null;
    a.el.classList.remove('sel');

    if (a.key !== t.key) {
      speak(t.info.say);
      wrong(a, t);
      return;
    }

    var path = null;
    if (G.classic) {
      path = findPath(a, t);
      if (!path) {
        speak(t.info.say);
        wrong(a, t);
        return;
      }
    }
    matched(a, t, path);
  }

  function wrong(a, b) {
    sfxWrong();
    addTemp(a, 'shake', 460);
    addTemp(b, 'shake', 460);
  }

  function matched(a, b, path) {
    a.busy = b.busy = true;
    a.el.classList.add('match');
    b.el.classList.add('match');
    if (path) { drawPath(path); }

    if (a.info.type === 'num') {
      countUp(a, b);
    } else {
      speak(a.info.say);
      sfxGood();
      later(function () { removePair(a, b); }, path ? 450 : 300);
    }
  }

  function countUp(a, b) {
    var n = a.info.n;
    var ma = a.el.getElementsByTagName('img');
    var mb = b.el.getElementsByTagName('img');
    a.el.classList.add('counting');
    b.el.classList.add('counting');
    var i = 0;
    var mySeq = -1;

    function next() {
      if (i < n) {
        ma[i].classList.add('lit');
        mb[i].classList.add('lit');
        if (mySeq === -1 || mySeq === speechSeq) {
          mySeq = speak(cap(NUMBERS[i + 1][0]));
        }
        i++;
        later(next, 700);
      } else {
        if (mySeq === speechSeq) { speak(cap(NUMBERS[n][0]) + '!'); }
        sfxGood();
        later(function () { removePair(a, b); }, 900);
      }
    }
    next();
  }

  function removePair(a, b) {
    if (!G) { return; }
    var pair = [a, b];
    for (var i = 0; i < 2; i++) {
      var t = pair[i];
      t.gone = true;
      G.grid[t.r][t.c] = null;
      t.el.classList.remove('match');
      t.el.classList.add('gone');
    }
    G.cleared[a.key] = true;
    G.left -= 2;
    later(function () {
      for (var j = 0; j < 2; j++) {
        if (pair[j].el.parentNode) { pair[j].el.parentNode.removeChild(pair[j].el); }
      }
    }, 320);

    if (G.left === 0) {
      later(win, 400);
    } else if (G.classic && !anyBusy() && !findAnyPair()) {
      later(function () { shuffleBoard(false); }, 600);
    }
  }

  function shuffleBoard(noAnim) {
    if (!G) { return; }
    if (G.sel) { G.sel.el.classList.remove('sel'); G.sel = null; }
    var mov = [], pos = [], i;
    for (i = 0; i < G.tiles.length; i++) {
      var t = G.tiles[i];
      if (!t.gone && !t.busy) { mov.push(t); pos.push({ r: t.r, c: t.c }); }
    }
    if (mov.length < 2) { return; }
    var tries = 0;
    do {
      shuffle(pos);
      for (i = 0; i < mov.length; i++) { G.grid[pos[i].r][pos[i].c] = null; }
      for (i = 0; i < mov.length; i++) {
        mov[i].r = pos[i].r;
        mov[i].c = pos[i].c;
        G.grid[pos[i].r][pos[i].c] = mov[i];
      }
      tries++;
    } while (G.classic && !findAnyPair() && tries < 60);
    if (noAnim) {
      layout(true);
    } else {
      for (i = 0; i < mov.length; i++) { placeTile(mov[i]); }
    }
  }

  function hint() {
    if (!G) { return; }
    var p = findAnyPair();
    if (!p) { return; }
    addTemp(p[0], 'hint', 1650);
    addTemp(p[1], 'hint', 1650);
  }

  // ---------- end of round ----------

  function confetti() {
    var fx = $('fx');
    var colors = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#ec407a'];
    for (var i = 0; i < 40; i++) {
      var d = el('div', 'cf', fx);
      d.style.left = Math.floor(Math.random() * 100) + '%';
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      d.style.webkitAnimationDelay = d.style.animationDelay;
      d.style.animationDuration = (1.6 + Math.random() * 0.9).toFixed(2) + 's';
      d.style.webkitAnimationDuration = d.style.animationDuration;
    }
    setTimeout(function () { fx.innerHTML = ''; }, 3500);
  }

  function win() {
    sfxCheer();
    speak('Hebat!');
    confetti();
    later(showEnd, 1600);
  }

  function sortKeys(keys) {
    return keys.sort(function (x, y) {
      var nx = x.charAt(0) === '#', ny = y.charAt(0) === '#';
      if (nx !== ny) { return nx ? 1 : -1; }
      if (nx) { return parseInt(x.slice(1), 10) - parseInt(y.slice(1), 10); }
      return x < y ? -1 : (x > y ? 1 : 0);
    });
  }

  function showEnd() {
    if (!G) { return; }
    var keys = [];
    for (var k in G.cleared) { if (G.cleared.hasOwnProperty(k)) { keys.push(k); } }
    sortKeys(keys);

    var n = keys.length;
    var size = n <= 6 ? 120 : (n <= 10 ? 100 : (n <= 16 ? 84 : 68));
    var recap = $('recap');
    recap.innerHTML = '';
    var items = [];
    for (var i = 0; i < n; i++) {
      var info = keyInfo(keys[i]);
      var t = buildTile(keys[i], info);
      t.className = 'tile static';
      t.style.fontSize = size + 'px';
      t.style.width = size + 'px';
      t.style.height = size + 'px';
      recap.appendChild(t);
      items.push({ el: t, say: info.recap });
    }

    $('skip').className = 'btn';
    $('skip').innerHTML = G.set.track ? 'Lanjut &#9654;' : 'Lewati &#9654;';
    $('again').className = 'btn hide';
    $('menu').className = 'btn hide';
    $('end').className = 'screen on';

    var idx = 0;
    function next() {
      if (idx > 0) { items[idx - 1].el.classList.remove('lit'); }
      if (idx >= items.length) { finishRecap(); return; }
      var it = items[idx];
      it.el.classList.add('lit');
      speak(it.say);
      idx++;
      later(next, Math.max(1100, 500 + it.say.length * 85));
    }
    later(next, 500);
  }

  function finishRecap() {
    var lit = $('recap').getElementsByClassName('lit');
    while (lit.length) { lit[0].classList.remove('lit'); }
    if (G && G.set.track) { startCheck(); return; }
    $('skip').className = 'btn hide';
    $('again').className = 'btn';
    $('menu').className = 'btn';
  }

  // ---------- learning tracks ----------

  function startTrack(name) {
    var T = TRACKS[name], P = progress[name], set, i;
    if (P.level < T.groups.length) {
      var L = P.level;
      var prev = [];
      for (i = 0; i < L; i++) { prev = prev.concat(T.groups[i]); }
      // The current group plus a couple of earlier letters/numbers for review.
      var keys = T.groups[L].concat(shuffle(prev).slice(0, REVIEW));
      var g = GRIDS[keys.length];
      set = { label: T.labels[L], keys: keys, R: g[0], C: g[1], track: name, level: L,
              checkKeys: T.groups[L], checkPool: T.groups[L] };
    } else {
      var f = T.final, all = [];
      for (i = 0; i < T.groups.length; i++) { all = all.concat(T.groups[i]); }
      set = { label: f.label, keys: f.keys, R: f.R, C: f.C, big: true, track: name, level: -1,
              checkKeys: null, checkPool: all };
    }
    startGame(set);
  }

  function refreshStart() {
    for (var i = 0; i < TRACK_NAMES.length; i++) {
      var n = TRACK_NAMES[i], P = progress[n], T = TRACKS[n];
      var lv = $('lv-' + n);
      if (P.level < T.groups.length) {
        var dots = '';
        for (var j = 0; j < PASS_DAYS; j++) { dots += j < P.passes.length ? '●' : '○'; }
        lv.textContent = T.labels[P.level] + '  ' + dots;
      } else {
        lv.textContent = 'Selesai ★';
      }
    }
    var open = trackDone('huruf') && trackDone('angka');
    $('campurBtn').className = 'big' + (open ? '' : ' locked');
    $('lv-campur').textContent = open ? 'Terbuka' : '🔒';
  }

  // ---------- Tebak: recognition check ----------

  var Q = null;

  function isNum(k) { return k.charAt(0) === '#'; }

  function nameFor(k) {
    return isNum(k) ? NUMBERS[parseInt(k.slice(1), 10)][0] : LETTERS[k][0];
  }

  function promptFor(k) {
    return (isNum(k) ? 'Cari angka ' : 'Cari huruf ') + nameFor(k) + '!';
  }

  function startCheck() {
    var set = G.set;
    var keys = set.checkKeys ? shuffle(set.checkKeys.slice()) : shuffle(set.checkPool.slice()).slice(0, 6);
    Q = { set: set, keys: keys, i: 0, correct: 0, first: true, locked: false, marks: [] };
    $('end').className = 'screen';
    show('check');
    nextQ();
  }

  function drawDots() {
    var d = $('dots');
    d.innerHTML = '';
    for (var i = 0; i < Q.keys.length; i++) {
      var cls = 'dot';
      if (i < Q.marks.length) { cls += Q.marks[i] ? ' ok' : ' retry'; } else if (i === Q.i) { cls += ' cur'; }
      el('span', cls, d);
    }
  }

  function nextQ() {
    if (!Q) { return; }
    if (Q.i >= Q.keys.length) { finishCheck(); return; }
    var target = Q.keys[Q.i];
    var pool = [], i;
    for (i = 0; i < Q.set.checkPool.length; i++) {
      if (Q.set.checkPool[i] !== target) { pool.push(Q.set.checkPool[i]); }
    }
    var opts = shuffle([target].concat(shuffle(pool).slice(0, 2)));
    Q.first = true;
    Q.locked = false;
    var box = $('choices');
    box.innerHTML = '';
    for (i = 0; i < opts.length; i++) {
      (function (k) {
        // Letter or digit only, no picture and a neutral border, so nothing gives the answer away.
        var t = el('div', 'tile static ctile', box);
        t.setAttribute('data-k', k);
        var inner = el('div', 'inner', t);
        var g = el('div', 'glyph cg', inner);
        g.textContent = isNum(k) ? k.slice(1) : k;
        tap(t, function () { onChoice(k, t); });
      })(opts[i]);
    }
    drawDots();
    later(function () { speak(promptFor(target)); }, 450);
  }

  function onChoice(k, node) {
    if (!Q || Q.locked) { return; }
    var target = Q.keys[Q.i];
    if (k === target) {
      Q.locked = true;
      if (Q.first) { Q.correct++; }
      Q.marks.push(Q.first);
      node.classList.add('lit');
      sfxGood();
      var say = 'Betul! ' + keyInfo(k).say;
      speak(say);
      Q.i++;
      drawDots();
      later(nextQ, Math.max(1700, 600 + say.length * 75));
    } else {
      Q.first = false;
      sfxWrong();
      node.classList.remove('shake');
      void node.offsetWidth;
      node.classList.add('shake');
      speak('Itu ' + nameFor(k) + '. ' + promptFor(target));
    }
  }

  function finishCheck() {
    var set = Q.set, n = Q.keys.length, c = Q.correct;
    var passed = c >= n - 1;
    var msg, say, sub = 'Betul ' + c + ' dari ' + n;

    if (set.level >= 0 && passed && progress[set.track].level === set.level) {
      var P = progress[set.track], T = TRACKS[set.track];
      var d = today();
      if (P.passes.indexOf(d) < 0) { P.passes.push(d); }
      if (P.passes.length >= PASS_DAYS) {
        P.level++;
        P.passes = [];
        if (P.level >= T.groups.length) {
          msg = 'Semua ' + T.name.toLowerCase() + ' selesai!';
          say = 'Hebat sekali! Semua ' + T.name.toLowerCase() + ' sudah bisa!';
        } else {
          msg = T.name + ' baru terbuka: ' + T.labels[P.level];
          say = 'Hebat sekali! Ada ' + T.name.toLowerCase() + ' baru!';
        }
      } else {
        msg = 'Lulus hari ini! Main lagi besok, ya.';
        say = 'Hebat! Besok main lagi, ya!';
      }
      saveProgress();
    } else if (passed) {
      msg = 'Hebat!';
      say = 'Hebat!';
    } else {
      msg = 'Ayo coba lagi!';
      say = 'Ayo coba lagi!';
    }

    var stars = '';
    for (var i = 0; i < n; i++) { stars += i < c ? '★' : '☆'; }
    $('rstars').textContent = stars;
    $('rmsg').textContent = msg;
    $('rsub').textContent = sub;
    Q = null;
    show('result');
    if (passed) { sfxCheer(); }
    later(function () { speak(say); }, 300);
  }

  // ---------- parent: free board picker ----------

  function openFree() {
    $('settings').className = '';
    $('setsTitle').textContent = 'Pilih papan';
    var list = $('setList');
    list.innerHTML = '';
    var groups = [[SETS.huruf.list, SETS.huruf.color], [SETS.angka.list, SETS.angka.color],
                  [[SETS.campur], '#43a047']];
    for (var i = 0; i < groups.length; i++) {
      for (var j = 0; j < groups[i][0].length; j++) {
        (function (set, color) {
          var b = el('div', 'setb' + (set.big ? ' all' : ''), list);
          b.style.borderColor = color;
          b.textContent = set.label;
          tap(b, function () { sfxClick(); startGame(set); });
        })(groups[i][0][j], groups[i][1]);
      }
    }
    show('sets');
  }

  // ---------- settings panel ----------

  function updateVoiceNote() {
    var n = $('voiceNote');
    if (!n) { return; }
    if (!synth) {
      n.textContent = 'Browser ini tidak mendukung suara.';
    } else if (idVoice) {
      n.textContent = 'Suara Indonesia: siap (' + idVoice.name + ').';
    } else {
      n.textContent = 'Suara Indonesia belum ada. Unduh “Damayanti” di ' +
        'Pengaturan → Umum → Aksesibilitas → Ucapan → Suara → Indonesia.';
    }
  }

  function refreshOpts() {
    var opts = document.querySelectorAll('.opt');
    for (var i = 0; i < opts.length; i++) {
      var on = (opts[i].getAttribute('data-k') === '1') === settings.klasik;
      opts[i].className = 'opt' + (on ? ' on' : '');
    }
  }

  function refreshProg() {
    var box = $('progRows');
    box.innerHTML = '';
    for (var i = 0; i < TRACK_NAMES.length; i++) {
      (function (n) {
        var P = progress[n], T = TRACKS[n], done = trackDone(n);
        var row = el('div', 'prow', box);
        var txt = el('span', 'ptxt', row);
        txt.textContent = T.name + ': ' + (done ? 'selesai' :
          T.labels[P.level] + ' (lulus ' + P.passes.length + ' dari ' + PASS_DAYS + ' hari)');

        var up = el('span', 'pbtn' + (done ? ' off' : ''), row);
        up.textContent = 'Naik';
        tap(up, function () {
          if (trackDone(n)) { return; }
          P.level++;
          P.passes = [];
          saveProgress();
          refreshProg();
          refreshStart();
        });

        // Reset needs a second tap within three seconds.
        var rs = el('span', 'pbtn', row);
        rs.textContent = 'Ulang';
        tap(rs, function () {
          if (rs.getAttribute('data-arm')) {
            progress[n] = { level: 0, passes: [] };
            saveProgress();
            refreshProg();
            refreshStart();
          } else {
            rs.setAttribute('data-arm', '1');
            rs.className = 'pbtn arm';
            rs.textContent = 'Yakin?';
            setTimeout(function () {
              rs.removeAttribute('data-arm');
              rs.className = 'pbtn';
              rs.textContent = 'Ulang';
            }, 3000);
          }
        });
      })(TRACK_NAMES[i]);
    }
  }

  function openSettings() {
    findVoice();
    refreshOpts();
    refreshProg();
    $('settings').className = 'on';
  }

  function refreshMute() {
    var bs = document.querySelectorAll('.mute');
    for (var i = 0; i < bs.length; i++) {
      bs[i].innerHTML = settings.muted ? '&#128263;' : '&#128266;';
    }
  }

  // ---------- wiring ----------

  function init() {
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, false);
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, false);

    var tracks = document.querySelectorAll('.big[data-track]');
    for (var i = 0; i < tracks.length; i++) {
      (function (b) {
        tap(b, function () {
          sfxClick();
          speak(b.querySelector('.bl').textContent);
          startTrack(b.getAttribute('data-track'));
        });
      })(tracks[i]);
    }

    var campur = $('campurBtn');
    tap(campur, function () {
      if (trackDone('huruf') && trackDone('angka')) {
        sfxClick();
        speak('Campur');
        startGame(SETS.campur);
      } else {
        sfxWrong();
        campur.classList.remove('shake');
        void campur.offsetWidth;
        campur.classList.add('shake');
      }
    });

    tap($('homeC'), function () { sfxClick(); goMenu(); });
    tap($('rep'), function () { if (Q && Q.i < Q.keys.length) { speak(promptFor(Q.keys[Q.i])); } });
    tap($('rAgain'), function () {
      sfxClick();
      if (!G) { goMenu(); return; }
      if (G.set.track) { startTrack(G.set.track); } else { startGame(G.set); }
    });
    tap($('rMenu'), function () { sfxClick(); goMenu(); });
    tap($('freeBtn'), function () { sfxClick(); openFree(); });

    tap($('back'), function () { sfxClick(); goMenu(); });
    tap($('home'), function () { sfxClick(); goMenu(); });
    tap($('hint'), function () { sfxClick(); hint(); });
    tap($('shuf'), function () { sfxClick(); shuffleBoard(false); });
    tap($('again'), function () { sfxClick(); if (G) { startGame(G.set); } });
    tap($('menu'), function () { sfxClick(); goMenu(); });
    tap($('skip'), function () { clearTimers(); stopSpeech(); finishRecap(); });

    tap($('board'), function (e) { onTile(tileFrom(e.target)); });

    var mutes = document.querySelectorAll('.mute');
    for (i = 0; i < mutes.length; i++) {
      tap(mutes[i], function () {
        settings.muted = !settings.muted;
        saveFlag('muted', settings.muted);
        if (settings.muted) { stopSpeech(); } else { sfxClick(); }
        refreshMute();
      });
    }
    refreshMute();
    refreshStart();

    // Settings open only after holding the gear for two seconds.
    var gear = $('gear');
    var gearT = null;
    function down(e) {
      e.preventDefault();
      gear.classList.add('holding');
      gearT = setTimeout(function () {
        gearT = null;
        gear.classList.remove('holding');
        openSettings();
      }, 2000);
    }
    function up() {
      if (gearT) { clearTimeout(gearT); gearT = null; }
      gear.classList.remove('holding');
    }
    gear.addEventListener('touchstart', down, false);
    gear.addEventListener('mousedown', down, false);
    gear.addEventListener('touchend', up, false);
    gear.addEventListener('touchcancel', up, false);
    gear.addEventListener('mouseup', up, false);
    gear.addEventListener('mouseleave', up, false);

    var opts = document.querySelectorAll('.opt');
    for (i = 0; i < opts.length; i++) {
      (function (o) {
        tap(o, function () {
          settings.klasik = o.getAttribute('data-k') === '1';
          saveFlag('klasik', settings.klasik);
          refreshOpts();
        });
      })(opts[i]);
    }
    tap($('closeSet'), function () { $('settings').className = ''; });

    window.addEventListener('resize', function () { setTimeout(function () { layout(true); }, 250); }, false);
    window.addEventListener('orientationchange', function () { setTimeout(function () { layout(true); }, 350); }, false);

    if (synth) {
      findVoice();
      if ('onvoiceschanged' in synth) { synth.onvoiceschanged = findVoice; }
    }

    // Preload images so tiles never appear blank.
    for (var k in LETTERS) {
      if (LETTERS.hasOwnProperty(k) && LETTERS[k][2]) { (new Image()).src = IMG + LETTERS[k][2]; }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache unavailable */ });
    }
  }

  init();
})();
