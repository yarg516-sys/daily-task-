// ==============================================================================
// DailyDesk Global Search & Command Palette Module (Ctrl + K)
// ==============================================================================

(function() {
    let searchDebounceTimer = null;

    function initSearch() {
        // Keyboard shortcut: Ctrl+K or Cmd+K
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                DailyDeskSearch.open();
            }
        });

        // Search trigger buttons in navbar / UI
        document.querySelectorAll(".global-search-trigger").forEach(el => {
            el.addEventListener("click", () => {
                DailyDeskSearch.open();
            });
        });

        // Search input listening
        const input = document.getElementById("omnibar-input");
        if (input) {
            input.addEventListener("input", (e) => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    performSearch(e.target.value);
                }, 150);
            });

            // Enter key navigation
            input.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    DailyDeskSearch.close();
                }
            });
        }
    }

    function performSearch(rawQuery) {
        const resultsContainer = document.getElementById("omnibar-results");
        if (!resultsContainer) return;

        const query = rawQuery.trim().toLowerCase();
        if (query === "") {
            resultsContainer.innerHTML = `
                <div class="p-6 text-center text-muted text-sm">
                    <p>Type to search across tasks, expenses, notes, and goals...</p>
                    <div class="flex justify-center gap-4 mt-3 text-xs">
                        <span class="badge badge-subtle">Tasks</span>
                        <span class="badge badge-subtle">Expenses</span>
                        <span class="badge badge-subtle">Notes</span>
                        <span class="badge badge-subtle">Goals</span>
                    </div>
                </div>
            `;
            return;
        }

        const tasks = window.DailyDeskTasks ? window.DailyDeskTasks.getTasksList() : [];
        const expenses = window.DailyDeskExpenses ? window.DailyDeskExpenses.getExpensesList() : [];
        const notes = window.DailyDeskNotes ? window.DailyDeskNotes.getNotesList() : [];
        const goals = window.DailyDeskGoals ? window.DailyDeskGoals.getGoalsList() : [];

        // Match tasks
        const matchTasks = tasks.filter(t => 
            (t.title || "").toLowerCase().includes(query) || 
            (t.description || "").toLowerCase().includes(query) ||
            (t.category || "").toLowerCase().includes(query)
        ).slice(0, 4);

        // Match expenses
        const matchExpenses = expenses.filter(e => 
            (e.title || "").toLowerCase().includes(query) || 
            (e.description || "").toLowerCase().includes(query) ||
            (e.category || "").toLowerCase().includes(query)
        ).slice(0, 4);

        // Match notes
        const matchNotes = notes.filter(n => 
            (n.title || "").toLowerCase().includes(query) || 
            (n.content || "").toLowerCase().includes(query)
        ).slice(0, 4);

        // Match goals
        const matchGoals = goals.filter(g => 
            (g.title || "").toLowerCase().includes(query) || 
            (g.description || "").toLowerCase().includes(query)
        ).slice(0, 4);

        const totalMatches = matchTasks.length + matchExpenses.length + matchNotes.length + matchGoals.length;

        if (totalMatches === 0) {
            resultsContainer.innerHTML = `
                <div class="p-8 text-center text-muted">
                    <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    <p class="font-medium text-sm">No results found for "${escapeHtml(rawQuery)}"</p>
                    <p class="text-xs mt-1">Try another keyword or search category.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        let html = "";

        // Render Tasks Section
        if (matchTasks.length > 0) {
            html += `
                <div class="search-category-group">
                    <div class="search-category-header">Tasks (${matchTasks.length})</div>
                    ${matchTasks.map(t => `
                        <div class="search-result-item" onclick="DailyDeskSearch.jumpTo('tasks', '${t.id}')">
                            <div class="search-result-icon bg-indigo-500/10 text-indigo-400">
                                <i data-lucide="check-square"></i>
                            </div>
                            <div class="search-result-meta">
                                <span class="search-result-title">${highlight(t.title, query)}</span>
                                <span class="search-result-desc">${escapeHtml(t.category)} • Due ${t.due_date || 'N/A'}</span>
                            </div>
                            <span class="badge badge-priority-${(t.priority || 'medium').toLowerCase()} text-xs">${t.priority}</span>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        // Render Expenses Section
        if (matchExpenses.length > 0) {
            html += `
                <div class="search-category-group">
                    <div class="search-category-header">Expenses (${matchExpenses.length})</div>
                    ${matchExpenses.map(e => `
                        <div class="search-result-item" onclick="DailyDeskSearch.jumpTo('expenses', '${e.id}')">
                            <div class="search-result-icon bg-emerald-500/10 text-emerald-400">
                                <i data-lucide="dollar-sign"></i>
                            </div>
                            <div class="search-result-meta">
                                <span class="search-result-title">${highlight(e.title, query)}</span>
                                <span class="search-result-desc">${escapeHtml(e.category)} • ${e.date || 'N/A'}</span>
                            </div>
                            <span class="font-bold text-sm text-emerald-400">$${parseFloat(e.amount).toFixed(2)}</span>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        // Render Notes Section
        if (matchNotes.length > 0) {
            html += `
                <div class="search-category-group">
                    <div class="search-category-header">Notes (${matchNotes.length})</div>
                    ${matchNotes.map(n => `
                        <div class="search-result-item" onclick="DailyDeskSearch.jumpTo('notes', '${n.id}')">
                            <div class="search-result-icon bg-sky-500/10 text-sky-400">
                                <i data-lucide="file-text"></i>
                            </div>
                            <div class="search-result-meta">
                                <span class="search-result-title">${highlight(n.title, query)}</span>
                                <span class="search-result-desc line-clamp-1">${escapeHtml(n.content || '')}</span>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        // Render Goals Section
        if (matchGoals.length > 0) {
            html += `
                <div class="search-category-group">
                    <div class="search-category-header">Goals (${matchGoals.length})</div>
                    ${matchGoals.map(g => `
                        <div class="search-result-item" onclick="DailyDeskSearch.jumpTo('goals', '${g.id}')">
                            <div class="search-result-icon bg-purple-500/10 text-purple-400">
                                <i data-lucide="target"></i>
                            </div>
                            <div class="search-result-meta">
                                <span class="search-result-title">${highlight(g.title, query)}</span>
                                <span class="search-result-desc">${escapeHtml(g.category)} • ${g.current_progress}% complete</span>
                            </div>
                            <span class="badge badge-outline text-xs">${g.current_progress}%</span>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        resultsContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }

    function highlight(text, query) {
        if (!text) return "";
        const escaped = escapeHtml(text);
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
        return escaped.replace(regex, `<mark class="bg-indigo-500/30 text-indigo-300 font-semibold px-0.5 rounded">$1</mark>`);
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.DailyDeskSearch = {
        init() {
            initSearch();
        },
        open() {
            const modal = document.getElementById("omnibar-modal");
            const input = document.getElementById("omnibar-input");
            if (modal && input) {
                window.DailyDeskApp.openModal("omnibar-modal");
                input.value = "";
                input.focus();
                performSearch("");
            }
        },
        close() {
            window.DailyDeskApp.closeModal("omnibar-modal");
        },
        jumpTo(viewName, entityId) {
            DailyDeskSearch.close();
            window.DailyDeskApp.navigate(viewName);

            // Highlight or open the entity modal
            setTimeout(() => {
                if (viewName === "tasks" && window.DailyDeskTasks) {
                    window.DailyDeskTasks.openTaskModal(entityId);
                } else if (viewName === "expenses" && window.DailyDeskExpenses) {
                    window.DailyDeskExpenses.openExpenseModal(entityId);
                } else if (viewName === "notes" && window.DailyDeskNotes) {
                    window.DailyDeskNotes.openNoteModal(entityId);
                } else if (viewName === "goals" && window.DailyDeskGoals) {
                    window.DailyDeskGoals.openGoalModal(entityId);
                }
            }, 100);
        }
    };
})();
