import { Game } from './Game.js';

const canvas = document.getElementById('gameCanvas');
const overlay = document.getElementById('menuOverlay');
const overlayCard = overlay.querySelector('.overlay-card');

const game = new Game(canvas, {
  score: document.getElementById('score'),
  apples: document.getElementById('apples'),
  bestScore: document.getElementById('bestScore'),
  hearts: document.getElementById('hearts'),
  overlay,
  overlayTitle: overlayCard.querySelector('h2'),
  overlayText: document.getElementById('overlayText'),
  overlayBadge: overlayCard.querySelector('.badge'),
  overlayImage: document.getElementById('overlayImage'),
  startButton: document.getElementById('startButton'),
  overlayRestartButton: document.getElementById('overlayRestartButton'),
  pauseButton: document.getElementById('pauseButton'),
  restartButton: document.getElementById('restartButton')
});

game.start();
