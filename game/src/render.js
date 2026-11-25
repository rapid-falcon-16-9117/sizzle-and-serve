// Sizzle & Serve — all drawing. Warm little diner: cream walls, dark wood
// counters, chunky labelled ingredients that stay readable at thumbnail size.
// Exposes window.SS_RENDER = { draw(ctx, S), LAYOUT } — main.js uses LAYOUT
// for click hit-testing, so what you see is exactly what you can click.

window.SS_RENDER = (function () {
  'use strict';
  var CFG = window.SS_CONFIG;
  var ING = {};
  CFG.INGREDIENTS.forEach(function (i) { ING[i.id] = i; });

  var LAYOUT = {
    ticket: { x: 16, y: 78, w: 272, h: 196, gap: 10 },
    grillSlots: [
      { x: 330, y: 92, w: 172, h: 142 },
      { x: 518, y: 92, w: 172, h: 142 },
    ],
    pass: { x: 706, y: 84, w: 546, h: 158 },
    plate: { cx: 545, surfaceY: 540, rx: 200 },
    serveBtn: { x: 796, y: 268, w: 456, h: 92 },
    clearBtn: { x: 796, y: 376, w: 216, h: 54 },
    pauseHint: { x: 1028, y: 376, w: 216, h: 54 },
    msgBox: { x: 796, y: 448, w: 456, h: 128 },
    cells: [],
    startBtn: { x: 440, y: 520, w: 400, h: 84 },
    restartBtn: { x: 440, y: 560, w: 400, h: 80 },
  };
  (function () {
    var x = 316;
    for (var i = 0; i < 8; i++) { LAYOUT.cells.push({ x: x, y: 652, w: 112, h: 124 }); x += 120; }
  })();

  var FONT = '"Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function text(ctx, s, x, y, size, color, align, bold) {
    ctx.fillStyle = color;
    ctx.font = (bold ? '700 ' : '') + size + 'px ' + FONT;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }

  // ---- ingredient painting -------------------------------------------------

  // One layer of the stack on the assembly plate. (cx, bottomY) is the point
  // the layer sits on; returns the layer's height so callers can stack.
  function drawLayer(ctx, id, cx, bottomY, isTop) {
    var w = 300, half = w / 2, c = ING[id];
    ctx.save();
    if (id === 'bun' && isTop) {
      ctx.fillStyle = c.main;
      ctx.beginPath();
      ctx.moveTo(cx - half, bottomY);
      ctx.arc(cx, bottomY, half, Math.PI, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.dark;
      ctx.fillRect(cx - half, bottomY - 3, w, 4);
      ctx.fillStyle = '#fff3d6';
      [[-90, -34], [-30, -46], [36, -40], [92, -26], [0, -24], [-58, -18]].forEach(function (p) {
        ctx.beginPath(); ctx.ellipse(cx + p[0], bottomY + p[1], 7, 3.4, 0.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore(); return 52;
    }
    if (id === 'bun') {
      ctx.fillStyle = c.main; rr(ctx, cx - half, bottomY - 20, w, 20, 8); ctx.fill();
      ctx.fillStyle = c.light; rr(ctx, cx - half, bottomY - 20, w, 7, 4); ctx.fill();
      ctx.restore(); return 21;
    }
    if (id === 'patty') {
      ctx.fillStyle = c.main; rr(ctx, cx - half + 6, bottomY - 20, w - 12, 20, 9); ctx.fill();
      ctx.strokeStyle = c.dark; ctx.lineWidth = 3;
      for (var i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(cx + i * 52 - 12, bottomY - 17); ctx.lineTo(cx + i * 52 + 12, bottomY - 4); ctx.stroke();
      }
      ctx.restore(); return 21;
    }
    if (id === 'cheese') {
      ctx.fillStyle = c.main;
      ctx.fillRect(cx - half - 10, bottomY - 11, w + 20, 9);
      [-120, -40, 44, 118].forEach(function (dx) {
        ctx.beginPath();
        ctx.moveTo(cx + dx - 10, bottomY - 3); ctx.lineTo(cx + dx + 10, bottomY - 3); ctx.lineTo(cx + dx, bottomY + 6);
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = c.light; ctx.fillRect(cx - half - 10, bottomY - 11, w + 20, 3);
      ctx.restore(); return 13;
    }
    if (id === 'lettuce') {
      ctx.fillStyle = c.main;
      ctx.beginPath(); ctx.moveTo(cx - half - 8, bottomY - 6);
      for (var x = -half - 8; x < half + 8; x += 26) ctx.quadraticCurveTo(x + 13, bottomY - 20, x + 26, bottomY - 6);
      ctx.lineTo(cx + half + 8, bottomY); ctx.lineTo(cx - half - 8, bottomY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.light; ctx.fillRect(cx - half - 8, bottomY - 7, w + 16, 3);
      ctx.restore(); return 15;
    }
    if (id === 'tomato') {
      ctx.fillStyle = c.main; rr(ctx, cx - half + 14, bottomY - 15, w - 28, 15, 7); ctx.fill();
      ctx.fillStyle = c.light;
      [-70, 0, 70].forEach(function (dx) { ctx.beginPath(); ctx.arc(cx + dx, bottomY - 7.5, 5.4, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore(); return 16;
    }
    if (id === 'egg') {
      ctx.fillStyle = c.main;
      ctx.beginPath(); ctx.ellipse(cx, bottomY - 8, 118, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.dark; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = ING.egg.yolk;
      ctx.beginPath(); ctx.arc(cx, bottomY - 10, 12.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.arc(cx - 4, bottomY - 14, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return 18;
    }
    if (id === 'bacon') {
      ctx.lineWidth = 8; ctx.lineCap = 'round';
      [-1, 1].forEach(function (s) {
        ctx.strokeStyle = c.main;
        ctx.beginPath(); ctx.moveTo(cx - half + 22, bottomY - 8 + s * 5);
        for (var x = -half + 22; x < half - 22; x += 44) ctx.quadraticCurveTo(x + 11, bottomY - 16 + s * 5, x + 22, bottomY - 8 + s * 5);
        ctx.stroke();
        ctx.strokeStyle = c.light; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(cx - half + 22, bottomY - 9 + s * 5);
        for (var x2 = -half + 22; x2 < half - 22; x2 += 44) ctx.quadraticCurveTo(x2 + 11, bottomY - 17 + s * 5, x2 + 22, bottomY - 9 + s * 5);
        ctx.stroke(); ctx.lineWidth = 8;
      });
      ctx.restore(); return 17;
    }
    // onion
    ctx.fillStyle = c.main; rr(ctx, cx - half + 20, bottomY - 12, w - 40, 12, 6); ctx.fill();
    ctx.strokeStyle = c.dark; ctx.lineWidth = 2;
    [-72, 0, 72].forEach(function (dx) {
      ctx.beginPath(); ctx.arc(cx + dx, bottomY - 6, 8, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + dx, bottomY - 6, 4, Math.PI, 0); ctx.stroke();
    });
    ctx.restore(); return 13;
  }

  // A small recognisable glyph for bench cells and order tickets.
  function drawIcon(ctx, id, cx, cy, s) {
    var c = ING[id];
    ctx.save(); ctx.translate(cx, cy);
    if (id === 'bun') {
      ctx.fillStyle = c.main;
      ctx.beginPath(); ctx.arc(0, 2, s * 0.42, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(-s * 0.42, 2, s * 0.84, s * 0.14);
      ctx.fillStyle = '#fff3d6';
      [[-0.2, -0.16], [0.08, -0.24], [0.26, -0.1]].forEach(function (p) {
        ctx.beginPath(); ctx.ellipse(p[0] * s, p[1] * s, s * 0.055, s * 0.03, 0.5, 0, Math.PI * 2); ctx.fill();
      });
    } else if (id === 'patty') {
      ctx.fillStyle = c.main; rr(ctx, -s * 0.44, -s * 0.13, s * 0.88, s * 0.26, s * 0.1); ctx.fill();
      ctx.strokeStyle = c.dark; ctx.lineWidth = s * 0.045;
      [-0.2, 0, 0.2].forEach(function (p) {
        ctx.beginPath(); ctx.moveTo(p * s - s * 0.07, -s * 0.1); ctx.lineTo(p * s + s * 0.07, s * 0.1); ctx.stroke();
      });
    } else if (id === 'cheese') {
      ctx.fillStyle = c.main;
      ctx.beginPath();
      ctx.moveTo(-s * 0.42, -s * 0.2); ctx.lineTo(s * 0.42, -s * 0.2); ctx.lineTo(s * 0.3, s * 0.22);
      ctx.lineTo(s * 0.05, s * 0.08); ctx.lineTo(-s * 0.18, s * 0.24); ctx.lineTo(-s * 0.3, s * 0.05);
      ctx.closePath(); ctx.fill();
    } else if (id === 'lettuce') {
      ctx.fillStyle = c.main;
      ctx.beginPath(); ctx.moveTo(-s * 0.44, s * 0.05);
      for (var x = -0.44; x < 0.44; x += 0.22) ctx.quadraticCurveTo((x + 0.11) * s, -s * 0.3, (x + 0.22) * s, s * 0.05);
      ctx.lineTo(s * 0.44, s * 0.18); ctx.lineTo(-s * 0.44, s * 0.18); ctx.closePath(); ctx.fill();
    } else if (id === 'tomato') {
      ctx.fillStyle = c.main; ctx.beginPath(); ctx.arc(0, 0, s * 0.36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.light; ctx.beginPath(); ctx.arc(-s * 0.12, -s * 0.1, s * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3d8520'; ctx.fillRect(-s * 0.05, -s * 0.44, s * 0.1, s * 0.1);
    } else if (id === 'egg') {
      ctx.fillStyle = c.main; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.dark; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = c.yolk; ctx.beginPath(); ctx.arc(0, 0, s * 0.17, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'bacon') {
      ctx.lineWidth = s * 0.13; ctx.lineCap = 'round';
      [-0.13, 0.13].forEach(function (o) {
        ctx.strokeStyle = c.main;
        ctx.beginPath(); ctx.moveTo(-s * 0.4, o * s);
        ctx.quadraticCurveTo(-s * 0.13, (o - 0.16) * s, s * 0.13, o * s);
        ctx.quadraticCurveTo(s * 0.27, (o + 0.1) * s, s * 0.4, o * s); ctx.stroke();
      });
    } else { // onion
      ctx.strokeStyle = c.dark; ctx.lineWidth = s * 0.05; ctx.fillStyle = c.main;
      [0.36, 0.24, 0.12].forEach(function (r) {
        ctx.beginPath(); ctx.arc(0, 0, s * r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    }
    ctx.restore();
  }

  function drawStack(ctx, stack, cx, surfaceY) {
    var y = surfaceY;
    for (var i = 0; i < stack.length; i++) {
      y -= drawLayer(ctx, stack[i], cx, y, i === stack.length - 1);
    }
    return y;
  }

  // ---- scene pieces --------------------------------------------------------

  function drawBackground(ctx) {
    ctx.fillStyle = '#f3e2c7'; ctx.fillRect(0, 0, 1280, 800);            // cream wall
    ctx.fillStyle = '#e8cf9f'; ctx.fillRect(0, 60, 1280, 10);            // trim line
    ctx.fillStyle = '#5d3a1a'; ctx.fillRect(0, 600, 1280, 200);          // floor boards
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2;
    for (var x = 80; x < 1280; x += 160) { ctx.beginPath(); ctx.moveTo(x, 604); ctx.lineTo(x - 30, 796); ctx.stroke(); }
    // window with awning, right of the pass
    ctx.fillStyle = '#bfe3ef'; rr(ctx, 1086, 96, 150, 96, 8); ctx.fill();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 5; rr(ctx, 1086, 96, 150, 96, 8); ctx.stroke();
    ctx.fillStyle = '#c0392b';
    for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(1099 + i * 31, 96, 16, 0, Math.PI); ctx.fill(); }
    // hanging lamps
    [420, 700, 980].forEach(function (lx) {
      ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lx, 60); ctx.lineTo(lx, 84); ctx.stroke();
      ctx.fillStyle = '#f7b731';
      ctx.beginPath(); ctx.moveTo(lx - 20, 108); ctx.lineTo(lx + 20, 108); ctx.lineTo(lx + 9, 84); ctx.lineTo(lx - 9, 84); ctx.closePath(); ctx.fill();
    });
    // main counter block (dark wood)
    ctx.fillStyle = '#6f4520'; rr(ctx, 308, 66, 956, 540, 14); ctx.fill();
    ctx.fillStyle = '#7d5026'; rr(ctx, 308, 66, 956, 26, 14); ctx.fill();
    ctx.strokeStyle = '#4a2c10'; ctx.lineWidth = 3; rr(ctx, 308, 66, 956, 540, 14); ctx.stroke();
  }

  function drawTopBar(ctx, S) {
    ctx.fillStyle = '#3a2410'; ctx.fillRect(0, 0, 1280, 60);
    ctx.fillStyle = '#f7b731'; ctx.fillRect(0, 56, 1280, 4);
    text(ctx, 'Sizzle & Serve', 24, 31, 25, '#ffd76a', 'left', true);
    text(ctx, '滋滋小餐馆', 262, 32, 19, '#f3e2c7', 'left', true);
    // shift timer
    var frac = Math.max(0, S.timeLeft / CFG.SHIFT_SECONDS);
    text(ctx, '班次', 560, 20, 13, '#cbb590', 'center', true);
    ctx.fillStyle = '#241708'; rr(ctx, 470, 32, 180, 14, 7); ctx.fill();
    ctx.fillStyle = frac > 0.25 ? '#58b531' : '#e74c3c';
    if (frac > 0) { rr(ctx, 470, 32, 180 * frac, 14, 7); ctx.fill(); }
    text(ctx, Math.ceil(S.timeLeft) + ' 秒', 560, 55 - 16, 15, '#ffffff', 'center', true);
    // score / coins / streak
    text(ctx, '分数 ' + S.score, 830, 31, 21, '#ffffff', 'right', true);
    ctx.fillStyle = '#f7b731'; ctx.beginPath(); ctx.arc(862, 30, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a00'; ctx.font = '700 13px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('¥', 862, 31);
    text(ctx, '' + S.coins, 880, 31, 21, '#ffd76a', 'left', true);
    text(ctx, '连对 ×' + S.streak, 1040, 31, 19, S.streak >= 2 ? '#ff9f43' : '#cbb590', 'right', true);
    text(ctx, '完成 ' + S.served + ' 单', 1256, 31, 17, '#f3e2c7', 'right', true);
  }

  function drawOrders(ctx, S) {
    ctx.fillStyle = '#8a5a2b'; rr(ctx, 8, 68, 288, 724, 12); ctx.fill();
    ctx.fillStyle = '#a06a33'; rr(ctx, 8, 68, 288, 40, 12); ctx.fill();
    text(ctx, '订 单 栏', 152, 89, 19, '#fff3d6', 'center', true);
    text(ctx, '新单会自动进来（最多 3 张）', 152, 130, 13, '#e8cf9f', 'center');
    var L = LAYOUT.ticket;
    for (var i = 0; i < S.orders.length; i++) {
      var o = S.orders[i], y = L.y + 64 + i * (L.h + L.gap);
      var urgent = o.timeLeft <= 12;
      ctx.fillStyle = '#fff8ea'; rr(ctx, L.x, y, L.w, L.h, 10); ctx.fill();
      ctx.strokeStyle = urgent ? '#e74c3c' : '#d9c9a8'; ctx.lineWidth = urgent ? 4 : 2;
      rr(ctx, L.x, y, L.w, L.h, 10); ctx.stroke();
      var r = CFG.RECIPES[o.recipe];
      text(ctx, r.name, L.x + 14, y + 24, 20, '#3a2410', 'left', true);
      ctx.fillStyle = '#f7b731'; ctx.beginPath(); ctx.arc(L.x + L.w - 44, y + 24, 11, 0, Math.PI * 2); ctx.fill();
      text(ctx, '' + r.price, L.x + L.w - 28, y + 25, 16, '#8a5a00', 'left', true);
      // mini stacked burger glyph (the real layer painter, scaled down)
      ctx.save();
      ctx.translate(L.x + 52, y + 152); ctx.scale(0.3, 0.3);
      var gy = 0;
      for (var j = 0; j < r.stack.length; j++) gy -= drawLayer(ctx, r.stack[j], 0, gy, j === r.stack.length - 1);
      ctx.restore();
      // ingredient name list, bottom layer first (1 = the bottom of the stack)
      for (var k = 0; k < r.stack.length; k++) {
        var rowY = y + 54 + k * 19;
        ctx.fillStyle = k % 2 ? '#f3e8d2' : '#fdf3dd'; ctx.fillRect(L.x + 104, rowY - 8, L.w - 118, 17);
        text(ctx, (k + 1) + '. ' + ING[r.stack[k]].name, L.x + 112, rowY + 1, 13.5, '#5d3a1a', 'left');
      }
      // countdown bar
      var f = Math.max(0, o.timeLeft / o.timeMax);
      ctx.fillStyle = '#e5d9bd'; rr(ctx, L.x + 14, y + L.h - 22, L.w - 28, 12, 6); ctx.fill();
      ctx.fillStyle = urgent ? '#e74c3c' : '#58b531';
      if (f > 0) { rr(ctx, L.x + 14, y + L.h - 22, (L.w - 28) * f, 12, 6); ctx.fill(); }
      text(ctx, Math.ceil(o.timeLeft) + 's', L.x + L.w - 14, y + L.h - 33, 13, urgent ? '#e74c3c' : '#8a7a55', 'right', true);
    }
    if (S.orders.length === 0) text(ctx, '暂无订单…', 152, 300, 17, '#e8cf9f', 'center');
  }

  function stageOf(t) { return t < CFG.PATTY_RAW_UNTIL ? 0 : t < CFG.PATTY_BURNT_AT ? 1 : 2; }

  function drawGrill(ctx, S) {
    text(ctx, '烤 架', 330, 78, 15, '#ffd76a', 'left', true);
    LAYOUT.grillSlots.forEach(function (g, i) {
      ctx.fillStyle = '#2b2b30'; rr(ctx, g.x, g.y, g.w, g.h, 12); ctx.fill();
      ctx.strokeStyle = '#101013'; ctx.lineWidth = 3; rr(ctx, g.x, g.y, g.w, g.h, 12); ctx.stroke();
      ctx.strokeStyle = '#45454c'; ctx.lineWidth = 4;
      for (var gx = g.x + 18; gx < g.x + g.w - 8; gx += 22) {
        ctx.beginPath(); ctx.moveTo(gx, g.y + 12); ctx.lineTo(gx, g.y + g.h - 12); ctx.stroke();
      }
      var slot = S.grill[i];
      if (!slot) { text(ctx, '空', g.x + g.w / 2, g.y + g.h / 2, 17, '#6a6a72', 'center'); return; }
      var st = stageOf(slot.t);
      var col = st === 0 ? '#cf7a6d' : st === 1 ? '#7a4a21' : '#17130f';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(g.x + g.w / 2, g.y + 74, 62, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = st === 1 ? '#573311' : 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
      [-26, 0, 26].forEach(function (dx) {
        ctx.beginPath(); ctx.moveTo(g.x + g.w / 2 + dx - 10, g.y + 56); ctx.lineTo(g.x + g.w / 2 + dx + 10, g.y + 92); ctx.stroke();
      });
      // progress ring
      var cx = g.x + g.w - 30, cy = g.y + 30;
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = st === 0 ? '#e0a458' : st === 1 ? '#58b531' : '#e74c3c';
      ctx.beginPath(); ctx.arc(cx, cy, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, slot.t / CFG.PATTY_BURNT_AT)); ctx.stroke();
      var label = st === 0 ? '加热中…' : st === 1 ? '熟了！点一下上盘' : '焦了！点一下扔掉';
      text(ctx, label, g.x + g.w / 2, g.y + g.h - 16, 14.5, st === 1 ? '#8edd6d' : st === 2 ? '#ff8a75' : '#e8cf9f', 'center', true);
    });
    text(ctx, '点牛肉饼先上烤架', 690, 78, 13, '#cbb590', 'right');
  }

  function drawPass(ctx, S) {
    var P = LAYOUT.pass;
    ctx.fillStyle = '#4a2c10'; rr(ctx, P.x, P.y, P.w, P.h, 12); ctx.fill();
    ctx.fillStyle = '#5d3a1a'; rr(ctx, P.x + 6, P.y + 6, P.w - 12, P.h - 12, 9); ctx.fill();
    text(ctx, '出 餐 口', P.x + 18, P.y + 24, 15, '#ffd76a', 'left', true);
    // service bell
    ctx.fillStyle = '#d9d9d9'; ctx.beginPath(); ctx.arc(P.x + P.w - 42, P.y + 30, 13, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7b731'; ctx.beginPath(); ctx.arc(P.x + P.w - 42, P.y + 16, 4, 0, Math.PI * 2); ctx.fill();
    if (S.servedDish) {
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath(); ctx.ellipse(P.x + 120, P.y + 118, 86, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(P.x + 120, P.y + 116); ctx.scale(0.45, 0.45);
      drawStack(ctx, CFG.RECIPES[S.servedDish.recipe].stack, 0, 0);
      ctx.restore();
      text(ctx, CFG.RECIPES[S.servedDish.recipe].name, P.x + 120, P.y + 140, 14, '#f3e2c7', 'center', true);
      ctx.save();
      ctx.translate(P.x + 330, P.y + 74); ctx.rotate(-0.06);
      ctx.fillStyle = '#58b531'; rr(ctx, -120, -30, 240, 60, 12); ctx.fill();
      ctx.strokeStyle = '#3d8520'; ctx.lineWidth = 3; rr(ctx, -120, -30, 240, 60, 12); ctx.stroke();
      text(ctx, 'Ready! 上菜成功', 0, 2, 27, '#ffffff', 'center', true);
      ctx.restore();
    } else {
      text(ctx, '做好的菜会从这里端走', P.x + P.w / 2, P.y + 92, 16, '#8a6f45', 'center');
    }
  }

  function drawPlateArea(ctx, S) {
    var P = LAYOUT.plate;
    text(ctx, '组 装 盘', 330, 262, 15, '#ffd76a', 'left', true);
    text(ctx, S.plate.length ? '已叠 ' + S.plate.length + ' 层' : '点下方食材开始叠', 760, 262, 13, '#cbb590', 'right');
    // plate
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(P.cx, P.surfaceY + 16, P.rx + 8, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath(); ctx.ellipse(P.cx, P.surfaceY + 6, P.rx, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#efe3c8';
    ctx.beginPath(); ctx.ellipse(P.cx, P.surfaceY + 4, P.rx - 34, 21, 0, 0, Math.PI * 2); ctx.fill();
    if (S.plate.length) drawStack(ctx, S.plate, P.cx, P.surfaceY);
    else text(ctx, '空盘', P.cx, P.surfaceY - 30, 16, '#a08b62', 'center');
  }

  function drawControls(ctx, S) {
    var B = LAYOUT.serveBtn;
    ctx.fillStyle = '#58b531'; rr(ctx, B.x, B.y, B.w, B.h, 14); ctx.fill();
    ctx.fillStyle = '#4da128'; rr(ctx, B.x, B.y + B.h - 16, B.w, 16, 8); ctx.fill();
    text(ctx, '上 菜', B.x + B.w / 2, B.y + 38, 32, '#ffffff', 'center', true);
    text(ctx, '空格键 · 盘中菜与订单完全一致才行', B.x + B.w / 2, B.y + 70, 14, '#eaf7e2', 'center');
    var C = LAYOUT.clearBtn;
    ctx.fillStyle = '#8a5a2b'; rr(ctx, C.x, C.y, C.w, C.h, 10); ctx.fill();
    text(ctx, '倒掉重做', C.x + C.w / 2, C.y + C.h / 2 + 1, 18, '#fff3d6', 'center', true);
    var H = LAYOUT.pauseHint;
    ctx.fillStyle = '#4a2c10'; rr(ctx, H.x, H.y, H.w, H.h, 10); ctx.fill();
    text(ctx, S.mode === 'paused' ? '已暂停（按 P 继续）' : '按 P 暂停', H.x + H.w / 2, H.y + H.h / 2 + 1, 16, '#cbb590', 'center', true);
    // message box
    var M = LAYOUT.msgBox;
    ctx.fillStyle = 'rgba(30,18,6,.55)'; rr(ctx, M.x, M.y, M.w, M.h, 10); ctx.fill();
    if (S.message) {
      var col = S.message.kind === 'good' ? '#8edd6d' : S.message.kind === 'bad' ? '#ff8a75' : '#ffd76a';
      text(ctx, S.message.text, M.x + M.w / 2, M.y + 40, 21, col, 'center', true);
      if (S.message.sub) text(ctx, S.message.sub, M.x + M.w / 2, M.y + 76, 15, '#e8cf9f', 'center');
    } else {
      text(ctx, '看订单叠菜：面包坯打底，', M.x + M.w / 2, M.y + 44, 16, '#cbb590', 'center');
      text(ctx, '牛肉饼先上烤架烤熟再上盘。', M.x + M.w / 2, M.y + 72, 16, '#cbb590', 'center');
    }
  }

  function drawBench(ctx, S) {
    ctx.fillStyle = '#5d3a1a'; rr(ctx, 308, 616, 956, 168, 12); ctx.fill();
    text(ctx, '食 材 台', 330, 634, 15, '#ffd76a', 'left', true);
    text(ctx, '点击或按数字键 1–8 取食材', 1244, 634, 13, '#cbb590', 'right');
    LAYOUT.cells.forEach(function (cell, i) {
      var ing = CFG.INGREDIENTS[i];
      ctx.fillStyle = '#fff8ea'; rr(ctx, cell.x, cell.y, cell.w, cell.h, 10); ctx.fill();
      ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 2; rr(ctx, cell.x, cell.y, cell.w, cell.h, 10); ctx.stroke();
      ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(cell.x + 17, cell.y + 17, 11, 0, Math.PI * 2); ctx.fill();
      text(ctx, ing.key, cell.x + 17, cell.y + 18, 14, '#ffffff', 'center', true);
      drawIcon(ctx, ing.id, cell.x + cell.w / 2, cell.y + 52, 74);
      text(ctx, ing.name, cell.x + cell.w / 2, cell.y + 104, 17, '#3a2410', 'center', true);
      if (ing.grill) text(ctx, '先上烤架', cell.x + cell.w / 2, cell.y + 88, 11.5, '#b93224', 'center', true);
    });
  }

  function drawFloaters(ctx, S) {
    S.floaters.forEach(function (f) {
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      text(ctx, f.text, f.x, f.y - f.t * 44, 26, '#ffd76a', 'center', true);
      ctx.restore();
    });
  }

  function panel(ctx, w, h) {
    ctx.fillStyle = 'rgba(24,13,4,.72)'; ctx.fillRect(0, 0, 1280, 800);
    ctx.fillStyle = '#fff8ea'; rr(ctx, 640 - w / 2, 400 - h / 2, w, h, 18); ctx.fill();
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4; rr(ctx, 640 - w / 2, 400 - h / 2, w, h, 18); ctx.stroke();
  }

  function drawTitle(ctx, S) {
    panel(ctx, 760, 470);
    text(ctx, 'Sizzle & Serve', 640, 218, 54, '#b3541e', 'center', true);
    text(ctx, '滋 滋 小 餐 馆', 640, 268, 26, '#5d3a1a', 'center', true);
    text(ctx, '90 秒一个班次：看订单、烤肉饼、按顺序叠好汉堡，准时上菜！', 640, 322, 18, '#5d3a1a', 'center');
    text(ctx, '点食材（或按 1–8）叠菜 · 牛肉饼先上烤架，熟了点一下上盘', 640, 356, 16, '#8a7a55', 'center');
    text(ctx, '空格上菜 · 订单超时会扣分 · 连对有加成', 640, 384, 16, '#8a7a55', 'center');
    var B = LAYOUT.startBtn;
    ctx.fillStyle = '#e74c3c'; rr(ctx, B.x, B.y, B.w, B.h, 16); ctx.fill();
    ctx.fillStyle = '#c0392b'; rr(ctx, B.x, B.y + B.h - 18, B.w, 18, 9); ctx.fill();
    text(ctx, '开 始 营 业', B.x + B.w / 2, B.y + B.h / 2 + 2, 32, '#ffffff', 'center', true);
  }

  function drawOver(ctx, S) {
    panel(ctx, 680, 520);
    text(ctx, '班 次 结 束', 640, 196, 38, '#b3541e', 'center', true);
    text(ctx, S.rating, 640, 252, 30, '#d99413', 'center', true);
    text(ctx, '总 分', 640, 308, 17, '#8a7a55', 'center');
    text(ctx, '' + S.score, 640, 348, 52, '#3a2410', 'center', true);
    text(ctx, '完成订单 ' + S.served + ' 单   ·   超时 ' + S.missed + ' 单   ·   最高连对 ×' + S.maxStreak, 640, 402, 19, '#5d3a1a', 'center');
    text(ctx, '赚到金币 ¥' + S.coins, 640, 438, 19, '#8a5a00', 'center', true);
    var B = LAYOUT.restartBtn;
    ctx.fillStyle = '#58b531'; rr(ctx, B.x, B.y, B.w, B.h, 16); ctx.fill();
    ctx.fillStyle = '#4da128'; rr(ctx, B.x, B.y + B.h - 18, B.w, 18, 9); ctx.fill();
    text(ctx, '再 来 一 班', B.x + B.w / 2, B.y + B.h / 2 + 2, 30, '#ffffff', 'center', true);
  }

  function draw(ctx, S) {
    ctx.clearRect(0, 0, 1280, 800);
    drawBackground(ctx);
    drawOrders(ctx, S);
    drawGrill(ctx, S);
    drawPass(ctx, S);
    drawPlateArea(ctx, S);
    drawControls(ctx, S);
    drawBench(ctx, S);
    drawTopBar(ctx, S);
    drawFloaters(ctx, S);
    if (S.mode === 'title') drawTitle(ctx, S);
    if (S.mode === 'paused') {
      ctx.fillStyle = 'rgba(24,13,4,.6)'; ctx.fillRect(0, 0, 1280, 800);
      text(ctx, '已 暂 停', 640, 380, 44, '#ffd76a', 'center', true);
      text(ctx, '按 P 或点右上角按钮继续', 640, 430, 19, '#f3e2c7', 'center');
    }
    if (S.mode === 'over') drawOver(ctx, S);
  }

  return { draw: draw, LAYOUT: LAYOUT, stageOf: stageOf };
})();
