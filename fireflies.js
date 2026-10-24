(function () {
  "use strict";

  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  document.addEventListener("dragstart", function (e) {
    if (e.target.tagName === "IMG") e.preventDefault();
  });

  var canvas = document.getElementById("fireflies");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fireflies = [];
  var bursts = [];
  var w = 0;
  var h = 0;
  var COUNT = reduceMotion ? 0 : 10;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeFirefly(x, y, burst) {
    var angle = Math.random() * Math.PI * 2;
    var speed = burst ? 0.45 + Math.random() * 0.9 : 0.08 + Math.random() * 0.18;
    return {
      x: x != null ? x : Math.random() * w,
      y: y != null ? y : Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: burst ? 1.1 + Math.random() * 1.4 : 1 + Math.random() * 1.3,
      life: burst ? 1 : 0.4 + Math.random() * 0.5,
      decay: burst ? 0.006 + Math.random() * 0.008 : 0,
      phase: Math.random() * Math.PI * 2,
      blink: 0.25 + Math.random() * 0.45,
      hue: 44 + Math.random() * 22,
    };
  }

  function seed() {
    fireflies = [];
    for (var i = 0; i < COUNT; i++) fireflies.push(makeFirefly());
  }

  function spawnBurst(x, y) {
    if (reduceMotion) return;
    var n = 6 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) bursts.push(makeFirefly(x, y, true));
  }

  function drawGlow(f, alpha) {
    var soft = alpha * 0.7;
    var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
    g.addColorStop(0, "hsla(" + f.hue + ", 90%, 72%, " + soft + ")");
    g.addColorStop(0.4, "hsla(" + f.hue + ", 85%, 58%, " + soft * 0.35 + ")");
    g.addColorStop(1, "hsla(" + f.hue + ", 85%, 50%, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "hsla(" + f.hue + ", 100%, 90%, " + Math.min(0.85, soft * 0.9) + ")";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  function stepFly(f, ambient) {
    f.phase += 0.01 * f.blink;
    var twinkle = ambient
      ? 0.28 + 0.42 * (0.5 + 0.5 * Math.sin(f.phase))
      : f.life * 0.75;

    if (ambient) {
      f.vx += (Math.random() - 0.5) * 0.012;
      f.vy += (Math.random() - 0.5) * 0.012;
      var sp = Math.hypot(f.vx, f.vy);
      if (sp > 0.28) {
        f.vx *= 0.28 / sp;
        f.vy *= 0.28 / sp;
      }
      f.x += f.vx;
      f.y += f.vy;
      if (f.x < -20) f.x = w + 20;
      if (f.x > w + 20) f.x = -20;
      if (f.y < -20) f.y = h + 20;
      if (f.y > h + 20) f.y = -20;
    } else {
      f.vx *= 0.992;
      f.vy *= 0.992;
      f.vy -= 0.004;
      f.x += f.vx;
      f.y += f.vy;
      f.life -= f.decay;
    }

    if (twinkle > 0.02) drawGlow(f, twinkle);
    return ambient || f.life > 0;
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < fireflies.length; i++) stepFly(fireflies[i], true);
    for (var j = bursts.length - 1; j >= 0; j--) {
      if (!stepFly(bursts[j], false)) bursts.splice(j, 1);
    }
    requestAnimationFrame(frame);
  }

  function onPointer(e) {
    var x = e.clientX;
    var y = e.clientY;
    if (e.touches && e.touches[0]) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }
    spawnBurst(x, y);
  }

  resize();
  seed();
  window.addEventListener("resize", resize);
  document.addEventListener("pointerdown", onPointer, { passive: true });

  if (!reduceMotion) requestAnimationFrame(frame);
})();
