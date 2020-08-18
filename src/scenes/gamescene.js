import { Scene } from 'phaser';
import io from 'socket.io-client';
import spaceshipred from '../assets/spaceshipred.png';
import money from '../assets/money.png';

class GameScene extends Scene {
  constructor() {
    super({
      key: 'GameScene',
    });
  }

  preload() {
    this.load.image('ship', spaceshipred);
    this.load.image('money', money);
  }

  create() {
    this.socket = io('http://localhost:9090');
    this.socket.on('connect', () => { console.log('socket.io connected'); });
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', (players) => {
      console.log(players);
      Object.keys(players).forEach((id) => {
        if (players[id].playerId === this.socket.id) {
          console.log(players[id]);
          this.addPlayer(players[id]);
        } else {
          this.addOtherPlayers(players[id]);
        }
      });
    });
    this.socket.on('newPlayer', (playerInfo) => {
      this.addOtherPlayers(playerInfo);
    });
    this.socket.on('disconnect', (playerId) => {
      this.otherPlayers.getChildren().forEach((otherPlayer) => {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.socket.on('playerMoved', (playerInfo) => {
      this.otherPlayers.getChildren().forEach((otherPlayer) => {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setRotation(playerInfo.rotation);
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });
    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#008000' });
    this.socket.on('scoreUpdate', (scores) => {
      this.blueScoreText.setText(`Blue: ${scores.blue}`);
      this.redScoreText.setText(`Green: ${scores.red}`);
    });
    this.socket.on('starLocation', (starLocation) => {
      if (this.star) this.star.destroy();
      this.star = this.physics.add.image(starLocation.x, starLocation.y, 'money').setDisplaySize(53, 40);
      this.physics.add.overlap(this.ship, this.star, () => {
        this.socket.emit('starCollected');
      });
    });
  }

  addOtherPlayers = (playerInfo) => {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x0000ff);
    } else {
      otherPlayer.setTint(0x008000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }

  addPlayer = (playerInfo) => {
    this.ship = this.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      this.ship.setTint(0x0000ff);
    } else {
      this.ship.setTint(0x008000);
    }
    this.ship.setDrag(100);
    this.ship.setAngularDrag(100);
    this.ship.setMaxVelocity(200);
  }

  update() {
    if (this.ship) {
      if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-150);
      } else if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(150);
      } else {
        this.ship.setAngularVelocity(0);
      }

      if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
      } else {
        this.ship.setAcceleration(0);
      }
      this.physics.world.wrap(this.ship, 5);
      const { x } = this.ship;
      const { y } = this.ship;
      const r = this.ship.rotation;
      if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
        this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
      }

      // save old position data
      this.ship.oldPosition = {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation,
      };
    }
  }
}

export default GameScene;
