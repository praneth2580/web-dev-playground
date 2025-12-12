class NoBackTrack {
    
    constructor(maze, startPoint) {
        this.maze = maze;
        this.width = maze[0].length;
        this.height = maze.length;
        this.startPoint = startPoint;
        this.currentPoint = startPoint;
        this.history = [startPoint];
    }

    nextMove() {
        if (this.isTop() && this.currentPoint[0] != 0) this.currentPoint 
    }

    move(row, column) {
        this.currentPoint = [this.currentPoint[0] + row, this.currentPoint[1] + column];
        updateMove(this.currentPoint);
    }

    isTop = () => this.maze[limiter(this.currentPoint[0] - 1, this.height)][this.currentPoint[1]] != 'W';
    isBottom = () => this.maze[limiter(this.currentPoint[0] + 1, this.height)][this.currentPoint[1]] != 'W';
    isLeft = () => this.maze[this.currentPoint[0]][limiter(this.currentPoint[1] - 1, this.width)] != 'W';
    isRight = () => this.maze[this.currentPoint[0]][limiter(this.currentPoint[1] + 1, this.width)] != 'W';
}