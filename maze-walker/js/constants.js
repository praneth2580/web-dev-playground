const defaultWidth = 20;
const defaultHeight = 20;
const defaultComplexity = 40;

const nextActionDelay = 3000;

let mazeContainer, movementContainer, leftNav, rightNav, totalTimeEle, noOfTurnsEle, noOfBacktracksEle, scoreEle, historyTableBody;
let currentAlgo = null;
let generatedMaze = null;
const algoritms = {
    v1: {
        label: 'No Backtracking',
        class: NoBackTrack
    },
    v2: { label: 'Path Finding v1', class: () => { } }
}

document.addEventListener('DOMContentLoaded', () => {
    mazeContainer = document.getElementById('maze-container');
    movementContainer = document.getElementById('movement-container');
    leftNav = document.getElementById('algo-nav');
    rightNav = document.getElementById('reslt-nav');
    totalTimeEle = document.getElementById('total-time');
    noOfTurnsEle = document.getElementById('no-of-turns');
    noOfBacktracksEle = document.getElementById('no-of-backtracks');
    scoreEle = document.getElementById('score');
    historyTableBody = document.getElementById('history-table');
})