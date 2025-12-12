const baseCell = {
    value: "",         // The actual text or formula
    bold: false,
    italic: false,
    underline: false,
    fontSize: 12,
    fontFamily: "Arial",
    color: null,
    bgColor: null,
    align: "left",          // left, center, right
    formula: null,          // if it's computed from =A1+B1
    evaluatedValue: "", // result after formula evaluation
    referencedCells: [] // cells where this value has been referenced
}

// grid.js
const Grid = (() => {
    const rows = 40;
    const cols = 20;
    const letters = Array.from({ length: cols }, (_, i) => {
        const idx = i % 26;
        const char_length = (i / 26) + 1;
        const char = String.fromCharCode(65 + idx)

        return Array.from({ length: char_length }, (_, i) => char).join("")
    });

    let table;
    let data = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (baseCell))
    );

    function createGrid() {
        table = document.getElementById("sheet");
        const headerRow = document.createElement('tr');
        const initialCell = document.createElement('th');
        initialCell.innerText = "";
        headerRow.appendChild(initialCell);
        for (let c of letters) {
            const headerCell = document.createElement('th');
            headerCell.innerText = c;
            headerRow.appendChild(headerCell);
        };
        table.appendChild(headerRow)

        for (let r = 0; r < rows; r++) {
            const row = document.createElement("tr");
            const headerCell = document.createElement('th');
            headerCell.innerText = r;
            row.appendChild(headerCell);

            for (let c = 0; c < cols; c++) {
                const cellData = data[r][c];
                const cell = document.createElement("td");
                cell.contentEditable = true;
                cell.textContent = cellData.evaluatedValue || cellData.value;

                // Apply style
                cell.style.fontWeight = cellData.bold ? "bold" : "normal";
                cell.style.fontStyle = cellData.italic ? "italic" : "normal";
                cell.style.textDecoration = cellData.underline ? "underline" : "none";
                cell.style.fontSize = `${cellData.fontSize}px`;
                cell.style.fontFamily = cellData.fontFamily;
                if (cellData.color != null) cell.style.color = cellData.color;
                if (cellData.bgColor != null) cell.style.backgroundColor = cellData.bgColor;
                cell.style.textAlign = cellData.align;

                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        attachListeners();
    }

    function attachListeners() {
        table.querySelectorAll("td[contenteditable=true]").forEach(td => {

            td.addEventListener('focus', (e) => {
                const id = e.target.dataset.cell;
                if (!data[id] || !data[id].includes("|")) return;

                e.target.innerHTML = data[id].split("|")[1];
            })

            td.addEventListener("input", (e) => {
                const id = e.target.dataset.cell;
                data[id] = e.target.innerText;
            });

            td.addEventListener("blur", (e) => {
                const id = e.target.dataset.cell;
                const calcData = Formula.evaluate(e.target.innerHTML, data);

                if (calcData === e.target.innerHTML) return;

                data[id] = `${calcData}|${e.target.innerText}`;
                e.target.innerHTML = calcData;
            });

            td.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur(); // Force blur to trigger your listener
                }
            });
        });
    }

    function getData() { return data; }
    function setData(newData) {
        data = newData;
        Object.entries(newData).forEach(([id, val]) => {
            const td = table.querySelector(`[data-cell="${id}"]`);
            if (td) td.innerText = val;
        });
    }

    return { createGrid, getData, setData };
})();
