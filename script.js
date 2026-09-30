import { SnakeGame, DIRECTIONS } from "./engine.js";
const $ = (id) => document.getElementById(id);
const game = new SnakeGame();
const canvas = $("board"),
  ctx = canvas.getContext("2d");
const overlay = $("overlay"),
  primary = $("primary"),
  pause = $("pause");
const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* Storage may be blocked in private browsing. */
  }
};
let best = Math.max(0, Number(read("snake.best", "0")) || 0),
  sound = read("snake.sound", "false") === "true";
let audio,
  timer = null,
  gesture = null;
const pad = (n) => String(n).padStart(2, "0");
function tone(kind) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.type = "sine";
    const t = audio.currentTime;
    osc.frequency.setValueAtTime(kind === "dead" ? 180 : 520, t);
    osc.frequency.exponentialRampToValueAtTime(
      kind === "dead" ? 50 : 880,
      t + 0.12,
    );
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t);
    osc.stop(t + 0.17);
  } catch {
    /* Audio is optional. */
  }
}
function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* Vibration is optional. */
  }
}
function syncSound() {
  $("sound").setAttribute("aria-pressed", String(sound));
  $("sound").setAttribute("aria-label", sound ? "关闭音效" : "开启音效");
  $("sound").querySelector("span").textContent = sound ? "声音开" : "声音关";
}
function draw() {
  const rect = canvas.getBoundingClientRect(),
    ratio = Math.min(window.devicePixelRatio || 1, 3),
    pixels = Math.round(rect.width * ratio);
  if (canvas.width !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }
  const w = canvas.width,
    cell = w / game.size;
  ctx.clearRect(0, 0, w, w);
  ctx.fillStyle = "#121a15";
  ctx.fillRect(0, 0, w, w);
  ctx.strokeStyle = "#253127";
  ctx.lineWidth = Math.max(1, ratio * 0.5);
  ctx.beginPath();
  for (let i = 1; i < game.size; i++) {
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, w);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(w, i * cell);
  }
  ctx.stroke();
  if (game.food) {
    const p = game.food;
    ctx.shadowColor = "#ffab71";
    ctx.shadowBlur = 12 * ratio;
    ctx.fillStyle = "#ffab71";
    ctx.beginPath();
    ctx.arc(
      (p.x + 0.5) * cell,
      (p.y + 0.5) * cell,
      cell * 0.29,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  game.snake.forEach((p, i) => {
    ctx.fillStyle =
      i === 0 ? "#d7ff98" : `hsl(85 57% ${Math.max(38, 67 - i * 0.8)}%)`;
    ctx.beginPath();
    ctx.roundRect(
      p.x * cell + cell * 0.09,
      p.y * cell + cell * 0.09,
      cell * 0.82,
      cell * 0.82,
      cell * 0.18,
    );
    ctx.fill();
  });
  const head = game.snake[0],
    d = DIRECTIONS[game.direction],
    side = { x: -d.y, y: d.x };
  ctx.fillStyle = "#223014";
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(
      (head.x + 0.5 + d.x * 0.19 + side.x * 0.19 * sign) * cell,
      (head.y + 0.5 + d.y * 0.19 + side.y * 0.19 * sign) * cell,
      cell * 0.065,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}
function hud() {
  $("score").textContent = pad(game.score);
  $("best").textContent = pad(best);
  $("level").textContent = pad(game.level);
  const running = game.state === "running";
  pause.disabled = !running && game.state !== "paused";
  pause.querySelector("span").textContent =
    game.state === "paused" ? "继续" : "暂停";
  pause.setAttribute(
    "aria-label",
    game.state === "paused" ? "继续游戏" : "暂停游戏",
  );
  $("status").textContent = {
    ready: "准备就绪",
    running: "游戏进行中",
    paused: "已暂停",
    over: "游戏结束",
    won: "棋盘已完成",
  }[game.state];
  $("status-light").classList.toggle("active", running);
}
function showScreen() {
  const state = game.state;
  overlay.hidden = state === "running";
  if (state === "running") return;
  const data = {
    ready: [
      "ONE MORE BITE",
      "再吃一口。",
      "滑动指尖，接住每一次挑战。",
      "开始游戏",
      "吃到食物 +10 · 别撞到边界和自己",
    ],
    paused: [
      "TAKE A BREATH",
      "休息一下。",
      "你的下一口，等你回来。",
      "继续游戏",
      "空格键或轻触按钮继续",
    ],
    over: [
      "ANOTHER ROUND?",
      "差一点，再来。",
      `本局 ${game.score} 分 · 最高 ${best} 分`,
      "再玩一局",
      "每一局，都是新的可能。",
    ],
    won: [
      "PERFECT RUN",
      "整个棋盘都是你。",
      `本局 ${game.score} 分 · 完美通关！`,
      "再玩一局",
      "把这场胜利留在你的纪录里。",
    ],
  }[state];
  $("eyebrow").textContent = data[0];
  $("overlay-title").textContent = data[1];
  $("overlay-description").textContent = data[2];
  primary.innerHTML = `${data[3]} <span>↗</span>`;
  $("overlay-hint").textContent = data[4];
  $("announcement").textContent = `${data[1]} ${data[2]}`;
}
function stop() {
  clearTimeout(timer);
  timer = null;
}
function schedule() {
  stop();
  if (game.state === "running") timer = setTimeout(tick, game.interval);
}
function tick() {
  const event = game.step();
  if (event === "eat" || event === "won") {
    if (game.score > best) {
      best = game.score;
      save("snake.best", best);
    }
    tone("eat");
    vibrate(12);
  }
  if (event === "dead") {
    tone("dead");
    vibrate([25, 30, 25]);
  }
  hud();
  draw();
  if (game.state === "running") schedule();
  else {
    stop();
    showScreen();
  }
}
function start() {
  stop();
  game.reset();
  gesture = null;
  game.state = "running";
  hud();
  showScreen();
  draw();
  schedule();
}
function togglePause() {
  if (game.state === "running") {
    stop();
    game.state = "paused";
    gesture = null;
  } else if (game.state === "paused") {
    game.state = "running";
    schedule();
  } else return;
  hud();
  showScreen();
}
primary.addEventListener("click", () => {
  if (game.state === "paused") togglePause();
  else start();
});
pause.addEventListener("click", togglePause);
$("restart").addEventListener("click", start);
$("sound").addEventListener("click", () => {
  sound = !sound;
  save("snake.sound", sound);
  syncSound();
  if (sound) tone("eat");
});
const keys = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const direction = keys[e.key] || keys[e.key.toLowerCase()];
  if (direction) {
    e.preventDefault();
    game.turn(direction);
  } else if (
    e.code === "Space" &&
    !["BUTTON", "A"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    if (e.repeat) return;
    if (game.state === "ready" || game.state === "over" || game.state === "won")
      start();
    else togglePause();
  } else if (e.key === "Escape" && game.state === "running") togglePause();
});
document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    game.turn(button.dataset.direction);
  });
  button.addEventListener("click", (e) => {
    if (e.detail === 0) game.turn(button.dataset.direction);
  });
});
canvas.addEventListener("pointerdown", (e) => {
  if (
    game.state !== "running" ||
    (e.pointerType === "mouse" && e.button !== 0) ||
    gesture
  )
    return;
  e.preventDefault();
  gesture = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!gesture || gesture.id !== e.pointerId) return;
  e.preventDefault();
  const dx = e.clientX - gesture.x,
    dy = e.clientY - gesture.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  game.turn(
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? "right"
        : "left"
      : dy > 0
        ? "down"
        : "up",
  ); // Re-anchor: multiple deliberate swipes work without lifting a finger.
  gesture.x = e.clientX;
  gesture.y = e.clientY;
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(type, (e) => {
    if (gesture?.id === e.pointerId) gesture = null;
  });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "running") togglePause();
});
window.addEventListener("blur", () => {
  if (game.state === "running") togglePause();
});
new ResizeObserver(draw).observe($("board-wrap"));
syncSound();
hud();
showScreen();
draw();
