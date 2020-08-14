import Constants from './constants/constants';
import Player from './player';

class Game {
  constructor() {
    this.sockets = {};
    this.players = {};
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
    setInterval(this.update.bind(this), 1000 / 60);
  }

  addPlayer(socket, username) {
    this.sockets[socket.id] = socket;

    // Generate a position to start this player at.
    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    this.players[socket.id] = new Player(socket.id, username, x, y);
  }

  removePlayer(socket) {
    delete this.sockets[socket.id];
    delete this.players[socket.id];
  }

  handleInput(socket, dir) {
    if (this.players[socket.id]) {
      this.players[socket.id].setDirection(dir);
    }
  }

  update() {
    // Calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    Object.keys(this.sockets).forEach((playerID) => {
      const player = this.players[playerID];
      const newBullet = player.update(dt);
      if (newBullet) {
        this.bullets.push(newBullet);
      }
    });

    // Check if any players are dead
    Object.keys(this.sockets).forEach((playerID) => {
      const socket = this.sockets[playerID];
      const player = this.players[playerID];
      if (player.hp <= 0) {
        socket.emit(Constants.MSG_TYPES.GAME_OVER);
        this.removePlayer(socket);
      }
    });

    // Send a game update to each player every other time
    if (this.shouldSendUpdate) {
      const leaderboard = this.getLeaderboard();
      Object.keys(this.sockets).forEach((playerID) => {
        const socket = this.sockets[playerID];
        const player = this.players[playerID];
        socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player, leaderboard));
      });
      this.shouldSendUpdate = false;
    } else {
      this.shouldSendUpdate = true;
    }
  }

  // Returns the top 5 players
  getLeaderboard() {
    return Object.values(this.players)
      .sort((p1, p2) => { return p2.score - p1.score; })
      .slice(0, 5)
      .map((p) => { return { username: p.username, score: Math.round(p.score) }; });
  }

  createUpdate(player, leaderboard) {
    const nearbyPlayers = Object.values(this.players).filter(
      (p) => { return p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 2; },
    );

    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      others: nearbyPlayers.map((p) => { return p.serializeForUpdate(); }),
      leaderboard,
    };
  }
}

module.exports = Game;
