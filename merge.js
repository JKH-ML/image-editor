const elements = {
    uploader: document.getElementById('uploader'),
    editorContainer: document.getElementById('editor-container'),
    fileList: document.getElementById('file-list'),
    noFilesMsg: document.getElementById('no-files-msg'),
    clearListBtn: document.getElementById('clear-list-btn'),
    addMoreBtn: document.getElementById('add-more-btn'),
    exportBtn: document.getElementById('export-btn'),
    downloadContainer: document.getElementById('download-container'),
    downloadLink: document.getElementById('download-link'),
    dropZone: document.getElementById('drop-zone'),
    themeToggle: document.getElementById('theme-toggle')
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

async function loadImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

elements.exportBtn.onclick = async () => {
    if (selectedFiles.length < 2) {
        alert('Please select at least 2 images to merge.');
        return;
    }

    const direction = document.querySelector('input[name="direction"]:checked').value;
    const images = await Promise.all(selectedFiles.map(loadImage));
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let totalWidth = 0;
    let totalHeight = 0;
    
    if (direction === 'horizontal') {
        totalWidth = images.reduce((sum, img) => sum + img.width, 0);
        totalHeight = Math.max(...images.map(img => img.height));
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        
        let x = 0;
        images.forEach(img => {
            ctx.drawImage(img, x, 0);
            x += img.width;
        });
    } else if (direction === 'vertical') {
        totalWidth = Math.max(...images.map(img => img.width));
        totalHeight = images.reduce((sum, img) => sum + img.height, 0);
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        
        let y = 0;
        images.forEach(img => {
            ctx.drawImage(img, 0, y);
            y += img.height;
        });
    } else if (direction === 'grid') {
        const cols = Math.ceil(Math.sqrt(images.length));
        const rows = Math.ceil(images.length / cols);
        const cellWidth = Math.max(...images.map(img => img.width));
        const cellHeight = Math.max(...images.map(img => img.height));
        
        canvas.width = cellWidth * cols;
        canvas.height = cellHeight * rows;
        
        images.forEach((img, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            ctx.drawImage(img, col * cellWidth, row * cellHeight);
        });
    }

    const format = document.querySelector('input[name="format"]:checked').value;
    const mimeType = `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : undefined);
    
    elements.downloadLink.href = dataUrl;
    elements.downloadLink.download = `merged_image.${format === 'jpeg' ? 'jpg' : format}`;
    elements.downloadContainer.classList.remove('hidden');
};
