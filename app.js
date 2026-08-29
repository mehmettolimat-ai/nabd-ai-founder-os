const STORAGE_KEYS = {
  ideas: 'nabd_ai_ideas',
  decisions: 'nabd_ai_decisions',
  theme: 'nabd_ai_theme'
};

const seedIdeas = [
  {
    id: Date.now(),
    name: 'AutoRevenue',
    market: 'UAE Automotive',
    problem: 'Recover and convert forgotten dealership leads through a vertical AI revenue agent.',
    score: 88,
    status: 'Validation',
    nextAction: 'Prepare outreach and test the demo with dealerships.',
    analysisNotes: 'Strong fit for UAE. High-ticket product, clear WhatsApp workflow, strong expansion path.',
    analysis: { pain: 9, roi: 10, sale: 8, competition: 6, mvp: 7, scale: 10 }
  },
  {
    id: Date.now() + 1,
    name: 'ClinicFlow',
    market: 'UAE Aesthetic / Dental',
    problem: 'Turn inquiries into booked consultations and reduce no-shows using AI.',
    score: 87,
    status: 'On Hold',
    nextAction: 'Build concept note after Automotive smoke test.',
    analysisNotes: 'Strong economics but slightly more compliance friction than automotive.',
    analysis: { pain: 10, roi: 9, sale: 8, competition: 6, mvp: 7, scale: 9 }
  },
  {
    id: Date.now() + 2,
    name: 'BeautyLoop',
    market: 'UAE Beauty / Wellness',
    problem: 'Fill appointment slots, automate rebooking, and recover no-shows through WhatsApp workflows.',
    score: 85,
    status: 'On Hold',
    nextAction: 'Keep as backup vertical and prepare draft concept.',
    analysisNotes: 'Simpler MVP and strong WhatsApp fit, but lower ARPU than automotive or clinics.',
    analysis: { pain: 8, roi: 9, sale: 9, competition: 6, mvp: 9, scale: 8 }
  }
];

const seedDecisions = [
  {
    id: Date.now() + 10,
    ideaId: seedIdeas[0].id,
    ideaName: 'AutoRevenue',
    type: 'Proceed',
    reason: 'Best balance of accessibility from Syria, strong ROI, and scalable vertical AI path.',
    createdAt: new Date().toLocaleString()
  },
  {
    id: Date.now() + 11,
    ideaId: seedIdeas[1].id,
    ideaName: 'ClinicFlow',
    type: 'Hold',
    reason: 'Promising but slightly more friction around compliance and data handling.',
    createdAt: new Date().toLocaleString()
  }
];

let ideas = load(STORAGE_KEYS.ideas, seedIdeas);
let decisions = load(STORAGE_KEYS.decisions, seedDecisions);

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function formatScore(score) { return Number.isFinite(score) ? score : 0; }
function averageScore() {
  if (!ideas.length) return 0;
  return Math.round(ideas.reduce((sum, i) => sum + formatScore(i.score), 0) / ideas.length);
}
function getPromisingCount() { return ideas.filter(i => formatScore(i.score) >= 75).length; }
function getValidationCount() { return ideas.filter(i => i.status === 'Validation' || i.status === 'Proceed').length; }
function highestIdea() {
  return [...ideas].sort((a,b)=> formatScore(b.score)-formatScore(a.score))[0];
}

function initTheme() {
  const theme = localStorage.getItem(STORAGE_KEYS.theme);
  if (theme === 'light') document.body.classList.add('light');
}
initTheme();

document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem(STORAGE_KEYS.theme, document.body.classList.contains('light') ? 'light' : 'dark');
});

function switchTab(tabId) {
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === tabId));
}

document.querySelectorAll('.nav-link').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

const ideaModal = document.getElementById('ideaModal');
const openModalButtons = ['openIdeaModal', 'quickAddIdea'];
openModalButtons.forEach(id => document.getElementById(id).addEventListener('click', () => ideaModal.showModal()));
document.getElementById('closeIdeaModal').addEventListener('click', () => ideaModal.close());
document.getElementById('cancelIdeaModal').addEventListener('click', () => ideaModal.close());

document.getElementById('ideaForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('ideaName').value.trim();
  if (!name) return;

  const newIdea = {
    id: Date.now(),
    name,
    market: document.getElementById('ideaMarket').value.trim() || 'Not set',
    problem: document.getElementById('ideaProblem').value.trim() || 'Not defined yet.',
    score: 0,
    status: document.getElementById('ideaStatus').value,
    nextAction: document.getElementById('ideaNextAction').value.trim() || 'Run first analysis.',
    analysisNotes: '',
    analysis: { pain: 8, roi: 8, sale: 7, competition: 6, mvp: 7, scale: 8 }
  };

  ideas.unshift(newIdea);
  persistAndRender();
  e.target.reset();
  ideaModal.close();
  switchTab('ideas');
});

function renderStats() {
  const stats = [
    { label: 'Total Ideas', value: ideas.length, note: 'All concepts in your workspace' },
    { label: 'Promising Ideas', value: getPromisingCount(), note: 'Ideas scoring 75+' },
    { label: 'Average Score', value: averageScore(), note: 'Across all analyzed ideas' },
    { label: 'Active Validation', value: getValidationCount(), note: 'Ideas moving in the pipeline' }
  ];
  document.getElementById('statsGrid').innerHTML = stats.map(stat => `
    <div class="stat-card">
      <div class="stat-label">${stat.label}</div>
      <div class="stat-value">${stat.value}</div>
      <div class="stat-note">${stat.note}</div>
    </div>
  `).join('');
}

function renderDashboardFocus() {
  const focus = highestIdea();
  document.getElementById('currentFocus').innerHTML = focus ? `
    <div class="focus-card">
      <h4>${focus.name}</h4>
      <p><strong>${focus.market}</strong><br>${focus.problem}</p>
      <div class="idea-meta">
        <span class="meta-chip">Score: ${focus.score}/100</span>
        <span class="meta-chip">Status: ${focus.status}</span>
      </div>
      <p class="next-line">Next: ${focus.nextAction}</p>
    </div>
  ` : `<div class="empty-state">No ideas yet. Add your first idea to start.</div>`;

  const recent = [...decisions].sort((a,b)=> b.id - a.id).slice(0, 3);
  document.getElementById('recentDecisions').innerHTML = recent.length ? recent.map(d => `
    <div class="timeline-item">
      <div class="timeline-item-top">
        <strong>${d.ideaName}</strong>
        <span class="timeline-type ${d.type.toLowerCase()}">${d.type}</span>
      </div>
      <p>${d.reason}</p>
    </div>
  `).join('') : `<div class="empty-state">No decisions recorded yet.</div>`;
}

function renderIdeas() {
  const container = document.getElementById('ideasList');
  if (!ideas.length) {
    container.innerHTML = `<div class="empty-state">No ideas yet. Create your first one.</div>`;
    return;
  }
  container.innerHTML = ideas.map(idea => `
    <article class="idea-card">
      <div class="idea-card-top">
        <div>
          <h3>${idea.name}</h3>
          <div class="idea-market">${idea.market}</div>
        </div>
        <div class="idea-score">
          <strong>${idea.score}</strong>
          <span>out of 100</span>
        </div>
      </div>
      <p>${idea.problem}</p>
      <div class="idea-meta">
        <span class="meta-chip">Status: ${idea.status}</span>
        <span class="meta-chip">Next: ${idea.nextAction}</span>
      </div>
    </article>
  `).join('');
}

function renderIdeaSelectors() {
  const html = ideas.map(idea => `<option value="${idea.id}">${idea.name}</option>`).join('');
  ['analysisIdea', 'decisionIdea', 'validationIdea'].forEach(id => {
    document.getElementById(id).innerHTML = html;
  });
}

function updateSliderLabels() {
  ['pain', 'roi', 'sale', 'competition', 'mvp', 'scale'].forEach(id => {
    const el = document.getElementById(id);
    document.getElementById(id + 'Val').textContent = el.value;
    el.addEventListener('input', () => document.getElementById(id + 'Val').textContent = el.value);
  });
}
updateSliderLabels();

function getIdeaById(id) {
  return ideas.find(idea => String(idea.id) === String(id));
}

function populateAnalysisForm() {
  const selectedId = document.getElementById('analysisIdea').value;
  const idea = getIdeaById(selectedId);
  if (!idea) return;
  const analysis = idea.analysis || { pain: 8, roi: 8, sale: 7, competition: 6, mvp: 7, scale: 8 };
  ['pain', 'roi', 'sale', 'competition', 'mvp', 'scale'].forEach(key => {
    document.getElementById(key).value = analysis[key] ?? 7;
    document.getElementById(key + 'Val').textContent = analysis[key] ?? 7;
  });
  document.getElementById('analysisNotes').value = idea.analysisNotes || '';
  document.getElementById('analysisScoreBox').textContent = idea.score ? `Current score: ${idea.score}/100` : 'No score saved yet';
}

document.getElementById('analysisIdea').addEventListener('change', populateAnalysisForm);

document.getElementById('saveAnalysis').addEventListener('click', () => {
  const selectedId = document.getElementById('analysisIdea').value;
  const idea = getIdeaById(selectedId);
  if (!idea) return;

  const analysis = {
    pain: Number(document.getElementById('pain').value),
    roi: Number(document.getElementById('roi').value),
    sale: Number(document.getElementById('sale').value),
    competition: Number(document.getElementById('competition').value),
    mvp: Number(document.getElementById('mvp').value),
    scale: Number(document.getElementById('scale').value)
  };
  const avg = Math.round((Object.values(analysis).reduce((a,b)=>a+b,0) / 6) * 10);

  idea.analysis = analysis;
  idea.analysisNotes = document.getElementById('analysisNotes').value.trim();
  idea.score = avg;
  idea.status = avg >= 75 ? 'Promising' : avg >= 55 ? 'Needs Work' : 'Weak';
  idea.nextAction = avg >= 75 ? 'Prepare validation test.' : avg >= 55 ? 'Refine value proposition.' : 'Consider pivoting or killing.';

  save(STORAGE_KEYS.ideas, ideas);
  document.getElementById('analysisScoreBox').textContent = `Saved score: ${avg}/100`;
  renderAll();
});

document.getElementById('addDecisionBtn').addEventListener('click', () => {
  const ideaId = document.getElementById('decisionIdea').value;
  const idea = getIdeaById(ideaId);
  if (!idea) return;
  const type = document.getElementById('decisionType').value;
  const reason = document.getElementById('decisionReason').value.trim();
  if (!reason) {
    alert('Please add a reason for this decision.');
    return;
  }

  decisions.unshift({
    id: Date.now(),
    ideaId: idea.id,
    ideaName: idea.name,
    type,
    reason,
    createdAt: new Date().toLocaleString()
  });

  idea.status = type;
  idea.nextAction = type === 'Proceed' ? 'Move to the next validation step.' : type === 'Hold' ? 'Review later.' : type === 'Pivot' ? 'Define a new hypothesis.' : 'Archive and stop work.';

  document.getElementById('decisionReason').value = '';
  persistAndRender();
  switchTab('decisions');
});

function renderDecisions() {
  const container = document.getElementById('decisionList');
  if (!decisions.length) {
    container.innerHTML = `<div class="empty-state">No decisions added yet.</div>`;
    return;
  }
  container.innerHTML = decisions.map(d => `
    <div class="timeline-item">
      <div class="timeline-item-top">
        <div>
          <strong>${d.ideaName}</strong>
          <div class="idea-market">${d.createdAt}</div>
        </div>
        <span class="timeline-type ${d.type.toLowerCase()}">${d.type}</span>
      </div>
      <p>${d.reason}</p>
    </div>
  `).join('');
}

document.getElementById('calcValidation').addEventListener('click', () => {
  const contacted = Math.max(0, Number(document.getElementById('contacted').value) || 0);
  const replies = Math.min(contacted, Math.max(0, Number(document.getElementById('replies').value) || 0));
  const demos = Math.min(replies, Math.max(0, Number(document.getElementById('demos').value) || 0));
  const pilots = Math.min(demos, Math.max(0, Number(document.getElementById('pilots').value) || 0));

  const replyRate = contacted ? replies / contacted : 0;
  const demoRate = contacted ? demos / contacted : 0;
  const pilotRate = contacted ? pilots / contacted : 0;

  let label = 'Weak signal';
  if (pilotRate >= 0.05 || (demoRate >= 0.15 && replyRate >= 0.25)) label = 'Strong validation signal';
  else if (replyRate >= 0.15 || demoRate >= 0.08) label = 'Moderate signal';

  document.getElementById('validationResult').textContent = `${label} • Reply ${Math.round(replyRate*100)}% • Demo ${Math.round(demoRate*100)}% • Pilot ${Math.round(pilotRate*100)}%`;
});

function renderActions() {
  const container = document.getElementById('actionsList');
  if (!ideas.length) {
    container.innerHTML = `<div class="empty-state">No actions yet.</div>`;
    return;
  }
  container.innerHTML = ideas.map(idea => `
    <article class="idea-card">
      <div class="idea-card-top">
        <div>
          <h3>${idea.name}</h3>
          <div class="idea-market">${idea.market}</div>
        </div>
        <div class="idea-score">
          <strong>${idea.score}</strong>
          <span>${idea.status}</span>
        </div>
      </div>
      <p class="next-line">Next Action: ${idea.nextAction}</p>
      <p>${idea.analysisNotes || 'No notes added yet.'}</p>
    </article>
  `).join('');
}

function persistAndRender() {
  save(STORAGE_KEYS.ideas, ideas);
  save(STORAGE_KEYS.decisions, decisions);
  renderAll();
}

function renderAll() {
  renderStats();
  renderDashboardFocus();
  renderIdeas();
  renderIdeaSelectors();
  renderDecisions();
  renderActions();
  populateAnalysisForm();
}

renderAll();
