/* ═══════════════════════════════════════════════════════════
   ADMIN PAGES — Tools, Markets, Users, Activity
   ═══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════
   TOOLS PAGE (Admin)
   ══════════════════════════════════════════ */
function renderToolsPage(container) {
  const tools = getTools();
  const markets = getMarkets();

  container.innerHTML = `
    <div class="page-header">
      <h1>📦 Manage Tools</h1>
      <p>Add, view, and manage inventory tools across all markets</p>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="addToolBtn">+ Add Tool</button>
      </div>
    </div>
    <div class="page-body">
      <div class="filter-bar">
        <div class="search-input"><input id="toolSearch" placeholder="Search tools..." /></div>
        <select class="form-control" id="marketFilter" style="width:auto;min-width:160px">
          <option value="">All Markets</option>
          ${markets.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
        </select>
        <select class="form-control" id="statusFilter" style="width:auto;min-width:140px">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="available">Available</option>
          <option value="out">Checked Out</option>
          <option value="decommissioned">Decommissioned</option>
          <option value="out_for_repair">Out for Repair</option>
        </select>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>P/N</th><th>S/N</th><th>Market</th><th>Location</th><th>Status</th><th>Cal</th><th>Actions</th></tr></thead>
          <tbody id="toolsTableBody"></tbody>
        </table>
      </div>
    </div>`;

  function renderRows() {
    const search = document.getElementById('toolSearch').value.toLowerCase();
    const mf = document.getElementById('marketFilter').value;
    const sf = document.getElementById('statusFilter').value;
    let filtered = tools.filter(t => {
      if (search && !t.name.toLowerCase().includes(search) && !t.id.toLowerCase().includes(search) && !(t.partNumber || '').toLowerCase().includes(search) && !(t.serialNumber || '').toLowerCase().includes(search)) return false;
      if (mf && t.marketId !== mf) return false;
      if (sf === 'active' && t.status !== 'active') return false;
      if (sf === 'available' && (t.isCheckedOut || t.status !== 'active')) return false;
      if (sf === 'out' && !t.isCheckedOut) return false;
      if (sf === 'decommissioned' && t.status !== 'decommissioned') return false;
      if (sf === 'out_for_repair' && t.status !== 'out_for_repair') return false;
      return true;
    });
    const tbody = document.getElementById('toolsTableBody');
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted" style="padding:32px">No tools found.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(t => {
      const market = getMarketById(t.marketId);
      const calBadge = t.requiresCalibration
        ? (t.calibrationDueDate && new Date(t.calibrationDueDate) < new Date()
          ? '<span class="badge badge-error">OVERDUE</span><br><span class="text-small">' + t.calibrationDueDate + '</span>'
          : '<span class="badge badge-success">Current</span>' + (t.calibrationDueDate ? '<br><span class="text-small">Due ' + t.calibrationDueDate + '</span>' : ''))
        : '<span class="text-muted text-small">Not Req</span>';
      let statusBadge;
      if (t.status === 'decommissioned') statusBadge = '<span class="badge badge-neutral">Decomm</span>';
      else if (t.status === 'out_for_repair') statusBadge = '<span class="badge badge-warning">Repair</span>';
      else if (t.isCheckedOut) statusBadge = '<span class="badge badge-warning">Out</span>' + (t.checkedOutBy ? '<br><span class="text-small text-muted">' + t.checkedOutBy + '</span>' : '');
      else statusBadge = '<span class="badge badge-success">Avail</span>';
      const dimStyle = t.status === 'decommissioned' ? ' style="opacity:0.5"' : '';
      return '<tr' + dimStyle + '>' +
        '<td><span class="tool-id">' + t.id + '</span></td>' +
        '<td><strong style="color:var(--text-primary)">' + t.name + '</strong></td>' +
        '<td class="text-small">' + (t.partNumber || '\u2014') + '</td>' +
        '<td class="text-small">' + (t.serialNumber || '\u2014') + '</td>' +
        '<td>' + (market ? market.name.split(' \u2014')[0] : '\u2014') + '</td>' +
        '<td class="text-small">' + (t.sublocation || '\u2014') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + calBadge + '</td>' +
        '<td><div style="display:flex;gap:4px">' +
        '<button class="btn btn-sm btn-ghost" onclick="location.hash=\'#tool-detail/' + t.id + '\'" title="View">\ud83d\udc41\ufe0f</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="openEditToolModal(\'' + t.id + '\')" title="Edit">\u270f\ufe0f</button>' +
        '<button class="btn btn-sm btn-ghost" onclick="openQRModal(\'' + t.id + '\')" title="QR">\ud83d\udcf1</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  renderRows();
  document.getElementById('toolSearch').addEventListener('input', renderRows);
  document.getElementById('marketFilter').addEventListener('change', renderRows);
  document.getElementById('statusFilter').addEventListener('change', renderRows);
  document.getElementById('addToolBtn').addEventListener('click', openAddToolModal);
}

/* ── Add Tool Modal ── */
function openAddToolModal() {
  const markets = getMarkets();
  if (markets.length === 0) { showToast('Add a market first before adding tools.', 'error'); return; }
  showModal('Add New Tool', `
    <div class="form-group"><label>Tool Name *</label><input id="newToolName" class="form-control" placeholder="e.g. Torque Wrench 50FT/LB-250FT/LB" /></div>
    <div class="form-group"><label>Description</label><textarea id="newToolDesc" class="form-control" placeholder="Brief description"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Part Number</label><input id="newToolPN" class="form-control" placeholder="e.g. 2503MFRMH" /></div>
      <div class="form-group"><label>Serial Number</label><input id="newToolSN" class="form-control" placeholder="e.g. 0522112225" /></div>
    </div>
    <div class="form-group"><label>Market *</label><select id="newToolMarket" class="form-control">${markets.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}</select></div>
    <div class="form-group"><label>Sub-Location</label><input id="newToolSubloc" class="form-control" placeholder="e.g. Van 1, Van 4, Matts Van" /></div>
    <div class="form-group"><label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0"><input type="checkbox" id="newToolReqCal" /> Requires Calibration</label></div>
    <div class="form-group hidden" id="calDateGroup"><label>Calibration Due Date</label><input id="newToolCalDate" class="form-control" type="date" /></div>
    <div class="form-group"><label>Photo (optional)</label>
      <div class="file-upload" id="photoUpload"><div class="upload-icon">📸</div><div class="upload-text">Click to upload a photo</div><div class="upload-hint">JPG, PNG, max 2MB</div><input type="file" id="toolPhotoInput" accept="image/*" /></div>
    </div>
  `, () => {
    const name = document.getElementById('newToolName').value.trim();
    const desc = document.getElementById('newToolDesc').value.trim();
    const marketId = document.getElementById('newToolMarket').value;
    if (!name) { showToast('Tool name is required.', 'error'); return false; }
    const photoData = document.getElementById('toolPhotoInput')._dataUrl || null;
    const tool = addTool(name, desc, marketId, photoData, {
      partNumber: document.getElementById('newToolPN').value.trim(),
      serialNumber: document.getElementById('newToolSN').value.trim(),
      requiresCalibration: document.getElementById('newToolReqCal').checked,
      calibrationDueDate: document.getElementById('newToolCalDate')?.value || '',
      sublocation: document.getElementById('newToolSubloc').value.trim(),
    });
    showToast(`Tool ${tool.id} created!`, 'success');
    closeModal();
    openQRModal(tool.id);
    return true;
  });

  // Photo upload handler
  const photoUpload = document.getElementById('photoUpload');
  const photoInput = document.getElementById('toolPhotoInput');
  photoUpload.addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      photoInput._dataUrl = ev.target.result;
      photoUpload.innerHTML = `<img src="${ev.target.result}" style="max-height:120px;border-radius:8px" /><div class="upload-text mt-md">${file.name}</div>`;
    };
    reader.readAsDataURL(file);
  });
}

/* ── QR Code Modal ── */
function openQRModal(toolId) {
  const tool = getToolById(toolId);
  if (!tool) return;

  // Smartphones cannot read `file:///` URLs from QR codes. 
  // If we are running locally, use a placeholder domain so the phone recognizes it as a valid URL.
  let baseUrl = `${location.origin}${location.pathname}`;
  if (baseUrl.startsWith('file://')) {
    baseUrl = 'http://toolvault.demo';
  }
  const qrUrl = `${baseUrl}#tool/${toolId}`;

  showModal(`QR Code — ${toolId}`, `
    <div class="qr-print-area" id="qrArea">
      <div class="qr-container" id="qrContainer">
        <img id="qrImage" src="" alt="QR" style="width: 200px; height: 200px; object-fit: contain; margin: 0 auto; display: block;" />
        <div class="qr-label">${toolId}</div>
      </div>
      <p class="text-muted text-small mt-md">${tool.name}</p>
      <p class="text-muted text-small">Scan with any QR reader to view calibration info</p>
    </div>
  `, null, [
    { label: '🖨️ Print Label', class: 'btn-primary', action: () => printQR(toolId) },
    { label: 'Close', class: 'btn-secondary', action: closeModal }
  ]);

  // Generate QR using public API (avoids CORS/local file execution blocking)
  const encodedUrl = encodeURIComponent(qrUrl);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedUrl}&margin=5`;

  setTimeout(() => {
    document.getElementById('qrImage').src = qrApiUrl;
  }, 100);
}

function printQR(toolId) {
  const tool = getToolById(toolId);

  let baseUrl = `${location.origin}${location.pathname}`;
  if (baseUrl.startsWith('file://')) {
    baseUrl = 'http://toolvault.demo';
  }
  const qrUrl = encodeURIComponent(`${baseUrl}#tool/${toolId}`);

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrUrl}&margin=0`;
  const printWin = window.open('', '_blank', 'width=400,height=500');

  printWin.document.write(`<!DOCTYPE html><html><head><title>QR Label — ${toolId}</title>
    <style>body{font-family:Arial,sans-serif;text-align:center;padding:20px}
    .label{border:2px solid #333;padding:20px;display:inline-block;border-radius:8px}
    .id{font-family:monospace;font-size:18px;font-weight:bold;margin-top:12px;letter-spacing:2px}
    .name{font-size:12px;color:#666;margin-top:4px}</style></head>
    <body><div class="label"><img src="${qrApiUrl}" style="width:180px;height:180px;" /><div class="id">${toolId}</div><div class="name">${tool ? tool.name : ''}</div></div>
    <script>
      // Wait for image to load before printing
      const img = document.querySelector('img');
      img.onload = () => setTimeout(() => window.print(), 300);
    <\/script></body></html>`);
  printWin.document.close();
}

/* ── Transfer Modal ── */
function openTransferModal(toolId) {
  const tool = getToolById(toolId);
  if (!tool) return;
  const markets = getMarkets().filter(m => m.id !== tool.marketId);
  const currentMarket = getMarketById(tool.marketId);
  if (markets.length === 0) { showToast('No other markets to transfer to. Add another market first.', 'error'); return; }
  showModal(`Transfer Tool — ${toolId}`, `
    <div class="transfer-card">
      <div class="detail-item"><div class="detail-label">Tool</div><div class="detail-value">${tool.name}</div></div>
      <div class="detail-item mt-md"><div class="detail-label">Current Market</div><div class="detail-value">${currentMarket ? currentMarket.name : '—'}</div></div>
      <div class="transfer-arrow">⬇️</div>
      <div class="form-group"><label>Transfer To</label><select id="transferTarget" class="form-control">${markets.map(m => `<option value="${m.id}">${m.name} (${m.location})</option>`).join('')}</select></div>
    </div>
  `, () => {
    const toMarket = document.getElementById('transferTarget').value;
    const user = currentUser();
    transferTool(toolId, toMarket, user.name);
    showToast(`${tool.name} transferred successfully!`, 'success');
    closeModal();
    location.hash = '#tools';
    handleRoute();
    return true;
  });
}

/* ── Add Certificate Modal ── */
function openCertModal(toolId) {
  const tool = getToolById(toolId);
  if (!tool) return;
  showModal(`Add Certificate — ${tool.name}`, `
    <div class="form-row"><div class="form-group"><label>Certificate #</label><input id="certNo" class="form-control" placeholder="e.g. CAL-2025-0471" /></div>
    <div class="form-group"><label>Instrument ID</label><input id="certInstrId" class="form-control" placeholder="e.g. FL87V-2891" /></div></div>
    <div class="form-row"><div class="form-group"><label>Calibration Date</label><input id="certCalDate" class="form-control" type="date" /></div>
    <div class="form-group"><label>Next Due Date</label><input id="certDueDate" class="form-control" type="date" /></div></div>
    <div class="form-group"><label>Status</label><select id="certStatus" class="form-control"><option value="Pass">Pass</option><option value="Fail">Fail</option><option value="N/A">N/A</option></select></div>
    <div class="form-group"><label>Certificate PDF (optional)</label>
      <div class="file-upload" id="certFileUpload"><div class="upload-icon">📄</div><div class="upload-text">Click to upload PDF</div><div class="upload-hint">PDF files only</div><input type="file" id="certFileInput" accept=".pdf" /></div>
    </div>
  `, () => {
    const certNo = document.getElementById('certNo').value.trim();
    if (!certNo) { showToast('Certificate number is required.', 'error'); return false; }
    const cert = addCertificate(toolId, {
      certNo,
      instrumentId: document.getElementById('certInstrId').value.trim(),
      calibrationDate: document.getElementById('certCalDate').value,
      nextDueDate: document.getElementById('certDueDate').value,
      status: document.getElementById('certStatus').value,
      fileData: document.getElementById('certFileInput')._dataUrl || null,
      fileName: document.getElementById('certFileInput')._fileName || '',
    });
    showToast(`Certificate ${cert.certNo} added!`, 'success');
    closeModal();
    handleRoute();
    return true;
  });

  // File upload handler
  const upload = document.getElementById('certFileUpload');
  const input = document.getElementById('certFileInput');
  upload.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      input._dataUrl = ev.target.result;
      input._fileName = file.name;
      upload.innerHTML = `<div class="upload-icon">✅</div><div class="upload-text">${file.name}</div>`;
    };
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════════════════════════
   TOOL DETAIL PAGE
   ══════════════════════════════════════════ */
function renderToolDetail(container, toolId) {
  const tool = getToolById(toolId);
  if (!tool) { container.innerHTML = '<div class="page-body"><div class="empty-state"><div class="empty-icon">🔍</div><h3>Tool Not Found</h3></div></div>'; return; }
  const certs = getCertsForTool(tool.id).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const market = getMarketById(tool.marketId);
  const checkout = getActiveCheckout(tool.id);
  const history = getCheckoutLog().filter(r => r.toolId === tool.id).sort((a, b) => new Date(b.checkoutTime) - new Date(a.checkoutTime));
  const transfers = getTransferLog().filter(r => r.toolId === tool.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  const calStatus = tool.requiresCalibration
    ? (tool.calibrationDueDate && new Date(tool.calibrationDueDate) < new Date()
      ? '<span class="badge badge-error">OVERDUE</span>'
      : `<span class="badge badge-success">Current</span>${tool.calibrationDueDate ? ` — Due ${tool.calibrationDueDate}` : ''}`)
    : '<span class="text-muted">Not Required</span>';

  container.innerHTML = `
    <div class="page-header">
      <h1><button class="btn btn-ghost btn-sm" onclick="history.back()">← Back</button> Tool Detail</h1>
    </div>
    <div class="page-body">
      <div class="tool-detail">
        <div class="tool-detail-header">
          <div class="tool-photo">${tool.photoData ? `<img src="${tool.photoData}" />` : '🔧'}</div>
          <span class="tool-id">${tool.id}</span>
          <h2 style="margin-top:var(--sp-sm)">${tool.name}</h2>
          ${tool.description ? `<p>${tool.description}</p>` : ''}
        </div>

        <div class="detail-grid">
          <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value">${tool.isCheckedOut ? '<span class="badge badge-warning">Checked Out</span>' : '<span class="badge badge-success">Available</span>'}</div></div>
          <div class="detail-item"><div class="detail-label">Market</div><div class="detail-value">${market ? market.name : '—'}</div></div>
          <div class="detail-item"><div class="detail-label">Location</div><div class="detail-value">${tool.sublocation || '—'}</div></div>
          <div class="detail-item"><div class="detail-label">Part Number</div><div class="detail-value text-mono">${tool.partNumber || '—'}</div></div>
          <div class="detail-item"><div class="detail-label">Serial Number</div><div class="detail-value text-mono">${tool.serialNumber || '—'}</div></div>
          <div class="detail-item"><div class="detail-label">Calibration</div><div class="detail-value">${calStatus}</div></div>
          <div class="detail-item"><div class="detail-label">Certificates</div><div class="detail-value">${certs.length}</div></div>
        </div>

        ${checkout ? `<div class="card mb-lg"><div class="card-header"><div class="card-title">📤 Current Checkout</div></div>
          <div class="cert-meta"><dt>Technician</dt><dd>${checkout.userName}</dd><dt>Since</dt><dd>${new Date(checkout.checkoutTime).toLocaleString()}</dd>
          ${checkout.checkoutLat ? `<dt>Location</dt><dd>${checkout.checkoutLat.toFixed(4)}, ${checkout.checkoutLng?.toFixed(4)}</dd>` : ''}</div></div>` : ''}

        <div class="detail-actions">
          <button class="btn btn-secondary btn-sm" onclick="openQRModal('${tool.id}')">📱 QR Code</button>
          ${tool.requiresCalibration ? `<button class="btn btn-secondary btn-sm" onclick="openCertModal('${tool.id}')">📜 Add Certificate</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="openTransferModal('${tool.id}')">🔄 Transfer</button>
        </div>

        <div class="card mb-lg">
          <div class="card-header"><div class="card-title">📜 Certificates (${certs.length})</div></div>
          ${certs.length === 0 ? `<p class="text-muted text-small">${tool.requiresCalibration ? 'No certificates yet. Add one above.' : 'This tool does not require calibration certificates.'}</p>` :
      certs.map(c => {
        const pdfLink = c.filePath ? c.filePath : (c.fileData || '');
        return `<div class="cert-card">
              <div class="cert-header"><strong>${c.certNo}</strong><span class="badge badge-${c.status === 'Pass' ? 'success' : c.status === 'Fail' ? 'error' : 'neutral'}">${c.status}</span></div>
              <div class="cert-meta">${c.instrumentId ? `<dt>Instrument ID</dt><dd>${c.instrumentId}</dd>` : ''}<dt>Calibration</dt><dd>${c.calibrationDate || '—'}</dd><dt>Next Due</dt><dd>${c.nextDueDate || '—'}</dd></div>
              ${pdfLink ? `<div class="mt-md"><a href="${pdfLink}" target="_blank" class="btn btn-sm btn-ghost">📄 View Certificate PDF</a></div>` : ''}
            </div>`;
      }).join('')}
        </div>

        <div class="card mb-lg">
          <div class="card-header"><div class="card-title">📋 Checkout History (${history.length})</div></div>
          ${history.length === 0 ? '<p class="text-muted text-small">No checkout history.</p>' : `
            <div class="table-wrapper"><table><thead><tr><th>Technician</th><th>Checked Out</th><th>Returned</th><th>Location</th></tr></thead><tbody>
            ${history.map(h => `<tr>
              <td>${h.userName}</td>
              <td>${new Date(h.checkoutTime).toLocaleString()}</td>
              <td>${h.checkinTime ? new Date(h.checkinTime).toLocaleString() : '<span class="badge badge-warning">Still Out</span>'}</td>
              <td class="text-small">${h.checkoutLat ? `${h.checkoutLat.toFixed(4)}, ${h.checkoutLng?.toFixed(4)}` : '—'}</td>
            </tr>`).join('')}
            </tbody></table></div>`}
        </div>

        ${transfers.length > 0 ? `<div class="card"><div class="card-header"><div class="card-title">🔄 Transfer History</div></div>
          <div class="table-wrapper"><table><thead><tr><th>From</th><th>To</th><th>Date</th><th>By</th></tr></thead><tbody>
          ${transfers.map(tr => {
        const from = getMarketById(tr.fromMarketId);
        const to = getMarketById(tr.toMarketId);
        return `<tr><td>${from ? from.name : '—'}</td><td>${to ? to.name : '—'}</td><td>${new Date(tr.date).toLocaleDateString()}</td><td>${tr.performedBy}</td></tr>`;
      }).join('')}</tbody></table></div></div>` : ''}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   MARKETS PAGE
   ══════════════════════════════════════════ */
function renderMarketsPage(container) {
  const markets = getMarkets();
  container.innerHTML = `
    <div class="page-header"><h1>🏢 Markets</h1><p>Manage your market locations</p>
      <div class="page-header-actions"><button class="btn btn-primary" id="addMarketBtn">+ Add Market</button></div></div>
    <div class="page-body">
      ${markets.length === 0 ? '<div class="empty-state"><div class="empty-icon">🏢</div><h3>No Markets Yet</h3><p>Add your first market to start organizing tools by location.</p></div>' : `
        <div class="stats-grid">${markets.map(m => {
    const s = getStats(m.id);
    return `<div class="stat-card" style="cursor:pointer" onclick="document.getElementById('marketFilter')?.value='${m.id}';location.hash='#tools'">
            <div class="stat-icon">🏢</div><div class="stat-value" style="font-size:1.3rem">${m.name}</div>
            <div class="stat-label">${m.location}</div>
            <div style="margin-top:var(--sp-md);display:flex;gap:var(--sp-sm)">
              <span class="badge badge-info">${s.total} tools</span>
              <span class="badge badge-success">${s.available} avail</span>
              ${s.checkedOut > 0 ? `<span class="badge badge-warning">${s.checkedOut} out</span>` : ''}
            </div>
          </div>`;
  }).join('')}</div>`}
    </div>`;

  document.getElementById('addMarketBtn').addEventListener('click', () => {
    showModal('Add Market', `
      <div class="form-group"><label>Market Name *</label><input id="marketName" class="form-control" placeholder="e.g. Atlanta" /></div>
      <div class="form-group"><label>Location / State</label><input id="marketLoc" class="form-control" placeholder="e.g. GA" /></div>
    `, () => {
      const name = document.getElementById('marketName').value.trim();
      if (!name) { showToast('Market name is required.', 'error'); return false; }
      addMarket(name, document.getElementById('marketLoc').value.trim());
      showToast(`Market "${name}" added!`, 'success');
      closeModal();
      renderMarketsPage(container);
      return true;
    });
  });
}

/* ══════════════════════════════════════════
   USERS PAGE
   ══════════════════════════════════════════ */
function renderUsersPage(container) {
  const users = getUsers();
  container.innerHTML = `
    <div class="page-header"><h1>👥 Users</h1><p>Manage system users</p>
      <div class="page-header-actions"><button class="btn btn-primary" id="addUserBtn">+ Add User</button></div></div>
    <div class="page-body">
      <div class="table-wrapper"><table><thead><tr><th>Name</th><th>Role</th><th>ID</th></tr></thead><tbody>
        ${users.map(u => `<tr><td><strong style="color:var(--text-primary)">${u.name}</strong></td><td><span class="badge ${u.role === 'admin' ? 'badge-info' : 'badge-neutral'}">${u.role}</span></td><td class="text-mono text-muted">${u.id}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;

  document.getElementById('addUserBtn').addEventListener('click', () => {
    showModal('Add User', `
      <div class="form-group"><label>Username *</label><input id="newUserName" class="form-control" placeholder="Enter username" /></div>
      <div class="form-group"><label>Password *</label><input id="newUserPass" class="form-control" type="password" placeholder="Enter password" /></div>
      <div class="form-group"><label>Role</label><select id="newUserRole" class="form-control"><option value="technician">Technician</option><option value="admin">Admin</option></select></div>
    `, () => {
      const name = document.getElementById('newUserName').value.trim();
      const pass = document.getElementById('newUserPass').value;
      if (!name || !pass) { showToast('Name and password are required.', 'error'); return false; }
      addUser(name, pass, document.getElementById('newUserRole').value, null);
      showToast(`User "${name}" created!`, 'success');
      closeModal();
      renderUsersPage(container);
      return true;
    });
  });
}

/* ══════════════════════════════════════════
   ACTIVITY LOG PAGE
   ══════════════════════════════════════════ */
function renderActivityPage(container) {
  const checkouts = getCheckoutLog().sort((a, b) => new Date(b.checkoutTime) - new Date(a.checkoutTime));
  container.innerHTML = `
    <div class="page-header"><h1>📋 Activity Log</h1><p>Check-in/out history across all tools</p></div>
    <div class="page-body">
      ${checkouts.length === 0 ? '<div class="empty-state"><div class="empty-icon">📋</div><h3>No Activity Yet</h3><p>Check-out and check-in records will appear here.</p></div>' : `
        <div class="table-wrapper"><table><thead><tr><th>Tool</th><th>Technician</th><th>Checked Out</th><th>Returned</th><th>CO Location</th><th>CI Location</th></tr></thead><tbody>
        ${checkouts.map(r => {
    const tool = getToolById(r.toolId);
    return `<tr>
            <td><span class="tool-id" style="cursor:pointer" onclick="location.hash='#tool-detail/${r.toolId}'">${r.toolId}</span>${tool ? `<br><span class="text-small text-muted">${tool.name}</span>` : ''}</td>
            <td>${r.userName}</td>
            <td>${new Date(r.checkoutTime).toLocaleString()}</td>
            <td>${r.checkinTime ? new Date(r.checkinTime).toLocaleString() : '<span class="badge badge-warning">Still Out</span>'}</td>
            <td class="text-small">${r.checkoutLat ? `${r.checkoutLat.toFixed(4)}, ${r.checkoutLng?.toFixed(4)}` : '—'}</td>
            <td class="text-small">${r.checkinLat ? `${r.checkinLat.toFixed(4)}, ${r.checkinLng?.toFixed(4)}` : '—'}</td>
          </tr>`;
  }).join('')}</tbody></table></div>`}
    </div>`;
}

/* ══════════════════════════════════════════
   MODAL HELPER
   ══════════════════════════════════════════ */
function showModal(title, bodyHtml, onConfirm, customButtons) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';

  const buttons = customButtons
    ? customButtons.map(b => `<button class="btn ${b.class}" data-modal-action="${b.label}">${b.label}</button>`).join('')
    : `<button class="btn btn-secondary" data-modal-action="cancel">Cancel</button>${onConfirm ? '<button class="btn btn-primary" data-modal-action="confirm">Save</button>' : ''}`;

  overlay.innerHTML = `<div class="modal">
    <div class="modal-header"><h2>${title}</h2><button class="modal-close" data-modal-action="close">×</button></div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-footer">${buttons}</div>
  </div>`;

  document.body.appendChild(overlay);

  // Events
  overlay.addEventListener('click', (e) => {
    const action = e.target.dataset.modalAction;
    if (action === 'close' || action === 'cancel') closeModal();
    else if (action === 'confirm' && onConfirm) onConfirm();
    else if (customButtons) {
      const btn = customButtons.find(b => b.label === action);
      if (btn && btn.action) btn.action();
    }
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();
}
