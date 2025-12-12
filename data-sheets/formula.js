// formula.js
const Formula = (() => {
    function evaluate(expr, data) {
        if (!expr.startsWith('=')) return expr;

        let body = expr.slice(1);

        // Handle SUM(A1:A5)
        body = body.replace(/SUM\(([^)]+)\)/gi, (match, range) => {
            // if (range.includes("|")) return range.split("|")[0]
            const [start, end] = range.split(':');
            if (!end) return 0;

            const cells = expandRange(start, end);
            const values = cells.map(ref => parseFloat(data[ref]) || 0)
            return values.reduce((a, b) => a + b, 0);
        });

        // Replace A1, B2, etc.
        body = body.replace(/[A-Z]\d+/g, ref => data[ref] || 0);
        if (body.includes("|")) return body.split("|")[0];

        try {
            return Function(`"use strict"; return (${body})`)();
        } catch {
            return '#ERR';
        }
    }

    function expandRange(start, end) {
        const startCol = start[0];
        const startRow = parseInt(start.slice(1));
        const endCol = end[0];
        const endRow = parseInt(end.slice(1));

        const cols = [];
        for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
            for (let r = startRow; r <= endRow; r++) {
                cols.push(String.fromCharCode(c) + r);
            }
        }
        return cols;
    }

    return { evaluate };
})();
