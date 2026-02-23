/* ═══════════════════════════════════════════════════════════
   APP ENTRY POINT
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // Seed demo data on first visit
    seedDemoData();

    // Check for public route (no login needed)
    const hash = location.hash.slice(1);
    if (hash.startsWith('tool/')) {
        const toolId = hash.split('/')[1];
        renderPublicToolView(toolId);
        // Listen for hash changes in case user navigates
        window.addEventListener('hashchange', () => {
            const h = location.hash.slice(1);
            if (h.startsWith('tool/')) {
                renderPublicToolView(h.split('/')[1]);
            } else {
                renderApp();
            }
        });
        return;
    }

    // Check if user is already logged in
    if (currentUser()) {
        renderApp();
    } else {
        renderLogin();
    }
});
