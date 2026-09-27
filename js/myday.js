// ==============================================================================
// DailyDesk "My Day" Dedicated View Module
// ==============================================================================

(function() {
    const MOTIVATIONAL_QUOTES = [
        { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
        { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
        { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
        { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { quote: "You don't have to be extreme, just consistent.", author: "Unknown" },
        { quote: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.", author: "Leo Babauta" }
    ];

    function getRandomQuote() {
        const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        return MOTIVATIONAL_QUOTES[index];
    }

    function renderMyDay() {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const profile = window.DailyDeskAuth.getCurrentProfile();
        const currency = (profile && profile.currency) || window.DAILY_CONFIG.DEFAULT_CURRENCY;

        // 1. Date & Greeting
        const dateEl = document.getElementById("myday-today-date");
        const greetingEl = document.getElementById("myday-greeting");
        const quoteTextEl = document.getElementById("myday-quote-text");
        const quoteAuthorEl = document.getElementById("myday-quote-author");

        if (dateEl) {
            const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
            dateEl.textContent = now.toLocaleDateString("en-US", options);
        }

        if (greetingEl) {
            const hour = now.getHours();
            let timeGreeting = "Good Morning";
            if (hour >= 12 && hour < 17) timeGreeting = "Good Afternoon";
            else if (hour >= 17) timeGreeting = "Good Evening";

            const name = (profile && profile.full_name) ? profile.full_name.split(" ")[0] : "Productive Human";
            greetingEl.textContent = `${timeGreeting}, ${name}!`;
        }

        if (quoteTextEl && quoteAuthorEl) {
            const q = getRandomQuote();
            quoteTextEl.textContent = `“${q.quote}”`;
            quoteAuthorEl.textContent = `— ${q.author}`;
        }

        // 2. Today's Tasks
        const allTasks = window.DailyDeskTasks ? window.DailyDeskTasks.getTasksList() : [];
        const todayTasks = allTasks.filter(t => t.due_date === todayStr);
        const todayCompletedTasks = todayTasks.filter(t => t.completed);
        const taskRatio = todayTasks.length > 0 ? Math.round((todayCompletedTasks.length / todayTasks.length) * 100) : 0;

        const taskProgBar = document.getElementById("myday-task-progress-bar");
        const taskProgText = document.getElementById("myday-task-progress-text");
        if (taskProgBar) taskProgBar.style.width = `${taskRatio}%`;
        if (taskProgText) taskProgText.textContent = `${todayCompletedTasks.length} of ${todayTasks.length} completed (${taskRatio}%)`;

        const taskListContainer = document.getElementById("myday-tasks-list");
        if (taskListContainer) {
            if (todayTasks.length === 0) {
                taskListContainer.innerHTML = `
                    <div class="empty-state-sm">
                        <p class="text-sm text-muted">No tasks scheduled for today. Plan ahead!</p>
                        <button class="btn btn-outline btn-sm mt-2" onclick="DailyDeskTasks.openTaskModal()">
                            <i data-lucide="plus"></i> Add Today's Task
                        </button>
                    </div>
                `;
            } else {
                taskListContainer.innerHTML = todayTasks.map(t => `
                    <div class="myday-task-item ${t.completed ? 'completed' : ''}">
                        <button class="task-checkbox ${t.completed ? 'checked' : ''}" 
                                onclick="DailyDeskTasks.toggleComplete('${t.id}')">
                            <i data-lucide="${t.completed ? 'check' : 'circle'}"></i>
                        </button>
                        <div class="myday-task-content">
                            <span class="myday-task-title font-medium ${t.completed ? 'line-through text-muted' : 'text-main'}">
                                ${escapeHtml(t.title)}
                            </span>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="badge badge-priority-${(t.priority || 'medium').toLowerCase()} text-xs">${t.priority}</span>
                                <span class="text-xs text-muted">${t.category}</span>
                            </div>
                        </div>
                    </div>
                `).join("");
            }
        }

        // 3. Today's Expenses
        const allExpenses = window.DailyDeskExpenses ? window.DailyDeskExpenses.getExpensesList() : [];
        const todayExpenses = allExpenses.filter(e => e.date === todayStr);
        const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        const expTotalEl = document.getElementById("myday-expense-total");
        if (expTotalEl) expTotalEl.textContent = `${currency}${todayExpensesTotal.toFixed(2)}`;

        const expListContainer = document.getElementById("myday-expenses-list");
        if (expListContainer) {
            if (todayExpenses.length === 0) {
                expListContainer.innerHTML = `
                    <div class="empty-state-sm">
                        <p class="text-sm text-muted">No expenses recorded today.</p>
                        <button class="btn btn-outline btn-sm mt-2" onclick="DailyDeskExpenses.openExpenseModal()">
                            <i data-lucide="plus"></i> Log Today's Expense
                        </button>
                    </div>
                `;
            } else {
                expListContainer.innerHTML = todayExpenses.map(e => `
                    <div class="myday-exp-item">
                        <div class="flex items-center gap-2">
                            <span class="badge badge-subtle text-xs">${e.category}</span>
                            <span class="font-medium text-main text-sm">${escapeHtml(e.title)}</span>
                        </div>
                        <span class="font-bold text-sm text-main">${currency}${parseFloat(e.amount).toFixed(2)}</span>
                    </div>
                `).join("");
            }
        }

        // 4. Quick Scratchpad Note for Today
        const allNotes = window.DailyDeskNotes ? window.DailyDeskNotes.getNotesList() : [];
        const todayNotes = allNotes.filter(n => n.is_pinned || (n.updated_at && n.updated_at.startsWith(todayStr)));

        const notesListContainer = document.getElementById("myday-notes-list");
        if (notesListContainer) {
            if (todayNotes.length === 0) {
                notesListContainer.innerHTML = `
                    <div class="empty-state-sm">
                        <p class="text-sm text-muted">No pinned notes or notes created today.</p>
                        <button class="btn btn-outline btn-sm mt-2" onclick="DailyDeskNotes.openNoteModal()">
                            <i data-lucide="plus"></i> Jot a Thought
                        </button>
                    </div>
                `;
            } else {
                notesListContainer.innerHTML = todayNotes.slice(0, 2).map(n => `
                    <div class="myday-note-preview note-color-${n.color || 'indigo'}" onclick="DailyDeskNotes.openNoteModal('${n.id}')">
                        <h5 class="font-semibold text-sm mb-1 line-clamp-1">${escapeHtml(n.title)}</h5>
                        <p class="text-xs text-muted line-clamp-3">${escapeHtml(n.content)}</p>
                    </div>
                `).join("");
            }
        }

        // 5. Active Goals Snapshot
        const allGoals = window.DailyDeskGoals ? window.DailyDeskGoals.getGoalsList() : [];
        const topGoals = allGoals.filter(g => g.status !== "Completed" && g.current_progress < 100).slice(0, 2);

        const goalsContainer = document.getElementById("myday-goals-list");
        if (goalsContainer) {
            if (topGoals.length === 0) {
                goalsContainer.innerHTML = `
                    <div class="empty-state-sm">
                        <p class="text-sm text-muted">All current goals achieved or none set.</p>
                    </div>
                `;
            } else {
                goalsContainer.innerHTML = topGoals.map(g => `
                    <div class="myday-goal-item mb-2">
                        <div class="flex justify-between items-center text-xs font-semibold mb-1">
                            <span class="truncate max-w-[180px] text-main">${escapeHtml(g.title)}</span>
                            <span class="text-indigo-400">${g.current_progress}%</span>
                        </div>
                        <div class="progress-bar-track progress-bar-track-sm">
                            <div class="progress-bar-fill" style="width: ${g.current_progress}%;"></div>
                        </div>
                    </div>
                `).join("");
            }
        }

        // 6. Daily Productivity Score
        const dailyScoreEl = document.getElementById("myday-score-value");
        const dailyScoreBadge = document.getElementById("myday-score-badge");
        if (dailyScoreEl) {
            let score = 50; // base score for showing up
            if (todayTasks.length > 0) {
                score = Math.round(30 + (todayCompletedTasks.length / todayTasks.length) * 50);
            }
            if (todayExpenses.length > 0) score += 10;
            if (todayNotes.length > 0) score += 10;
            score = Math.min(100, Math.max(0, score));

            dailyScoreEl.textContent = `${score}`;

            if (dailyScoreBadge) {
                if (score >= 85) {
                    dailyScoreBadge.textContent = "Supercharged ⚡";
                    dailyScoreBadge.className = "badge badge-success";
                } else if (score >= 60) {
                    dailyScoreBadge.textContent = "On Track 👍";
                    dailyScoreBadge.className = "badge badge-primary";
                } else {
                    dailyScoreBadge.textContent = "Starting Up ☕";
                    dailyScoreBadge.className = "badge badge-amber";
                }
            }
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.DailyDeskMyDay = {
        init() {
            renderMyDay();
        },
        refresh() {
            renderMyDay();
        }
    };
})();
