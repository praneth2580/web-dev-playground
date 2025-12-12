// configuration
const boardSize = 8;
const squareSize = 100;

const boardWidth = boardSize * squareSize;
const boardHeight = boardSize * squareSize;

const board = document.querySelector('.board');
const pieces = document.querySelector('.pieces');
const moves = document.querySelector('.moves');

board.style.width = `${boardWidth}px`;
board.style.height = `${boardHeight}px`;

const colors = ['#eeeeee', '#555555'];
const pieceColors = ['white', 'black'];
const pieceTypes = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];
const piecePositions = [
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
];

document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    setupPieces();
    setupMoves();
});

function createSquare(i, j) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.classList.add(`square-${i}-${j}`);
    square.style.backgroundColor = colors[(i + j) % 2];
    square.style.width = `${squareSize}px`;
    square.style.height = `${squareSize}px`;
    return square;
}

function createBoard() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const square = createSquare(i, j);
            board.appendChild(square);
        }
    }
}

function createPiece(type, color, i, j) {
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.classList.add(`piece-${type}-${color}`);
    piece.style.color = color;
    piece.style.width = `${squareSize}px`;
    piece.style.height = `${squareSize}px`;
    return piece;
}

function setupPieces() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const piece = createPiece(piecePositions[i][j], pieceColors[parseInt(i / 4) ], i, j);
            pieces.appendChild(piece);
        }
    }
}

function createMove() {
    const _move = document.createElement('div');
    _move.classList.add('move');
    return _move;
}

function setupMoves() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const move = createMove();
            moves.appendChild(move);
        }
    }
}