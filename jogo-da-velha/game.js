const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
  [0, 4, 8], [2, 4, 6],             // diagonais
];

let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;
const score = { X: 0, O: 0, draw: 0 };

const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('status');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreDraw = document.getElementById('score-draw');
const btnRestart = document.getElementById('btn-restart');

function setStatus(text, cls = '') {
  statusEl.textContent = text;
  statusEl.className = 'status' + (cls ? ' ' + cls : '');
}

function checkWinner() {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo: [a, b, c] };
    }
  }
  if (board.every(Boolean)) return { winner: null, combo: [] };
  return null;
}

function handleClick(e) {
  const idx = +e.target.dataset.index;
  if (gameOver || board[idx]) return;

  board[idx] = currentPlayer;
  const cell = e.target;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());
  cell.disabled = true;

  const result = checkWinner();

  if (result) {
    gameOver = true;
    cells.forEach(c => (c.disabled = true));

    if (result.winner) {
      result.combo.forEach(i => cells[i].classList.add('winning'));
      score[result.winner]++;
      updateScoreDisplay();
      setStatus(`Jogador ${result.winner} venceu!`, `winner-${result.winner.toLowerCase()}`);
    } else {
      score.draw++;
      updateScoreDisplay();
      setStatus('Empate!', 'draw');
    }
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  setStatus(`Vez do jogador ${currentPlayer}`);
}

function updateScoreDisplay() {
  scoreX.textContent = score.X;
  scoreO.textContent = score.O;
  scoreDraw.textContent = score.draw;
}

function restartGame() {
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;

  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.disabled = false;
  });

  setStatus('Vez do jogador X');
}

cells.forEach(cell => cell.addEventListener('click', handleClick));
btnRestart.addEventListener('click', restartGame);
