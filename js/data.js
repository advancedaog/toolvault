/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   DATA LAYER \u2014 localStorage-backed persistence
   Advanced AOG Avionics \u2014 Tool & Calibration Inventory
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */

const DB_KEYS = {
  markets: 'tv_markets',
  tools: 'tv_tools',
  certs: 'tv_certs',
  checkouts: 'tv_checkouts',
  transfers: 'tv_transfers',
  users: 'tv_users',
  counter: 'tv_counter',
  seeded: 'tv_seeded_v3',
};

/* \u2500\u2500 Generic helpers \u2500\u2500 */
function _load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function _save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function _loadScalar(key, fallback) {
  const v = localStorage.getItem(key);
  return v !== null ? JSON.parse(v) : fallback;
}
function _saveScalar(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function _uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* \u2550\u2550\u2550 MARKETS \u2550\u2550\u2550 */
function getMarkets() { return _load(DB_KEYS.markets); }

function addMarket(name, location, id) {
  const markets = getMarkets();
  const m = { id: id || _uid(), name, location, createdAt: new Date().toISOString() };
  markets.push(m);
  _save(DB_KEYS.markets, markets);
  return m;
}

function getMarketById(id) { return getMarkets().find(m => m.id === id) || null; }

/* \u2550\u2550\u2550 TOOLS \u2550\u2550\u2550 */
function getToolIdCounter() { return _loadScalar(DB_KEYS.counter, 7000); }
function _bumpCounter() {
  const c = getToolIdCounter();
  _saveScalar(DB_KEYS.counter, c + 1);
  return c;
}

function generateToolId() {
  return String(_bumpCounter());
}

function getTools() { return _load(DB_KEYS.tools); }

function addTool(name, description, marketId, photoData, opts) {
  opts = opts || {};
  const tools = getTools();
  const t = {
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
  };
  tools.push(t);
  _save(DB_KEYS.tools, tools);
  return t;
}

function getToolById(id) { return getTools().find(t => t.id === id) || null; }

function getToolsByMarket(marketId) { return getTools().filter(t => t.marketId === marketId); }

function updateTool(id, updates) {
  const tools = getTools();
  const idx = tools.findIndex(t => t.id === id);
  if (idx === -1) return null;
  Object.assign(tools[idx], updates);
  _save(DB_KEYS.tools, tools);
  return tools[idx];
}

function deleteTool(id) {
  let tools = getTools();
  tools = tools.filter(t => t.id !== id);
  _save(DB_KEYS.tools, tools);
}

/* \u2550\u2550\u2550 CERTIFICATES \u2550\u2550\u2550 */
function getCertificates() { return _load(DB_KEYS.certs); }

function getCertsForTool(toolId) { return getCertificates().filter(c => c.toolId === toolId); }

function addCertificate(toolId, data) {
  const certs = getCertificates();
  const c = {
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
  };
  certs.push(c);
  _save(DB_KEYS.certs, certs);
  return c;
}

function deleteCertificate(certId) {
  let certs = getCertificates();
  certs = certs.filter(c => c.id !== certId);
  _save(DB_KEYS.certs, certs);
}

/* \u2550\u2550\u2550 CHECKOUTS \u2550\u2550\u2550 */
function getCheckoutLog() { return _load(DB_KEYS.checkouts); }

function getActiveCheckout(toolId) {
  return getCheckoutLog().find(r => r.toolId === toolId && !r.checkinTime) || null;
}

function checkoutTool(toolId, userId, userName, lat, lng) {
  if (!lat || !lng) return null;
  const tool = getToolById(toolId);
  if (!tool || tool.isCheckedOut) return null;

  updateTool(toolId, { isCheckedOut: true, checkedOutBy: userName });

  const log = getCheckoutLog();
  const record = {
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
  };
  log.push(record);
  _save(DB_KEYS.checkouts, log);
  return record;
}

function checkinTool(toolId, lat, lng) {
  if (!lat || !lng) return null;
  const tool = getToolById(toolId);
  if (!tool || !tool.isCheckedOut) return null;

  updateTool(toolId, { isCheckedOut: false, checkedOutBy: null });

  const log = getCheckoutLog();
  const rec = log.filter(r => r.toolId === toolId && !r.checkinTime)
    .sort((a, b) => new Date(b.checkoutTime) - new Date(a.checkoutTime))[0];
  if (rec) {
    rec.checkinTime = new Date().toISOString();
    rec.checkinLat = lat;
    rec.checkinLng = lng;
  }
  _save(DB_KEYS.checkouts, log);
  return rec || null;
}

/* \u2550\u2550\u2550 TRANSFERS \u2550\u2550\u2550 */
function getTransferLog() { return _load(DB_KEYS.transfers); }

function transferTool(toolId, toMarketId, performedBy) {
  const tool = getToolById(toolId);
  if (!tool) return null;
  const fromMarketId = tool.marketId;

  updateTool(toolId, { marketId: toMarketId });

  const log = getTransferLog();
  const rec = {
    id: _uid(),
    toolId,
    fromMarketId,
    toMarketId,
    date: new Date().toISOString(),
    performedBy,
  };
  log.push(rec);
  _save(DB_KEYS.transfers, log);
  return rec;
}

/* \u2550\u2550\u2550 USERS \u2550\u2550\u2550 */
const DEFAULT_USERS = [
  { id: 'admin1', name: 'admin', password: 'admin123', role: 'admin', marketId: null },
  { id: 'tech1', name: 'technician', password: 'tech123', role: 'technician', marketId: null },
];

function getUsers() {
  let users = _load(DB_KEYS.users);
  if (users.length === 0) {
    users = [...DEFAULT_USERS];
    _save(DB_KEYS.users, users);
  }
  return users;
}

function getUserById(id) { return getUsers().find(u => u.id === id) || null; }

function addUser(name, password, role, marketId) {
  const users = getUsers();
  const u = { id: _uid(), name, password, role, marketId: marketId || null };
  users.push(u);
  _save(DB_KEYS.users, users);
  return u;
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   SEED DATA \u2014 Real inventory from Advanced AOG Avionics
   Source: Quantum MX export (tools.pdf + tools-1..6.pdf)
   332 tools | 70 require calibration
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function seedDemoData() {
  if (_loadScalar(DB_KEYS.seeded, false)) return;

  // Clear old data
  Object.values(DB_KEYS).forEach(k => { if (k !== DB_KEYS.seeded) localStorage.removeItem(k); });

  // \u2500\u2500 Markets \u2500\u2500
  const bjc = addMarket('BJC \u2014 Broomfield', 'Rocky Mountain Metro Airport, CO', 'bjc');
  const pdk = addMarket('PDK \u2014 Atlanta', 'DeKalb-Peachtree Airport, GA', 'pdk');
  const teb = addMarket('TEB \u2014 Teterboro', 'Teterboro Airport, NJ', 'teb');
  const fll = addMarket('FLL \u2014 Fort Lauderdale', 'Fort Lauderdale-Hollywood Intl, FL', 'fll');
  const las = addMarket('LAS \u2014 Las Vegas', 'Harry Reid Intl Airport, NV', 'las');
  const vny = addMarket('VNY \u2014 Van Nuys', 'Van Nuys Airport, CA', 'vny');
  const gjam = addMarket('GJAM \u2014 Georgia Jet', 'Georgia Jet Aviation Maintenance', 'gjam');
  const sfb = addMarket('SFB \u2014 Sanford', 'Orlando Sanford Intl Airport, FL', 'sfb');
  const tpa = addMarket('TPA \u2014 Tampa', 'Tampa Intl Airport, FL', 'tpa');
  const apa = addMarket('APA \u2014 Centennial', 'Centennial Airport, CO', 'apa');
  const opf = addMarket('OPF \u2014 Opa-Locka', 'Opa-Locka Executive Airport, FL', 'opf');

  // Helper: add a tool with all fields
  function t(id, name, pn, sn, marketId, subloc, reqCal, calDue, status) {
    return addTool(name, '', marketId, null, {
      id: String(id),
      partNumber: pn || '',
      serialNumber: sn || '',
      requiresCalibration: reqCal,
      calibrationDueDate: calDue || '',
      sublocation: subloc || '',
      status: status || 'active',
    });
  }

  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // ALL TOOLS (332 total)
  // \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  t('1000', '1000 - VAN 1', '', 'VIN : 3C6LRVDG7NE112744', pdk.id, '', false, '');
  t('1001', '1001 - TIRE SERVICE GAUGE 0-300 PSI', '0-300', 'RA29565', pdk.id, 'Van 1', true, '2026-09-02');
  t('1002', '1002 - LZU11- SANLIANG TORQUE SCREWDRIVER WRENCH', 'X002YJ60OV', '111971051', pdk.id, 'Van 1', true, '2026-03-08');
  t('1003', '1003 - LZU12 - TORQUE WRENCH ADJUSTABLE 10IN/LB-50IN/LB', '501MRMH', '0522906156', pdk.id, 'Van 1', true, '2026-03-08');
  t('1004', '1004 - LZU 13 - TIRE GAUGE 0 O 400 PSI', '8844', '26272', pdk.id, 'Van 1', true, '2026-03-08');
  t('1005', '1005 - LZU 5 - TORQUE WRENCH 50FT/LB-250 FT/LB', '2503MFRMH', '0522112225', pdk.id, 'Van 1', true, '2026-03-08');
  t('1006', '1006 - LZU 6 - TORQUE WRENCH 50IN/LB-250IN/LB', '2502MRMH', '0522906978', pdk.id, 'Van 1', true, '2026-03-08');
  t('1007', '1007 - WHEEL BEARING LOCKNUT SOCKET 3-1/2\"', 'OTC1910 3-1/2\"', '', pdk.id, 'Van 1', false, '');
  t('1008', '1008 - 1\" DRIVE- 3-3/4\" IMPACT SOCKET', '5120', '', pdk.id, 'Van 1', false, '');
  t('1009', '1009 - O2 REG KIT 15\' HOSE', 'O2HPK-15', 'JOSH MILLARD', pdk.id, 'Van 1', false, '');
  t('1010', '1010 - NITRO REG KIT 22\' HOSE', 'NHPK-22', 'JOSH MILLARD', pdk.id, 'Van 1', false, '');
  t('1011', '1011 - FLUID SERVICE UNIT', '06-5022-6500', '737220708', pdk.id, 'Matts Van', false, '');
  t('1012', '1012 - FLUID SERVICE UNIT', '06-5022-6600', '8839220803', pdk.id, 'Matts Van', false, '');
  t('1013', '1013 - FLUID SERVICE UNIT', '06-5022-6500', '0143220610', pdk.id, 'Matts Van', false, '');
  t('1014', '1014 - LITTLE GIANT', '', '', pdk.id, 'Van 1', false, '');
  t('1015', '1015 - TOOL BOX', 'HUSKY', '', pdk.id, 'Van 1', false, '');
  t('1016', '1016 - AIR HAMMER', '92037', '35399282022', pdk.id, 'Van 1', false, '');
  t('1017', '1017 - RIVET KIT', 'HP-2', '39001', pdk.id, 'Van 1', false, '');
  t('1018', '1018 - GREASE GUN', '', '', pdk.id, 'Van 1', false, '');
  t('1019', '1019 - MISC. TOOLS', '', '', pdk.id, 'Van 1', false, '');
  t('1020', '1020 - REMOVAL TOOLS', '', '', pdk.id, 'Van 1', false, '');
  t('1021', '1021 - HYDRAULIC BRAKE BLEEDING KIT', 'BBK1601-01', '', pdk.id, 'Van 1', false, '');
  t('1022', '1022 - LIGHT BULB KIT', '', '', pdk.id, 'Van 1', false, '');
  t('1023', '1023 - AIR COMPRESSOR KIT', 'HUSKY', '', pdk.id, 'Van 1', false, '');
  t('1024', '1024 - SOLDERING BASE', 'WELLER', '', pdk.id, 'Van 1', false, '');
  t('1025', '1025 - MIL-SPEC TERMINALS', 'HI-LINE', '', pdk.id, 'Van 1', false, '');
  t('1026', '1026 - 1\" DRIVE IMPACT TOOL KIT', 'JQ-1-ZTO21A', '', pdk.id, 'Van 1', false, '');
  t('1027', '1027 - IMPACT ADAPTER AND REDUCER KIT', 'NEIKO 30223A', '', pdk.id, 'Van 1', false, '');
  t('1028', '1028 - WHEEL BEARING LOCKNUT SOCKET 2-7/8\"', 'OTC 1932', '', pdk.id, 'Van 1', false, '');
  t('1029', '1029 - 50\' HOSE', '', 'GREY', pdk.id, 'Van 1', false, '');
  t('1031', '1031 - NITROGEN HOSE', '', '', pdk.id, 'Van 1', false, '');
  t('1032', '1032 - OXYGEN BRAIDED HOSE', '', '', pdk.id, 'Van 1', false, '');
  t('1033', '1033 - HEAT GUN', 'FURNO', '', pdk.id, 'Van 1', false, '');
  t('1034', '1034 - AIR COMPRESSOR', 'RIGID', '', pdk.id, 'Van 1', false, '');
  t('A6034', '10\' POLOFLOW HOSE', '', 'BLACK', pdk.id, 'Van 1', false, '');
  t('A6035', '2380', '21 cans 1/24/25', 'Expires 1/24/28', teb.id, 'TEB Van', false, '');
  t('A6036', '2 GREASE GUNS', '', '', bjc.id, 'BJC Van', false, '');
  t('A6037', '360272247 impact adapter kit', '', '', bjc.id, 'BJC Van', false, '');
  t('A6038', '3 LIGHT BARS', '', '', pdk.id, 'Matts Van', false, '');
  t('4001', '4001 - LZUII 1- TORQUE DR 10-70IN/LB', 'X002YJ60OV', '', bjc.id, 'Van 4', true, '2026-06-18');
  t('4002', '4002 - LZUII 4- TORQUE WRENCH 50IN/LB-250IN/LB', '2502MRMH', '0922111408', bjc.id, 'Van 4', true, '2026-06-18');
  t('4003', '4003 - LZUII 5 - TORQUE 10IN/LB- 50IN/LB', '501MRMH', '0722900118', bjc.id, 'Van 4', true, '2026-06-18');
  t('4004', '4004 - LZUII 6- TORQUE WRENCH 50FT/LB-250FT/LB', '2503MFRMH', '1022120900', bjc.id, 'Van 4', true, '2026-06-18');
  t('4005', '4005 - LZUII 7- TIRE GAUGE 0-400PSI', '8844', '26892', bjc.id, 'Van 4', true, '2026-06-23');
  t('5000', '5000 - VAN 5 MX FORMS -LUIS VAN', 'VIN 1FTBW3X84PKA0509 1', '2023 FORD TRANSIT CARGO VAN', pdk.id, 'Van 5', false, '');
  t('5001', '5001 - AUTO AIR CONDITIONING MANIFOLD GAUGE', '', '', pdk.id, 'Van 5', false, '');
  t('5002', '5002 - Klein Tools Digital Multimeter', 'MM320', '1021U-A1', pdk.id, 'Van 5', true, '2026-06-11');
  t('5003', '5003 - TIRE SERVICE GAUGE 0-300 PSI', '0-300', 'RA27055', pdk.id, 'Van 5', true, '2026-06-11');
  t('5004', '5004 - TORQUE WRENCH 10IN/LB- 50IN/LB', '501MRMH', '0522906203', pdk.id, 'Van 5', true, '2026-06-11');
  t('5005', '5005 - TORQUE WRENCH 50IN/LB-250 IN/LB', '2502MRMH', '0522907008', pdk.id, 'Van 5', true, '2026-06-11');
  t('5006', '5006- TORQUE DR 10-70IN/LB', 'X002YJ60OV', 'N/A', pdk.id, 'Van 5', true, '2026-06-11');
  t('5007', '5007- TIRE GAUGE 0-400PSI', '8844', '26907', pdk.id, 'Van 5', true, '2026-06-11');
  t('5008', '5008 - TORQUE WRENCH 50FT/LB- 250FT/LB', '2503MFRMH', '1022120886', pdk.id, 'Van 5', true, '2026-06-11');
  t('5009', '5009 - LASKO FAN', 'LASKO FAN', '5009', pdk.id, 'Van 5', false, '');
  t('5010', '5010 - LUBRICATION KIT IN DEWALT BOX', '', '', pdk.id, 'Van 5', false, '');
  t('5011', '5011 - MADDOX FLARING TOOL KIT', 'MF 18-1', 'N/A', pdk.id, 'Van 5', false, '');
  t('5012', '5012 - PRINTER', '', '', pdk.id, 'Van 5', false, '');
  t('5013', '5013 - TOOLBOX', 'HUSKY TOOLBOX (BLUE)', 'NSN', pdk.id, 'Van 5', false, '');
  t('5014', '5014 - 100FT ORANGE EXTENSION CABLE', '', '', pdk.id, 'Van 5', false, '');
  t('5015', '5015 - QD GOOSENECK STEEL BRAIDED LINE', '', '', pdk.id, 'Van 5', false, '');
  t('5016', '5016 - 6FT QD OXYGEN SERVICING STEEL BRAIDED LINE', '', '', pdk.id, 'Van 5', false, '');
  t('5017', '5017 - STEEL BRAIDED LINE', '', '', pdk.id, 'Van 5', false, '');
  t('5018', '5018 - STEEL BRAIDED LINE', '', '', pdk.id, 'Van 5', false, '');
  t('5019', '5019 - 3 STEP LADDER', '', '', pdk.id, 'Van 5', false, '');
  t('5020', '5020 - GORILLA LADDER 18FT MAX', '', '', pdk.id, 'Van 5', false, '');
  t('5021', '5021 - GORILLA WORK PLATFORM LADDER', '', '', pdk.id, 'Van 5', false, '');
  t('5022', '5022 - INVERTER', '', 'MAGNUM DIMENSIONS', pdk.id, 'Van 5', false, '');
  t('5023', '5023 - OXYGEN REGULATOR', 'O2HPK-15', '', pdk.id, 'Van 5', false, '');
  t('5024', '5024 - NITROGEN REGULATOR', 'NHPK-22', '', pdk.id, 'Van 5', false, '');
  t('5025', '5025 - 17 TON JACK', '91-2928-0132', '8710-8691', pdk.id, 'Van 5', false, '');
  t('5026', '5026 - NITROGEN REEL', '', '', pdk.id, 'Van 5', false, '');
  t('5027', '5027 - 25TON JACK', '02-7830C0100', '3024220602', pdk.id, 'Van 5', false, '');
  t('5028', '5028 - DIGITAL TIRE GAUGE', 'EAU472', '20013110009', pdk.id, 'Van 5', true, '2026-06-23');
  t('A1001', 'A-1001 - CABLE TENSIOMETER', 'T5-2002-101-00', '77861', pdk.id, 'PDK', true, '2026-06-12');
  t('A1002', 'A- 1002 -TIRE PRESSURE GAUGE 0-300 PSI', '300-ATG-1', 'T-56384', pdk.id, 'PDK', true, '2027-02-03');
  t('A1003', 'A-1003 -TORQUE 50FT/LB-250FT/LB', '2503MFRMH', '0423120498', pdk.id, 'PDK', true, '2027-02-03');
  t('A1004', 'A-1004 - TORQUE WRENCH 50 INCH-250 IN/LB', '2502MRPH', '0125114320', pdk.id, 'PDK', true, '2027-02-03');
  t('A1005', 'A-1005 -SETTING TORQUE TOOL 40- 200IN/LB', 'TWM200A', 'V070010', pdk.id, 'PDK', true, '2027-02-03');
  t('A1006', 'A-1006 - SETTING TORQUE TOOL 20- 100FT/LB', 'TWXF100', 'V060268', pdk.id, 'PDK', true, '2027-02-03');
  t('A1007', 'A-1007 - AIRCRAFT AIR STRUT SERVICE TOOL 0 TO 3000PSI', '8876', '23520', pdk.id, 'PDK', true, '2027-02-03');
  t('A1008', 'A-1008 - TORQUE WRENCH ADJUSTABLE 10IN/LB-50IN/LB', '501MRMH', '0324122020', pdk.id, 'PDK', true, '2027-02-03');
  t('A1009', 'A-1009 -TORQUE SCREWDRIVER', 'X002YJ60OV', '10-70IN/LB', pdk.id, 'PDK', false, '', 'decommissioned');
  t('A6082', 'AIRCONDITIONING SERVICING KIT', '', '', bjc.id, 'BJC Van', false, '');
  t('A6083', 'AIRHAMMER SET 14 PIECES', '', '', bjc.id, 'BJC Van', false, '');
  t('A6084', 'AIR LIFT LOAD LIFTER 5000 AIR SUSPENSION KIT', '', '', pdk.id, 'Matts Van', false, '');
  t('A6085', 'AOG-PDK 001 - DMC HX4 CRIMPER', 'MIL. HX4', 'M22520/5-01', pdk.id, 'PDK', false, '', 'calibration');
  t('A6086', 'AOG-PDK - LASER THERMOMETER', 'FLUKE 62 MAX', 'IR THERMOMETER', pdk.id, 'PDK', false, '');
  t('APA10', 'APA 10 -12 TON JACK', '02-7813C0100', '6618221201', apa.id, 'APA Truck', false, '');
  t('APA11', 'APA 11 -25 TON JACK', '02-7830C0100', '5305220901', apa.id, 'APA Truck', false, '');
  t('APA12', 'APA 12- FLUID SERVICE UNIT', '06-5022-6500', '4236221101', apa.id, 'APA Truck', false, '');
  t('APA13', 'APA13- FLUID SERVICE UNIT', '06-5022-6500', '7180221204', apa.id, 'APA Truck', false, '');
  t('APA14', 'APA14- FLUID SERVICE UNIT', '06-5022-6500', '8322221002', apa.id, 'APA Truck', false, '');
  t('APA15', 'APA 15 - 3000 PSI TIRE GAUGE', 'N/A', 'T-45774', apa.id, 'APA Truck', true, '2026-06-23');
  t('APA16', 'APA 16 - 300 PSI TIRE GAUGE', 'TTL-300-HA', '22101007004', apa.id, 'APA Truck', true, '2026-06-23');
  t('APA17', 'APA 17- O2 REGULATOR', 'O2HPK', '', apa.id, 'APA Truck', false, '');
  t('APA18', 'APA 18- NITROGEN HOSE 22\'', 'NH-22', '', apa.id, 'APA Truck', false, '');
  t('APA19', 'APA 19 - NITROGEN REGULATOR', 'NHPK', '', apa.id, 'APA Truck', false, '');
  t('APA1', 'APA1- TORQUE DR. 10-17 IN/LB', 'X002YJ60OV', 'APA 1', apa.id, 'APA Truck', true, '2026-06-18');
  t('APA20', 'APA 20 - OXYGEN HOSE', '', '', apa.id, 'APA Truck', false, '');
  t('APA21', 'APA 21 - TRONAIR WING JACK', '02-1032-0111', '515414001', apa.id, 'APA Truck', false, '');
  t('APA22', 'APA 22 - TRONAIR WING JACK', '02-1032-0111', '515414002', apa.id, 'APA Truck', false, '');
  t('APA23', 'APA 23 - Mobile Mule Alberth Aviation', 'PN: MM-3200', 'SN: 099', apa.id, 'APA Truck', false, '');
  t('APA24', 'APA 24 - Cable Tensiometer 10 to 150', 'T5-2002-101-00', '83483', apa.id, 'APA Truck', true, '2026-06-23');
  t('APA2', 'APA2- IMPACT ADAPTER AND REDUCER KIT', 'NEIKO 30223A', '', apa.id, 'APA Truck', false, '');
  t('APA3', 'APA3- NITRO REG KIT 22\' HOSE', 'NHPK-22', '', apa.id, 'APA Truck', false, '');
  t('APA4', 'APA4- TIRE GAUGE 0-400PSI', '8844', '26699', apa.id, 'APA Truck', true, '2026-06-23');
  t('APA5', 'APA5- TORQUE WRENCH 50IN/LB- 250IN/LB', '2502MRMH', '0922111421', apa.id, 'APA Truck', true, '2026-06-18');
  t('APA6', 'APA6- O2 REG KIT', 'O2HPK-15', '', apa.id, 'APA Truck', false, '');
  t('APA7', 'APA7- TORQUE WRENCH 10IN/LB- 50IN/LB', '501MRMH', '0722900152', apa.id, 'APA Truck', true, '2026-06-18');
  t('APA8', 'APA8- GULFSTREAM ADAPTER KIT', 'GMGJAK', '100', apa.id, 'APA Truck', false, '');
  t('APA9', 'APA9- TORQUE WRENCH 50FT/LB- 250FT/LB', '2503MFRMH', '1022120972', apa.id, 'APA Truck', true, '2026-06-18');
  t('A6111', 'APACHE ROLLER CARRY CASE', '', '', teb.id, 'TEB Van', false, '');
  t('A6112', 'APA - LAPTOP', 'DELL INSPIRON', '1WWHVN3', apa.id, 'APA Truck', false, '');
  t('A6113', 'APA TRUCK INFORMATION', '', '', apa.id, '', false, '');
  t('A6114', 'AT&T MOBILE WIFI - FRANKLIN A50', 'RG2102 Franklin A50', 'IMEI 358718370889599', teb.id, 'TEB Van', false, '');
  t('A6115', 'BJC - JACK PADS PHENOM 300', 'JCPS-G5K-0011', '', bjc.id, 'BJC Van', false, '');
  t('A6116', 'BJC VAN MX FORMS', 'VIN 3C6LRVDGOME584962', '2021 RAM PROMASTER VAN', bjc.id, 'BJC Van', false, '');
  t('A6117', 'BLACK PELICAN 1560WF CASE', '', '', teb.id, 'TEB Van', false, '');
  t('A6118', 'BLACK Tool Box - 56 INCH', 'Us general', '', teb.id, 'TEB Van', false, '');
  t('A6119', 'BONNIE WRENCHES', '', '', bjc.id, 'BJC Van', false, '');
  t('A6120', 'BORESCOPE', '', '', bjc.id, 'BJC Van', false, '');
  t('A6121', 'CASE OF 2380', 'EXPIRES 2/14/27', 'CONSUMABLES', apa.id, 'APA Truck', false, '');
  t('A6122', 'COBRA PRO 3000W POWER INVERTER', '', '', teb.id, 'TEB Van', false, '');
  t('A6123', 'COLORADO LAPTOP - BLUE', 'LENOVO', 'PFSBJ0YH', bjc.id, 'Van 4', false, '');
  t('A6124', 'COLORADO TRUCK MX FORMS', 'VIN: 3C7WR5HJ0NG309709', '2022 RAM 2500 TRUCK', pdk.id, '', false, '');
  t('A6125', 'COMPOSITE REPAIR KIT', '', '', bjc.id, 'BJC Van', false, '');
  t('COSCO3', 'COSCO 3 IN 1 HAND TRUCK', '', '', teb.id, 'TEB Van', false, '');
  t('A6127', 'Craftsman tool box', '', '', bjc.id, 'BJC Van', false, '');
  t('A6128', 'CRAFTSMAN WRENCHES', '', '', las.id, 'BJC Van', false, '');
  t('A6129', 'DEWALT FAN', '', '', bjc.id, 'BJC Van', false, '');
  t('A6130', 'DEWALT STOOL', '', '', bjc.id, 'BJC Van', false, '');
  t('A6131', 'DRILL BITS', '', '', bjc.id, 'BJC Van', false, '');
  t('DTS15', 'DTS 15 - 1-4FT STEP LADDER', 'SILVER', '', pdk.id, 'Matts Van', false, '');
  t('DTS16', 'DTS 16 - TOOL BOX', 'CRAFTSMAN', 'BLACK', pdk.id, 'Matts Van', false, '');
  t('DTS17', 'DTS 17 - O2 TANK', '', '', pdk.id, 'Matts Van', false, '');
  t('DTS18', 'DTS 18 - NITROGEN LARGE TANK', '', '', sfb.id, 'SFB Van', false, '');
  t('DTS19', 'DTS 19 - SMALL NITROGEN TANK', '', '', sfb.id, 'SFB Van', false, '');
  t('DTS1', 'DTS 1 - TORQUE DR 10-70IN/LB', 'X002YJ60OV', 'DTS 1', pdk.id, 'PDK', true, '2026-03-04');
  t('DTS2', 'DTS2- IMPACT ADAPTER AND REDUCER KIT', 'NEIKO 30223A', '', sfb.id, 'SFB Van', false, '');
  t('DTS3', 'DTS3- NITRO REG KIT 22\' HOSE', 'NHPK-22', '', sfb.id, 'SFB Van', false, '');
  t('DTS4', 'DTS4 - TORQUE WRENCH 50IN/LB- 250IN/LB', '2502MRMH', '0922111423', sfb.id, 'SFB Van', false, '', 'decommissioned');
  t('DTS6', 'DTS6- TORQUE WRENCH 10IN/LB- 50IN/LB', '501MRMH', '0722900179', sfb.id, 'SFB Van', true, '2026-03-04');
  t('DTS7', 'DTS7- TIRE GAUGE 0-400PSI', '8844', '26899', sfb.id, 'SFB Van', false, '', 'reference');
  t('DTS8', 'DTS8- TORQUE WRENCH 50FT/LB- 250FT/LB', '2503MFRMH', '1022120971', sfb.id, 'SFB Van', true, '2026-03-04');
  t('DTS9', 'DTS9- TIRE GAUGE 0-400PSI', '8844', '26902', sfb.id, 'SFB Van', true, '2026-03-04');
  t('A6145', 'DTS - fire extinguisher', '', '', sfb.id, 'SFB Van', false, '');
  t('A6146', 'DTS - First Aid Kit', '', '', sfb.id, 'SFB Van', false, '');
  t('A6147', 'DTS - triangle kit', '', '', sfb.id, 'SFB Van', false, '');
  t('A6148', 'DTS VAN', '', '', sfb.id, 'SFB Van', false, '');
  t('A6149', 'ELECTRICAL', '', '', bjc.id, 'BJC Van', false, '');
  t('A6150', 'EMERGENCY ROADSIDE KIT', '', '', bjc.id, 'BJC Van', false, '');
  t('A6151', 'EXTENSION CORDS', '', '', tpa.id, 'TPA Van', false, '');
  t('A6152', 'EXTRA NITROGEN HOSE', '', '', bjc.id, 'BJC Van', false, '');
  t('F6992', 'F6992 VNYII 4- TORQUE WRENCH 50IN/LB-250IN/LB', '2502MRMH', '0922111397', bjc.id, 'BJC Van', true, '2026-09-24');
  t('F8929', 'F8929 - VNY2 - 400 PSI TIRE GAUGE', '8844', '26404', bjc.id, 'BJC Van', true, '2026-05-08');
  t('F8930', 'F8930 - VNY23- SANLIANG TORQUE SCREWDRIVER WRENCH', 'X002YJ60OV', '20188-AAOG', bjc.id, 'BJC Van', true, '2026-05-08');
  t('F8931', 'F8931 VNYII 5- TORQUE WRENCH 10IN/LB-50IN/LB', '501MRMH', '0722900113', bjc.id, 'BJC Van', true, '2026-05-08');
  t('A6157', 'FIRE EXTINGUISHER', '', '09201186', pdk.id, 'Van 1', false, '');
  t('A6158', 'First aid kit', '', '', bjc.id, 'BJC Van', false, '');
  t('A6159', 'FIRST AID KIT', 'UNKOWN', 'UNK', pdk.id, 'Van 5', false, '');
  t('A6160', 'Fluke 101 Multimeter', 'Fluke 101', '54571909WS', pdk.id, '', false, '', 'decommissioned');
  t('A6161', 'GREASER', '', '', teb.id, 'TEB Van', false, '');
  t('A6162', 'GREASING ACCESSORY KIT', '', '', teb.id, 'TEB Van', false, '');
  t('A6163', 'GULFSTREAM GRASER ADAPTER', '', '', teb.id, 'TEB Van', false, '');
  t('A6164', 'HAMMERS/PRYBARS', '', '', bjc.id, 'BJC Van', false, '');
  t('HP2', 'HP-2 RIVETER AND ASSORTED RIVETS', '', '', bjc.id, 'BJC Van', false, '');
  t('A6166', 'HP PRINTER', '', '', bjc.id, 'BJC Van', false, '');
  t('A6167', 'HYDRAULIC WIRE CRIMPING TOOL', '', '', bjc.id, 'BJC Van', false, '');
  t('A6168', 'JACK PLATE 2-PIECE', '', 'Z-2169-02', pdk.id, 'Van 5', false, '');
  t('K2799', 'K-2799 JACKING KIT', 'K-2799 JACKING KIT', 'M369970', teb.id, 'TEB Van', false, '');
  t('KL1992', 'KL1992-01', 'MD88', '78610147', apa.id, 'APA Truck', true, '2026-06-18');
  t('A6171', 'KLECO AND DRILL BITS KIT', '', '', bjc.id, 'BJC Van', false, '');
  t('A6172', 'KLECO FASTENERS', '', '', bjc.id, 'BJC Van', false, '');
  t('A6173', 'LANTAP KIT', '', '', bjc.id, 'BJC Van', false, '');
  t('A6174', 'LAPTOP', 'DELL INSPIRION', '8M4HVN3', pdk.id, '', false, '');
  t('A6175', 'LAS Laptop 1 - LENOVO Ideapad 1 15ALC7', '15ALC7', 'PF4T1RZX', las.id, 'BJC Van', false, '');
  t('A6176', 'LENOVO LAPTOP', '', 'PF5A7D4B', teb.id, 'TEB Van', false, '');
  t('A6177', 'LOW BACK CREEPER 300 LB - Black', '', '', teb.id, 'TEB Van', false, '');
  t('LZUH8', 'LZUH8 HIGH PRESSURE NITROGEN REGULATOR', '8700', 'LZUH8 - F6991', pdk.id, 'PDK', false, '');
  t('LZUHOME7', 'LZUHOME7 - TIRE SERVICE GAUGE 0- 300 PSI', '0-300', 'LZUHOME7', pdk.id, '', true, '', 'decommissioned');
  t('LZUII12', 'LZUII 12 3lb Dead Blow Hammer', 'CHFDRL48', 'LZUII 12', sfb.id, 'SFB Van', false, '');
  t('LZUII15', 'LZUII 15 -Sim Kit Sealant Gun', 'LZUII 15', 'LZUII 15', tpa.id, 'TPA Van', false, '');
  t('LZUII16', 'LZUII 16 - C Clamps x 2', 'LZUII 16', 'LZUII 16', sfb.id, 'SFB Van', false, '');
  t('LZUII19', 'LZUII 19 - Lear Nose Wheel Steering Cable', 'LZUII 19', 'LZUII 19', pdk.id, 'Van 5', false, '');
  t('LZUII23', 'LZUII 23 -Grease Guns', 'LX-1152', 'LZUII 23', sfb.id, 'SFB Van', false, '');
  t('LZUII24', 'LZUII 24 -Hydraulic Coupling Kit', 'KHC-1012', 'MO64450', pdk.id, 'Van 5', false, '');
  t('LZUII25', 'LZUII 25 -Hydraulic Coupling Kit', 'KCH-1009', 'M259430', pdk.id, '', false, '');
  t('LZUII26', 'LZUII 26 -Hydraulic Coupling Kit', 'KHC-1139', 'M108400', pdk.id, 'Van 5', false, '');
  t('LZUII27', 'LZUII 27 -Fluke 115 Multimeter', 'LZUII 27', 'LZUII 27', pdk.id, 'Van 5', false, '', 'reference');
  t('LZUII29', 'LZUII 29 Nitrogen 22\' Hose', 'HN22', '500262-001-02', sfb.id, 'SFB Van', false, '');
  t('LZUII31', 'LZUII 31 - MCO -5882230302 - JACK AXLE 25 TON', '02-7830C0110', '5882230302', sfb.id, 'SFB Van', false, '');
  t('LZUII32', 'LZUII 32 - MCO - 7188230104 - JACK AXLE 12 TON', '02-7813C0100', '7188230104', sfb.id, 'SFB Van', false, '');
  t('LZUII33', 'LZUII 33 - MCO- 8027230108 - FLUID SERVICE UNIT', '06-5022-6500', '8027230108', pdk.id, 'Van 5', false, '');
  t('LZUII34', 'LZUII 34 -MCO- 8027230109 - FLUID SERVICE UNIT', '06-5022-6500', '8027230109', pdk.id, 'Van 5', false, '');
  t('LZUII35', 'LZUII 35- MCO -8027230110 - FLUID SERVICE UNIT', '06-5022-6500', '8027230110', pdk.id, 'Van 5', false, '');
  t('LZUII3', 'LZUII 3- NITRO REG KIT 22\' HOSE', 'NHPK-22', '', pdk.id, 'Derek Grimes', false, '');
  t('LZUII7', 'LZUII 7 - LZUII 8 -NITROGEN HIGH PRESSURE REGULATOR', '8700', 'LZUII7', pdk.id, 'PDK', false, '');
  t('LZUII8', 'LZUII 8 - O2 REGULATOR KIT', 'O2HPK-15', '', pdk.id, 'Derek Grimes', false, '');
  t('A6198', 'LZU VAN MX FORMS', 'VIN: 3C6LRVDG7NE112744', '2022 RAM PRMASTER VAN', pdk.id, '', false, '');
  t('A6199', 'MAC SCREW DRIVERS', '', '', bjc.id, 'BJC Van', false, '');
  t('A6200', 'MIFI HOTSPOT NIGHTHAWK', 'MR7400', '7HH44AW2A4FE6', bjc.id, 'BJC Van', false, '');
  t('A6201', 'Mobile Jet oil II', '23 cans 1-24-25', 'Expires March 2034', teb.id, 'TEB Van', false, '');
  t('A6202', 'Mobil Jet Oil 254', '24 cans 1/24/25', '', teb.id, 'TEB Van', false, '');
  t('N2', 'N2 SERVICE KIT', '', '', teb.id, 'TEB Van', false, '');
  t('NEIKO8', 'NEIKO 8-PIECE IMPACT ADAPTER AND REDUCER KIT', 'NEIKO 30223A', '', pdk.id, 'Van 5', false, '');
  t('A6205', 'NITROGEN HOSE REEL', '', '', sfb.id, 'SFB Van', false, '');
  t('A6206', 'NITROGEN HYDRAULIC FITTINGS', '', '', bjc.id, 'BJC Van', false, '');
  t('O2', 'O2 GAS BOOSTER', '', '', sfb.id, 'SFB Van', false, '');
  t('O2_2', 'O2 HOSE REEL', '', '', sfb.id, 'SFB Van', false, '');
  t('OPF1', 'OPF 1 - BRAUN RECHARGEABLE PEN LIGHT', 'OPF 1', 'N/A', opf.id, '', false, '', 'decommissioned');
  t('A6210', 'OXYGEN HOSE REEL', '', '', bjc.id, 'BJC Van', false, '');
  t('PBI11', 'PBI11 - SANLIANG TORQUE SCREWDRIVER WRENCH', 'X002YJ60OV', '111004447', tpa.id, 'TPA Van', true, '2026-05-15');
  t('PBI12', 'PBI 12- WHEEL BEARING 3-1/2\"', 'OTC1910', '', tpa.id, 'TPA Van', false, '');
  t('PBI14', 'PBI14- 1\" DRIVE 3-3/4\" IMPACT SOCKET', '5120', '', tpa.id, 'TPA Van', false, '');
  t('PBI15', 'PBI15- FLUID SERVICE UNIT', '06-5022-6600', '8839220804', tpa.id, 'TPA Van', false, '');
  t('PBI16', 'PBI16- FLUID SERVICE UNIT', '06-5022-6600', '8839220805', tpa.id, 'TPA Van', false, '');
  t('PBI17', 'PBI17- 25TON JACK', '02-7830C0110', '7858220702', tpa.id, 'TPA Van', false, '');
  t('PBI18', 'PBI18 - TIRE GAUGE 0 TO 400 PSI', '8844', '26407', pdk.id, '', false, '', 'decommissioned');
  t('PBI19', 'PBI19- O2 REGULATOR KIT', 'O2HPK-15', '', pdk.id, '', false, '', 'decommissioned');
  t('PBI1', 'PBI1- GULFSTREAM AXEL JACK', 'GMGJAK', '121', tpa.id, 'TPA Van', false, '');
  t('PBI2', 'PBI 2- 12TON JACK', '02-7813C0100', '6272220502', tpa.id, 'TPA Van', false, '');
  t('PBI3', 'PBI3- FLUID SERVICE UNIT', '06-5022-6500', '0143220609', tpa.id, 'TPA Van', false, '');
  t('PBI4', 'PBI4 - TORQUE WRENCH 50FT/LB- 250FT/LB', '2503MFRMH', '0622114897', tpa.id, 'TPA Van', true, '2026-05-15');
  t('PBI5', 'PBI5 - TORQUE WRENCH 10IN/LB- 50IN/LB', '501MRMH', '0522906119', tpa.id, 'TPA Van', false, '', 'decommissioned');
  t('PBI6', 'PBI6- TORQUE WRENCH 50IN/LB- 250IN/LB', '2502MRMH', '0522906976', tpa.id, 'TPA Van', true, '2026-05-15');
  t('PBI7', 'PBI7- 1\" DRIVE IMPACT TOOL KIT', 'JQ-1-ZTO21A', '', tpa.id, 'TPA Van', false, '');
  t('PBI8', 'PBI8- IMPACT ADAPTER AND REDUCER KIT', 'NEIKO 30223A', '', tpa.id, 'TPA Van', false, '');
  t('PBI9', 'PBI9- WHEEL BEARING 2-7/8\"', 'OTC 1932', '', tpa.id, 'TPA Van', false, '');
  t('PBIII1', 'PBIII1- TORQUE DR 10-70IN/LB', 'X002YJ60OV', 'PBIII 1', tpa.id, 'TPA Van', true, '2026-05-15');
  t('PBIII21', 'PBIII 21 - LADDER', '', '', tpa.id, 'TPA Van', false, '');
  t('PBIII22', 'PBIII 22 - LADDER', '', '', tpa.id, 'TPA Van', false, '');
  t('PBIII23', 'PBIII 23 - FLUKE MULTIMETER', '', '', tpa.id, 'TPA Van', false, '');
  t('PBIII23_2', 'PBIII 23- LADDER', '', '', tpa.id, 'TPA Van', false, '');
  t('PBIII2', 'PBIII2- IMPACT ADAPTER AND REDUCER KIT', 'NEIKO 30223A', '', tpa.id, 'TPA Van', false, '');
  t('PBIII4', 'PBIII4- TORQUE WRENCH 50IN/LB- 250IN/LB', '2502MRMH', '0922111439', tpa.id, 'TPA Van', true, '2026-05-15');
  t('PBIII5', 'PBIII5- O2 REG KIT', 'O2HPK-15', '', pdk.id, '', false, '', 'decommissioned');
  t('PBIII6', 'PBIII6- TIRE GAUGE 0-400PSI', '8844', '26891', tpa.id, 'TPA Van', true, '2026-05-15');
  t('PBIII7', 'PBIII7- TORQUE WRENCH 10IN/LB- 50IN/LB', '501MRMH', '0722900115', tpa.id, 'TPA Van', true, '2026-05-15');
  t('PBIII8', 'PBIII8- TORQUE WRENCH 50FT/LB- 250FT/LB', '2503MFRMH', '1022120895', tpa.id, 'TPA Van', true, '2026-05-15');
  t('A6239', 'PDK - JACK PADS PHENOM 300', 'JCPS-G5K-0011', '', pdk.id, 'PDK', false, '');
  t('A6240', 'PLIERS AND CLAMPS DRAWER', '', '', bjc.id, 'BJC Van', false, '');
  t('A6241', 'POP RIVETS', '', '', bjc.id, 'BJC Van', false, '');
  t('A6242', 'PORTABLE WIFI - LOST- NIGHTHAWK M6', 'MR6110', '6V4639WRA1CC7', apa.id, 'APA Truck', false, '', 'decommissioned');
  t('A6243', 'PORTABLE WIFI -- NIGHTHAWK M6', 'MR6110', '6V4639WVA1D00', apa.id, 'APA Truck', false, '');
  t('PRO360', 'PRO 360 Digital Protractor', 'KS5549', '', bjc.id, 'BJC Van', false, '');
  t('A6245', 'RIVET SQUEEZER KIT', '', '', bjc.id, 'BJC Van', false, '');
  t('SFB1', 'SFB 1 - Airgas O2 Regulator', 'Y11-N115H', '3200387', sfb.id, 'SFB Van', false, '');
  t('SFB2', 'SFB 2 - USA BORESCOPE', 'SRV-J SERIES', 'SFB2', sfb.id, 'SFB Van', false, '');
  t('SFB3', 'SFB 3 - Ryobi Generator 2300 Watts (Gas Powered)', 'SFB 3', 'SFB 3', sfb.id, 'TPA Van', false, '');
  t('SFB4', 'SFB 4 - ALBERTH AVIATION MOBILE MULE', 'MM-3200', '', sfb.id, 'SFB Van', false, '');
  t('SFB5', 'SFB - 5 560XLS + Engine Download Cables', 'PWC44020', '1223073', sfb.id, 'SFB Van', false, '');
  t('SFB6', 'SFB 6 - ENGINE SLING', 'SFB 6', '', sfb.id, '', false, '');
  t('SFB7', 'SFB - 7 APU HOIST SYSTEM', '', 'SFB 7', sfb.id, 'SFB Van', false, '');
  t('A6253', 'SFB VAN MX FORMS', 'VIN: 1FTBW3X82PKA05297', '2023 FORD TRANSIT CARGO VAN', sfb.id, 'SFB Van', false, '');
  t('A6254', 'SOCKET KIT', '', '', bjc.id, 'Van 4', false, '');
  t('A6255', 'SOCKETS/RATCHES/EXTENSIONS', '', '', bjc.id, 'BJC Van', false, '');
  t('TEB10', 'TEB 10 - 25 TON AXLE JACK', '', '1095', teb.id, 'TEB Van', false, '');
  t('TEB11', 'TEB 11 - FLUID DISPENSER 5606', '2025066', '', teb.id, 'TEB Van', false, '');
  t('TEB12', 'TEB 12 - FLUID DISPENSER SKYDROL', '2025057', '', teb.id, 'TEB Van', false, '');
  t('TEB13', 'TEB 13 - 25 IN/LB Torque Driver', '', '5GF034238', teb.id, 'TEB Van', true, '2026-07-25');
  t('TEB14', 'TEB 14 - O2 FILL ADAPTER', '1519', '1119', teb.id, 'TEB Van', false, '');
  t('TEB15', 'TEB 15- small socket kit', 'Icon', '', teb.id, 'TEB Van', false, '');
  t('TEB15_2', 'TEB 15- socket kit', 'Puttsburg', '', teb.id, 'TEB Van', false, '');
  t('TEB17', 'TEB17- rolling seat', 'Grants', '', teb.id, 'TEB Van', false, '');
  t('TEB18', 'TEB 18- green hand bottle dolly', '', '', teb.id, 'TEB Van', false, '');
  t('TEB19', 'TEB 19- gorilla ladder', '', '', teb.id, 'TEB Van', false, '');
  t('TEB1', 'TEB 1 - GULFSTREAM JACK ADAPTER KIT', 'GMGJAK', '201', teb.id, 'TEB Van', false, '');
  t('TEB20', 'TEB 20- 2 extension cords', '', '', teb.id, 'TEB Van', false, '');
  t('TEB22', 'TEB 22- 1/2 IN TORQUE 30-250 FT LBS', '2503MFRMH', '0525111976', teb.id, 'TEB Van', true, '2026-05-17');
  t('TEB2', 'TEB 2 - GULFSTREAM WHEEL SOCKET KIT', 'GSK', '2916/5905', teb.id, 'TEB Van', false, '');
  t('TEB3', 'TEB 3 - DILL HIGH PRESSURE TIRE GUAGE', '8844-B', 'GA 001', teb.id, 'TEB Van', true, '2026-07-25');
  t('TEB4', 'TEB 4 - SNAP-ON Torque Wrench', 'QD3R250', '0810603030', teb.id, '', true, '', 'decommissioned');
  t('TEB5', 'TEB 5 - SNAP-ON Torque Wrench', 'QD2R1000', '0310005324', teb.id, 'TEB Van', true, '2026-07-25');
  t('TEB6', 'TEB 6 - SNAP-ON Torque Wrench', 'QD1R200', '0810063390', teb.id, 'TEB Van', true, '2026-07-25');
  t('TEB7', 'TEB 7 - HIGH PRESSURE NITROGEN GUAGE', 'N2K.A1', '8700-2500-580', teb.id, 'TEB Van', false, '');
  t('TEB8', 'TEB 8 - HIGH PRESSURE O2 GUAGE', 'O2K.A1', '8700-2500-540', teb.id, 'TEB Van', false, '');
  t('TEB9', 'TEB 9 - 12 TON AXLE JACK', '', '1091', teb.id, 'TEB Van', false, '');
  t('A6277', 'TEB ITEMS FOR VAN', 'RECEIPTS', 'IMAGES', teb.id, 'TEB Van', false, '');
  t('A6278', 'TEB VAN MX FORMS', 'VIN: 3C6LRVDG9PE564990', '2023 RAM PROMASTER VAN', teb.id, '', false, '');
  t('A6279', 'TIRE PRESSURE GAUGE - TPJ-KL1992- 02', '02-4159-X', 'TPJ-KL1992-02', apa.id, 'APA Truck', true, '2026-06-20');
  t('TPA1', 'TPA 1 - HIGH PRESSURE NITROGEN GAUGE', '8700', 'T-54464', tpa.id, 'TPA Van', false, '');
  t('TPA2', 'TPA 2 - Dewalt 165 PSI Compressor', 'TPA 2', 'TPA 2', tpa.id, 'TPA Van', false, '');
  t('A6282', 'TPA VAN MX FORMS', 'VIN 1FTBW3X83PKA05115', '2023 FORD TRANSIT CARGO VAN', tpa.id, 'TPA Van', false, '');
  t('A6283', 'TRIANGLE SAFETY KIT', '', '1005', pdk.id, 'Van 5', false, '');
  t('A6284', 'U.S. GENERAL BLUE TOOL BOX', '', '', bjc.id, 'Van 4', false, '');
  t('VAN4', 'VAN 4 -1/2 Breaker Bar', 'MXP54', '', bjc.id, 'Van 4', false, '');
  t('VAN4_2', 'VAN 4 - 26 Inch Ladder', 'Model 150 B', '', bjc.id, 'Van 4', false, '');
  t('VAN4_3', 'VAN 4 - COLORADO MX FORMS', 'VIN 1FTBW3X8XPKA05127', '2023 FORD TRANSIT C ARGO VAN', bjc.id, 'Van 4', false, '');
  t('VAN4_4', 'VAN 4 - DIGITAL VIDEO INSPECTION CAMERA', '', '', bjc.id, 'Van 4', false, '');
  t('VAN4_5', 'VAN 4 -Extension Cord 14 Guage/100 Feet', '', '', bjc.id, 'Van 4', false, '');
  t('VAN4_6', 'VAN 4 -Gorilla Ladder', 'Model GLMPXA-22', 'LZUII 18', bjc.id, 'Van 4', false, '');
  t('VAN4_7', 'VAN 4 - TUNGSTEN BUCKING BAR KIT', 'TBB7', '', bjc.id, 'Van 4', false, '');
  t('VAN4_8', 'VAN 4 -Welder Solder Iron', 'VAN 4', 'VAN 4', bjc.id, 'Van 4', false, '');
  t('A6293', 'VEHICLE SAFTEY REFLECTOR', 'RED BOX', '', pdk.id, 'Van 1', false, '');
  t('VNY10', 'VNY10- 1\" DRIVE IMPACT KIT', 'JQ-1-ZTO21A', '', vny.id, 'BJC Van', false, '');
  t('VNY13', 'VNY13- FLUID SERVICE UNIT', '06-5022-6500', '0143220608', vny.id, 'BJC Van', false, '');
  t('VNY14', 'VNY14- ADAPTER, FILL O2', 'OOGSE-1039-00', '246503-05', vny.id, 'BJC Van', false, '');
  t('VNY15', 'VNY15- NITRO REG KIT 22\' HOSE', 'NHPK-22', '', vny.id, 'BJC Van', false, '');
  t('VNY16', 'VNY16- O2 REG KIT 15\' HOSE', 'O2HPK-15', '', vny.id, 'BJC Van', false, '');
  t('VNY17', 'VNY17- JACKSTAND PAD, WING X2', 'R-1807', 'JOSH MILLARD', vny.id, 'BJC Van', false, '');
  t('VNY18', 'VNY18- JACKSTAND PAD, WING x2', 'R-1808', 'JOSH MILLARD', vny.id, 'BJC Van', false, '');
  t('VNY19', 'VNY19- PAD', '5520151-1', 'JOSH MILLARD', vny.id, 'BJC Van', false, '');
  t('VNY24', 'VNY24- FLUID SERVICE UNIT', '06-5022-6600', '8839220801', vny.id, 'BJC Van', false, '');
  t('VNY25', 'VNY25- FLUID SERVICE UNIT', '06-5022-6600', '8839220802', vny.id, 'BJC Van', false, '');
  t('VNY26', 'VNY26- GULFSTREAM ADAPTER RED SLEEVE', 'GMGJAK.A2', 'REPLACEMENT', vny.id, '', false, '');
  t('VNY27', 'VNY 27 - GULFSTREAM JACK ADAPTER', 'GMGJAK', '104', vny.id, 'BJC Van', false, '');
  t('VNY28', 'VNY 28 - 25TON JACK', '02-7830C0110', '3024220601', vny.id, 'BJC Van', false, '');
  t('VNY29', 'VNY 29 - 12TON JACK', '02-7813C0100', '6272220505', vny.id, 'BJC Van', false, '');
  t('VNY30', 'VNY30 - SOLDER KIT', '', '', vny.id, 'BJC Van', false, '');
  t('VNY3', 'VNY 3 STEP LADDER', '', '', vny.id, 'BJC Van', false, '');
  t('VNY5', 'VNY5 F8932 - TORQUE WRENCH 50FT/LB-250FT-LB', '2503MFRMH', '0422111250', vny.id, 'BJC Van', true, '2026-05-08');
  t('VNY6', 'VNY6- 1\" DRIVE- 3-3/4\" IMPACT SOCKET', '5120', '', vny.id, 'BJC Van', false, '');
  t('VNY7', 'VNY7- WHEEL BEARING 3-1/2\"', 'OTC1910', '', vny.id, 'BJC Van', false, '');
  t('VNY8', 'VNY8- WHEEL BEARING 2-7/8\"', 'OTC 1932', '', vny.id, 'BJC Van', false, '');
  t('VNY9', 'VNY9- IMPACT ADAPTER AND REDUCER KIT', 'NEIKO 30223A', '', vny.id, 'BJC Van', false, '');
  t('A6315', 'VNY F6808 - TIRE SERVICING GAUGE', 'MH46070', 'AAA6808', vny.id, 'BJC Van', true, '2026-05-08');
  t('A6316', 'VNY F7106 TERMINAL CRIMP SET', '18921', 'AV-66', vny.id, 'BJC Van', true, '2026-09-24');
  t('A6317', 'VNY F7107 CABLE TENSIOMETER', 'T5-2002-101-00', '64974', vny.id, 'BJC Van', true, '2026-09-24');
  t('A6318', 'VNY F7108 FORCE GAUGE', 'DL-100', '211210903405', vny.id, 'BJC Van', true, '2026-09-24');
  t('A6319', 'VNY F7109 MEGOHMETER', '101-00221', '700', vny.id, '', false, '', 'decommissioned');
  t('A6320', 'VNY F7110 DIGITAL CALIPER', '63711', '2322-36027', vny.id, 'BJC Van', true, '2026-09-22');
  t('A6321', 'VNY F7111 TORQUE DRIVER', 'TSMN16-88', 'V090402', vny.id, 'BJC Van', true, '2026-09-24');
  t('A6322', 'VNY F7113 OUTSIDE MICROMETER', '0-1\"', 'AAA7113', vny.id, 'BJC Van', true, '2026-09-22');
  t('A6323', 'VNY F7114 OUTSIDE MICROMETER', '1-2\"', 'AAA7114', vny.id, 'BJC Van', true, '2026-09-22');
  t('A6324', 'VNY F7115 OUTSIDE MICROMETER', '2-3\"', 'AAA7115', vny.id, 'BJC Van', true, '2026-09-22');
  t('A6325', 'VNY Gorilla ladder', 'Gorilla ladder', '', vny.id, 'BJC Van', false, '');
  t('VNYII10', 'VNYII 10 - 1- GULFSTREAM AXEL JACK ADAPTER', 'GMGJAK', '102', vny.id, '', false, '', 'decommissioned');
  t('VNYII11', 'VNYII 11- 12TON JACK', '02-7813C0100', '8097220603', vny.id, '', false, '', 'decommissioned');
  t('VNYII13', 'VNYII 13- 8TON JACK', '3999-010', '0269', vny.id, 'OPF Van', false, '', 'out_for_repair');
  t('VNYII27', 'VNYII 27 Oxygen Booster', '', '18-2599-OB', vny.id, '', false, '');
  t('A6330', 'VNY SCAFFOLD STAND', '', '', vny.id, 'BJC Van', false, '');
  t('A6331', 'Wrenches and spare socket set', 'Husky', '', teb.id, 'TEB Van', false, '');

  // \u2500\u2500 Certificates (from Examples/ folder) \u2500\u2500
  addCertificate('1002', { certNo: 'A-1002', instrumentId: '111971051', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1002.pdf', fileName: 'A-1002.pdf' });
  addCertificate('1003', { certNo: 'A-1003', instrumentId: '0522906156', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1003.pdf', fileName: 'A-1003.pdf' });
  addCertificate('1004', { certNo: 'A-1004', instrumentId: '26272', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1004.pdf', fileName: 'A-1004.pdf' });
  addCertificate('1005', { certNo: 'A-1005', instrumentId: '0522112225', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1005.pdf', fileName: 'A-1005.pdf' });
  addCertificate('1006', { certNo: 'A-1006', instrumentId: '0522906978', calibrationDate: '2025-03-08', nextDueDate: '2026-03-08', status: 'Pass', filePath: 'Examples/A-1006.pdf', fileName: 'A-1006.pdf' });
  addCertificate('1007', { certNo: 'A-1007', instrumentId: '', calibrationDate: '', nextDueDate: '', status: 'N/A', filePath: 'Examples/A-1007.pdf', fileName: 'A-1007.pdf' });
  addCertificate('1008', { certNo: 'A-1008', instrumentId: '', calibrationDate: '', nextDueDate: '', status: 'N/A', filePath: 'Examples/A-1008.pdf', fileName: 'A-1008.pdf' });

  _saveScalar(DB_KEYS.seeded, true);
}

/* \u2550\u2550\u2550 STATS HELPERS \u2550\u2550\u2550 */
function getStats(marketId) {
  let tools = getTools().filter(t => t.status !== 'decommissioned');
  if (marketId) tools = tools.filter(t => t.marketId === marketId);
  const total = tools.length;
  const checkedOut = tools.filter(t => t.isCheckedOut).length;
  const available = total - checkedOut;
  const calTools = tools.filter(t => t.requiresCalibration);
  const calDueSoon = calTools.filter(t => {
    if (!t.calibrationDueDate) return false;
    const diff = (new Date(t.calibrationDueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;
  const calOverdue = calTools.filter(t => {
    if (!t.calibrationDueDate) return false;
    return new Date(t.calibrationDueDate) < new Date();
  }).length;
  const outForRepair = getTools().filter(t => t.status === 'out_for_repair' && (!marketId || t.marketId === marketId)).length;
  const decommissioned = getTools().filter(t => t.status === 'decommissioned' && (!marketId || t.marketId === marketId)).length;
  return { total, checkedOut, available, calDueSoon, calOverdue, calTools: calTools.length, outForRepair, decommissioned };
}
