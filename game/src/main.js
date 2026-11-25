// Sizzle & Serve — game state, rules and input.
// Loop: orders arrive on the left rail -> grill the patty -> stack the plate
// in the recipe's exact order -> serve before the ticket's timer runs out.
// Supports deterministic screenshot scenes via ?shot=cover|play|serve&seed=N.

(function () {
  'use strict';
  var CFG = window.SS_CONFIG;
  var R = window.SS_RENDER;
  var L = R.LAYOUT;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  var params = new URLSearchParams(location.search);
  var shot = params.get('shot');
  var seed = parseInt(params.get('seed') || '1', 10) || 1;

  // Small deterministic RNG (mulberry32) so screenshot scenes never change.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32(shotsSeed());
  function shotsSeed() { return shot ? seed : (Date.now() % 2147483647); }

  var S; // the whole game state; render.js only reads it

  function freshState(mode) {
    return {
      mode: mode,               // title | playing | paused | over | shot
      timeLeft: CFG.SHIFT_SECONDS,
      score: 0, coins: 0, streak: 0, maxStreak: 0, served: 0, missed: 0,
      orders: [],               // {recipe, timeLeft, timeMax}
      plate: [],                // ingredient ids, bottom first
      grill: [null, null],      // null or {t: seconds on the grill}
      spawnIn: 0,
      message: null,            // {text, sub, kind, t}
      floaters: [],             // {x, y, text, t}
      servedDish: null,         // {recipe, t} shown at the pass
      rating: '',
    };
  }

  function addOrder() {
    if (S.orders.length >= CFG.MAX_ORDERS) return;
    var recipe = Math.floor(rng() * CFG.RECIPES.length);
    S.orders.push({ recipe: recipe, timeLeft: CFG.ORDER_SECONDS, timeMax: CFG.ORDER_SECONDS });
  }

  function say(text, sub, kind) { S.message = { text: text, sub: sub || '', kind: kind || 'info', t: 0 }; }

  function startShift() {
    S = freshState('playing');
    addOrder();
    S.spawnIn = 5;
    say('开工！先看左边订单', '面包坯打底，牛肉饼记得先上烤架', 'info');
  }

  // ---- actions ---------------------------------------------------------------

  function takeIngredient(id) {
    if (id === 'patty') {
      var free = S.grill.indexOf(null);
      if (free === -1) { say('烤架满了', '等一块饼熟了或扔掉焦的再放', 'bad'); return; }
      S.grill[free] = { t: 0 };
      say('牛肉饼上烤架了', '变棕色就是熟了，别等到焦', 'info');
      return;
    }
    if (S.plate.length >= CFG.MAX_PLATE) { say('盘子叠不下了', '先上菜或倒掉重做', 'bad'); return; }
    S.plate.push(id);
  }

  function clickGrill(i) {
    var slot = S.grill[i];
    if (!slot) return;
    var st = R.stageOf(slot.t);
    if (st === 0) { say('还没熟', '肉饼还是红的，再等几秒', 'bad'); return; }
    if (st === 2) {
      S.grill[i] = null;
      say('焦了，只能扔掉', '下次盯着进度环，绿了就上盘', 'bad');
      return;
    }
    if (S.plate.length >= CFG.MAX_PLATE) { say('盘子叠不下了', '先上菜或倒掉重做', 'bad'); return; }
    S.grill[i] = null;
    S.plate.push('patty');
    say('肉饼上盘！', '', 'good');
  }

  function sameStack(a, b) {
    return a.length === b.length && a.every(function (v, i) { return v === b[i]; });
  }

  function serve() {
    if (!S.plate.length) { say('盘子是空的', '先照订单把菜叠好', 'bad'); return; }
    var match = -1;
    for (var i = 0; i < S.orders.length; i++) {
      if (sameStack(S.plate, CFG.RECIPES[S.orders[i].recipe].stack)) {
        if (match === -1 || S.orders[i].timeLeft < S.orders[match].timeLeft) match = i;
      }
    }
    if (match === -1) {
      S.streak = 0;
      say('错单！和订单对不上', '照票上的顺序从下往上叠，或倒掉重做', 'bad');
      return;
    }
    var order = S.orders.splice(match, 1)[0];
    var r = CFG.RECIPES[order.recipe];
    var timeBonus = Math.round(CFG.TIME_BONUS_MAX * (order.timeLeft / order.timeMax));
    var gain = r.price + timeBonus + S.streak * CFG.STREAK_BONUS;
    S.score += gain; S.coins += r.price;
    S.streak += 1; S.maxStreak = Math.max(S.maxStreak, S.streak);
    S.served += 1;
    S.servedDish = { recipe: order.recipe, t: 0 };
    S.floaters.push({ x: L.pass.x + 330, y: L.pass.y + 40, text: '+' + gain, t: 0 });
    say(r.name + ' 上菜成功！', '得分 +' + gain + '（含速度与连对加成）', 'good');
    S.plate = [];
  }

  function endShift() {
    S.mode = 'over';
    S.rating = S.score >= 500 ? '★★★ 厨 神' : S.score >= 320 ? '★★ 大 厨' : S.score >= 160 ? '★ 帮厨之星' : '学徒厨师';
  }

  // ---- update ------------------------------------------------------------------

  function update(dt) {
    if (S.mode !== 'playing') return;
    S.timeLeft -= dt;
    if (S.timeLeft <= 0) { S.timeLeft = 0; endShift(); return; }
    for (var i = S.orders.length - 1; i >= 0; i--) {
      S.orders[i].timeLeft -= dt;
      if (S.orders[i].timeLeft <= 0) {
        S.orders.splice(i, 1);
        S.missed += 1; S.streak = 0;
        S.score = Math.max(0, S.score - CFG.TIMEOUT_PENALTY);
        say('订单超时，被撤走了', '扣 ' + CFG.TIMEOUT_PENALTY + ' 分，连对清零', 'bad');
      }
    }
    S.spawnIn -= dt;
    if (S.spawnIn <= 0) { addOrder(); S.spawnIn = 6 + rng() * 5; }
    S.grill.forEach(function (g) { if (g) g.t += dt; });
    if (S.servedDish) { S.servedDish.t += dt; if (S.servedDish.t > 3.2) S.servedDish = null; }
    if (S.message) { S.message.t += dt; if (S.message.t > 3.4) S.message = null; }
    S.floaters.forEach(function (f) { f.t += dt; });
    S.floaters = S.floaters.filter(function (f) { return f.t < 1.4; });
  }

  // ---- deterministic screenshot scenes ------------------------------------------

  function shotScene(name) {
    S = freshState('shot');
    if (name === 'cover') {
      S.mode = 'title';
      S.timeLeft = CFG.SHIFT_SECONDS;
      S.orders = [
        { recipe: 0, timeLeft: 40, timeMax: CFG.ORDER_SECONDS },
        { recipe: 3, timeLeft: 33, timeMax: CFG.ORDER_SECONDS },
      ];
      S.grill[0] = { t: 6 };
      return;
    }
    if (name === 'play') {
      S.timeLeft = 63; S.score = 120; S.coins = 120; S.streak = 2; S.maxStreak = 2; S.served = 2;
      S.orders = [
        { recipe: 1, timeLeft: 30, timeMax: CFG.ORDER_SECONDS },
        { recipe: 0, timeLeft: 38, timeMax: CFG.ORDER_SECONDS },
      ];
      S.plate = ['bun', 'patty', 'cheese'];
      S.grill[0] = { t: CFG.PATTY_BURNT_AT / 2 }; // progress ring exactly half full
      say('芝士双层堡叠到一半', '烤架上的饼快好了，熟了点一下上盘', 'info');
      return;
    }
    if (name === 'serve') {
      S.timeLeft = 41; S.score = 260; S.coins = 245; S.streak = 3; S.maxStreak = 3; S.served = 4;
      S.orders = [{ recipe: 3, timeLeft: 35, timeMax: CFG.ORDER_SECONDS }];
      S.servedDish = { recipe: 0, t: 0 };
      say('经典牛肉堡做好了！', '客人很满意，连对 ×3', 'good');
      return;
    }
    S.mode = 'title';
  }

  // ---- input ----------------------------------------------------------------------

  function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

  function canvasPos(ev) {
    var b = canvas.getBoundingClientRect();
    return { x: (ev.clientX - b.left) * (CFG.WIDTH / b.width), y: (ev.clientY - b.top) * (CFG.HEIGHT / b.height) };
  }

  canvas.addEventListener('click', function (ev) {
    var p = canvasPos(ev);
    if (S.mode === 'title') { if (inRect(p.x, p.y, L.startBtn)) startShift(); return; }
    if (S.mode === 'over') { if (inRect(p.x, p.y, L.restartBtn)) startShift(); return; }
    if (S.mode === 'shot') return;
    if (S.mode === 'paused') { S.mode = 'playing'; return; }
    if (inRect(p.x, p.y, L.serveBtn)) { serve(); return; }
    if (inRect(p.x, p.y, L.clearBtn)) {
      if (S.plate.length) { S.plate = []; say('盘子倒掉了', '重新照订单叠吧', 'info'); }
      return;
    }
    if (inRect(p.x, p.y, L.pauseHint)) { S.mode = 'paused'; return; }
    for (var g = 0; g < 2; g++) if (inRect(p.x, p.y, L.grillSlots[g])) { clickGrill(g); return; }
    for (var c = 0; c < 8; c++) if (inRect(p.x, p.y, L.cells[c])) { takeIngredient(CFG.INGREDIENTS[c].id); return; }
  });

  window.addEventListener('keydown', function (ev) {
    if (S.mode === 'title') { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); startShift(); } return; }
    if (S.mode === 'over') { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); startShift(); } return; }
    if (S.mode === 'shot') return;
    if (ev.key === 'p' || ev.key === 'P') { S.mode = S.mode === 'paused' ? 'playing' : 'paused'; return; }
    if (S.mode !== 'playing') return;
    if (ev.key === ' ') { ev.preventDefault(); serve(); return; }
    var n = parseInt(ev.key, 10);
    if (n >= 1 && n <= 8) takeIngredient(CFG.INGREDIENTS[n - 1].id);
  });

  // ---- boot + loop ------------------------------------------------------------------

  if (shot) shotScene(shot);
  else { S = freshState('title'); S.orders = [
    { recipe: 0, timeLeft: 40, timeMax: CFG.ORDER_SECONDS },
    { recipe: 3, timeLeft: 33, timeMax: CFG.ORDER_SECONDS },
  ]; S.grill[0] = { t: 6 }; }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!shot) update(dt);
    R.draw(ctx, S);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
