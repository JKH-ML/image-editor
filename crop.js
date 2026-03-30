const elements = {
    uploader: document.getElementById('uploader'),
    cropCanvas: document.getElementById('crop-canvas'),
    editorContainer: document.getElementById('editor-container'),
    status: document.getElementById('status'),
    exportBtn: document.getElementById('export-btn'),
    downloadContainer: document.getElementById('download-container'),
    downloadLink: document.getElementById('download-link'),
    dropZone: document.getElementById('drop-zone'),
    themeToggle: document.getElementById('theme-toggle'),
    cropBox: document.getElementById('crop-box'),
    cropOverlay: document.getElementById('crop-overlay'),
    imageWrapper: document.getElementById('image-wrapper'),
    cropX: document.getElementById('crop-x'),
    cropY: document.getElementById('crop-y'),
    cropW: document.getElementById('crop-w'),
    cropH: document.getElementById('crop-h'),
    imageResVal: document.getElementById('image-res-val'),
    resetCropBtn: document.getElementById('reset-crop-btn'),
    preset169: document.getElementById('preset-16-9'),
    preset43: document.getElementById('preset-4-3'),
    preset11: document.getElementById('preset-1-1')
};

let originalImage = null;
let isDragging = false;
let isResizing = false;
let currentHandle = null;
let startX, startY, startLeft, startTop, startWidth, startHeight;

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
            initCrop();
            elements.editorContainer.classList.remove('hidden');
            elements.dropZone.classList.add('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function initCrop() {
    const ctx = elements.cropCanvas.getContext('2d');
    elements.cropCanvas.width = originalImage.width;
    elements.cropCanvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0);
    
    elements.imageResVal.innerText = `${originalImage.width} x ${originalImage.height}`;
    
    resetCrop();
}

function resetCrop() {
    const w = originalImage.width;
    const h = originalImage.height;
    updateCropBox(0, 0, w, h);
}

function updateCropBox(x, y, w, h) {
    // Clamp values
    x = Math.max(0, Math.min(x, originalImage.width - 10));
    y = Math.max(0, Math.min(y, originalImage.height - 10));
    w = Math.max(10, Math.min(w, originalImage.width - x));
    h = Math.max(10, Math.min(h, originalImage.height - y));

    // UI update (percentage based for responsive wrapper)
    const pw = (w / originalImage.width) * 100;
    const ph = (h / originalImage.height) * 100;
    const px = (x / originalImage.width) * 100;
    const py = (y / originalImage.height) * 100;

    elements.cropBox.style.left = px + '%';
    elements.cropBox.style.top = py + '%';
    elements.cropBox.style.width = pw + '%';
    elements.cropBox.style.height = ph + '%';

    // Input update
    elements.cropX.value = Math.round(x);
    elements.cropY.value = Math.round(y);
    elements.cropW.value = Math.round(w);
    elements.cropH.value = Math.round(h);
}

// Interaction
elements.cropBox.onmousedown = (e) => {
    if (e.target.classList.contains('crop-handle')) {
        isResizing = true;
        currentHandle = e.target.classList[1];
    } else {
        isDragging = true;
    }
    startX = e.clientX;
    startY = e.clientY;
    const rect = elements.cropBox.getBoundingClientRect();
    const wrapperRect = elements.imageWrapper.getBoundingClientRect();
    
    startLeft = ((rect.left - wrapperRect.left) / wrapperRect.width) * originalImage.width;
    startTop = ((rect.top - wrapperRect.top) / wrapperRect.height) * originalImage.height;
    startWidth = (rect.width / wrapperRect.width) * originalImage.width;
    startHeight = (rect.height / wrapperRect.height) * originalImage.height;
    
    e.preventDefault();
};

window.onmousemove = (e) => {
    if (!isDragging && !isResizing) return;

    const wrapperRect = elements.imageWrapper.getBoundingClientRect();
    const dx = ((e.clientX - startX) / wrapperRect.width) * originalImage.width;
    const dy = ((e.clientY - startY) / wrapperRect.height) * originalImage.height;

    if (isDragging) {
        updateCropBox(startLeft + dx, startTop + dy, startWidth, startHeight);
    } else if (isResizing) {
        let x = startLeft, y = startTop, w = startWidth, h = startHeight;
        if (currentHandle.includes('n')) { y += dy; h -= dy; }
        if (currentHandle.includes('s')) { h += dy; }
        if (currentHandle.includes('w')) { x += dx; w -= dx; }
        if (currentHandle.includes('e')) { w += dx; }
        updateCropBox(x, y, w, h);
    }
};

window.onmouseup = () => {
    isDragging = false;
    isResizing = false;
};

// Inputs
[elements.cropX, elements.cropY, elements.cropW, elements.cropH].forEach(input => {
    input.oninput = () => {
        updateCropBox(
            parseInt(elements.cropX.value),
            parseInt(elements.cropY.value),
            parseInt(elements.cropW.value),
            parseInt(elements.cropH.value)
        );
    };
});

// Presets
elements.preset169.onclick = () => applyPreset(16/9);
elements.preset43.onclick = () => applyPreset(4/3);
elements.preset11.onclick = () => applyPreset(1);

function applyPreset(ratio) {
    let w = originalImage.width;
    let h = w / ratio;
    if (h > originalImage.height) {
        h = originalImage.height;
        w = h * ratio;
    }
    updateCropBox((originalImage.width - w) / 2, (originalImage.height - h) / 2, w, h);
}

elements.resetCropBtn.onclick = resetCrop;

elements.dropZone.onclick = () => elements.uploader.click();
elements.uploader.onchange = (e) => handleFile(e.target.files[0]);

elements.exportBtn.onclick = () => {
    if (!originalImage) return;
    const x = parseInt(elements.cropX.value);
    const y = parseInt(elements.cropY.value);
    const w = parseInt(elements.cropW.value);
    const h = parseInt(elements.cropH.value);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');
    outCtx.drawImage(originalImage, x, y, w, h, 0, 0, w, h);

    const format = document.querySelector('input[name="format"]:checked').value;
    const mimeType = `image/${format}`;
    const dataUrl = outCanvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : undefined);
    
    elements.downloadLink.href = dataUrl;
    elements.downloadLink.download = `cropped_image.${format === 'jpeg' ? 'jpg' : format}`;
    elements.downloadContainer.classList.remove('hidden');
};
