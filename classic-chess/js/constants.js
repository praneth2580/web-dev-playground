const colors = ['#eeeeee', '#555555'];
const piecesMap = {
    r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king', p: 'pawn'
};
const piecesScoreMap = {
    r: 5, n: 3, b: 3, q: 9, k: 9999, p: 1
};
const boardSize = 8;

let board, pieces, moves, interactors, whiteScoreBoard, blackScoreBoard, whiteCapturedPieces, blackCapturedPieces;
document.addEventListener('DOMContentLoaded', () => {
    board = document.querySelector('.board');
    pieces = document.querySelector('.pieces');
    moves = document.querySelector('.moves');
    interactors = document.querySelector('.interactors');
    whiteScoreBoard = document.getElementById('white-score');
    blackScoreBoard = document.getElementById('black-score');
    whiteCapturedPieces = document.getElementById('white-pieces');
    blackCapturedPieces = document.getElementById('black-pieces');
});