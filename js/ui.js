/* ═══════════════════════════════════════════════════════════
   UI RENDERER — All page rendering functions
   ═══════════════════════════════════════════════════════════ */

/* ── Toast System ── */
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ── Geolocation helper ── */
function getLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 8000, enableHighAccuracy: false }
    );
  });
}

/* ══════════════════════════════════════════
   LOGIN SCREEN
   ══════════════════════════════════════════ */
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-icon">🔧</div>
        <h1>ToolVault</h1>
        <p class="login-sub">Calibration Inventory Manager</p>
        <div class="form-group">
          <label>Username</label>
          <input id="loginUser" class="form-control" placeholder="Enter username" autocomplete="username" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input id="loginPass" class="form-control" type="password" placeholder="Enter password" autocomplete="current-password" />
        </div>
        <div id="loginError" class="form-error hidden"></div>
        <button id="loginBtn" class="btn btn-primary btn-block btn-lg mt-md">Sign In</button>
        <div class="demo-hint">
          Demo accounts:<br/>
          Admin: <code>admin / admin123</code><br/>
          Tech: <code>technician / tech123</code>
        </div>
      </div>
    </div>`;

  const doLogin = () => {
    const name = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const users = getUsers();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === pass);
    if (user) {
      sessionStorage.setItem('tv_currentUser', JSON.stringify(user));
      location.hash = '#dashboard';
      renderApp();
    } else {
      const err = document.getElementById('loginError');
      err.textContent = 'Invalid username or password.';
      err.classList.remove('hidden');
    }
  };
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('loginUser').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loginPass').focus(); });
}

/* ── Current user helper ── */
function currentUser() {
  try { return JSON.parse(sessionStorage.getItem('tv_currentUser')); }
  catch { return null; }
}
function isAdmin() { const u = currentUser(); return u && u.role === 'admin'; }

/* ══════════════════════════════════════════
   MAIN APP SHELL (sidebar + content)
   ══════════════════════════════════════════ */
function renderApp() {
  const user = currentUser();
  if (!user) { renderLogin(); return; }

  const app = document.getElementById('app');
  const initials = user.name.slice(0, 2).toUpperCase();
  const adminNav = user.role === 'admin' ? `
    <div class="nav-section">
      <div class="nav-section-title">Admin</div>
      <button class="nav-item" data-page="tools"><span class="nav-icon">📦</span> Manage Tools</button>
      <button class="nav-item" data-page="markets"><span class="nav-icon">🏢</span> Markets</button>
      <button class="nav-item" data-page="users"><span class="nav-icon">👥</span> Users</button>
      <button class="nav-item" data-page="activity"><span class="nav-icon">📋</span> Activity Log</button>
    </div>` : '';

  app.innerHTML = `
    <button class="sidebar-toggle" id="sidebarToggle">☰</button>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">🔧</div>
        <div><h2>ToolVault</h2><div class="brand-sub">Inventory Manager</div></div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <button class="nav-item" data-page="dashboard"><span class="nav-icon">📊</span> Dashboard</button>
          <button class="nav-item" data-page="scan"><span class="nav-icon">📱</span> Scan Tool</button>
        </div>
        ${adminNav}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${user.role}</div>
          </div>
          <button class="btn-logout" id="logoutBtn" title="Sign Out">⏻</button>
        </div>
      </div>
    </aside>
    <main class="main-content" id="mainContent"></main>`;

  // Sidebar events
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('tv_currentUser');
    location.hash = '';
    renderLogin();
  });

  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      location.hash = '#' + btn.dataset.page;
    });
  });

  // Mobile sidebar
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('visible'); });
  overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); });

  // Route
  handleRoute();
  window.addEventListener('hashchange', handleRoute);
}

/* ══════════════════════════════════════════
   ROUTER
   ══════════════════════════════════════════ */
function handleRoute() {
  const hash = location.hash.slice(1) || 'dashboard';
  const parts = hash.split('/');
  const page = parts[0];
  const param = parts[1] || null;

  // Public route: tool certificate view (no login needed)
  if (page === 'tool' && param) {
    renderPublicToolView(param);
    return;
  }

  if (!currentUser()) { renderLogin(); return; }

  // Highlight active nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (active) active.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('visible');

  const main = document.getElementById('mainContent');
  if (!main) return;

  switch (page) {
    case 'dashboard': renderDashboard(main); break;
    case 'scan': renderScanPage(main); break;
    case 'tools': renderToolsPage(main); break;
    case 'markets': renderMarketsPage(main); break;
    case 'users': renderUsersPage(main); break;
    case 'activity': renderActivityPage(main); break;
    case 'tool-detail': renderToolDetail(main, param); break;
    default: renderDashboard(main);
  }
}

/* ══════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════ */
function renderDashboard(container) {
  const stats = getStats();
  const markets = getMarkets();
  const tools = getTools();

  // Find tools with calibration due within 30 days or overdue
  const today = new Date();
  const calTools = tools.filter(t => t.requiresCalibration && t.calibrationDueDate);
  const expiring = calTools.filter(t => {
    const diff = (new Date(t.calibrationDueDate) - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });
  const overdue = calTools.filter(t => new Date(t.calibrationDueDate) < today);

  // Recently checked out
  const recentCheckouts = getCheckoutLog()
    .filter(r => r.checkinTime === null)
    .sort((a, b) => new Date(b.checkoutTime) - new Date(a.checkoutTime))
    .slice(0, 5);

  container.innerHTML = `
    <div class="page-header">
      <h1>📊 Dashboard</h1>
      <p>Advanced AOG Avionics — Tool Inventory Overview</p>
    </div>
    <div class="page-body">
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-value">${stats.total}</div><div class="stat-label">Total Tools</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${stats.available}</div><div class="stat-label">Available</div></div>
        <div class="stat-card"><div class="stat-icon">📤</div><div class="stat-value">${stats.checkedOut}</div><div class="stat-label">Checked Out</div></div>
        <div class="stat-card"><div class="stat-icon">🔬</div><div class="stat-value">${stats.calTools}</div><div class="stat-label">Require Calibration</div></div>
        <div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-value">${stats.calDueSoon}</div><div class="stat-label">Cal Due Soon (30d)</div></div>
        ${stats.calOverdue > 0 ? `<div class="stat-card" style="border-color:var(--error)"><div class="stat-icon">🚨</div><div class="stat-value" style="color:var(--error)">${stats.calOverdue}</div><div class="stat-label">Calibration Overdue</div></div>` : ''}
      </div>

      <!-- Per-market breakdown -->
      <div class="card mb-lg">
        <div class="card-header"><div class="card-title">🏢 Inventory by Market</div></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Market</th><th>Location</th><th>Total</th><th>Available</th><th>Checked Out</th></tr></thead>
            <tbody>
              ${markets.map(m => {
    const s = getStats(m.id);
    return `<tr><td><strong>${m.name}</strong></td><td>${m.location}</td><td>${s.total}</td><td><span class="badge badge-success">${s.available}</span></td><td><span class="badge ${s.checkedOut > 0 ? 'badge-warning' : 'badge-neutral'}">${s.checkedOut}</span></td></tr>`;
  }).join('')}
              ${markets.length === 0 ? '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">No markets yet. Add one from the Markets page.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-md)">
        <!-- Calibration alerts -->
        <div class="card">
          <div class="card-header"><div class="card-title">${overdue.length > 0 ? '🚨 Calibration Overdue' : '⚠️ Calibration Due Soon'}</div></div>
          ${[...overdue, ...expiring].length === 0 ? '<p class="text-muted text-small">All calibrations are current.</p>' :
      [...overdue.map(t => ({ ...t, _overdue: true })), ...expiring].map(t => `
              <div class="cert-card" style="cursor:pointer" onclick="location.hash='#tool-detail/${t.id}'">
                <div class="cert-header">
                  <span class="tool-id">${t.id}</span>
                  <span class="badge ${t._overdue ? 'badge-error' : 'badge-warning'}">${t._overdue ? 'OVERDUE' : t.calibrationDueDate}</span>
                </div>
                <div style="font-size:0.85rem;color:var(--text-secondary)">${t.name}${t.sublocation ? ' — ' + t.sublocation : ''}</div>
              </div>
            `).join('')}
        </div>

        <!-- Currently checked out -->
        <div class="card">
          <div class="card-header"><div class="card-title">📤 Currently Checked Out</div></div>
          ${recentCheckouts.length === 0 ? '<p class="text-muted text-small">No tools currently checked out.</p>' :
      recentCheckouts.map(r => {
        const tool = getToolById(r.toolId);
        return `
                <div class="cert-card" style="cursor:pointer" onclick="location.hash='#tool-detail/${r.toolId}'">
                  <div class="cert-header">
                    <span class="tool-id">${r.toolId}</span>
                    <span class="badge badge-info">${r.userName}</span>
                  </div>
                  <div style="font-size:0.85rem;color:var(--text-secondary)">${tool ? tool.name : 'Unknown'} — since ${new Date(r.checkoutTime).toLocaleDateString()}</div>
                </div>`;
      }).join('')}
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   SCAN PAGE
   ══════════════════════════════════════════ */
function renderScanPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>📱 Scan Tool</h1>
      <p>Scan a QR code or enter a tool ID to check in/out</p>
    </div>
    <div class="page-body">
      <div class="scanner-view" id="scannerView">
        <div class="scanner-frame" id="scannerFrame">
          <video id="scanVideo" autoplay playsinline></video>
          <div class="scanner-corners"></div>
        </div>
        <div class="scanner-prompt">
          <button class="btn btn-primary btn-lg" id="startCameraBtn">📷 Start Camera</button>
          <div class="scanner-or">or enter manually</div>
          <div class="manual-entry">
            <input id="manualToolId" class="form-control" placeholder="e.g. INV-00001" style="font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.06em" />
            <button class="btn btn-secondary" id="lookupBtn">Look Up</button>
          </div>
          <div id="scanError" class="form-error hidden mt-md"></div>
        </div>
      </div>
      <div id="scanResult" class="hidden"></div>
    </div>`;

  // Camera scan
  let stream = null;
  document.getElementById('startCameraBtn').addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.getElementById('scanVideo');
      video.srcObject = stream;

      // Use BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const scanInterval = setInterval(async () => {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              clearInterval(scanInterval);
              stream.getTracks().forEach(t => t.stop());
              handleScanResult(barcodes[0].rawValue);
            }
          } catch { }
        }, 500);
      } else {
        showToast('QR scanning not supported in this browser. Use manual entry.', 'info');
      }
    } catch (err) {
      showToast('Camera access denied or unavailable. Use manual entry.', 'error');
    }
  });

  // Manual lookup
  const doLookup = () => {
    const id = document.getElementById('manualToolId').value.trim().toUpperCase();
    if (!id) { showScanError('Please enter a tool ID.'); return; }
    handleScanResult(id);
  };
  document.getElementById('lookupBtn').addEventListener('click', doLookup);
  document.getElementById('manualToolId').addEventListener('keydown', e => { if (e.key === 'Enter') doLookup(); });

  function showScanError(msg) {
    const el = document.getElementById('scanError');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function handleScanResult(input) {
    // Extract tool ID if it's a URL
    let toolId = input;
    if (input.includes('#tool/')) {
      toolId = input.split('#tool/').pop();
    } else if (input.includes('tool/')) {
      toolId = input.split('tool/').pop();
    }
    toolId = toolId.toUpperCase();

    const tool = getToolById(toolId);
    if (!tool) { showScanError(`No tool found with ID: ${toolId}`); return; }

    document.getElementById('scannerView').classList.add('hidden');
    renderScanToolResult(tool);
  }
}

function renderScanToolResult(tool) {
  const result = document.getElementById('scanResult');
  result.classList.remove('hidden');
  const checkout = getActiveCheckout(tool.id);
  const certs = getCertsForTool(tool.id);
  const market = getMarketById(tool.marketId);
  const latestCert = certs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

  result.innerHTML = `
    <div class="tool-detail" style="animation:fadeSlideUp 0.4s ease">
      <div class="tool-detail-header">
        <div class="tool-photo">${tool.photoData ? `<img src="${tool.photoData}" alt="${tool.name}" />` : '🔧'}</div>
        <span class="tool-id">${tool.id}</span>
        <h2 style="margin-top:var(--sp-sm)">${tool.name}</h2>
        ${tool.description ? `<p style="font-size:0.88rem">${tool.description}</p>` : ''}
      </div>

      <div class="detail-grid">
        <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value">${tool.isCheckedOut ? '<span class="badge badge-warning">📤 Checked Out</span>' : '<span class="badge badge-success">✅ Available</span>'}</div></div>
        <div class="detail-item"><div class="detail-label">Market</div><div class="detail-value">${market ? market.name : 'Unassigned'}</div></div>
        ${checkout ? `
          <div class="detail-item"><div class="detail-label">Checked Out By</div><div class="detail-value">${checkout.userName}</div></div>
          <div class="detail-item"><div class="detail-label">Since</div><div class="detail-value">${new Date(checkout.checkoutTime).toLocaleString()}</div></div>
        ` : ''}
      </div>

      ${latestCert ? `
        <div class="card mb-lg">
          <div class="card-header"><div class="card-title">📜 Current Calibration</div></div>
          <div class="cert-meta">
            <dt>Certificate #</dt><dd>${latestCert.certNo}</dd>
            <dt>Status</dt><dd><span class="badge badge-${latestCert.status === 'Pass' ? 'success' : latestCert.status === 'Fail' ? 'error' : 'neutral'}">${latestCert.status}</span></dd>
            <dt>Calibration Date</dt><dd>${latestCert.calibrationDate || '—'}</dd>
            <dt>Next Due</dt><dd>${latestCert.nextDueDate || '—'}</dd>
            ${latestCert.instrumentId ? `<dt>Instrument ID</dt><dd>${latestCert.instrumentId}</dd>` : ''}
          </div>
          ${latestCert.fileData ? `<div class="mt-md"><a href="${latestCert.fileData}" target="_blank" class="btn btn-sm btn-secondary">📄 View Certificate PDF</a></div>` : ''}
        </div>` : ''}

      <div class="detail-actions">
        ${tool.isCheckedOut ?
      `<button class="btn btn-success btn-lg" id="checkinBtn">📥 Check In / Return</button>` :
      `<button class="btn btn-warning btn-lg" id="checkoutBtn">📤 Check Out</button>`}
        <button class="btn btn-secondary" onclick="location.hash='#scan';renderApp()">📷 Scan Another</button>
      </div>
    </div>`;

  if (tool.isCheckedOut) {
    document.getElementById('checkinBtn').addEventListener('click', async (e) => {
      const btn = e.target;
      btn.disabled = true;
      btn.innerHTML = '📍 Acquiring Location...';
      const { lat, lng } = await getLocation();
      if (!lat || !lng) {
        btn.disabled = false;
        btn.innerHTML = '📥 Check In / Return';
        showToast('Location access is required to check in tools. Please enable location services.', 'error');
        return;
      }
      const rec = checkinTool(tool.id, lat, lng);
      if (rec) {
        showToast(`${tool.name} checked in successfully!`, 'success');
        renderScanToolResult(getToolById(tool.id));
      } else {
        btn.disabled = false;
        btn.innerHTML = '📥 Check In / Return';
        showToast('Failed to check in tool.', 'error');
      }
    });
  } else {
    document.getElementById('checkoutBtn').addEventListener('click', async (e) => {
      const btn = e.target;
      btn.disabled = true;
      btn.innerHTML = '📍 Acquiring Location...';
      const user = currentUser();
      const { lat, lng } = await getLocation();
      if (!lat || !lng) {
        btn.disabled = false;
        btn.innerHTML = '📤 Check Out';
        showToast('Location access is required to check out tools. Please enable location services.', 'error');
        return;
      }
      const rec = checkoutTool(tool.id, user.id, user.name, lat, lng);
      if (rec) {
        showToast(`${tool.name} checked out to ${user.name}!`, 'success');
        renderScanToolResult(getToolById(tool.id));
      } else {
        btn.disabled = false;
        btn.innerHTML = '📤 Check Out';
        showToast('Failed to check out tool.', 'error');
      }
    });
  }
}

/* ══════════════════════════════════════════
   PUBLIC CERTIFICATE VIEW (no auth)
   ══════════════════════════════════════════ */
function renderPublicToolView(toolId) {
  const app = document.getElementById('app');
  const tool = getToolById(toolId.toUpperCase());

  if (!tool) {
    app.innerHTML = `<div class="public-view"><div class="public-card text-center"><div style="font-size:3rem;margin-bottom:var(--sp-md)">🔍</div><h2>Tool Not Found</h2><p>No tool found with ID: <strong>${toolId}</strong></p></div></div>`;
    return;
  }

  const certs = getCertsForTool(tool.id).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const market = getMarketById(tool.marketId);

  const calStatusHtml = tool.requiresCalibration
    ? (tool.calibrationDueDate && new Date(tool.calibrationDueDate) < new Date()
      ? '<div style="background:var(--error);color:white;padding:12px;border-radius:8px;text-align:center;margin-top:var(--sp-md);font-weight:bold;letter-spacing:1px">⚠️ CALIBRATION OVERDUE</div>'
      : `<div style="background:var(--success);color:white;padding:12px;border-radius:8px;text-align:center;margin-top:var(--sp-md);font-weight:bold;letter-spacing:1px">✅ CALIBRATION CURRENT</div><div class="text-center text-small mt-sm text-muted">Due: ${tool.calibrationDueDate}</div>`)
    : '<div style="background:var(--surface-2);color:var(--text-secondary);padding:12px;border-radius:8px;text-align:center;margin-top:var(--sp-md);font-weight:bold">NOT REQUIRED</div>';

  app.innerHTML = `
    <div class="public-view">
      <div class="public-card">
        <div class="public-header">
          <div class="public-icon">🔧</div>
          <h1>${tool.name}</h1>
          <span class="tool-id" style="margin-top:var(--sp-sm);display:inline-block">${tool.id}</span>
          ${tool.description ? `<p style="margin-top:var(--sp-sm);font-size:0.88rem">${tool.description}</p>` : ''}
          ${market ? `<p class="text-small text-muted mt-md">Market: ${market.name} (${market.location})</p>` : ''}
        </div>
        
        ${calStatusHtml}

        <h3 style="margin-top:var(--sp-lg);margin-bottom:var(--sp-md);border-bottom:1px solid var(--border);padding-bottom:8px">📜 Calibration Certificates</h3>
        ${certs.length === 0 ? '<p class="text-muted">No certificates on file for this tool.</p>' :
      certs.map(c => `
            <div class="cert-card">
              <div class="cert-header">
                <strong>${c.certNo}</strong>
                <span class="badge badge-${c.status === 'Pass' ? 'success' : c.status === 'Fail' ? 'error' : 'neutral'}">${c.status}</span>
              </div>
              <div class="cert-meta mt-sm text-small">
                ${c.instrumentId ? `<dt>Instrument ID</dt><dd>${c.instrumentId}</dd>` : ''}
                <dt>Calibration Date</dt><dd>${c.calibrationDate || '—'}</dd>
                <dt>Next Due Date</dt><dd>${c.nextDueDate || '—'}</dd>
              </div>
              ${c.fileData ? `<a href="${c.fileData}" target="_blank" class="btn btn-primary btn-block mt-md" style="display:flex;justify-content:center;align-items:center;gap:8px">📄 View PDF Certificate</a>` : ''}
            </div>
          `).join('')}

        <div class="mt-lg text-center" style="border-top:1px solid var(--border);padding-top:16px">
          <p class="text-small text-muted">Powered by ToolVault — Calibration Inventory Manager</p>
        </div>
      </div>
    </div>`;
}
