"""
Generate the complete data.js file with all 332 tools from all PDFs.
"""
import pdfplumber
import re

# ── Extract all tools from ALL PDFs ──
all_rows = []

def extract_pdf(fname):
    rows = []
    with pdfplumber.open(fname) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    for row in table:
                        if not row or not row[0]:
                            continue
                        title = str(row[0]).replace('\n', ' ').strip() if row[0] else ''
                        if title == 'Title':
                            continue
                        pn = str(row[1]).replace('\n', ' ').strip() if row[1] else ''
                        sn = str(row[2]).replace('\n', ' ').strip() if row[2] else ''
                        status = str(row[3]).replace('\n', ' ').strip() if row[3] else 'active'
                        loc = str(row[4]).replace('\n', ' ').strip() if row[4] else ''
                        cat = str(row[5]).replace('\n', ' ').strip() if row[5] else ''
                        cal = str(row[6]).replace('\n', ' ').strip() if row[6] else ''
                        rows.append({
                            'title': title, 'pn': pn, 'sn': sn,
                            'status': status, 'location': loc,
                            'categories': cat, 'calibration': cal
                        })
    return rows

all_rows.extend(extract_pdf('tools.pdf'))
for i in range(1, 7):
    all_rows.extend(extract_pdf(f'tools-{i}.pdf'))

# ── De-duplicate by title ──
seen_titles = set()
unique = []
for r in all_rows:
    key = r['title'].strip()
    if key and key not in seen_titles:
        seen_titles.add(key)
        unique.append(r)

# ── Helpers ──
def parse_cal_date(cal_str):
    if not cal_str or cal_str in ('Not Required', 'CALIBRATION DUE'):
        return ''
    m = re.search(r'(\w+)\s+(\d{1,2}),?\s*(\d{4})', cal_str)
    if m:
        months = {'January':'01','February':'02','March':'03','April':'04',
                   'May':'05','June':'06','July':'07','August':'08',
                   'September':'09','October':'10','November':'11','December':'12'}
        return f"{m.group(3)}-{months.get(m.group(1),'01')}-{m.group(2).zfill(2)}"
    return ''

def map_market(loc, title, cat):
    loc_l = (loc or '').lower()
    cat_l = (cat or '').lower()
    title_l = (title or '').lower()
    if title_l.startswith('teb ') or 'teb' in cat_l or 'teb' in loc_l: return 'teb'
    if title_l.startswith('sfb ') or title_l.startswith('sfb-') or 'sfb' in cat_l or 'sfb' in loc_l: return 'sfb'
    if title_l.startswith('tpa ') or 'tpa' in cat_l or 'tpa' in loc_l: return 'tpa'
    if title_l.startswith('vny') or 'vny' in cat_l: return 'vny'
    if title_l.startswith('las ') or 'las' in cat_l or loc_l.startswith('las'): return 'las'
    if title_l.startswith('fll ') or 'fll' in cat_l or 'fll' in loc_l: return 'fll'
    if title_l.startswith('apa ') or 'apa' in cat_l or 'apa' in loc_l: return 'apa'
    if title_l.startswith('opf ') or 'opf' in cat_l or 'opf' in loc_l: return 'opf'
    if 'bjc' in loc_l: return 'bjc'
    if 'pdk' in loc_l or 'matts' in loc_l: return 'pdk'
    if 'van 1' in loc_l or 'van 5' in loc_l: return 'pdk'
    if 'derek' in loc_l: return 'pdk'
    return 'pdk'

def map_subloc(loc):
    if not loc: return ''
    l = loc.strip()
    if l in ('DECOMMISSIONED','MISSING'): return ''
    if l == 'VAN 1': return 'Van 1'
    if l in ('VAN 5','VAN 5 LUIS VAN'): return 'Van 5'
    if 'PDK MATTS VAN' in l: return 'Matts Van'
    if l == 'PDK': return 'PDK'
    if 'BJC VAN 4' in l: return 'Van 4'
    if 'BJC VAN' in l: return 'BJC Van'
    if 'TEB VAN' in l: return 'TEB Van'
    if 'SFB VAN' in l: return 'SFB Van'
    if 'TPA VAN' in l: return 'TPA Van'
    if 'APA TRUCK' in l: return 'APA Truck'
    if 'OPF VAN' in l: return 'OPF Van'
    if 'DEREK' in l: return 'Derek Grimes'
    return l

def gen_id(title, idx):
    m = re.match(r'^(\d{3,5})\s*[-\u2013]?\s', title)
    if m: return m.group(1)
    m2 = re.match(r'^([A-Z]+\s*\d+)', title.replace('-',' '))
    if m2: return m2.group(1).strip().replace(' ','')
    return f'A{6000+idx:04d}'

def esc(s):
    return s.replace('\\','\\\\').replace("'","\\'").replace('"','\\"')

# ── Build tool records ──
tools_data = []
seen_ids = set()
for idx, r in enumerate(unique):
    tid = gen_id(r['title'], idx)
    orig_tid = tid
    suffix = 2
    while tid in seen_ids:
        tid = f"{orig_tid}_{suffix}"
        suffix += 1
    seen_ids.add(tid)
    
    status = r['status']
    if status not in ('active','decommissioned','out_for_repair','reference','calibration'):
        status = 'active'
    
    requires_cal = 'Next due' in r['calibration']
    cal_date = parse_cal_date(r['calibration'])
    if r['calibration'] == 'CALIBRATION DUE':
        requires_cal = True
    
    tools_data.append({
        'id': tid,
        'name': esc(r['title']),
        'pn': esc(r['pn']),
        'sn': esc(r['sn']),
        'market': map_market(r['location'], r['title'], r['categories']),
        'subloc': map_subloc(r['location']),
        'status': status,
        'reqCal': requires_cal,
        'calDate': cal_date,
    })

# ── Generate JS ──
tool_lines = []
for t in tools_data:
    status_arg = f", '{t['status']}'" if t['status'] != 'active' else ''
    tool_lines.append(f"  t('{t['id']}', '{t['name']}', '{t['pn']}', '{t['sn']}', {t['market']}.id, '{t['subloc']}', {str(t['reqCal']).lower()}, '{t['calDate']}'{status_arg});")

SEED_TOOLS = '\n'.join(tool_lines)

# Count by market
market_counts = {}
for t in tools_data:
    market_counts[t['market']] = market_counts.get(t['market'], 0) + 1

js = f'''/* \\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550
   DATA LAYER \\u2014 localStorage-backed persistence
   Advanced AOG Avionics \\u2014 Tool & Calibration Inventory
   \\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550 */

const DB_KEYS = {{
  markets: 'tv_markets',
  tools: 'tv_tools',
  certs: 'tv_certs',
  checkouts: 'tv_checkouts',
  transfers: 'tv_transfers',
  users: 'tv_users',
  counter: 'tv_counter',
  seeded: 'tv_seeded_v3',
}};

/* \\u2500\\u2500 Generic helpers \\u2500\\u2500 */
function _load(key) {{
  try {{ return JSON.parse(localStorage.getItem(key)) || []; }}
  catch {{ return []; }}
}}
function _save(key, data) {{ localStorage.setItem(key, JSON.stringify(data)); }}
function _loadScalar(key, fallback) {{
  const v = localStorage.getItem(key);
  return v !== null ? JSON.parse(v) : fallback;
}}
function _saveScalar(key, val) {{ localStorage.setItem(key, JSON.stringify(val)); }}
function _uid() {{ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }}

/* \\u2550\\u2550\\u2550 MARKETS \\u2550\\u2550\\u2550 */
function getMarkets() {{ return _load(DB_KEYS.markets); }}

function addMarket(name, location, id) {{
  const markets = getMarkets();
  const m = {{ id: id || _uid(), name, location, createdAt: new Date().toISOString() }};
  markets.push(m);
  _save(DB_KEYS.markets, markets);
  return m;
}}

function getMarketById(id) {{ return getMarkets().find(m => m.id === id) || null; }}

/* \\u2550\\u2550\\u2550 TOOLS \\u2550\\u2550\\u2550 */
function getToolIdCounter() {{ return _loadScalar(DB_KEYS.counter, 7000); }}
function _bumpCounter() {{
  const c = getToolIdCounter();
  _saveScalar(DB_KEYS.counter, c + 1);
  return c;
}}

function generateToolId() {{
  return String(_bumpCounter());
}}

function getTools() {{ return _load(DB_KEYS.tools); }}

function addTool(name, description, marketId, photoData, opts) {{
  opts = opts || {{}};
  const tools = getTools();
  const t = {{
    id: opts.id || generateToolId(),
    name,
    description: description || '',
    marketId,
    photoData: photoData || null,
    partNumber: opts.partNumber || '',
    serialNumber: opts.serialNumber || '',
    requiresCalibration: opts.requiresCalibration !== undefined ? opts.requiresCalibration : false,
    calibrationDueDate: opts.calibrationDueDate || '',
    sublocation: opts.sublocation || '',
    status: opts.status || 'active',   // active | decommissioned | out_for_repair
    isCheckedOut: false,
    checkedOutBy: null,
    createdAt: new Date().toISOString(),
  }};
  tools.push(t);
  _save(DB_KEYS.tools, tools);
  return t;
}}

function getToolById(id) {{ return getTools().find(t => t.id === id) || null; }}

function getToolsByMarket(marketId) {{ return getTools().filter(t => t.marketId === marketId); }}

function updateTool(id, updates) {{
  const tools = getTools();
  const idx = tools.findIndex(t => t.id === id);
  if (idx === -1) return null;
  Object.assign(tools[idx], updates);
  _save(DB_KEYS.tools, tools);
  return tools[idx];
}}

function deleteTool(id) {{
  let tools = getTools();
  tools = tools.filter(t => t.id !== id);
  _save(DB_KEYS.tools, tools);
}}

/* \\u2550\\u2550\\u2550 CERTIFICATES \\u2550\\u2550\\u2550 */
function getCertificates() {{ return _load(DB_KEYS.certs); }}

function getCertsForTool(toolId) {{ return getCertificates().filter(c => c.toolId === toolId); }}

function addCertificate(toolId, data) {{
  const certs = getCertificates();
  const c = {{
    id: _uid(),
    toolId,
    certNo: data.certNo || '',
    instrumentId: data.instrumentId || '',
    calibrationDate: data.calibrationDate || '',
    nextDueDate: data.nextDueDate || '',
    status: data.status || 'Pass',
    fileData: data.fileData || null,
    fileName: data.fileName || '',
    filePath: data.filePath || '',
    uploadedAt: new Date().toISOString(),
  }};
  certs.push(c);
  _save(DB_KEYS.certs, certs);
  return c;
}}

function deleteCertificate(certId) {{
  let certs = getCertificates();
  certs = certs.filter(c => c.id !== certId);
  _save(DB_KEYS.certs, certs);
}}

/* \\u2550\\u2550\\u2550 CHECKOUTS \\u2550\\u2550\\u2550 */
function getCheckoutLog() {{ return _load(DB_KEYS.checkouts); }}

function getActiveCheckout(toolId) {{
  return getCheckoutLog().find(r => r.toolId === toolId && !r.checkinTime) || null;
}}

function checkoutTool(toolId, userId, userName, lat, lng) {{
  const tool = getToolById(toolId);
  if (!tool || tool.isCheckedOut) return null;

  updateTool(toolId, {{ isCheckedOut: true, checkedOutBy: userName }});

  const log = getCheckoutLog();
  const record = {{
    id: _uid(),
    toolId,
    userId,
    userName,
    checkoutTime: new Date().toISOString(),
    checkinTime: null,
    checkoutLat: lat,
    checkoutLng: lng,
    checkinLat: null,
    checkinLng: null,
  }};
  log.push(record);
  _save(DB_KEYS.checkouts, log);
  return record;
}}

function checkinTool(toolId, lat, lng) {{
  const tool = getToolById(toolId);
  if (!tool || !tool.isCheckedOut) return null;

  updateTool(toolId, {{ isCheckedOut: false, checkedOutBy: null }});

  const log = getCheckoutLog();
  const rec = log.filter(r => r.toolId === toolId && !r.checkinTime)
    .sort((a, b) => new Date(b.checkoutTime) - new Date(a.checkoutTime))[0];
  if (rec) {{
    rec.checkinTime = new Date().toISOString();
    rec.checkinLat = lat;
    rec.checkinLng = lng;
  }}
  _save(DB_KEYS.checkouts, log);
  return rec || null;
}}

/* \\u2550\\u2550\\u2550 TRANSFERS \\u2550\\u2550\\u2550 */
function getTransferLog() {{ return _load(DB_KEYS.transfers); }}

function transferTool(toolId, toMarketId, performedBy) {{
  const tool = getToolById(toolId);
  if (!tool) return null;
  const fromMarketId = tool.marketId;

  updateTool(toolId, {{ marketId: toMarketId }});

  const log = getTransferLog();
  const rec = {{
    id: _uid(),
    toolId,
    fromMarketId,
    toMarketId,
    date: new Date().toISOString(),
    performedBy,
  }};
  log.push(rec);
  _save(DB_KEYS.transfers, log);
  return rec;
}}

/* \\u2550\\u2550\\u2550 USERS \\u2550\\u2550\\u2550 */
const DEFAULT_USERS = [
  {{ id: 'admin1', name: 'admin', password: 'admin123', role: 'admin', marketId: null }},
  {{ id: 'tech1', name: 'technician', password: 'tech123', role: 'technician', marketId: null }},
];

function getUsers() {{
  let users = _load(DB_KEYS.users);
  if (users.length === 0) {{
    users = [...DEFAULT_USERS];
    _save(DB_KEYS.users, users);
  }}
  return users;
}}

function getUserById(id) {{ return getUsers().find(u => u.id === id) || null; }}

function addUser(name, password, role, marketId) {{
  const users = getUsers();
  const u = {{ id: _uid(), name, password, role, marketId: marketId || null }};
  users.push(u);
  _save(DB_KEYS.users, users);
  return u;
}}

/* \\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550
   SEED DATA \\u2014 Real inventory from Advanced AOG Avionics
   Source: Quantum MX export (tools.pdf + tools-1..6.pdf)
   {len(tools_data)} tools | {sum(1 for t in tools_data if t['reqCal'])} require calibration
   \\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550\\u2550 */
function seedDemoData() {{
  if (_loadScalar(DB_KEYS.seeded, false)) return;

  // Clear old data
  Object.values(DB_KEYS).forEach(k => {{ if (k !== DB_KEYS.seeded) localStorage.removeItem(k); }});

  // \\u2500\\u2500 Markets \\u2500\\u2500
  const bjc  = addMarket('BJC \\u2014 Broomfield',       'Rocky Mountain Metro Airport, CO', 'bjc');
  const pdk  = addMarket('PDK \\u2014 Atlanta',          'DeKalb-Peachtree Airport, GA',     'pdk');
  const teb  = addMarket('TEB \\u2014 Teterboro',        'Teterboro Airport, NJ',            'teb');
  const fll  = addMarket('FLL \\u2014 Fort Lauderdale',  'Fort Lauderdale-Hollywood Intl, FL','fll');
  const las  = addMarket('LAS \\u2014 Las Vegas',        'Harry Reid Intl Airport, NV',      'las');
  const vny  = addMarket('VNY \\u2014 Van Nuys',         'Van Nuys Airport, CA',             'vny');
  const gjam = addMarket('GJAM \\u2014 Georgia Jet',     'Georgia Jet Aviation Maintenance',  'gjam');
  const sfb  = addMarket('SFB \\u2014 Sanford',          'Orlando Sanford Intl Airport, FL', 'sfb');
  const tpa  = addMarket('TPA \\u2014 Tampa',            'Tampa Intl Airport, FL',           'tpa');
  const apa  = addMarket('APA \\u2014 Centennial',       'Centennial Airport, CO',           'apa');
  const opf  = addMarket('OPF \\u2014 Opa-Locka',        'Opa-Locka Executive Airport, FL',  'opf');

  // Helper: add a tool with all fields
  function t(id, name, pn, sn, marketId, subloc, reqCal, calDue, status) {{
    return addTool(name, '', marketId, null, {{
      id: String(id),
      partNumber: pn || '',
      serialNumber: sn || '',
      requiresCalibration: reqCal,
      calibrationDueDate: calDue || '',
      sublocation: subloc || '',
      status: status || 'active',
    }});
  }}

  // \\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500
  // ALL TOOLS ({len(tools_data)} total)
  // \\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500
{SEED_TOOLS}

  // \\u2500\\u2500 Certificates (from Examples/ folder) \\u2500\\u2500
  addCertificate('1002', {{ certNo: 'A-1002', instrumentId: '111971051', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1002.pdf', fileName: 'A-1002.pdf' }});
  addCertificate('1003', {{ certNo: 'A-1003', instrumentId: '0522906156', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1003.pdf', fileName: 'A-1003.pdf' }});
  addCertificate('1004', {{ certNo: 'A-1004', instrumentId: '26272', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1004.pdf', fileName: 'A-1004.pdf' }});
  addCertificate('1005', {{ certNo: 'A-1005', instrumentId: '0522112225', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1005.pdf', fileName: 'A-1005.pdf' }});
  addCertificate('1006', {{ certNo: 'A-1006', instrumentId: '0522906978', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1006.pdf', fileName: 'A-1006.pdf' }});
  addCertificate('1007', {{ certNo: 'A-1007', instrumentId: '', calibrationDate: '', nextDueDate: '', status: 'N/A', filePath: 'Examples/A-1007.pdf', fileName: 'A-1007.pdf' }});
  addCertificate('1008', {{ certNo: 'A-1008', instrumentId: '', calibrationDate: '', nextDueDate: '', status: 'N/A', filePath: 'Examples/A-1008.pdf', fileName: 'A-1008.pdf' }});

  _saveScalar(DB_KEYS.seeded, true);
}}

/* \\u2550\\u2550\\u2550 STATS HELPERS \\u2550\\u2550\\u2550 */
function getStats(marketId) {{
  let tools = getTools().filter(t => t.status !== 'decommissioned');
  if (marketId) tools = tools.filter(t => t.marketId === marketId);
  const total = tools.length;
  const checkedOut = tools.filter(t => t.isCheckedOut).length;
  const available = total - checkedOut;
  const calTools = tools.filter(t => t.requiresCalibration);
  const calDueSoon = calTools.filter(t => {{
    if (!t.calibrationDueDate) return false;
    const diff = (new Date(t.calibrationDueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }}).length;
  const calOverdue = calTools.filter(t => {{
    if (!t.calibrationDueDate) return false;
    return new Date(t.calibrationDueDate) < new Date();
  }}).length;
  const outForRepair = getTools().filter(t => t.status === 'out_for_repair' && (!marketId || t.marketId === marketId)).length;
  const decommissioned = getTools().filter(t => t.status === 'decommissioned' && (!marketId || t.marketId === marketId)).length;
  return {{ total, checkedOut, available, calDueSoon, calOverdue, calTools: calTools.length, outForRepair, decommissioned }};
}}
'''

with open('js/data.js', 'w') as f:
    f.write(js)

cal_count = sum(1 for t in tools_data if t['reqCal'])
decomm_count = sum(1 for t in tools_data if t['status'] == 'decommissioned')
repair_count = sum(1 for t in tools_data if t['status'] == 'out_for_repair')
print(f"Generated js/data.js with {len(tools_data)} tools")
print(f"  Calibrated: {cal_count}")
print(f"  Decommissioned: {decomm_count}")
print(f"  Out for repair: {repair_count}")
print(f"  Markets: {sorted(set(t['market'] for t in tools_data))}")
for m, c in sorted(market_counts.items()):
    print(f"    {m}: {c} tools")
