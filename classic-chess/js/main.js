let squareSize = getCellWidth(window.innerWidth, window.innerHeight, boardSize);
document.documentElement.style.setProperty('--cell-size', `${squareSize}px`);

const boardWidth = boardSize * squareSize;
const boardHeight = boardSize * squareSize;

// const initalBoardPositions = [
//     ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
//     ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
//     [null, null, null, null, null, null, null, null],
//     [null, null, null, null, null, null, null, null],
//     [null, null, null, null, null, null, null, null],
//     [null, null, null, null, null, null, null, null],
//     ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
//     ['R', 'N', 'B', 'K', 'Q', 'B', 'N', 'R']
// ];
const initalBoardPositions = [
  ['r', 'n', 'b', null, 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', null, 'p', 'p', 'p'],
  [null, null, null, null, 'p', null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, 'P', 'q'], // queen checkmates
  [null, null, null, null, null, 'P', null, null],
  ['P', 'P', 'P', 'P', 'P', null, null, 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const initalMovePositions = [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
];

document.addEventListener('DOMContentLoaded', () => {
    renderBoard(squareSize);
    renderPiecesInPositions(initalBoardPositions);
    boardState = [...initalBoardPositions.map(row => [...row.map(cell => cell)])];
    moveState = initalMovePositions;
    renderMoves();
    renderInteractorPads();

    setTimeout(() => {
        // setBoardState([
        //     ['r', 'k', 'b', 'q', 'k', 'b', 'k', 'r'],
        //     ['p', 'p', 'p', 'p', 'p', null, 'p', 'p'],
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, 'p', null, null],
        //     ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        //     ['R', 'K', 'B', 'Q', 'K', 'B', 'K', 'R']
        // ]);
        // setMoveState([
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, '1', null, null],
        //     [null, null, null, null, null, '1', null, null],
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, null, null, null],
        //     [null, null, null, null, null, null, null, null],
        // ]);
    }, 2000);
});


window.addEventListener('resize', handleResize);
window.addBoardStateChangeListener(handleBoardStateChange);
window.addMoveStateChangeListener(handleMoveStateChange);

const originalLog = console.log;

console.log = function (...args) {
    // Capture the line where console.log was called
    const stackLine = new Error().stack.split("\n")[2].trim();
    
    // Try to extract the variable name from that line
    const match = stackLine.match(/console\.log\(([^)]+)\)/);
    const variableName = match ? match[1].trim() : null;

    for (const arg of args) {
        if (Array.isArray(arg) && Array.isArray(arg[0])) {
            if (variableName) originalLog(`${variableName}:`);
            console.table(arg);
        } else {
            if (variableName && args.length === 1) {
                originalLog(`${variableName}:`, arg);
            } else {
                originalLog.apply(console, args);
            }
        }
    }
};



function handleResize() {
    const width = window.innerWidth;
    console.log('Window width changed:', width);

    //   // keep the board responsive (e.g., always 80% of viewport width, but max 800px)
    //   const newSize = Math.min(width * 0.8, 800);
    //   board.style.width = `${newSize}px`;
    //   board.style.height = `${newSize}px`;

    // update grid square sizes dynamically if needed
    squareSize = getCellWidth(window.innerWidth, window.innerHeight, boardSize);
    renderBoard(boardSize, squareSize);
    renderMoves();
}

function handleBoardStateChange(piece, i, j) {
    updatePiece(piece, i, j);
    renderInteractorPads();
}

function handleMoveStateChange(piece, i, j) {
    updateMove(boardState[i][j], i, j);
    renderInteractorPads();
}

function restartGame() {
    setGameState('normal');
    playerTurn = 0;
    setBoardState(initalBoardPositions);
    clearMoves();
}