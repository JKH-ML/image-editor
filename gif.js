const elements = {
    uploader: document.getElementById('uploader'),
    editorContainer: document.getElementById('editor-container'),
    fileList: document.getElementById('file-list'),
    noFilesMsg: document.getElementById('no-files-msg'),
    clearListBtn: document.getElementById('clear-list-btn'),
    addMoreBtn: document.getElementById('add-more-btn'),
    makeGifBtn: document.getElementById('make-gif-btn'),
    gifDelay: document.getElementById('gif-delay'),
    delayVal: document.getElementById('delay-val'),
    gifLoop: document.getElementById('gif-loop'),
    previewSection: document.getElementById('preview-section'),
    gifPreview: document.getElementById('gif-preview'),
    downloadLink: document.getElementById('download-link'),
    dropZone: document.getElementById('drop-zone'),
    themeToggle: document.getElementById('theme-toggle'),
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    status: document.getElementById('status')
};

let selectedFiles = [];

// Theme Initialization
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

elements.themeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

elements.gifDelay.oninput = (e) => {
    elements.delayVal.innerText = `${e.target.value}ms`;
};

function handleFiles(files) {
    if (!files.length) return;
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            selectedFiles.push(file);
        }
    }
    
    updateFileList();
    elements.editorContainer.classList.remove('hidden');
    elements.dropZone.classList.add('hidden');
}

function updateFileList() {
    elements.fileList.innerHTML = '';
    if (selectedFiles.length === 0) {
        elements.noFilesMsg.classList.remove('hidden');
    } else {
        elements.noFilesMsg.classList.add('hidden');
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <div class="file-controls">
                    <button class="control-btn" onclick="moveFile(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="control-btn" onclick="moveFile(${index}, 1)" ${index === selectedFiles.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="remove-file" onclick="removeFile(${index})">×</button>
                </div>
            `;
            elements.fileList.appendChild(li);
        });
    }
}

window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    updateFileList();
    if (selectedFiles.length === 0) {
        elements.editorContainer.classList.add('hidden');
        elements.dropZone.classList.remove('hidden');
        elements.previewSection.classList.add('hidden');
    }
};

window.moveFile = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < selectedFiles.length) {
        const temp = selectedFiles[index];
        selectedFiles[index] = selectedFiles[newIndex];
        selectedFiles[newIndex] = temp;
        updateFileList();
    }
};

elements.clearListBtn.onclick = () => {
    selectedFiles = [];
    updateFileList();
    elements.editorContainer.classList.add('hidden');
    elements.dropZone.classList.remove('hidden');
    elements.previewSection.classList.add('hidden');
};

elements.addMoreBtn.onclick = () => elements.uploader.click();
elements.dropZone.onclick = () => elements.uploader.click();
elements.uploader.onchange = (e) => handleFiles(e.target.files);

elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
elements.dropZone.ondrop = (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
};

async function getFileDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
    });
}

elements.makeGifBtn.onclick = async () => {
    if (selectedFiles.length < 2) {
        alert('Please select at least 2 images to create a GIF.');
        return;
    }

    elements.makeGifBtn.disabled = true;
    elements.progressContainer.classList.remove('hidden');
    elements.previewSection.classList.add('hidden');
    
    try {
        // Log start
        console.log('Preparing images for GIF...');
        const images = await Promise.all(selectedFiles.map(getFileDataUrl));
        console.log(`Successfully prepared ${images.length} images.`);

        const delay = parseInt(elements.gifDelay.value) / 1000;
        const loop = parseInt(elements.gifLoop.value);

        // Ensure gifshot is loaded
        if (typeof gifshot === 'undefined') {
            throw new Error('GIF library (gifshot) not loaded. Check your internet connection.');
        }

        // Get dimensions from first image to avoid issues with mismatched sizes
        const firstImg = new Image();
        await new Promise((resolve) => {
            firstImg.onload = resolve;
            firstImg.src = images[0];
        });

        // Limit size for better performance (e.g., max 800px)
        let gifWidth = firstImg.width;
        let gifHeight = firstImg.height;
        const maxDim = 800;
        if (gifWidth > maxDim || gifHeight > maxDim) {
            const ratio = Math.min(maxDim / gifWidth, maxDim / gifHeight);
            gifWidth = Math.round(gifWidth * ratio);
            gifHeight = Math.round(gifHeight * ratio);
            console.log(`Resizing GIF to ${gifWidth}x${gifHeight} for performance.`);
        }

        elements.status.innerText = 'Processing frames...';

        gifshot.createGIF({
            images: images,
            interval: delay,
            numFrames: images.length,
            gifWidth: gifWidth,
            gifHeight: gifHeight,
            sampleInterval: 10, // Faster color sampling (default is 10)
            loop: loop === 0 ? 0 : loop - 1,
            progressCallback: (captureProgress) => {
                const percent = Math.round(captureProgress * 100);
                elements.progressFill.style.width = `${percent}%`;
                elements.status.innerText = `Creating GIF: ${percent}%`;
                console.log(`GIF Progress: ${percent}%`);
            }
        }, function(obj) {
            if(!obj.error) {
                const image = obj.image;
                elements.gifPreview.src = image;
                elements.downloadLink.href = image;
                elements.previewSection.classList.remove('hidden');
                elements.status.innerText = 'GIF Created Successfully!';
            } else {
                console.error('GIF generation error:', obj.error);
                alert(`Error creating GIF: ${obj.errorMsg || 'Unknown error'}`);
            }
            
            elements.makeGifBtn.disabled = false;
            elements.progressContainer.classList.add('hidden');
        });
    } catch (error) {
        console.error('GIF preparation error:', error);
        alert(`Error: ${error.message || 'Error preparing images for GIF.'}`);
        elements.makeGifBtn.disabled = false;
        elements.progressContainer.classList.add('hidden');
    }
};
