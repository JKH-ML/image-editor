// --- CONFIG & STATE ---
let cardCount = 0;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentDragCard = null;
let hasDraggedThisInteraction = false;
let selectedCard = null;

const cardsContainer = document.getElementById("cardsContainer");
const fileInput = document.getElementById("fileInput");
const cardControlsPanel = document.getElementById("cardControlsPanel");
const cardSizeInput = document.getElementById("cardSizeInput");
const cardAspectToggle = document.getElementById("cardAspectToggle");
const deleteCardBtn = document.getElementById("deleteCardBtn");
const closePanelBtn = document.getElementById("closePanelBtn");
const pageContainer = document.getElementById("pageContainer");
const emptyHint = document.getElementById("empty-hint");
const themeToggle = document.getElementById('theme-toggle');

// Theme Initialization
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

themeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

// --- SELECTION ---
function deselectAll() {
  if (selectedCard) selectedCard.classList.remove("selected");
  selectedCard = null;
  cardControlsPanel.classList.add("hidden");
}

function selectCard(card) {
  deselectAll();
  selectedCard = card;
  card.classList.add("selected");

  const isLandscape = card.offsetWidth > card.offsetHeight;
  cardAspectToggle.checked = isLandscape;
  cardSizeInput.value = isLandscape ? card.offsetHeight : card.offsetWidth;

  const rect = card.getBoundingClientRect();
  const containerRect = pageContainer.getBoundingClientRect();
  
  // Position control panel near the card
  let top = rect.top - containerRect.top - 80;
  if (top < 10) top = rect.bottom - containerRect.top + 10;
  
  cardControlsPanel.style.top = `${top}px`;
  cardControlsPanel.style.left = `${rect.left - containerRect.left}px`;
  cardControlsPanel.classList.remove("hidden");
}

cardsContainer.addEventListener('click', (e) => {
  if (e.target === cardsContainer || e.target === emptyHint) {
    deselectAll();
  }
});

// --- CARD CREATION ---
function getRandomPosition() {
  const rect = cardsContainer.getBoundingClientRect();
  const padding = 50;
  return {
    x: padding + Math.random() * (rect.width - 250),
    y: padding + Math.random() * (rect.height - 350)
  };
}

function createCard() {
  cardCount++;
  emptyHint.classList.add("hidden");
  
  const card = document.createElement("div");
  const pos = getRandomPosition();
  const rotation = (Math.random() - 0.5) * 20;
  
  card.className = "card-container shadow-xl";
  card.style.left = `${pos.x}px`;
  card.style.top = `${pos.y}px`;
  card.style.transform = `rotate(${rotation}deg)`;
  card.style.zIndex = cardCount;
  
  card.innerHTML = `
    <button class="card-action-btn absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white rounded-full p-1 z-10 transition-opacity">
      <span class="material-symbols-outlined text-xs">settings</span>
    </button>
  `;

  // Drag logic
  card.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    hasDraggedThisInteraction = false;
    currentDragCard = card;
    
    const rect = card.getBoundingClientRect();
    const containerRect = cardsContainer.getBoundingClientRect();
    
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    card.style.zIndex = ++cardCount;
    e.preventDefault();
  });

  card.addEventListener("click", (e) => {
    if (!hasDraggedThisInteraction) {
      e.stopPropagation();
      selectCard(card);
    }
  });

  // Rotation with scroll
  card.addEventListener("wheel", (e) => {
    e.preventDefault();
    const match = card.style.transform.match(/rotate\(([^)]+)deg\)/);
    let rot = match ? parseFloat(match[1]) : 0;
    card.style.transform = `rotate(${rot + (e.deltaY > 0 ? 5 : -5)}deg)`;
  }, { passive: false });

  cardsContainer.appendChild(card);
  return card;
}

function loadImageToCard(card, file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const settingsBtn = card.querySelector("button");
    const img = document.createElement("img");
    img.src = e.target.result;
    img.className = "card-image";
    card.appendChild(img);
    if (settingsBtn) card.appendChild(settingsBtn);
  };
  reader.readAsDataURL(file);
}

// --- GLOBAL DRAG ---
document.addEventListener("mousemove", (e) => {
  if (!currentDragCard) return;
  
  if (!isDragging) {
    isDragging = true;
    hasDraggedThisInteraction = true;
  }
  
  const containerRect = cardsContainer.getBoundingClientRect();
  let x = e.clientX - containerRect.left - dragOffset.x;
  let y = e.clientY - containerRect.top - dragOffset.y;
  
  currentDragCard.style.left = `${x}px`;
  currentDragCard.style.top = `${y}px`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  currentDragCard = null;
});

// --- CONTROLS ---
document.getElementById("addCard").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      const card = createCard();
      loadImageToCard(card, file);
    }
  });
  e.target.value = "";
});

document.getElementById("clearAll").addEventListener("click", () => {
  cardsContainer.querySelectorAll('.card-container').forEach(c => c.remove());
  emptyHint.classList.remove("hidden");
  deselectAll();
});

cardSizeInput.addEventListener("input", (e) => {
  if (!selectedCard) return;
  const val = +e.target.value;
  if (val < 10) return;
  const isLand = cardAspectToggle.checked;
  if (isLand) {
    selectedCard.style.width = `${val * 1.5}px`;
    selectedCard.style.height = `${val}px`;
  } else {
    selectedCard.style.width = `${val}px`;
    selectedCard.style.height = `${val * 1.5}px`;
  }
});

cardAspectToggle.addEventListener("change", (e) => {
  if (!selectedCard) return;
  const val = +cardSizeInput.value;
  const isLand = e.target.checked;

  if (isLand) {
    selectedCard.style.width = `${val * 1.5}px`;
    selectedCard.style.height = `${val}px`;
  } else {
    selectedCard.style.width = `${val}px`;
    selectedCard.style.height = `${val * 1.5}px`;
  }
});

deleteCardBtn.addEventListener("click", () => {
  if (selectedCard) { 
    selectedCard.remove(); 
    deselectAll(); 
    if (cardsContainer.querySelectorAll('.card-container').length === 0) {
        emptyHint.classList.remove("hidden");
    }
  }
});

closePanelBtn.addEventListener("click", deselectAll);

// Tooltip Toggle for mobile
const tooltipContainer = document.querySelector('.tooltip-container');
if (tooltipContainer) {
    tooltipContainer.addEventListener('click', (e) => {
        const content = tooltipContainer.querySelector('.tooltip-content');
        if (content) {
            const isVisible = window.getComputedStyle(content).display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            content.style.opacity = isVisible ? '0' : '1';
            e.stopPropagation();
        }
    });
}

// Global click to hide tooltip
document.addEventListener('click', () => {
    const content = document.querySelector('.tooltip-content');
    if (content) {
        content.style.display = 'none';
        content.style.opacity = '0';
    }
});
