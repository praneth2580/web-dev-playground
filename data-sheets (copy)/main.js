const toolbarConfig = {
    File: [
        { label: "New" },
        { label: "Save" },
        { label: "Export" },
    ],
    Edit: [
        { label: "Undo" },
        { label: "Redo" },
        { label: "Clear" },
        { label: "Font Size", type: 'input:number', value: 12, suffix: "px" },
        { label: "Font Weight", type: 'dropdown', values: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
    ],
    Format: [
        { label: "Bold", action: () => document.execCommand("bold") },
        { label: "Italic", action: () => document.execCommand("italic") },
        { label: "Underline", action: () => document.execCommand("underline") },
    ],
    View: [
        { label: "🌓 Theme", action: toggleTheme } // using your existing theme toggle
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

