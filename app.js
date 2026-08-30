const SUPABASE_URL = 'https://oobyyaposkmtkibtbcbx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bpW5hAaWZgXX0efqIUrLzw_Ij1CuxtY';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const STORAGE_KEYS = { theme: 'nabd_ai_theme' };
let ideas = [];
let decisions = [];
let currentUser = null;

const seedIdeas = [
  {
    name: 'AutoRevenue',
    market: 'UAE Automotive',
    problem: 'Recover and convert forgotten dealership leads through a vertical AI revenue agent.',
    score: 88,
    status: 'Validation',
    next_action: 'Prepare outreach and test the demo with dealerships.',
    analysis_notes: 'Strong fit for UAE. High-ticket product, clear WhatsApp workflow, strong expansion path.',
    analysis: { pain: 9, roi: 10, sale: 8, competition: 6, mvp: 7, scale: 10 }
  },
  {
    name: 'ClinicFlow',
    market: 'UAE Aesthetic / Dental',
    problem: 'Turn inquiries into booked consultations and reduce no-shows using AI.',
    score: 87,
    status: 'On Hold',
    next_action: 'Build concept note after Automotive smoke test.',
    analysis_notes: 'Strong economics but slightly more compliance friction than automotive.',
    analysis: { pain: 10, roi: 9, sale: 8, competition: 6, mvp: 7, scale: 9 }
  },
  {
    name: 'BeautyLoop',
    market: 'UAE Beauty / Wellness',
    problem: 'Fill appointment slots, automate rebooking, and recover no-shows through WhatsApp workflows.',
    score: 85,
    status: 'On Hold',
    next_action: 'Keep as backup vertical and prepare draft concept.',
    analysis_notes: 'Simpler MVP and strong WhatsApp fit, but lower ARPU than automotive or clinics.',
    analysis: { pain: 8, roi: 9, sale: 9, competition: 6, mvp: 9, scale: 8 }
  }
];

function initTheme() {
  const theme = localStorage.getItem(STORAGE_KEYS.theme);
  if (theme === 'light') document.body.classList.add('light');
}
initTheme();

document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem(STORAGE_KEYS.theme, document.body.classList.contains('light') ? 'light' : 'dark');
});

function setAuthUI(session) {
  const gate = document.getElementById('authGate');
  const app = document.getElementById('appShell');
  if (session?.user) {
    currentUser = session.user;
    document.getElementById('userEmail').textContent = currentUser.email || 'Signed in';
    gate.classList.add('app-hidden');
    app.classList.remove('app-hidden');
  } else {
    currentUser = null;
    app.classList.add('app-hidden');
    gate.classList.remove('app-hidden');
  }
}

async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  setAuthUI(session);
  if (session?.user) await loadWorkspace();

  supabaseClient.auth.onAuthStateChange(async (_event, newSession) => {
    setAuthUI(newSession);
    if (newSession?.user) await loadWorkspace();
  });
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const message = document.getElementById('loginMessage');
  const button = document.getElementById('loginBtn');
  message.className = 'auth-message';
  message.textContent = 'Signing in...';
  button.disabled = true;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  button.disabled = false;
  if (error) {
    message.className = 'auth-message error';
    message.textContent = error.message;
  } else {
    message.className = 'auth-message success';
    message.textContent = 'Signed in.';
    document.getElementById('loginPassword').value = '';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  ideas = [];
  decisions = [];
  renderAll();
});

function switchTab(tabId) {
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === tabId));
}
document.querySelectorAll('.nav-link').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

const ideaModal = document.getElementById('ideaModal');
['openIdeaModal', 'quickAddIdea'].forEach(id => document.getElementById(id).addEventListener('click', () => ideaModal.showModal()));
document.getElementById('closeIdeaModal').addEventListener('click', () => ideaModal.close());
document.getElementById('cancelIdeaModal').addEventListener('click', () => ideaModal.close());

async function loadWorkspace() {
  if (!currentUser) return;

  const [{ data: ideaRows, error: ideasError }, { data: decisionRows, error: decisionsError }] = await Promise.all([
    supabaseClient.from('ideas').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('decisions').select('*').order('created_at', { ascending: false })
  ]);

  if (ideasError) console.error('Ideas load error:', ideasError);
  if (decisionsError) console.error('Decisions load error:', decisionsError);

  ideas = ideaRows || [];
  decisions = decisionRows || [];

  if (!ideas.length) {
    const payload = seedIdeas.map(i => ({ ...i, user_id: currentUser.id }));
    const { error } = await supabaseClient.from('ideas').insert(payload);
    if (!error) {
      const { data } = await supabaseClient.from('ideas').select('*').order('created_at', { ascending: false });
      ideas = data || [];
    } else {
      console.error('Seed insert error:', error);
    }
  }

  renderAll();
}

document.getElementById('ideaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const name = document.getElementById('ideaName').value.trim();
  if (!name) return;

  const row = {
    user_id: currentUser.id,
    name,
    market: document.getElementById('ideaMarket').value.trim() || 'Not set',
    problem: document.getElementById('ideaProblem').value.trim() || 'Not defined yet.',
    score: 0,
    status: document.getElementById('ideaStatus').value,
    next_action: document.getElementById('ideaNextAction').value.trim() || 'Run first analysis.',
    analysis_notes: '',
    analysis: { pain: 8, roi: 8, sale: 7, competition: 6, mvp: 7, scale: 8 }
  };

  const { data, error } = await supabaseClient.from('ideas').insert(row).select().single();
  if (error) {
    alert('Could not save idea: ' + error.message);
    return;
  }

  ideas.unshift(data);
  e.target.reset();
  ideaModal.close();
  renderAll();
  switchTab('ideas');
});

function renderStats() {
  const avg = ideas.length ? Math.round(ideas.reduce((sum, i) => sum + (Number(i.score) || 0), 0) / ideas.length) : 0;
  const promising = ideas.filter(i => (Number(i.score) || 0) >= 75).length;
  const active = ideas.filter(i => i.status === 'Validation' || i.status === 'Proceed').length;
  const stats = [
    { label: 'Total Ideas', value: ideas.length, note: 'All concepts in your workspace' },
    { label: 'Promising Ideas', value: promising, note: 'Ideas scoring 75+' },
    { label: 'Average Score', value: avg, note: 'Across all analyzed ideas' },
    { label: 'Active Validation', value: active, note: 'Ideas moving in the pipeline' }
  ];
  document.getElementById('statsGrid').innerHTML = stats.map(stat => `
    <div class="stat-card"><div class="stat-label">${stat.label}</div><div class="stat-value">${stat.value}</div><div class="stat-note">${stat.note}</div></div>
  `).join('');
}

function renderDashboardFocus() {
  const focus = [...ideas].sort((a,b)=> (Number(b.score)||0)-(Number(a.score)||0))[0];
  document.getElementById('currentFocus').innerHTML = focus ? `
    <div class="focus-card">
      <h4>${focus.name}</h4>
      <p><strong>${focus.market}</strong><br>${focus.problem}</p>
      <div class="idea-meta"><span class="meta-chip">Score: ${focus.score || 0}/100</span><span class="meta-chip">Status: ${focus.status}</span></div>
      <p class="next-line">Next: ${focus.next_action || ''}</p>
    </div>` : `<div class="empty-state">No ideas yet. Add your first idea to start.</div>`;

  document.getElementById('recentDecisions').innerHTML = decisions.length ? decisions.slice(0,3).map(d => `
    <div class="timeline-item"><div class="timeline-item-top"><strong>${d.idea_name}</strong><span class="timeline-type ${(d.type || '').toLowerCase()}">${d.type}</span></div><p>${d.reason}</p></div>
  `).join('') : `<div class="empty-state">No decisions recorded yet.</div>`;
}

function renderIdeas() {
  const container = document.getElementById('ideasList');
  container.innerHTML = ideas.length ? ideas.map(idea => `
    <article class="idea-card">
      <div class="idea-card-top"><div><h3>${idea.name}</h3><div class="idea-market">${idea.market}</div></div><div class="idea-score"><strong>${idea.score || 0}</strong><span>out of 100</span></div></div>
      <p>${idea.problem}</p>
      <div class="idea-meta"><span class="meta-chip">Status: ${idea.status}</span><span class="meta-chip">Next: ${idea.next_action || ''}</span></div>
    </article>`).join('') : `<div class="empty-state">No ideas yet. Create your first one.</div>`;
}

function renderIdeaSelectors() {
  const html = ideas.map(idea => `<option value="${idea.id}">${idea.name}</option>`).join('');
  ['analysisIdea', 'decisionIdea', 'validationIdea'].forEach(id => document.getElementById(id).innerHTML = html);
}

function updateSliderLabels() {
  ['pain', 'roi', 'sale', 'competition', 'mvp', 'scale'].forEach(id => {
    const el = document.getElementById(id);
    document.getElementById(id + 'Val').textContent = el.value;
    el.addEventListener('input', () => document.getElementById(id + 'Val').textContent = el.value);
  });
}
updateSliderLabels();

function getIdeaById(id) { return ideas.find(idea => String(idea.id) === String(id)); }

function populateAnalysisForm() {
  const idea = getIdeaById(document.getElementById('analysisIdea').value);
  if (!idea) return;
  const analysis = idea.analysis || { pain: 8, roi: 8, sale: 7, competition: 6, mvp: 7, scale: 8 };
  ['pain', 'roi', 'sale', 'competition', 'mvp', 'scale'].forEach(key => {
    const value = analysis[key] ?? 7;
    document.getElementById(key).value = value;
    document.getElementById(key + 'Val').textContent = value;
  });
  document.getElementById('analysisNotes').value = idea.analysis_notes || '';
  document.getElementById('analysisScoreBox').textContent = idea.score ? `Current score: ${idea.score}/100` : 'No score saved yet';
}
document.getElementById('analysisIdea').addEventListener('change', populateAnalysisForm);

document.getElementById('saveAnalysis').addEventListener('click', async () => {
  const idea = getIdeaById(document.getElementById('analysisIdea').value);
  if (!idea) return;
  const analysis = {
    pain: Number(document.getElementById('pain').value), roi: Number(document.getElementById('roi').value), sale: Number(document.getElementById('sale').value),
    competition: Number(document.getElementById('competition').value), mvp: Number(document.getElementById('mvp').value), scale: Number(document.getElementById('scale').value)
  };
  const score = Math.round((Object.values(analysis).reduce((a,b)=>a+b,0) / 6) * 10);
  const status = score >= 75 ? 'Promising' : score >= 55 ? 'Needs Work' : 'Weak';
  const next_action = score >= 75 ? 'Prepare validation test.' : score >= 55 ? 'Refine value proposition.' : 'Consider pivoting or killing.';
  const analysis_notes = document.getElementById('analysisNotes').value.trim();

  const { data, error } = await supabaseClient.from('ideas').update({ analysis, score, status, next_action, analysis_notes }).eq('id', idea.id).select().single();
  if (error) { alert('Could not save analysis: ' + error.message); return; }
  const idx = ideas.findIndex(i => i.id === idea.id); ideas[idx] = data;
  document.getElementById('analysisScoreBox').textContent = `Saved score: ${score}/100`;
  renderAll();
});

document.getElementById('addDecisionBtn').addEventListener('click', async () => {
  const idea = getIdeaById(document.getElementById('decisionIdea').value);
  if (!idea || !currentUser) return;
  const type = document.getElementById('decisionType').value;
  const reason = document.getElementById('decisionReason').value.trim();
  if (!reason) { alert('Please add a reason for this decision.'); return; }

  const row = { user_id: currentUser.id, idea_id: idea.id, idea_name: idea.name, type, reason };
  const { data, error } = await supabaseClient.from('decisions').insert(row).select().single();
  if (error) { alert('Could not save decision: ' + error.message); return; }

  const next_action = type === 'Proceed' ? 'Move to the next validation step.' : type === 'Hold' ? 'Review later.' : type === 'Pivot' ? 'Define a new hypothesis.' : 'Archive and stop work.';
  await supabaseClient.from('ideas').update({ status: type, next_action }).eq('id', idea.id);
  idea.status = type; idea.next_action = next_action;
  decisions.unshift(data);
  document.getElementById('decisionReason').value = '';
  renderAll();
  switchTab('decisions');
});

function renderDecisions() {
  const container = document.getElementById('decisionList');
  container.innerHTML = decisions.length ? decisions.map(d => `
    <div class="timeline-item"><div class="timeline-item-top"><div><strong>${d.idea_name}</strong><div class="idea-market">${new Date(d.created_at).toLocaleString()}</div></div><span class="timeline-type ${(d.type || '').toLowerCase()}">${d.type}</span></div><p>${d.reason}</p></div>
  `).join('') : `<div class="empty-state">No decisions added yet.</div>`;
}

document.getElementById('calcValidation').addEventListener('click', () => {
  const contacted = Math.max(0, Number(document.getElementById('contacted').value) || 0);
  const replies = Math.min(contacted, Math.max(0, Number(document.getElementById('replies').value) || 0));
  const demos = Math.min(replies, Math.max(0, Number(document.getElementById('demos').value) || 0));
  const pilots = Math.min(demos, Math.max(0, Number(document.getElementById('pilots').value) || 0));
  const replyRate = contacted ? replies / contacted : 0, demoRate = contacted ? demos / contacted : 0, pilotRate = contacted ? pilots / contacted : 0;
  let label = 'Weak signal';
  if (pilotRate >= 0.05 || (demoRate >= 0.15 && replyRate >= 0.25)) label = 'Strong validation signal';
  else if (replyRate >= 0.15 || demoRate >= 0.08) label = 'Moderate signal';
  document.getElementById('validationResult').textContent = `${label} • Reply ${Math.round(replyRate*100)}% • Demo ${Math.round(demoRate*100)}% • Pilot ${Math.round(pilotRate*100)}%`;
});

function renderActions() {
  const container = document.getElementById('actionsList');
  container.innerHTML = ideas.length ? ideas.map(idea => `
    <article class="idea-card"><div class="idea-card-top"><div><h3>${idea.name}</h3><div class="idea-market">${idea.market}</div></div><div class="idea-score"><strong>${idea.score || 0}</strong><span>${idea.status}</span></div></div><p class="next-line">Next Action: ${idea.next_action || ''}</p><p>${idea.analysis_notes || 'No notes added yet.'}</p></article>
  `).join('') : `<div class="empty-state">No actions yet.</div>`;
}

function renderAll() {
  renderStats(); renderDashboardFocus(); renderIdeas(); renderIdeaSelectors(); renderDecisions(); renderActions(); populateAnalysisForm();
}

initAuth();
