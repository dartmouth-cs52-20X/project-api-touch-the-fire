/* eslint-disable no-use-before-define */
import React from 'react';
import Phaser from 'phaser';
import { IonPhaser } from '@ion-phaser/react';
import GameScene from './scenes/gamescene';

const config = {
  type: Phaser.AUTO,
  parent: 'phaser-parent',
  width: '100%',
  height: '100%',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: [GameScene],
};

// eslint-disable-next-line no-unused-vars
const game = new Phaser.Game(config);

const Game = () => {
  return (
    <IonPhaser game={game} />
  );
};

export default Game;
