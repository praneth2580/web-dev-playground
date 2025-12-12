function interactorClickHandler(e, i, j) {
    const piece = boardState[i][j];
    const isOpponent = checkIsOpponent(piece);
    const clickedMove = moveState[i][j];
    if (piece != null && !isOpponent) {
        calculateMoves(piece, i, j, setMoveState, checkIsOpponent);
        activePiece = {
            piece, i, j
        };
    } else {
        if (clickedMove != null) {

            const _boardState = [...boardState.map(row => [...row.map(cell => cell)])];
            if (_boardState[activePiece.i][activePiece.j] === activePiece.piece) {
                if ((clickedMove === "1") || (clickedMove === "2" && piece === null) || (clickedMove === "3" && piece != null)) {
                    _boardState[i][j] = _boardState[activePiece.i][activePiece.j];
                    _boardState[activePiece.i][activePiece.j] = null;

                    setBoardState(_boardState);
                    activePiece = null;
                    playerTurn = playerTurn === 0 ? 1 : 0;
                    checkIfMoveExistsAndIsCheck();
                    console.log(gameState)
                    clearMoves();
                }
            }

        } else {
            activePiece = null;
            clearMoves();
        }
    }
}

function calculateMoves(piece, i, j, _setMoveState, _checkIsOpponent) {
    const isWhite = piece === piece?.toUpperCase();
    let _moveState = Array.from({ length: boardSize }, (idx) => new Array(boardSize).fill(null));

    switch (piece?.toLowerCase()) {
        case 'k':
            limiterMap(i - 1, j - 1, (i, j) => _moveState[i][j] = "1");
            limiterMap(i - 1, j, (i, j) => _moveState[i][j] = "1");
            limiterMap(i - 1, j + 1, (i, j) => _moveState[i][j] = "1");

            limiterMap(i, j - 1, (i, j) => _moveState[i][j] = "1");
            limiterMap(i, j + 1, (i, j) => _moveState[i][j] = "1");

            limiterMap(i + 1, j - 1, (i, j) => _moveState[i][j] = "1");
            limiterMap(i + 1, j, (i, j) => _moveState[i][j] = "1");
            limiterMap(i + 1, j + 1, (i, j) => _moveState[i][j] = "1");

            _moveState = checkIfIntercepting(_moveState, i, j, _checkIsOpponent);
            _setMoveState(_moveState);
            break;
        case 'q':
            for (let move = 0; move < boardSize; move++) {
                if (move != i) _moveState[move][j] = "1";
                if (move != j) _moveState[i][move] = "1";
                limiterMap(i + move, j + move, (i, j) => _moveState[i][j] = "1");
                limiterMap(i + move, j - move, (i, j) => _moveState[i][j] = "1");
                limiterMap(i - move, j + move, (i, j) => _moveState[i][j] = "1");
                limiterMap(i - move, j - move, (i, j) => _moveState[i][j] = "1");
            }

            _moveState = checkIfIntercepting(_moveState, i, j, _checkIsOpponent);
            _setMoveState(_moveState);
            break;
        case 'r':
            for (let move = 0; move < boardSize; move++) {
                if (move != i) _moveState[move][j] = "1";
                if (move != j) _moveState[i][move] = "1";
            }

            _moveState = checkIfIntercepting(_moveState, i, j, _checkIsOpponent);
            _setMoveState(_moveState);
            break;
        case 'b':
            for (let move = 0; move < boardSize; move++) {
                limiterMap(i + move, j + move, (i, j) => _moveState[i][j] = "1");
                limiterMap(i + move, j - move, (i, j) => _moveState[i][j] = "1");
                limiterMap(i - move, j + move, (i, j) => _moveState[i][j] = "1");
                limiterMap(i - move, j - move, (i, j) => _moveState[i][j] = "1");
            }

            _moveState = checkIfIntercepting(_moveState, i, j, _checkIsOpponent);
            _setMoveState(_moveState);
            break;
        case 'n':
            limiterMap(i + 2, j + 1, (i, j) => _moveState[i][j] = "1");
            limiterMap(i + 2, j - 1, (i, j) => _moveState[i][j] = "1");

            limiterMap(i - 2, j + 1, (i, j) => _moveState[i][j] = "1");
            limiterMap(i - 2, j - 1, (i, j) => _moveState[i][j] = "1");

            limiterMap(i + 1, j + 2, (i, j) => _moveState[i][j] = "1");
            limiterMap(i + 1, j - 2, (i, j) => _moveState[i][j] = "1");

            limiterMap(i - 1, j + 2, (i, j) => _moveState[i][j] = "1");
            limiterMap(i - 1, j - 2, (i, j) => _moveState[i][j] = "1");

            _setMoveState(_moveState);
            break;
        case 'p':
            const move = isWhite ? -1 : 1;

            if (i === boardSize - 2 || i === 1) {
                limiterMap(i + move, j, (i, j) => _moveState[i][j] = "2");
                limiterMap(i + (move * 2), j, (i, j) => _moveState[i][j] = "2");
                limiterMap(i + move, j + move, (i, j) => _moveState[i][j] = "3");
                limiterMap(i + move, j - move, (i, j) => _moveState[i][j] = "3");
            } else {
                limiterMap(i + move, j, (i, j) => _moveState[i][j] = "2");
                limiterMap(i + move, j + move, (i, j) => _moveState[i][j] = "3");
                limiterMap(i + move, j - move, (i, j) => _moveState[i][j] = "3");
            }

            _moveState = checkIfIntercepting(_moveState, i, j, _checkIsOpponent);
            _setMoveState(_moveState);
            break;
        default:
            setMoveState(initalMovePositions);
            break;
    }
}

function checkIfIntercepting(moveBoard, i, j, _checkIsOpponent = checkIsOpponent) {
    let top = true, right = true, bottom = true, left = true;
    let top_left = true, top_right = true, bottom_left = true, bottom_right = true;

    const _moveState = Array.from({ length: boardSize }, () => new Array(boardSize).fill(null));

    for (let move = 1; move < boardSize; move++) {
        // TOP
        if (top && i - move >= 0) {
            const piece = boardState[i - move][j];
            const _move = moveBoard[i - move][j];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i - move][j] = _move;
                top = false;
            }
            if (piece === null && _move != '3') _moveState[i - move][j] = _move;
        }

        // RIGHT
        if (right && j + move < boardSize) {
            const piece = boardState[i][j + move];
            const _move = moveBoard[i][j + move];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i][j + move] = _move;
                right = false;
            }
            if (piece === null && _move != '3') _moveState[i][j + move] = _move;
        }

        // BOTTOM
        if (bottom && i + move < boardSize) {
            const piece = boardState[i + move][j];
            const _move = moveBoard[i + move][j];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i + move][j] = _move;
                bottom = false;
            }
            if (piece === null && _move != '3') _moveState[i + move][j] = _move;
        }

        // LEFT
        if (left && j - move >= 0) {
            const piece = boardState[i][j - move];
            const _move = moveBoard[i][j - move];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i][j - move] = _move;
                left = false;
            }
            if (piece === null && _move != '3') _moveState[i][j - move] = _move;
        }

        // TOP LEFT
        if (top_left && i - move >= 0 && j - move >= 0) {
            const piece = boardState[i - move][j - move];
            const _move = moveBoard[i - move][j - move];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i - move][j - move] = _move;
                top_left = false;
            }
            if (piece === null && _move != '3') _moveState[i - move][j - move] = _move;
        }

        // TOP RIGHT
        if (top_right && i - move >= 0 && j + move < boardSize) {
            const piece = boardState[i - move][j + move];
            const _move = moveBoard[i - move][j + move];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i - move][j + move] = _move;
                top_right = false;
            }
            if (piece === null && _move != '3') _moveState[i - move][j + move] = _move;
        }

        // BOTTOM LEFT
        if (bottom_left && i + move < boardSize && j - move >= 0) {
            const piece = boardState[i + move][j - move];
            const _move = moveBoard[i + move][j - move];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i + move][j - move] = _move;
                bottom_left = false;
            }
            if (piece === null && _move != '3') _moveState[i + move][j - move] = _move;
        }

        // BOTTOM RIGHT
        if (bottom_right && i + move < boardSize && j + move < boardSize) {
            const piece = boardState[i + move][j + move];
            const _move = moveBoard[i + move][j + move];
            const isOpponent = _checkIsOpponent(piece);

            if (piece != null && _move != null) {
                if (isOpponent && _move != "2") _moveState[i + move][j + move] = _move;
                bottom_right = false;
            }
            if (piece === null && _move != '3') _moveState[i + move][j + move] = _move;
        }
    }

    return _moveState;
}

function checkIfInterceptingByCount(moveBoard, i, j, kingRow, kingColumn) {
    const calculated_i = kingRow - i;
    const calculated_j = kingColumn - j;

    if (calculated_i < 0 && calculated_j === 0) { // top
        for (let _i = (i - 1); _i >= 0; _i--) {
            if (moveBoard[_i][j] > 1) return true
        }
    } else if (calculated_i === 0 && calculated_j < 0) { // left
        for (let _j = (j - 1); _j >= 0; _j--) {
            if (moveBoard[i][_j] > 1) return true
        }
    } else if (calculated_i > 0 && calculated_j === 0) { // bottom
        for (let _i = 0; _i < i; _i++) {
            if (moveBoard[_i][j] > 1) return true
        }
    } else if (calculated_i === 0 && calculated_j > 0) { // right
        for (let _j = 0; _j < j; _j++) {
            if (moveBoard[i][_j] > 1) return true
        }
    } else if (calculated_i < 0 && calculated_j < 0) { // top left
        for (let _i = (i - 1), _j = (j - 1); _i >= 0 & _j >= 0; _i--, j--) {
            if (moveBoard[_i][_j] > 1) return true
        }
    } else if (calculated_i < 0 && calculated_j > 0) { // top right
        for (let _i = (i - 1), _j = 0; _i >= 0 & _j < j; _i--, j++) {
            if (moveBoard[_i][_j] > 1) return true
        }
    } else if (calculated_i > 0 && calculated_j < 0) { // bottom left
        for (let _i = 0, _j = (j - 1); _i < i & _j >= 0; _i++ ,j--) {
            if (moveBoard[_i][_j] > 1) return true
        }
    } else if (calculated_i > 0 && calculated_j > 0) { // bottom right
        for (let _i = 0, _j = 0; _i < i & _j < j; _i++ ,j++) {
            if (moveBoard[_i][_j] > 1) return true
        }
    }


    return false;
}

function checkIfMoveExistsAndIsCheck() {
    let doesMovesExists = false
    const kingIndex = boardState.flat().indexOf(playerTurn === 0 ? "K" : 'k');
    const kingRow = parseInt(kingIndex / 8);
    const kingColumn = parseInt(kingIndex % 8);
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const piece = boardState[i][j];
            if (piece === null) continue;
            if (checkIsOpponent(piece) && gameState === 'normal') {
                calculateMoves(piece, i, j, (moves) => {
                    if (moves[kingRow][kingColumn] != null && moves[kingRow][kingColumn] != "2") setGameState('check');
                }, (_piece) => true);   // piece === piece.toUpperCase() ? _piece === _piece?.toLowerCase() : piece === piece?.toUpperCase());
                continue;
            };

            if (!doesMovesExists) {
                calculateMoves(piece, i, j, (moves) => {
                    doesMovesExists = moves.flat().includes("1");
                }, checkIsOpponent);
            }
            if (doesMovesExists && gameState === 'checkmate') return;
        }
    }
    if (!doesMovesExists) setGameState('draw');
}

function checkIfCheckIsCheckmate() {
    const friendlyPieces = [];
    const opponentPiecesGivingCheck = [];
    const kingIndex = boardState.flat().indexOf(playerTurn === 0 ? "K" : 'k');
    const kingRow = parseInt(kingIndex / 8);
    const kingColumn = parseInt(kingIndex % 8);
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const piece = boardState[i][j];
            if (piece === null) continue;
            if (checkIsOpponent(piece)) {
                if (piece.toLowerCase() === 'k') continue;
                calculateMoves(piece, i, j, (moves) => {
                    if (moves[kingRow][kingColumn] != null && moves[kingRow][kingColumn] != "2") {
                        opponentPiecesGivingCheck.push({ piece, moves, mergedMoves: moves, i, j});
                    }
                }, (_piece) => true);
                continue;
            };

            calculateMoves(piece, i, j, (moves) => {
                friendlyPieces.push({piece, moves});
            }, checkIsOpponent);
        }
    }

    console.log(opponentPiecesGivingCheck)
    for (let i = 0; i < opponentPiecesGivingCheck.length; i++) {
        for (let j = 0; j < friendlyPieces.length; j++) {
            opponentPiecesGivingCheck[i].mergedMoves = sumMap(opponentPiecesGivingCheck[i].mergedMoves, friendlyPieces[j].moves);
        }
        const isIntercepting = checkIfInterceptingByCount(opponentPiecesGivingCheck[i].mergedMoves, opponentPiecesGivingCheck[i].i, opponentPiecesGivingCheck[i].j, kingRow, kingColumn);
        console.log(opponentPiecesGivingCheck[i].piece, opponentPiecesGivingCheck[i].i, opponentPiecesGivingCheck[i].j, isIntercepting)
        console.log(opponentPiecesGivingCheck[i].mergedMoves)

        if (isIntercepting) return true;
    }
}