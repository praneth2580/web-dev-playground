let boardState = null;
let moveState = null;
let capturedPieces = [];
let playerTurn = 0; // 0: white, 1: black
let playerScores = [0, 0];
let activePiece = null;
let gameState = 'normal';
let noOfChecks = 0;

let boardStateChangeHandler = () => { };
let moveStateChangeHandler = () => { };

window.addBoardStateChangeListener = (_boardStateChangeHandler) => {
    boardStateChangeHandler = _boardStateChangeHandler;
};
window.addMoveStateChangeListener = (_moveStateChangeHandler) => {
    moveStateChangeHandler = _moveStateChangeHandler;
};

const setBoardState = (new_board) => {
    for (let i = 0; i < new_board.length; i++) {
        for (let j = 0; j < new_board[i].length; j++) {
            if (boardState[i][j] != new_board[i][j]) {
                if (boardState[i][j] != null && new_board[i][j] != null) {
                    capturedPieces.push(boardState[i][j]);
                    playerScores[boardState[i][j] === boardState[i][j].toUpperCase() ? 1 : 0] += piecesScoreMap[boardState[i][j].toLowerCase()];
                    updateScoreBoard();
                }
                boardState[i][j] = new_board[i][j];
                boardStateChangeHandler(new_board[i][j], i, j);
            }
        }
    }
    // console.log("BOARD STATE");
    // console.log(boardState);
}

const setMoveState = (new_move_board) => {
    for (let i = 0; i < new_move_board.length; i++) {
        for (let j = 0; j < new_move_board[i].length; j++) {
            if (moveState[i][j] != new_move_board[i][j]) {
                moveState[i][j] = new_move_board[i][j];
                moveStateChangeHandler(new_move_board[i][j], i, j);
            }
        }
    }
    // console.log("Move STATE");
    // console.log(moveState);
}

const setGameState = (state) => {
    gameState = state;
    // if (noOfChecks >= 3) gameState = 'checkmate';
    switch (gameState) {
        case 'draw':
            showResultPopup("Draw", "Stalemate");
            break;
        case 'check':
            noOfChecks++;
            if (!checkIfCheckIsCheckmate()) setGameState('checkmate');
            // showResultPopup(`${playerTurn === 1 ? 'White' : 'Black'} Wins!`, "Checkmate");
            break;
        case 'checkmate':
            showResultPopup(`${playerTurn === 1 ? 'White' : 'Black'} Wins!`, "Checkmate");
            break;

        default:
            break;
    }
};
