const toolbarConfig = {
    File: [
        {
            label: "New",
            action: () => {
                // Recreate grid fresh
                const table = document.getElementById('sheet');
                if (table) table.innerHTML = '';
                Grid.createGrid();
            }
        },
        {
            label: "Save",
            action: () => {
                try {
                    Storage.save(Grid.getData());
                } catch (e) {
                    alert('Save failed');
                }
            }
        },
        {
            label: "Export",
            action: () => {
                // Export current table as CSV
                const table = document.getElementById('sheet');
                if (!table) return;
                const rows = Array.from(table.querySelectorAll('tr'));
                const csv = rows.map(tr => {
                    const cells = Array.from(tr.querySelectorAll('th,td'));
                    return cells.map(td => {
                        const text = (td.innerText || '').replace(/"/g, '""');
                        return `"${text}"`;
                    }).join(',');
                }).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sheet.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        },
    ],
    Edit: [
        { label: "Undo", action: () => document.execCommand('undo') },
        { label: "Redo", action: () => document.execCommand('redo') },
        {
            label: "Clear",
            action: (cell) => {
                if (cell && cell.isContentEditable) {
                    cell.innerText = '';
                } else {
                    // clear all editable cells
                    document.querySelectorAll('#sheet td[contenteditable="true"]').forEach(td => {
                        td.innerText = '';
                    });
                }
            }
        },
        {
            label: "Font Size",
            type: 'input:number',
            value: 12,
            suffix: "px",
            action: (size, cell) => {
                const target = cell && cell.isContentEditable ? cell : document.activeElement;
                if (target && target.tagName === 'TD' && target.isContentEditable) {
                    target.style.fontSize = `${size}px`;
                }
            }
        },
        {
            label: "Font Weight",
            type: 'dropdown',
            values: [100, 200, 300, 400, 500, 600, 700, 800, 900],
            action: (weight, cell) => {
                const target = cell && cell.isContentEditable ? cell : document.activeElement;
                if (target && target.tagName === 'TD' && target.isContentEditable) {
                    target.style.fontWeight = `${weight}`;
                }
            }
        },
    ],
    Format: [
        {
            label: "Bold",
            action: (cell) => {
                const sel = window.getSelection();
                const hasRange = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
                if (hasRange) {
                    document.execCommand("bold");
                    return;
                }
                const target = cell && cell.isContentEditable ? cell : document.activeElement;
                if (target && target.tagName === 'TD' && target.isContentEditable) {
                    target.style.fontWeight = (target.style.fontWeight === 'bold') ? 'normal' : 'bold';
                } else {
                    document.execCommand("bold");
                }
            }
        },
        {
            label: "Italic",
            action: (cell) => {
                const sel = window.getSelection();
                const hasRange = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
                if (hasRange) {
                    document.execCommand("italic");
                    return;
                }
                const target = cell && cell.isContentEditable ? cell : document.activeElement;
                if (target && target.tagName === 'TD' && target.isContentEditable) {
                    target.style.fontStyle = (target.style.fontStyle === 'italic') ? 'normal' : 'italic';
                } else {
                    document.execCommand("italic");
                }
            }
        },
        {
            label: "Underline",
            action: (cell) => {
                const sel = window.getSelection();
                const hasRange = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
                if (hasRange) {
                    document.execCommand("underline");
                    return;
                }
                const target = cell && cell.isContentEditable ? cell : document.activeElement;
                if (target && target.tagName === 'TD' && target.isContentEditable) {
                    target.style.textDecoration = (target.style.textDecoration === 'underline') ? 'none' : 'underline';
                } else {
                    document.execCommand("underline");
                }
            }
        },
    ],
    View: [
        { label: "🌓 Theme", action: toggleTheme }
    ]
};

// Toggle between light and dark mode
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// main.js
document.addEventListener("DOMContentLoaded", () => {
    Grid.createGrid();
    Toolbar.createToolbar(toolbarConfig);

    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");

    // saveBtn.addEventListener("click", () => Storage.save(Grid.getData()));
    // loadBtn.addEventListener("click", () => Grid.setData(Storage.load()));

    // Apply saved theme on load
    document.addEventListener('DOMContentLoaded', () => {
        const saved = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
    });

    const colorTheme = localStorage.getItem('theme');
    if (colorTheme != 'light') document.documentElement.setAttribute('data-theme', colorTheme);
});

