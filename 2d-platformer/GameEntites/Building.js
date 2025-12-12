const types = [
    {
        buildingType: 'corporate',
        rows: [8, 20],
        cols: [5, 8],
        lifts: [2, 4],
        stairs: [1, 3],
        specialRooms: [
            { type: 'target', row: 8, col: 4 },
            { type: 'exit', row: 7, col: 0 },
            { type: 'security', row: 2, col: 3 }
        ],
        theme: 'modern glass, bright interiors, minimal debris'
    },
    {
        buildingType: 'residential',
        rows: [5, 12],
        cols: [4, 6],
        lifts: [1, 2],
        stairs: [1, 2],
        specialRooms: [
            { type: 'target', row: 5, col: 3 },
            { type: 'exit', row: 5, col: 0 },
            { type: 'safehouse', row: 3, col: 1 }
        ],
        theme: 'apartments, personal items, cluttered interiors'
    },
    {
        buildingType: 'industrial',
        rows: [6, 15],
        cols: [6, 10],
        lifts: [0, 1],
        stairs: [1, 2],
        specialRooms: [
            { type: 'target', row: 6, col: 7 },
            { type: 'exit', row: 5, col: 0 },
            { type: 'generator', row: 4, col: 2 }
        ],
        theme: 'rundown factory, pipes, steam vents, low visibility'
    },
    {
        buildingType: 'luxury',
        rows: [10, 20],
        cols: [7, 10],
        lifts: [2, 5],
        stairs: [2, 3],
        specialRooms: [
            { type: 'target', row: 10, col: 8 },
            { type: 'exit', row: 9, col: 0 },
            { type: 'vault', row: 5, col: 5 }
        ],
        theme: 'golden decor, expensive furniture, laser security'
    },
    {
        buildingType: 'government',
        rows: [12, 22],
        cols: [6, 9],
        lifts: [2, 4],
        stairs: [2, 4],
        specialRooms: [
            { type: 'target', row: 12, col: 8 },
            { type: 'exit', row: 10, col: 0 },
            { type: 'control', row: 5, col: 4 }
        ],
        theme: 'reinforced walls, secure zones, cameras everywhere'
    },
    {
        buildingType: 'military',
        rows: [8, 18],
        cols: [6, 10],
        lifts: [1, 3],
        stairs: [1, 3],
        specialRooms: [
            { type: 'target', row: 8, col: 8 },
            { type: 'exit', row: 8, col: 0 },
            { type: 'armory', row: 4, col: 3 },
            { type: 'command', row: 2, col: 5 }
        ],
        theme: 'metal floors, flickering lights, armed guards'
    }
];

class Building {
    constructor() {
        this.data = this.generateBuilding(types);
        console.log(this.data)
        this.camera = { x: 0, y: 0, zoom: 3 }; // zoom = number of floors visible
    }

    randRange([min, max]) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateBuilding(types) {
        const type = types[Math.floor(Math.random() * types.length)];
        const rows = this.randRange(type.rows);
        const cols = this.randRange(type.cols);
        const numLifts = this.randRange(type.lifts);
        const numStairs = this.randRange(type.stairs);

        const grid = Array.from({ length: rows + 1 }, () =>
            Array.from({ length: cols + 1 }, () => ".")
        );

        for (let r = 0; r <= rows; r++)
            for (let c = 0; c <= cols; c++)
                grid[r][c] = "R";

        for (let i = 0; i < numLifts; i++) {
            const col = Math.floor(Math.random() * cols) + 1;
            for (let r = 1; r <= rows; r++) grid[r][col] = "L";
        }

        for (let i = 0; i < numStairs; i++) {
            const col = Math.floor(Math.random() * cols) + 1;
            for (let r = 1; r <= rows; r += 2) if (grid[r][col] != "L") grid[r][col] = "S";
        }

        for (let s of type.specialRooms) {
            let row = Math.min(rows, s.row + 1);
            const col = Math.min(cols, s.col + 1);
            if (grid[row][col] == "R") {
                grid[row][col] = s.type[0].toUpperCase();
            } else {
                while (true) {
                    row = row === rows ? 0 : Math.min(rows, row + 1);
                    if (grid[row][col] == "R") {
                        grid[row][col] = s.type[0].toUpperCase();
                        break;
                    }
                }
            }
        }

        return { type: type.buildingType, rows, cols, grid };
    }

    drawLabels(ctx, x, y, label, roomWidth, roomHeight, scale) {
        ctx.font = `${1 * scale}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, x + 3, y + roomHeight * scale - 5);
    }


    draw(ctx, map = this.data.grid, roomWidth = 10, roomHeight = 5) {

        const rows = map.length;
        const cols = map[0].length;

        // Dynamic scaling — only show 3 floors
        // const visibleFloors = parseInt((rows / 9) * this.camera.zoom);
        const visibleFloors = rows;
        const scale = ctx.canvas.height / (visibleFloors * roomHeight);

        const offsetX = 0; // 50
        const offsetY = ctx.canvas.height - 0; //50; // bottom aligned

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = map[r][c];
                if (cell === 0) continue;

                const x = offsetX + c * roomWidth * scale;
                const y = offsetY - (r + 1) * roomHeight * scale;

                // Basic room body
                ctx.fillStyle = cell === 'S' ? '#c8c8c8' : '#e6e6e6';
                if (cell === 'T') ctx.fillStyle = '#c0392b';
                if (cell === 'E') ctx.fillStyle = '#27ae60';

                ctx.fillRect(x, y, roomWidth * scale, roomHeight * scale);

                // Wall outlines
                // ctx.strokeStyle = '#555';
                // ctx.lineWidth = 2;
                // ctx.strokeRect(x, y, roomWidth * scale, roomHeight * scale);

                // Draw walls between rooms
                const right = map[r]?.[c + 1];
                const bottom = map[r + 1]?.[c];

                // console.log("ABC",right, bottom)

                ctx.beginPath();
                // if (!right) {
                if (right != cell) {
                    ctx.moveTo(x + roomWidth * scale, y);
                    ctx.lineTo(x + roomWidth * scale, y + roomHeight * scale);
                }
                ctx.stroke();

                // Optional symbols for stairs/lifts
                if (cell === 'L') {
                    ctx.fillStyle = '#2c3e50';
                    ctx.fillRect(x + roomWidth * scale * 0.4, y, roomWidth * scale * 0.4, roomHeight * scale);
                }
                if (cell === 'T') {
                    ctx.strokeStyle = '#8e44ad';
                    ctx.beginPath();
                    ctx.moveTo(x + 5, y + roomHeight * scale - 5);
                    ctx.lineTo(x + roomWidth * scale - 5, y + 5);
                    ctx.stroke();
                }

                this.drawLabels(ctx, x, y, cell, roomWidth, roomHeight, scale);
            }

            // ✅ Correct bottom line for the row
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const lineY = offsetY - (r + 1) * roomHeight * scale;
            ctx.moveTo(offsetX, lineY);
            ctx.lineTo(offsetX + cols * roomWidth * scale, lineY);
            ctx.stroke();
        }
    }


    moveCamera(dx, dy) {
        this.camera.x += dx;
        this.camera.y += dy;
    }

    setZoom(level) {
        this.camera.zoom = Math.max(2, Math.min(10, level));
        // this.camera.zoom = Math.max(2, level);
    }
}
