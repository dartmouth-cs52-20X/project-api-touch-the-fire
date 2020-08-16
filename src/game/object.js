class Object {
  constructor(id, x, y, dir, speed, move) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = dir;
    this.speed = speed;
    this.move = move;
  }

  update(dt) {
    this.x += dt * this.speed * Math.sin(this.direction) * this.move;
    this.y -= dt * this.speed * Math.cos(this.direction) * this.move;
  }

  distanceTo(object) {
    const dx = this.x - object.x;
    const dy = this.y - object.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // this is fine don't mess for go/stop
  setDirection(dir, move) {
    this.direction = dir;
    this.move = move;
  }

  serializeForUpdate() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      // move: this.move,
    };
  }
}

module.exports = Object;
