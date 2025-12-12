const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

document.addEventListener('DOMContentLoaded', () => {
    generatedMaze = generateRandomMaze(defaultWidth, defaultHeight, parseInt(defaultComplexity * Math.random()));
    printMaze(generatedMaze)
    renderMaze(generatedMaze);
    renderAlgorithMenu();
    renderMoveGrid(generatedMaze);
})