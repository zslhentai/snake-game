// Pure game rules; the UI and tests use the same implementation.
export const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});
export class SnakeGame {
  constructor(size = 20, random = Math.random) {
    this.size = size;
    this.random = random;
    this.reset();
  }
  reset() {
    const m = Math.floor(this.size / 2);
    this.snake = [
      { x: m, y: m },
      { x: m - 1, y: m },
      { x: m - 2, y: m },
    ];
    this.direction = "right";
    this.queue = [];
    this.score = 0;
    this.state = "ready";
    this.food = this.spawnFood();
  }
  get interval() {
    return Math.max(70, 180 - Math.floor(this.score / 30) * 10);
  }
  get level() {
    return 1 + Math.floor((180 - this.interval) / 10);
  }
  spawnFood() {
    const occupied = new Set(this.snake.map((p) => p.y * this.size + p.x));
    const free = [];
    for (let y = 0; y < this.size; y++)
      for (let x = 0; x < this.size; x++)
        if (!occupied.has(y * this.size + x)) free.push({ x, y });
    return free.length
      ? free[Math.min(free.length - 1, Math.floor(this.random() * free.length))]
      : null;
  }
  turn(next) {
    if (this.state !== "running" || !DIRECTIONS[next] || this.queue.length >= 2)
      return false;
    const previous = this.queue.at(-1) || this.direction;
    const a = DIRECTIONS[previous],
      b = DIRECTIONS[next];
    if (previous === next || (a.x + b.x === 0 && a.y + b.y === 0)) return false;
    this.queue.push(next);
    return true;
  }
  step() {
    if (this.state !== "running") return "idle";
    this.direction = this.queue.shift() || this.direction;
    const d = DIRECTIONS[this.direction],
      head = { x: this.snake[0].x + d.x, y: this.snake[0].y + d.y };
    const eating =
      this.food && head.x === this.food.x && head.y === this.food.y; // The tail vacates its cell unless this move grows the snake.
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= this.size ||
      head.y >= this.size ||
      body.some((p) => p.x === head.x && p.y === head.y)
    ) {
      this.state = "over";
      this.queue = [];
      return "dead";
    }
    this.snake.unshift(head);
    if (!eating) {
      this.snake.pop();
      return "move";
    }
    this.score += 10;
    this.food = this.spawnFood();
    if (!this.food) {
      this.state = "won";
      this.queue = [];
      return "won";
    }
    return "eat";
  }
}
