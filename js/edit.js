/* ═══════════════════════════════════════════════════════════
   EDIT TOOL MODAL — allows admin to update tool properties
   ═══════════════════════════════════════════════════════════ */
function openEditToolModal(toolId) {
    var tool = getToolById(toolId);
    if (!tool) { showToast('Tool not found.', 'error'); return; }
    var markets = getMarkets();
    var mktOpts = markets.map(function (m) {
        return '<option value="' + m.id + '"' + (m.id === tool.marketId ? ' selected' : '') + '>' + m.name + '</option>';
    }).join('');

    var body =
        '<div class="form-row">' +
        '<div class="form-group"><label>Part Number</label>' +
        '<input id="editPN" class="form-control" value="' + (tool.partNumber || '') + '" /></div>' +
        '<div class="form-group"><label>Serial Number</label>' +
        '<input id="editSN" class="form-control" value="' + (tool.serialNumber || '') + '" /></div>' +
        '</div>' +
        '<div class="form-group"><label>Market</label>' +
        '<select id="editMarket" class="form-control">' + mktOpts + '</select></div>' +
        '<div class="form-group"><label>Sub-Location</label>' +
        '<input id="editSubloc" class="form-control" value="' + (tool.sublocation || '') + '" /></div>' +
        '<div class="form-group"><label>Tool Status</label>' +
        '<select id="editStatus" class="form-control">' +
        '<option value="active"' + (tool.status === 'active' ? ' selected' : '') + '>Active</option>' +
        '<option value="decommissioned"' + (tool.status === 'decommissioned' ? ' selected' : '') + '>Decommissioned</option>' +
        '<option value="out_for_repair"' + (tool.status === 'out_for_repair' ? ' selected' : '') + '>Out for Repair</option>' +
        '</select></div>' +
        '<hr style="border-color:var(--border);margin:var(--sp-md) 0">' +
        '<h3 style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:var(--sp-sm)">Calibration</h3>' +
        '<div class="form-group">' +
        '<label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0">' +
        '<input type="checkbox" id="editReqCal" ' + (tool.requiresCalibration ? 'checked' : '') + ' /> ' +
        'Requires Calibration</label></div>' +
        '<div class="form-group' + (tool.requiresCalibration ? '' : ' hidden') + '" id="editCalDateGroup">' +
        '<label>Calibration Due Date</label>' +
        '<input id="editCalDate" class="form-control" type="date" value="' + (tool.calibrationDueDate || '') + '" />' +
        '</div>';

    showModal('Edit Tool ' + tool.id, body, function () {
        updateTool(toolId, {
            partNumber: document.getElementById('editPN').value.trim(),
            serialNumber: document.getElementById('editSN').value.trim(),
            marketId: document.getElementById('editMarket').value,
            sublocation: document.getElementById('editSubloc').value.trim(),
            status: document.getElementById('editStatus').value,
            requiresCalibration: document.getElementById('editReqCal').checked,
            calibrationDueDate: document.getElementById('editCalDate').value || '',
        });
        showToast('Tool ' + toolId + ' updated!', 'success');
        closeModal();
        handleRoute();
        return true;
    });

    // Toggle cal date field visibility
    document.getElementById('editReqCal').addEventListener('change', function () {
        document.getElementById('editCalDateGroup').classList.toggle('hidden', !this.checked);
    });
}
