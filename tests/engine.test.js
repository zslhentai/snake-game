import test from "node:test";
import assert from "node:assert/strict";
import { SnakeGame } from "../engine.js";
const running = () => {
  const g = new SnakeGame();
  g.state = "running";
  return g;
};
test("eating grows, scores, accelerates and spawns only in free cells", () => {
  const g = running();
  for (let i = 0; i < 3; i++) {
    g.food = { x: g.snake[0].x + 1, y: g.snake[0].y };
    assert.equal(g.step(), "eat");
    assert.ok(!g.snake.some((p) => p.x === g.food.x && p.y === g.food.y));
  }
  assert.equal(g.score, 30);
  assert.equal(g.snake.length, 6);
  assert.equal(g.interval, 170);
  for (let i = 0; i < 1000; i++) {
    const p = g.spawnFood();
    assert.ok(!g.snake.some((s) => s.x === p.x && s.y === p.y));
  }
  g.score = 10000;
  assert.equal(g.interval, 70);
});
test("wall and self collisions end the game", () => {
  const g = running();
  g.snake = [
    { x: 19, y: 2 },
    { x: 18, y: 2 },
  ];
  assert.equal(g.step(), "dead");
  assert.equal(g.state, "over");
  const h = running();
  h.snake = [
    { x: 3, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 4, y: 3 },
    { x: 5, y: 3 },
  ];
  assert.equal(h.step(), "dead");
});
test("moving into vacated tail is valid", () => {
  const g = running();
  g.snake = [
    { x: 3, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 4, y: 3 },
  ];
  g.food = { x: 10, y: 10 };
  assert.equal(g.step(), "move");
});
test("rapid inputs cannot reverse; buffered turns execute on separate ticks", () => {
  const g = running();
  assert.equal(g.turn("left"), false);
  assert.equal(g.turn("up"), true);
  assert.equal(g.turn("down"), false);
  assert.equal(g.turn("left"), true);
  assert.equal(g.turn("down"), false);
  assert.equal(g.step(), "move");
  assert.equal(g.direction, "up");
  assert.equal(g.step(), "move");
  assert.equal(g.direction, "left");
});
test("restart completely clears game state and pause does not move", () => {
  const g = running();
  g.turn("up");
  g.score = 90;
  g.state = "paused";
  const before = JSON.stringify(g.snake);
  assert.equal(g.step(), "idle");
  assert.equal(JSON.stringify(g.snake), before);
  g.reset();
  assert.equal(g.state, "ready");
  assert.equal(g.score, 0);
  assert.equal(g.interval, 180);
  assert.equal(g.direction, "right");
  assert.deepEqual(g.queue, []);
  assert.equal(g.snake.length, 3);
});
test("last free cell spawns and full board wins without infinite loops", () => {
  const g = new SnakeGame(4, () => 0);
  g.snake = [];
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) if (x !== 3 || y !== 0) g.snake.push({ x, y });
  assert.deepEqual(g.spawnFood(), { x: 3, y: 0 });
  g.snake.sort((a, b) =>
    a.x === 2 && a.y === 0 ? -1 : b.x === 2 && b.y === 0 ? 1 : 0,
  );
  g.food = { x: 3, y: 0 };
  g.direction = "right";
  g.state = "running";
  assert.equal(g.step(), "won");
  assert.equal(g.food, null);
});
