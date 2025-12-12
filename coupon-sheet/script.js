const canvas = document.getElementById('coupon-sheet-preview');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('coupon-sheet-image');
const uploadBtn = document.getElementById('coupon-sheet-image-btn');

// Inputs
const dataMethodSelect = document.getElementById('coupon-data-method');
const methodSequential = document.getElementById('method-sequential');
const methodCsv = document.getElementById('method-csv');

const prefixInput = document.getElementById('coupon-serial-prefix');
const suffixInput = document.getElementById('coupon-serial-suffix');
const startSerialInput = document.getElementById('coupon-serial-start');
const endSerialInput = document.getElementById('coupon-serial-end');
const csvDataInput = document.getElementById('coupon-csv-data');

const rowsInput = document.getElementById('coupon-grid-row');
const colsInput = document.getElementById('coupon-grid-column');
const downloadBtn = document.getElementById('download-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const paperSizeInput = document.getElementById('paper-size');
const paperMarginInput = document.getElementById('paper-margin');
const orientationInput = document.getElementById('paper-orientation');
const serialXInput = document.getElementById('coupon-serial-position-x');
const serialYInput = document.getElementById('coupon-serial-position-y');
const fontSizeInput = document.getElementById('coupon-font-size');
const fontWeightInput = document.getElementById('coupon-font-weight');
const fontFamilyInput = document.getElementById('coupon-font-family');
const textColorInput = document.getElementById('coupon-text-color');
const bgColorInput = document.getElementById('coupon-bg-color');
const bgTransparentInput = document.getElementById('coupon-bg-transparent');

let uploadedImage = null;

// Paper Sizes in mm (width x height)
const PAPER_SIZES = {
    a3: { width: 297, height: 420 },
    a4: { width: 210, height: 297 },
    a5: { width: 148, height: 210 },
    letter: { width: 215.9, height: 279.4 }
};

const DPI = 300;
const MM_TO_INCH = 0.0393701;

function getCanvasDimensions() {
    const size = PAPER_SIZES[paperSizeInput.value] || PAPER_SIZES.a4;
    const isPortrait = orientationInput.value === 'portrait';

    const widthMM = isPortrait ? size.width : size.height;
    const heightMM = isPortrait ? size.height : size.width;

    return {
        width: Math.floor(widthMM * MM_TO_INCH * DPI),
        height: Math.floor(heightMM * MM_TO_INCH * DPI),
        widthMM,
        heightMM
    };
}

// Data Helper Functions
function getCsvList() {
    if (!csvDataInput.value.trim()) return [];
    return csvDataInput.value.trim().split('\n').map(s => s.trim()).filter(s => s !== '');
}

function getTotalItems() {
    if (dataMethodSelect.value === 'csv') {
        return getCsvList().length;
    } else {
        const start = parseInt(startSerialInput.value) || 1;
        // If end is blank, default to at least 1 page worth (rows * cols) if just previewing,
        // or just 1 item if we need a safe fallback.
        // For drawing, we behave 'infinite' if no end is set, but for export we need a limit.
        const itemsPerPage = (parseInt(rowsInput.value) || 1) * (parseInt(colsInput.value) || 1);
        if (!endSerialInput.value) {
            return itemsPerPage; // Default to 1 page for preview
        }
        const end = parseInt(endSerialInput.value);
        return Math.max(0, end - start + 1);
    }
}

function getCouponText(globalIndex) {
    if (dataMethodSelect.value === 'csv') {
        const list = getCsvList();
        return list[globalIndex] || '';
    } else {
        const start = parseInt(startSerialInput.value) || 1;
        const currentNum = start + globalIndex;
        const prefix = prefixInput.value || '';
        const suffix = suffixInput.value || '';
        return `${prefix}${currentNum}${suffix}`;
    }
}

// Initialize
function initCanvas() {
    draw();

    if (!uploadedImage) {
        const { width, height } = getCanvasDimensions();
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 80px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Select Image & Settings', canvas.width / 2, canvas.height / 2);
    }
}

// Handle Image Upload
uploadBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                uploadedImage = img;
                draw();
                uploadBtn.innerHTML = `✅ ${file.name}`;
                uploadBtn.style.borderColor = 'var(--accent)';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Toggle Data Methods
dataMethodSelect.addEventListener('change', () => {
    if (dataMethodSelect.value === 'csv') {
        methodSequential.classList.add('hidden');
        methodCsv.classList.remove('hidden');
    } else {
        methodSequential.classList.remove('hidden');
        methodCsv.classList.add('hidden');
    }
    draw();
});

// Event Listeners for inputs
const allInputs = [
    startSerialInput, endSerialInput, prefixInput, suffixInput, csvDataInput,
    rowsInput, colsInput, paperSizeInput, orientationInput, paperMarginInput,
    serialXInput, serialYInput, fontFamilyInput, fontSizeInput, fontWeightInput,
    textColorInput, bgColorInput, bgTransparentInput
];

allInputs.forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
        draw();
    });
});

/**
 * Draws a single page of coupons starting from specific global index
 * @param {number} startGlobalIndex - Simply the index (0, 1, 2...) of the first item on this page
 */
function drawPage(startGlobalIndex) {
    const { width, height } = getCanvasDimensions();

    // Resize canvas if needed
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    // Background (White for Paper)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // High Quality Smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (!uploadedImage) return;

    // Grid Specs
    const rows = parseInt(rowsInput.value) || 1;
    const cols = parseInt(colsInput.value) || 1;
    const itemsPerPage = rows * cols;

    const margin = Math.floor(parseInt(paperMarginInput.value || 0) * MM_TO_INCH * DPI);
    const gridWidth = canvas.width - (margin * 2);
    const gridHeight = canvas.height - (margin * 2);

    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;

    const totalAvailable = getTotalItems();

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            const indexOnPage = (r * cols) + c;
            const currentGlobalIndex = startGlobalIndex + indexOnPage;

            // Stop if we have run out of items to print
            if (currentGlobalIndex >= totalAvailable) continue;

            // Get Text
            const text = getCouponText(currentGlobalIndex);

            const x = margin + (c * cellWidth);
            const y = margin + (r * cellHeight);

            // Save context for clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, cellWidth, cellHeight);
            ctx.clip();

            // Draw Image (Stretch)
            ctx.drawImage(uploadedImage, x, y, cellWidth, cellHeight);
            ctx.restore();

            // Draw Dashed Border
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([15, 15]);
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            ctx.setLineDash([]);

            // Draw Serial Number / Text
            const fontSize = parseInt(fontSizeInput.value) || 24;
            const fontFamily = fontFamilyInput ? fontFamilyInput.value : 'Arial';
            const fontWeight = fontWeightInput.value;

            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            const textMetrics = ctx.measureText(text);
            const textW = textMetrics.width;
            const padding = fontSize * 0.5;

            // Calculate Position
            const offsetX = parseInt(serialXInput.value) || 0;
            const offsetY = parseInt(serialYInput.value) || 0;

            const textX = offsetX + x + (cellWidth / 2);
            const textY = offsetY + y + cellHeight - (cellHeight * 0.1);

            // Background for text
            if (!bgTransparentInput.checked) {
                ctx.fillStyle = bgColorInput.value;
                ctx.fillRect(
                    textX - (textW / 2) - (padding / 2),
                    textY - fontSize,
                    textW + padding,
                    fontSize + (padding / 2)
                );
            }

            // Text
            ctx.fillStyle = textColorInput.value;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, textX, textY);
        }
    }
}

// Draw Preview (Page 1 -> Index 0)
function draw() {
    drawPage(0);
}

// --- Export Logic ---

async function getPagesData(format = 'image/png', quality = 1.0) {
    if (!uploadedImage) {
        alert("Please upload an image first!");
        return [];
    }

    const rows = parseInt(rowsInput.value) || 1;
    const cols = parseInt(colsInput.value) || 1;
    const itemsPerPage = rows * cols;
    const totalItems = getTotalItems();

    if (totalItems === 0) {
        alert("No data generated. Check your start/end numbers or CSV data.");
        return [];
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pages = [];

    const originalBtnText = downloadBtn.innerText;
    // Update button text based on what triggered it is hard without passing ref, 
    // but we can just use a generic loading state on body or generic logic.
    // For simplicity, we won't toggle specific button text here to avoid complexity.
    document.body.style.cursor = 'wait';

    for (let i = 0; i < totalPages; i++) {
        const startGlobalIndex = i * itemsPerPage;

        // Draw this page to canvas
        drawPage(startGlobalIndex);

        // Get Data URL
        // Naming logic:
        const firstItem = getCouponText(startGlobalIndex).replace(/[^a-z0-9]/gi, '_');
        const lastItemIndex = Math.min(startGlobalIndex + itemsPerPage - 1, totalItems - 1);
        const lastItem = getCouponText(lastItemIndex).replace(/[^a-z0-9]/gi, '_');

        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        pages.push({
            name: `coupons_${firstItem}_to_${lastItem}.${ext}`,
            data: canvas.toDataURL(format, quality)
        });

        // Small delay to allow UI update if needed
        await new Promise(r => setTimeout(r, 10));
    }

    // Reset Preview to page 1
    drawPage(0);
    document.body.style.cursor = 'default';

    return pages;
}

// Download Images (ZIP or PNG)
if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        downloadBtn.innerText = "Generating...";
        // Use PNG for distinct images (Lossless)
        const pages = await getPagesData('image/png');
        downloadBtn.innerText = "Images (zip)";

        if (pages.length === 0) return;

        if (pages.length === 1) {
            // Single file download
            saveAs(pages[0].data, pages[0].name);
        } else {
            // Zip download
            const zip = new JSZip();
            pages.forEach(p => {
                const base64Data = p.data.replace(/^data:image\/(png|jpeg);base64,/, "");
                zip.file(p.name, base64Data, { base64: true });
            });

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "sales_coupon_bundle.zip");
        }
    });
}

// Download PDF
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async () => {
        const qualityMode = document.getElementById('pdf-quality').value;
        const isStandard = qualityMode === 'standard';

        // Config based on selection
        const imgFormat = isStandard ? 'image/jpeg' : 'image/png';
        const imgQuality = isStandard ? 0.8 : 1.0;
        const pdfFormat = isStandard ? 'JPEG' : 'PNG';
        const pdfCompress = isStandard ? 'FAST' : 'NONE';

        downloadPdfBtn.innerText = "Generating...";

        const pages = await getPagesData(imgFormat, imgQuality);
        downloadPdfBtn.innerText = "PDF ⤓";

        if (pages.length === 0) return;

        const { jsPDF } = window.jspdf;
        const orientation = orientationInput.value;
        const format = paperSizeInput.value;

        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: format,
            compress: true
        });

        const { widthMM, heightMM } = getCanvasDimensions();

        pages.forEach((page, index) => {
            if (index > 0) doc.addPage();
            doc.addImage(page.data, pdfFormat, 0, 0, widthMM, heightMM, undefined, pdfCompress);
        });

        doc.save(`coupon_sheets_${qualityMode}.pdf`);
    });
}

// Start
initCanvas();
