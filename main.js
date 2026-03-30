const elements = {
    uploader: document.getElementById('uploader'),
    mainCanvas: document.getElementById('main-canvas'),
    editorContainer: document.getElementById('editor-container'),
    status: document.getElementById('status'),
    exportBtn: document.getElementById('export-btn'),
    downloadContainer: document.getElementById('download-container'),
    downloadLink: document.getElementById('download-link'),
    dropZone: document.getElementById('drop-zone'),
    themeToggle: document.getElementById('theme-toggle'),
    rotateBtn: document.getElementById('rotate-btn'),
    flipHBtn: document.getElementById('flip-h-btn'),
    flipVBtn: document.getElementById('flip-v-btn'),
    // Filters
    brightness: document.getElementById('brightness'),
    contrast: document.getElementById('contrast'),
    saturation: document.getElementById('saturation'),
    blur: document.getElementById('blur'),
    resetFilters: document.getElementById('reset-filters')
};

let originalImage = null;
let rotation = 0;
let flipH = false;
let flipV = false;

// Theme Initialization
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

elements.themeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            resetEditor();
            elements.editorContainer.classList.remove('hidden');
            elements.dropZone.classList.add('hidden');
            applyFilters();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function resetEditor() {
    rotation = 0;
    flipH = false;
    flipV = false;
    elements.brightness.value = 100;
    elements.contrast.value = 100;
    elements.saturation.value = 100;
    elements.blur.value = 0;
}

function applyFilters() {
    if (!originalImage) return;

    const ctx = elements.mainCanvas.getContext('2d');
    
    // Calculate dimensions based on rotation
    let width = originalImage.width;
    let height = originalImage.height;
    if (rotation % 180 !== 0) {
        width = originalImage.height;
        height = originalImage.width;
    }

    elements.mainCanvas.width = width;
    elements.mainCanvas.height = height;

    // Apply CSS-like filters to context
    ctx.filter = `
        brightness(${elements.brightness.value}%)
        contrast(${elements.contrast.value}%)
        saturate(${elements.saturation.value}%)
        blur(${elements.blur.value}px)
    `;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
    ctx.restore();
}

// Event Listeners
elements.brightness.oninput = applyFilters;
elements.contrast.oninput = applyFilters;
elements.saturation.oninput = applyFilters;
elements.blur.oninput = applyFilters;

elements.resetFilters.onclick = () => {
    elements.brightness.value = 100;
    elements.contrast.value = 100;
    elements.saturation.value = 100;
    elements.blur.value = 0;
    applyFilters();
};

elements.rotateBtn.onclick = () => {
    rotation = (rotation + 90) % 360;
    applyFilters();
};

elements.flipHBtn.onclick = () => {
    flipH = !flipH;
    applyFilters();
};

elements.flipVBtn.onclick = () => {
    flipV = !flipV;
    applyFilters();
};

elements.dropZone.onclick = () => elements.uploader.click();
elements.uploader.onchange = (e) => handleFile(e.target.files[0]);

elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
};

elements.exportBtn.onclick = () => {
    if (!originalImage) return;
    const format = document.querySelector('input[name="format"]:checked').value;
    const mimeType = `image/${format}`;
    const quality = format === 'jpeg' ? 0.9 : undefined;
    
    const dataUrl = elements.mainCanvas.toDataURL(mimeType, quality);
    elements.downloadLink.href = dataUrl;
    elements.downloadLink.download = `edited_image.${format === 'jpeg' ? 'jpg' : format}`;
    elements.downloadContainer.classList.remove('hidden');
};
