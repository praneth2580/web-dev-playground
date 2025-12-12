function createSquare(i, j, squareSize) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.classList.add(`square-${i}-${j}`);
    square.setAttribute('data-label', `${i}-${j}`)
    // square.style.backgroundColor = colors[(i + j) % 2];
    return square;
}

function renderBoard(squareSize) {
    board.innerHTML = "";
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const square = createSquare(i, j, squareSize);
            board.appendChild(square);
        }
    }
}

function createCapturedPiece(_piece, i, j) {

    const type = piecesMap[_piece?.toLowerCase()] || "NA";
    const color = _piece ? (_piece === _piece?.toUpperCase() ? "white" : "black") : "NA";

    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.classList.add(`piece-${type}-${color}`);
    return piece;
}

function createPiece(_piece, i, j) {

    const type = piecesMap[_piece?.toLowerCase()] || "NA";
    const color = _piece ? (_piece === _piece?.toUpperCase() ? "white" : "black") : "NA";

    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.classList.add(`piece-${type}-${color}`);
    piece.id = `p-${i}-${j}`;
    piece.style.color = color;
    // piece.style.width = `${squareSize}px`;
    // piece.style.height = `${squareSize}px`;
    return piece;
}

function renderPiecesInPositions(pieceBoardPosition) {
    pieces.innerHTML = "";
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const piece = createPiece(pieceBoardPosition[i][j], i, j);
            pieces.appendChild(piece);
        }
    }
}

function updatePiece(_piece, i, j) {
    const piece = document.getElementById(`p-${i}-${j}`);
    const type = piecesMap[_piece?.toLowerCase()] || "NA";
    const color = _piece ? (_piece === _piece?.toUpperCase() ? "white" : "black") : "NA";

    piece.classList.remove(...piece.classList);
    piece.classList.add('piece');
    piece.classList.add(`piece-${type}-${color}`);
}

function createMove(i, j) {
    const _move = document.createElement('div');
    _move.classList.add('move');
    _move.id = `m-${i}-${j}`;
    return _move;
}

function renderMoves() {
    moves.innerHTML = "";
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const move = createMove(i, j);
            moves.appendChild(move);
        }
    }
}

function updateMove(_piece, i, j) {
    const move = document.getElementById(`m-${i}-${j}`);
    const isOpponent = checkIsOpponent(_piece);

    move.classList.remove(...move.classList);
    move.classList.add('move');
    if (_piece != null && isOpponent && moveState[i][j] != null) move.classList.add('capture');
    if (_piece === null && moveState[i][j] != null) move.classList.add('active');
}

function clearMoves() {
    setMoveState(Array.from({ length: boardSize }, (idx) => new Array(boardSize).fill(null)));
}

function createInteractorPad(_piece, _move, i, j) {
    const type = piecesMap[_piece?.toLowerCase()] || (_move != null ? "M" : "NA");
    const color = _piece ? (_piece === _piece?.toUpperCase() ? "white" : "black") : "NA";

    const interactorPad = document.createElement('div');
    interactorPad.classList.add('interactor');
    interactorPad.setAttribute('data-type', type);
    interactorPad.setAttribute('data-color', color);
    interactorPad.addEventListener('click', (e) => interactorClickHandler(e, i, j));
    interactorPad.id = `t-${i}-${j}`;
    return interactorPad;
}

function renderInteractorPads() {
    interactors.innerHTML = "";
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const interactorPad = createInteractorPad(boardState[i][j], moveState[i][j], i, j);
            interactors.appendChild(interactorPad);
        }
    }
}

function updateScoreBoard() {
    whiteScoreBoard.innerText = playerScores[0].toString().padStart(Math.max(playerScores[0].toString().length, playerScores[1].toString().length), "0");
    blackScoreBoard.innerText = playerScores[1].toString().padStart(Math.max(playerScores[0].toString().length, playerScores[1].toString().length), "0");

    whiteCapturedPieces.innerHTML = "";
    blackCapturedPieces.innerHTML = "";
    for (let i = 0; i < capturedPieces.length; i++) {
        const element = createCapturedPiece(capturedPieces[i]);
        const container = capturedPieces[i] === capturedPieces[i].toUpperCase() ? whiteCapturedPieces : blackCapturedPieces;

        container.appendChild(element);
    }
}

function showResultPopup(title, subtitle = "") {
    const popup = document.getElementById("result-popup");
    const popupTitle = document.getElementById("popup-title");
    const popupSubtitle = document.getElementById("popup-subtitle");

    popupTitle.textContent = title;
    popupSubtitle.textContent = subtitle;

    popup.classList.remove("hidden");

    // Add optional confetti
    createConfetti();

    document.getElementById("rematch-btn").onclick = () => {
        popup.classList.add("hidden");
        restartGame();
    };

    document.getElementById("next-btn").onclick = () => {
        popup.classList.add("hidden");
        startNextRound();
    };

    document.getElementById("close-btn").onclick = () => {
        popup.classList.add("hidden");
    };
}

function createConfetti() {
    const count = 80;
    for (let i = 0; i < count; i++) {
        const conf = document.createElement("div");
        conf.className = "confetti";
        conf.style.left = Math.random() * 100 + "vw";
        conf.style.animationDelay = Math.random() * 3 + "s";
        conf.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 4000);
    }
}

const style = document.createElement("style");
style.textContent = `
.confetti {
  position: fixed;
  width: 8px;
  height: 8px;
  top: -10px;
  border-radius: 2px;
  animation: confettiFall 3.5s linear forwards;
  z-index: 2000;
}
@keyframes confettiFall {
  to {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
`;
document.head.appendChild(style);
