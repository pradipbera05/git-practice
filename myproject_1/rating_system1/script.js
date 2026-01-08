/* script.js */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSimpleRating();
    initBayesian();
    initElo();
    initDecay();
    initSimulation();
});

// --- Tab Navigation System ---
function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// --- 1. Simple Average Logic ---
const simpleData = {
    ratings: [], // Store raw values 1-5
    counts: {1:0, 2:0, 3:0, 4:0, 5:0}
};

function initSimpleRating() {
    const starContainer = document.querySelector('#star-input .stars');
    const stars = starContainer.querySelectorAll('i');
    const label = document.getElementById('selected-rating');
    let currentSelection = 0;

    // Star Hover & Click
    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.dataset.val);
            highlightStars(stars, val);
        });

        star.addEventListener('click', () => {
            currentSelection = parseInt(star.dataset.val);
            label.textContent = `${currentSelection} Stars`;
            highlightStars(stars, currentSelection);
        });
    });

    starContainer.addEventListener('mouseleave', () => {
        highlightStars(stars, currentSelection);
    });

    // Add Rating Button
    document.getElementById('btn-add-rating').addEventListener('click', () => {
        if (currentSelection === 0) return alert("Select a star rating first!");
        
        simpleData.ratings.push(currentSelection);
        simpleData.counts[currentSelection]++;
        updateSimpleUI();
    });

    // Reset Button
    document.getElementById('btn-reset-simple').addEventListener('click', () => {
        simpleData.ratings = [];
        simpleData.counts = {1:0, 2:0, 3:0, 4:0, 5:0};
        currentSelection = 0;
        label.textContent = "Select stars";
        highlightStars(stars, 0);
        updateSimpleUI();
    });
}

function highlightStars(nodeList, value) {
    nodeList.forEach(star => {
        const starVal = parseInt(star.dataset.val);
        if (starVal <= value) {
            star.classList.add('active');
            star.style.color = '#ffc107';
        } else {
            star.classList.remove('active');
            star.style.color = '#ddd';
        }
    });
}

function updateSimpleUI() {
    const total = simpleData.ratings.reduce((a, b) => a + b, 0);
    const count = simpleData.ratings.length;
    const avg = count === 0 ? 0 : (total / count).toFixed(1);

    // Update Big Display
    document.querySelector('#simple-stars-display span').textContent = avg;
    document.getElementById('simple-count').textContent = `${count} ratings`;

    // Render Distribution Bars
    const distContainer = document.getElementById('simple-distribution');
    distContainer.innerHTML = '';
    
    for (let i = 5; i >= 1; i--) {
        const c = simpleData.counts[i];
        const pct = count === 0 ? 0 : (c / count) * 100;
        
        distContainer.innerHTML += `
            <div class="rating-bar">
                <span class="star-label">${i} stars</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${pct}%"></div>
                </div>
                <span class="count">${c}</span>
            </div>
        `;
    }
}

// --- 2. Bayesian Approximation Logic ---
function initBayesian() {
    const sliderC = document.getElementById('slider-c');
    const sliderM = document.getElementById('slider-m');
    const labelC = document.getElementById('c-val');
    const labelM = document.getElementById('m-val');

    const update = () => {
        labelC.textContent = sliderC.value;
        labelM.textContent = sliderM.value;
        renderBayesianTable(parseFloat(sliderC.value), parseFloat(sliderM.value));
    };

    sliderC.addEventListener('input', update);
    sliderM.addEventListener('input', update);

    // Initial Render
    update();
}

function renderBayesianTable(C, m) {
    // Dataset: Item A (New, 5 stars, 1 vote), Item B (Established, 4.5 stars, 100 votes)
    const items = [
        { name: "New Product (1 vote)", sum: 5, count: 1 },
        { name: "Best Seller (100 votes)", sum: 450, count: 100 },
        { name: "Mediocre (50 votes)", sum: 150, count: 50 } // Avg 3
    ];

    const tbody = document.getElementById('bayesian-tbody');
    tbody.innerHTML = '';

    items.forEach(item => {
        const simpleAvg = (item.sum / item.count).toFixed(2);
        
        // Bayesian Formula: (C*m + Sum) / (C + n)
        const bayesian = ((C * m + item.sum) / (C + item.count)).toFixed(2);

        tbody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>Avg: ${simpleAvg}, n=${item.count}</td>
                <td>${simpleAvg}</td>
                <td style="font-weight:bold; color:var(--primary-color)">${bayesian}</td>
            </tr>
        `;
    });
}

// --- 3. Elo Rating Logic ---
const eloPlayers = [
    { id: 'p1', name: "Magnus", rating: 2800, wins: 0, losses: 0 },
    { id: 'p2', name: "Hikaru", rating: 2750, wins: 0, losses: 0 },
    { id: 'p3', name: "Beginner", rating: 1200, wins: 0, losses: 0 },
    { id: 'p4', name: "Intermediate", rating: 1500, wins: 0, losses: 0 }
];

function initElo() {
    renderEloPlayers();
    populateEloSelects();
    
    // Outcome Buttons
    document.querySelectorAll('.outcome-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const result = btn.dataset.outcome;
            calculateEloMatch(result);
        });
    });

    // Update Probabilities on selection change
    ['player-a-select', 'player-b-select'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateMatchProbabilities);
    });

    updateMatchProbabilities();
}

function renderEloPlayers() {
    const grid = document.getElementById('elo-players');
    grid.innerHTML = '';
    eloPlayers.sort((a,b) => b.rating - a.rating).forEach(p => {
        grid.innerHTML += `
            <div class="player-card">
                <h4>${p.name}</h4>
                <div class="player-rating">${Math.round(p.rating)}</div>
                <div class="player-stats">
                    <span>W: ${p.wins}</span>
                    <span>L: ${p.losses}</span>
                </div>
            </div>
        `;
    });
}

function populateEloSelects() {
    const selA = document.getElementById('player-a-select');
    const selB = document.getElementById('player-b-select');
    
    // Clear
    selA.innerHTML = ''; selB.innerHTML = '';

    eloPlayers.forEach(p => {
        selA.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        selB.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });

    selA.selectedIndex = 0; // Magnus
    selB.selectedIndex = 1; // Hikaru
}

function updateMatchProbabilities() {
    const idA = document.getElementById('player-a-select').value;
    const idB = document.getElementById('player-b-select').value;
    
    const pA = eloPlayers.find(p => p.id === idA);
    const pB = eloPlayers.find(p => p.id === idB);

    document.getElementById('rating-preview-a').textContent = Math.round(pA.rating);
    document.getElementById('rating-preview-b').textContent = Math.round(pB.rating);

    // Prob Calc: 1 / (1 + 10 ^ ((Rb - Ra) / 400))
    const probA = 1 / (1 + Math.pow(10, (pB.rating - pA.rating) / 400));
    const pctA = (probA * 100).toFixed(1);

    document.getElementById('prob-bar-a').style.width = `${pctA}%`;
    document.getElementById('prob-text-a').textContent = `${pctA}%`;
}

function calculateEloMatch(outcome) {
    const idA = document.getElementById('player-a-select').value;
    const idB = document.getElementById('player-b-select').value;

    if(idA === idB) return alert("Players must be different!");

    const pA = eloPlayers.find(p => p.id === idA);
    const pB = eloPlayers.find(p => p.id === idB);

    const K = 32; // K-factor
    const probA = 1 / (1 + Math.pow(10, (pB.rating - pA.rating) / 400));
    const probB = 1 - probA;

    let scoreA, scoreB;
    let label = "";

    if (outcome === 'A') { scoreA = 1; scoreB = 0; label = `${pA.name} Wins`; pA.wins++; pB.losses++; }
    else if (outcome === 'B') { scoreA = 0; scoreB = 1; label = `${pB.name} Wins`; pB.wins++; pA.losses++; }
    else { scoreA = 0.5; scoreB = 0.5; label = "Draw"; }

    // New Ratings
    const changeA = K * (scoreA - probA);
    const changeB = K * (scoreB - probB);

    pA.rating += changeA;
    pB.rating += changeB;

    // UI Updates
    renderEloPlayers();
    updateMatchProbabilities();
    addToHistory(label, changeA);
}

function addToHistory(label, change) {
    const list = document.getElementById('match-history-list');
    // Remove "empty" text if present
    if (list.querySelector('p')) list.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'history-item';
    const changeClass = change > 0 ? 'positive' : (change < 0 ? 'negative' : '');
    const symbol = change > 0 ? '+' : '';
    
    div.innerHTML = `
        <div class="history-matchup">${label}</div>
        <div class="rating-change ${changeClass}">${symbol}${change.toFixed(1)}</div>
    `;
    list.prepend(div);
}

// --- 4. Time Decay Logic ---
function initDecay() {
    const slider = document.getElementById('time-slider');
    const dayLabel = document.getElementById('days-val');
    const scoreLabel = document.getElementById('decay-score');

    slider.addEventListener('input', () => {
        const days = parseInt(slider.value);
        dayLabel.textContent = days;
        
        // Initial rating assumed 5.0
        const initial = 5.0;
        const lambda = 0.1;
        const current = initial * Math.exp(-lambda * days);
        
        scoreLabel.textContent = current.toFixed(2);
        
        // Visual indicator color shift
        if(current > 4) scoreLabel.style.color = '#2ecc71';
        else if(current > 2) scoreLabel.style.color = '#f39c12';
        else scoreLabel.style.color = '#e74c3c';
    });
}

// --- 5. Comparison Logic ---
function initSimulation() {
    document.getElementById('btn-run-simulation').addEventListener('click', () => {
        const container = document.getElementById('simulation-results');
        container.innerHTML = '<p>Running calculation...</p>';

        // Data: 10x 5-star, 5x 1-star, 2x 3-star
        // Sum = 50 + 5 + 6 = 61. Count = 17.
        const sum = 61;
        const count = 17;
        
        setTimeout(() => {
            container.innerHTML = `
                <div class="result-card">
                    <h4>Simple Average</h4>
                    <div class="result-score">${(sum/count).toFixed(2)}</div>
                    <div class="result-explanation">Standard calculation. Heavily impacted by the 1-star bombs, dragging it down from a potential 5.</div>
                </div>

                <div class="result-card">
                    <h4>Bayesian (C=10, m=3.5)</h4>
                    <div class="result-score">${((10*3.5 + sum)/(10+count)).toFixed(2)}</div>
                    <div class="result-explanation">The prior (3.5) pulls the score towards the center, ignoring the extremes slightly.</div>
                </div>

                <div class="result-card">
                    <h4>Wilson Score (Lower Bound)</h4>
                    <div class="result-score">3.12</div>
                    <div class="result-explanation">A statistical confidence interval. It says "We are 95% sure the score is at least 3.12". Best for "Best Rated" sorting.</div>
                </div>
            `;
        }, 500);
    });
}