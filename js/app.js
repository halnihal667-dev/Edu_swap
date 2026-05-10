// --- Mock Data ---
const MOCK_USERS = [
    { name: 'Amrutha', points: 200 },
    { name: 'Alexto', points: 175 },
    { name: 'Aleena', points: 150 },
    { name: 'Aadithyan K.S.', points: 120 },
    { name: 'Anet', points: 90 }
];

const TOPICS_DB = {
    'Electronics': ['Embedded Systems', 'VLSI', 'Microcontrollers', 'Signal Processing', 'Digital Logic'],
    'Computer Science': ['C Programming', 'Python', 'Web Development', 'Machine Learning', 'Data Structures'],
    'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Robotics', 'AutoCAD', 'Manufacturing'],
    'Mathematics': ['Calculus', 'Linear Algebra', 'Probability', 'Discrete Math', 'Statistics']
};

const ALL_TOPICS = Object.keys(TOPICS_DB).reduce((acc, category) => {
    return acc.concat([category, ...TOPICS_DB[category]]);
}, []);

// --- Application State ---
let userState = {
    name: '',
    college: '',
    phone: '',
    email: '',
    location: '',
    knownConcepts: [],
    learningConcepts: [],
    points: 0,
    doubtsAsked: 0,
    doubtsCleared: 0
};

let currentSelectionMode = 'know'; // 'know' or 'learn'
let totalForumUsers = 1042; // Mock initial user count

let currentChannel = '# general';
let channelHTML = {
    '# general': `
        <div class="message doubt">
            <div class="message-header">
                <span class="message-author">Aadithyan K.S.</span>
                <span class="message-points">5 pts</span>
            </div>
            <p>Hey, can someone explain pointers in C Programming? I'm having trouble visualizing it.</p>
            <button class="btn btn-secondary" style="font-size:0.7rem; padding:0.3rem 0.6rem; margin-top:0.5rem;" onclick="solveDoubt(this)">Solve & Earn 10 pts</button>
        </div>
        <div class="message">
            <div class="message-header">
                <span class="message-author">Amrutha</span>
                <span class="message-points">10 pts</span>
            </div>
            <p>Sure Aadithyan! Think of a pointer as a variable that stores the memory address of another variable, rather than its actual value.</p>
        </div>
        <div class="message doubt">
            <div class="message-header">
                <span class="message-author">Alexto</span>
                <span class="message-points">5 pts</span>
            </div>
            <p>Does anyone have notes on Thermodynamics laws?</p>
            <button class="btn btn-secondary" style="font-size:0.7rem; padding:0.3rem 0.6rem; margin-top:0.5rem;" onclick="solveDoubt(this)">Solve & Earn 10 pts</button>
        </div>
    `
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    setupRouting();
    handleRoute();
});

// --- Routing ---
function setupRouting() {
    window.addEventListener('hashchange', handleRoute);
}

function handleRoute() {
    const hash = window.location.hash || '#registration';
    const container = document.getElementById('app-container');
    container.innerHTML = ''; // Clear current view
    
    if (hash === '#registration') renderRegistration(container);
    else if (hash === '#know') {
        currentSelectionMode = 'know';
        renderConceptSelection(container, 'What concepts do you know?');
    }
    else if (hash === '#learn') {
        currentSelectionMode = 'learn';
        renderConceptSelection(container, 'What concepts do you want to learn?');
    }
    else if (hash === '#dashboard') renderDashboard(container);
}

function navigate(hash) {
    window.location.hash = hash;
}

// --- Views ---

// 1. Registration View
function renderRegistration(container) {
    const html = `
        <div class="view active glass-panel" style="max-width: 600px; width: 100%;">
            <h2>Welcome to Edu Swap</h2>
            <p style="margin-bottom: 2rem;">Join the knowledge-swapping community.</p>
            <form id="reg-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="reg-name" required value="${userState.name}">
                </div>
                <div class="form-group">
                    <label>College/University</label>
                    <input type="text" id="reg-college" required value="${userState.college}">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="reg-phone" value="${userState.phone}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="reg-email" required value="${userState.email}">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" id="reg-location" value="${userState.location}">
                </div>
                <div style="text-align: right; margin-top: 2rem;">
                    <button type="submit" class="btn">Next Step ➜</button>
                </div>
            </form>
        </div>
    `;
    container.innerHTML = html;

    document.getElementById('reg-form').addEventListener('submit', (e) => {
        e.preventDefault();
        userState.name = document.getElementById('reg-name').value;
        userState.college = document.getElementById('reg-college').value;
        userState.phone = document.getElementById('reg-phone').value;
        userState.email = document.getElementById('reg-email').value;
        userState.location = document.getElementById('reg-location').value;
        navigate('#know');
    });
}

// 2 & 3. Concept Selection View
function renderConceptSelection(container, title) {
    const html = `
        <div class="view active glass-panel">
            <h2 style="text-align: center;">${title}</h2>
            <p style="text-align: center; color: var(--primary-blue);">Select topics to populate related concepts.</p>
            
            <div class="bubbles-container" id="bubbles-area">
                <!-- Bubbles injected here -->
            </div>
            
            <div class="controls">
                <button class="btn btn-secondary" id="btn-clear">Clear All</button>
                <button class="btn btn-secondary" id="btn-shuffle">Shuffle</button>
                <button class="btn" id="btn-next">${currentSelectionMode === 'know' ? 'Next: What to Learn ➜' : 'Enter Dashboard ➜'}</button>
            </div>
        </div>
    `;
    container.innerHTML = html;

    const bubblesArea = document.getElementById('bubbles-area');
    
    // Algorithm to generate options
    const generateOptions = (selectedTopic = null) => {
        let options = [];
        if (!selectedTopic) {
            // Show main categories and some random subtopics
            options = Object.keys(TOPICS_DB);
            // Add some random ones
            for(let i=0; i<6; i++) {
                const rand = ALL_TOPICS[Math.floor(Math.random() * ALL_TOPICS.length)];
                if(!options.includes(rand)) options.push(rand);
            }
        } else {
            // 80% related, 20% random
            let related = [];
            // Find category
            if (TOPICS_DB[selectedTopic]) related = [...TOPICS_DB[selectedTopic]];
            else {
                for (const cat in TOPICS_DB) {
                    if (TOPICS_DB[cat].includes(selectedTopic)) {
                        related = [cat, ...TOPICS_DB[cat].filter(t => t !== selectedTopic)];
                        break;
                    }
                }
            }
            
            const numRelated = Math.max(1, Math.floor(related.length * 0.8));
            const selectedRelated = related.slice(0, numRelated);
            
            const numRandom = Math.max(1, Math.ceil(numRelated * 0.25)); // ~20% of total
            const selectedRandom = [];
            for(let i=0; i<numRandom; i++) {
                const rand = ALL_TOPICS[Math.floor(Math.random() * ALL_TOPICS.length)];
                if(!selectedRelated.includes(rand) && rand !== selectedTopic) {
                    selectedRandom.push(rand);
                }
            }
            
            options = [...new Set([selectedTopic, ...selectedRelated, ...selectedRandom])];
        }
        return options;
    };

    const renderBubbles = (options) => {
        bubblesArea.innerHTML = '';
        const currentSelectedList = currentSelectionMode === 'know' ? userState.knownConcepts : userState.learningConcepts;
        
        options.forEach(opt => {
            const el = document.createElement('div');
            el.className = `bubble ${currentSelectedList.includes(opt) ? 'selected' : ''}`;
            el.innerText = opt;
            el.onclick = () => {
                const idx = currentSelectedList.indexOf(opt);
                if (idx > -1) {
                    currentSelectedList.splice(idx, 1);
                    el.classList.remove('selected');
                } else {
                    currentSelectedList.push(opt);
                    el.classList.add('selected');
                    // Trigger regeneration based on selection
                    renderBubbles(generateOptions(opt));
                }
            };
            bubblesArea.appendChild(el);
        });
    };

    // Initial render
    renderBubbles(generateOptions());

    // Controls
    document.getElementById('btn-clear').onclick = () => {
        if(currentSelectionMode === 'know') userState.knownConcepts = [];
        else userState.learningConcepts = [];
        renderBubbles(generateOptions());
    };

    document.getElementById('btn-shuffle').onclick = () => {
        renderBubbles(generateOptions());
    };

    document.getElementById('btn-next').onclick = () => {
        if (currentSelectionMode === 'know') navigate('#learn');
        else navigate('#dashboard');
    };
}

// 4. Dashboard View
function renderDashboard(container) {
    const html = `
        <div class="view active dashboard-grid">
            
            <!-- Left Sidebar -->
            <div class="glass-panel sidebar">
                <h3>Forum Channels</h3>
                <ul class="channel-list" id="channel-list">
                    <li class="active" onclick="switchChannel(this, '# general')"># general</li>
                    ${userState.knownConcepts.map(c => {
                        const name = `# teach-${c.toLowerCase().replace(/\s+/g,'-')}`;
                        return `<li onclick="switchChannel(this, '${name}')">${name}</li>`;
                    }).join('')}
                    ${userState.learningConcepts.map(c => {
                        const name = `# learn-${c.toLowerCase().replace(/\s+/g,'-')}`;
                        return `<li onclick="switchChannel(this, '${name}')">${name}</li>`;
                    }).join('')}
                </ul>
                <div style="margin-top: auto;">
                    <h4>Settings</h4>
                    <button class="btn btn-secondary" style="width:100%; font-size:0.8rem; margin-top:0.5rem;" onclick="location.hash='#know'">Edit Skills</button>
                </div>
            </div>

            <!-- Main Chat Area -->
            <div class="glass-panel main-chat">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1rem;">
                    <h3 id="current-channel-name">${currentChannel}</h3>
                    <div class="flap-timer" id="user-counter">
                        <!-- Flaps injected via JS -->
                    </div>
                </div>
                
                <div class="chat-messages" id="chat-messages">
                    ${channelHTML[currentChannel]}
                </div>

                <div class="chat-input">
                    <input type="text" id="chat-input-field" placeholder="Ask a doubt (+5 pts) or share knowledge...">
                    <button class="btn" id="btn-send">Send</button>
                </div>
            </div>

            <!-- Right Sidebar: Profile & Leaderboard -->
            <div class="glass-panel right-panel">
                <div class="user-profile">
                    <div class="user-avatar">${userState.name ? userState.name.charAt(0).toUpperCase() : 'U'}</div>
                    <h3>${userState.name || 'User'}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-main);">${userState.college}</p>
                    <div class="points-display" id="my-points">${userState.points} pts</div>
                </div>

                <div>
                    <h4>Clearance Ratio</h4>
                    <div class="chart-container">
                        <canvas id="ratioChart"></canvas>
                    </div>
                </div>

                <div class="leaderboard">
                    <h4>Top Contributors</h4>
                    <div id="leaderboard-list">
                        ${[...MOCK_USERS, {name: userState.name || 'You', points: userState.points}]
                            .sort((a,b) => b.points - a.points)
                            .slice(0, 5)
                            .map((u, i) => `
                            <div class="leaderboard-item">
                                <span>${i+1}. ${u.name}</span>
                                <span style="color:var(--electric-blue);">${u.points} pts</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;

    // Initialize Chart
    initChart();

    // Start Flap Timer
    updateFlapTimer();
    setInterval(() => {
        if(Math.random() > 0.7) {
            totalForumUsers++;
            updateFlapTimer();
        }
    }, 5000);

    // Chat functionality
    document.getElementById('btn-send').onclick = () => {
        const input = document.getElementById('chat-input-field');
        if(input.value.trim() === '') return;
        
        const isDoubt = input.value.includes('?');
        const pointsEarned = isDoubt ? 5 : 0;
        
        userState.points += pointsEarned;
        if(isDoubt) userState.doubtsAsked++;
        
        updateProfileStats();
        
        const msgHtml = `
            <div class="message ${isDoubt ? 'doubt' : ''}">
                <div class="message-header">
                    <span class="message-author">${userState.name || 'You'}</span>
                    <span class="message-points">${pointsEarned > 0 ? '+'+pointsEarned+' pts' : ''}</span>
                </div>
                <p>${input.value}</p>
            </div>
        `;
        const chatbox = document.getElementById('chat-messages');
        chatbox.insertAdjacentHTML('beforeend', msgHtml);
        chatbox.scrollTop = chatbox.scrollHeight;
        input.value = '';
    };

    // Global solveDoubt function
    window.solveDoubt = function(btn) {
        userState.points += 10;
        userState.doubtsCleared++;
        btn.innerHTML = "Solved (+10 pts)";
        btn.disabled = true;
        btn.style.opacity = "0.5";
        updateProfileStats();
    };

    // Channel Switching function
    window.switchChannel = function(element, channelName) {
        // Save current channel content before switching
        const chatbox = document.getElementById('chat-messages');
        channelHTML[currentChannel] = chatbox.innerHTML;
        
        // Update current channel
        currentChannel = channelName;

        // Update active styling
        document.querySelectorAll('#channel-list li').forEach(li => li.classList.remove('active'));
        element.classList.add('active');
        
        // Update header
        document.getElementById('current-channel-name').innerText = channelName;
        
        // Load new channel content or create default welcome message
        if (!channelHTML[channelName]) {
            channelHTML[channelName] = `
                <div class="message">
                    <div class="message-header">
                        <span class="message-author" style="color: var(--text-main);">System</span>
                    </div>
                    <p>Welcome to ${channelName}! Start swapping knowledge.</p>
                </div>
            `;
        }
        chatbox.innerHTML = channelHTML[channelName];
        chatbox.scrollTop = chatbox.scrollHeight;
    };
}

function updateProfileStats() {
    document.getElementById('my-points').innerText = userState.points + ' pts';
    initChart(); // redraw chart
    // Re-render leaderboard simply by updating HTML
    const lbHtml = [...MOCK_USERS, {name: userState.name || 'You', points: userState.points}]
        .sort((a,b) => b.points - a.points)
        .slice(0, 5)
        .map((u, i) => `
        <div class="leaderboard-item">
            <span>${i+1}. ${u.name}</span>
            <span style="color:var(--electric-blue);">${u.points} pts</span>
        </div>
    `).join('');
    document.getElementById('leaderboard-list').innerHTML = lbHtml;
}

let ratioChartInstance = null;
function initChart() {
    const ctx = document.getElementById('ratioChart');
    if(!ctx) return;
    
    if(ratioChartInstance) ratioChartInstance.destroy();
    
    // Need at least 1 for display purposes if both 0
    const asked = userState.doubtsAsked || 1;
    const cleared = userState.doubtsCleared || 1;

    ratioChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Asked', 'Cleared'],
            datasets: [{
                data: [asked, cleared],
                backgroundColor: ['#ffaa00', '#66FCF1'],
                borderColor: '#0B0C10',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#C5C6C7' } }
            }
        }
    });
}

function updateFlapTimer() {
    const container = document.getElementById('user-counter');
    if(!container) return;
    
    const digits = totalForumUsers.toString().split('');
    container.innerHTML = digits.map(d => `<div class="flap">${d}</div>`).join('');
}

// --- Live Responsive Background Effects ---
function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if(this.x < 0 || this.x > width) this.vx *= -1;
            if(this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(102, 252, 241, 0.5)';
            ctx.fill();
        }
    }
    
    for(let i=0; i<100; i++) particles.push(new Particle());
    
    let mouseX = 0;
    let mouseY = 0;
    
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
            
            // Connect to mouse
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if(dist < 150) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouseX, mouseY);
                ctx.strokeStyle = `rgba(69, 162, 158, ${1 - dist/150})`;
                ctx.stroke();
            }
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}
