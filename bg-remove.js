const elements = {
    uploader: document.getElementById('uploader'),
    bgCanvas: document.getElementById('bg-canvas'),
    editorContainer: document.getElementById('editor-container'),
    status: document.getElementById('status'),
    bgRemoveBtn: document.getElementById('bg-remove-btn'),
    downloadContainer: document.getElementById('download-container'),
    downloadLink: document.getElementById('download-link'),
    dropZone: document.getElementById('drop-zone'),
    themeToggle: document.getElementById('theme-toggle'),
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent')
};

let originalImage = null;
let selfieSegmentation = null;

// Theme Initialization
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

elements.themeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

/**
 * Initialize MediaPipe Selfie Segmentation (Top tier quality)
 */
async function initAI() {
    if (selfieSegmentation) return;
    
    elements.status.innerText = "Initializing High-Quality AI...";
    
    selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }
    });

    selfieSegmentation.setOptions({
        modelSelection: 1, // 0 for general, 1 for landscape (better edges)
    });

    selfieSegmentation.onResults(onResults);
    
    elements.status.innerText = "AI Engine Ready";
    elements.status.style.color = "#059669";
    elements.bgRemoveBtn.disabled = false;
}

// Start AI init
initAI();

function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            elements.editorContainer.classList.remove('hidden');
            elements.dropZone.classList.add('hidden');
            drawToCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function drawToCanvas() {
    if (!originalImage) return;
    const ctx = elements.bgCanvas.getContext('2d');
    elements.bgCanvas.width = originalImage.width;
    elements.bgCanvas.height = originalImage.height;
    ctx.drawImage(originalImage, 0, 0);
}

elements.bgRemoveBtn.onclick = async () => {
    if (!originalImage || !selfieSegmentation) return;

    elements.bgRemoveBtn.disabled = true;
    elements.progressContainer.classList.remove('hidden');
    elements.progressText.innerText = "Processing High-Res Mask...";
    elements.progressFill.style.width = "50%";

    // Send image to segmentation
    await selfieSegmentation.send({image: originalImage});
};

/**
 * Handle AI results with Feathering (Smooth edges)
 */
function onResults(results) {
    const canvas = elements.bgCanvas;
    const ctx = canvas.getContext('2d');
    
    // 1. Clear and setup mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 2. Draw the mask from AI
    tempCtx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

    // 3. APPLY FEATHERING: Soften the mask edges using blur
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Draw the original image
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Use the mask to clip (Destination-In)
    // This creates much smoother edges than pixel-by-pixel looping
    ctx.globalCompositeOperation = 'destination-in';
    
    // Soften edges slightly
    ctx.filter = 'blur(2px)'; 
    ctx.drawImage(tempCanvas, 0, 0);
    
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over'; // Reset

    // UI Update
    elements.progressText.innerText = "Complete!";
    elements.progressFill.style.width = "100%";
    
    setTimeout(() => {
        elements.progressContainer.classList.add('hidden');
        elements.downloadContainer.classList.remove('hidden');
        updateDownloadLink();
        elements.bgRemoveBtn.disabled = false;
    }, 500);
}

function updateDownloadLink() {
    const format = document.querySelector('input[name="format"]:checked').value;
    const mimeType = `image/${format}`;
    elements.downloadLink.href = elements.bgCanvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : undefined);
    elements.downloadLink.download = `no-bg.${format === 'jpeg' ? 'jpg' : format}`;
}

document.querySelectorAll('input[name="format"]').forEach(input => {
    input.onchange = () => {
        if (elements.downloadContainer.classList.contains('hidden')) return;
        updateDownloadLink();
    };
});

elements.dropZone.onclick = () => elements.uploader.click();
elements.uploader.onchange = (e) => handleFile(e.target.files[0]);

elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
};
