const getMinSize = (mazeLength) => Math.min(35, ((Math.min(window.innerWidth, window.innerHeight) - 20) / mazeLength));

function createMazeCell(row, column, type, width) {
    try {
        const elem = document.createElement('div');
        elem.classList.add('cell');
        elem.classList.add(`cell-${type}`);
        elem.style.width = `${width}px`
        elem.id = `maze-${row}-${column}`;

        return elem;
    } catch (error) {
        console.log(error)
        return null;
    }
}

function renderMaze(maze) {
    mazeContainer.innerHtml = "";
    mazeContainer.style['grid-template-columns'] = Array.from({ length: maze[0].length }, () => 'auto').join(" ");
    mazeContainer.style['grid-template-rows'] = Array.from({ length: maze.length }, () => 'auto').join(" ");
    const cellWidth = getMinSize(maze[0].length);
    for (let row = 0; row < maze.length; row++) {
        for (let column = 0; column < maze[row].length; column++) {
            const cell = createMazeCell(row, column, maze[row][column], cellWidth);
            mazeContainer.appendChild(cell);
        }        
    }
}

function createAlgorith(title, id, runner) {
    try {        
        const elem = document.createElement('div');
        elem.classList.add('algo-container');
        elem.id = id;
        elem.innerText = title;
        elem.addEventListener('click', (e) => {
            if (e.target.classList.contains('disabled')) return;

            disableAlgorith();

            if (currentAlgo != null || moveInterval != null) {
                currentAlgo = null;
                clearInterval(moveInterval);
                moveInterval = null;
            }

            currentAlgo = new runner(generatedMaze, [generatedMaze.length - 1, generatedMaze.length - 1]);
            moves.value.push([generatedMaze.length - 2, generatedMaze.length - 2]);

            moveInterval = setInterval(() => {
                currentAlgo.nextMove();
            }, nextActionDelay);
        })
        
        return elem;
    } catch (error) {
        console.log(error);
        return null;
    }
}

function renderAlgorithMenu() {
    const keys = Object.keys(algoritms);
    for (let i = 0; i < keys.length; i++) {
        const element = createAlgorith(algoritms[keys[i]].label, keys[i], algoritms[keys[i]].class);
        leftNav.appendChild(element);
    }
}

function disableAlgorith() {
    document.querySelectorAll('.algo-container').forEach(elem => elem.classList.add('disabled'));
}

function enableAlgorith() {
    document.querySelectorAll('.algo-container').forEach(elem => elem.classList.remove('disabled'));
}


function createMove(row, column, width) {
    try {
        const elem = document.createElement('div');
        elem.classList.add('move');
        elem.style.width = `${width}px`
        elem.id = `move-${row}-${column}`;

        return elem;
    } catch (error) {
        console.log(error)
        return null;
    }
}

function updateMove(row, column) {
    const move = document.getElementById(`move-${row}-${column}`);
    move.classList.add('passed');
}

function renderMoveGrid(maze) {
    movementContainer.innerHtml = "";
    movementContainer.style['grid-template-columns'] = Array.from({ length: maze[0].length }, () => 'auto').join(" ");
    movementContainer.style['grid-template-rows'] = Array.from({ length: maze.length }, () => 'auto').join(" ");
    const cellWidth = getMinSize(maze[0].length);
    for (let row = 0; row < maze.length; row++) {
        for (let column = 0; column < maze[row].length; column++) {
            const cell = createMove(row, column, cellWidth);
            movementContainer.appendChild(cell);
        }        
    }
}

function createHistoryRow(idx, direction, type, time) {
    try {
        const elem = document.createElement('tr');

        const idxElem = document.createElement('td');
        idxElem.classList.add('center');
        idxElem.innerText = idx;
        elem.appendChild(idxElem);
        
        const moveElem = document.createElement('td');
        moveElem.innerText = direction.toUpperCase();
        elem.appendChild(moveElem);
        
        const typeElem = document.createElement('td');
        typeElem.innerText = type.toUpperCase();
        console.log(typeElem)
        elem.appendChild(typeElem);
        
        const timeElem = document.createElement('td');
        timeElem.classList.add('center');
        timeElem.innerText = `${time}s`;
        elem.appendChild(timeElem);

        return elem;
    } catch (error) {
        console.log(error)
        return null;
    }
}

function addHistory(history, idx) {
    historyTableBody.appendChild(createHistoryRow(idx, history.direction, history.type, history.time));
}

