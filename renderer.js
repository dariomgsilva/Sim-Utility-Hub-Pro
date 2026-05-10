const { ipcRenderer, shell } = require('electron');

let linksRemotos = {};
let favoritos = JSON.parse(localStorage.getItem('simHubFavs')) || [];
let pastaDownloads = localStorage.getItem('downloadPath') || ""; 
let timeoutPesquisa;

const GIST_URL = 'https://gist.githubusercontent.com/dariomgsilva/f90500de32c59144e7c14bed1e42cc2d/raw/06596779ea5fd934700d47b2d5a1f697e8ae359d/links.json';

window.onload = async () => {
    // Se não houver pasta no localStorage, pede a pasta padrão ao sistema
    if (!pastaDownloads) {
        pastaDownloads = await ipcRenderer.invoke('get-default-downloads');
        localStorage.setItem('downloadPath', pastaDownloads);
    }
    
    document.getElementById('current-path').innerText = pastaDownloads;
    carregarDados();
    aplicarTooltips();
};

async function carregarDados() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    try {
        const response = await fetch(GIST_URL);
        if (!response.ok) throw new Error();
        linksRemotos = await response.json();
        statusDot.style.background = '#00ff64';
        statusText.innerText = 'SERVER SYNCED';
    } catch (e) {
        statusDot.style.background = '#ff3c00';
        statusText.innerText = 'OFFLINE MODE';
        linksRemotos = { "SimHub": "https://www.simhubdash.com/" };
    }

    aplicarFavoritosUI();
    animarCards();
    atualizarContador();
}

function filtrarApps() {
    clearTimeout(timeoutPesquisa);
    timeoutPesquisa = setTimeout(() => {
        const busca = document.getElementById('appSearch').value.toLowerCase();
        const cards = document.querySelectorAll('.card');
        const noResults = document.getElementById('noResults');
        let encontrouAlgum = false;

        cards.forEach(card => {
            const nome = card.querySelector('h2').innerText.toLowerCase();
            const desc = card.querySelector('p').innerText.toLowerCase();
            const visivel = nome.includes(busca) || desc.includes(busca);
            card.style.display = visivel ? "flex" : "none";
            if (visivel) encontrouAlgum = true;
        });

        noResults.style.display = encontrouAlgum ? "none" : "block";
        atualizarContador();
    }, 200);
}

function atualizarContador() {
    const total = Array.from(document.querySelectorAll('.card')).filter(c => c.style.display !== "none").length;
    document.getElementById('toolCounter').innerText = `DISPLAYING ${total} TOOLS`;
}

function instalar(id) {
    const url = linksRemotos[id];
    if (url) {
        shell.openExternal(url);
        mostrarNotificacao(`Opening download for ${id}...`);
    } else {
        mostrarNotificacao("Link not found.");
    }
}

// ATUALIZADO: Agora comunica com o main.js para abrir de forma segura
function abrirPastaLocal() {
    ipcRenderer.send('open-folder-safe', pastaDownloads);
}

function changeView(type) {
    const container = document.getElementById('appsContainer');
    const gridBtn = document.getElementById('gridBtn');
    const listBtn = document.getElementById('listBtn');

    if (type === 'list') {
        container.classList.add('list-mode');
        gridBtn.classList.remove('active');
        listBtn.classList.add('active');
    } else {
        container.classList.remove('list-mode');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    }
}

function toggleFav(id) {
    const idx = favoritos.indexOf(id);
    if (idx > -1) favoritos.splice(idx, 1);
    else favoritos.push(id);
    localStorage.setItem('simHubFavs', JSON.stringify(favoritos));
    aplicarFavoritosUI();
}

function aplicarFavoritosUI() {
    document.querySelectorAll('.card').forEach(card => {
        const isFav = favoritos.includes(card.getAttribute('data-id'));
        card.querySelector('.fav-star').classList.toggle('active', isFav);
        card.style.order = isFav ? "-1" : "0";
    });
}

async function escolherPasta() {
    const path = await ipcRenderer.invoke('select-folder');
    if (path) {
        pastaDownloads = path;
        document.getElementById('current-path').innerText = path;
        localStorage.setItem('downloadPath', path);
    }
}

function toggleSettings() {
    const home = document.getElementById('home-view');
    const sett = document.getElementById('settings-view');
    const isHome = home.style.display !== 'none';
    home.style.display = isHome ? 'none' : 'block';
    sett.style.display = isHome ? 'block' : 'none';
}

function animarCards() {
    document.querySelectorAll('.card').forEach((c, i) => {
        setTimeout(() => c.classList.add('show'), i * 20);
    });
}

function mostrarNotificacao(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function aplicarTooltips() {
    document.querySelectorAll('.card p').forEach(p => {
        p.setAttribute('title', p.innerText);
    });
}

function abrirDiscord() {
    shell.openExternal('https://discord.com/'); 
}

window.toggleFav = toggleFav; 
window.instalar = instalar; 
window.toggleSettings = toggleSettings;
window.escolherPasta = escolherPasta; 
window.filtrarApps = filtrarApps; 
window.abrirDiscord = abrirDiscord;
window.abrirPastaLocal = abrirPastaLocal;
window.changeView = changeView;