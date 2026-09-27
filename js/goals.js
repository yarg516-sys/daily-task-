// ==============================================================================
// DailyDesk Goals Module
// ==============================================================================

(function() {
    let goalsList = [];
    let currentFilterStatus = "all"; // 'all', 'in_progress', 'completed'
    let currentCategoryFilter = "all";

    async function loadGoals() {
        const user = window.DailyDeskAuth.getCurrentUser();
        if (!user) return;

        try {
            goalsList = await window.DailyDeskDB.getGoals(user.id);
            renderGoals();
            updateGoalCounters();
        } catch (err) {
            window.DailyDeskApp.showToast("Failed to load goals: " + err.message, "error");
        }
    }

    function getFilteredGoals() {
        return goalsList.filter(goal => {
            if (currentFilterStatus === "in_progress" && goal.status === "Completed") return false;
            if (currentFilterStatus === "completed" && goal.status !== "Completed" && goal.current_progress < 100) return false;
            if (currentCategoryFilter !== "all" && goal.category !== currentCategoryFilter) return false;
            return true;
        });
    }

    function renderGoals() {
        const container = document.getElementById("goals-container");
        if (!container) return;

        const filtered = getFilteredGoals();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state col-span-full">
                    <div class="empty-state-icon">
                        <i data-lucide="target"></i>
                    </div>
                    <h3>No goals found</h3>
                    <p>Set inspiring long-term milestones for your career, fitness, savings, or learning.</p>
                    <button class="btn btn-primary" onclick="DailyDeskGoals.openGoalModal()">
                        <i data-lucide="plus"></i> Create New Goal
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        container.innerHTML = filtered.map(goal => {
            const progress = Math.min(100, Math.max(0, parseInt(goal.current_progress, 10) || 0));
            const isCompleted = goal.status === "Completed" || progress === 100;
            const daysLeft = calculateDaysRemaining(goal.target_date);

            return `
                <div class="goal-card ${isCompleted ? 'goal-completed' : ''}" data-id="${goal.id}">
                    <div class="goal-card-header">
                        <div class="flex items-center gap-2">
                            <span class="badge badge-category">${goal.category || 'Personal'}</span>
                            ${isCompleted ? '<span class="badge badge-success"><i data-lucide="check" class="icon-xxs"></i> Achieved</span>' : ''}
                        </div>
                        <div class="goal-card-actions">
                            <button class="btn-icon btn-icon-sm" onclick="DailyDeskGoals.openGoalModal('${goal.id}')" title="Edit Goal">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-icon btn-icon-sm btn-icon-danger" onclick="DailyDeskGoals.confirmDelete('${goal.id}')" title="Delete Goal">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>

                    <h4 class="goal-title">${escapeHtml(goal.title)}</h4>
                    ${goal.description ? `<p class="goal-desc">${escapeHtml(goal.description)}</p>` : ''}

                    <div class="goal-progress-section">
                        <div class="flex justify-between items-center mb-1 text-sm font-semibold">
                            <span class="text-main">${goal.target_value ? escapeHtml(goal.target_value) : 'Progress'}</span>
                            <span class="text-indigo-400 font-bold">${progress}%</span>
                        </div>
                        <div class="progress-bar-track">
                            <div class="progress-bar-fill ${progress >= 100 ? 'fill-success' : ''}" style="width: ${progress}%;"></div>
                        </div>
                    </div>

                    <!-- Quick Progress Adjuster Buttons -->
                    <div class="goal-quick-progress">
                        <button class="btn-step" onclick="DailyDeskGoals.adjustProgress('${goal.id}', -10)" title="-10%">-10%</button>
                        <button class="btn-step" onclick="DailyDeskGoals.adjustProgress('${goal.id}', +10)" title="+10%">+10%</button>
                        <button class="btn-step ${isCompleted ? 'btn-step-active' : ''}" onclick="DailyDeskGoals.toggleComplete('${goal.id}')" title="Complete">
                            <i data-lucide="${isCompleted ? 'rotate-ccw' : 'check'}"></i> ${isCompleted ? 'Reopen' : 'Mark Done'}
                        </button>
                    </div>

                    <div class="goal-footer">
                        <span class="text-xs text-muted flex items-center gap-1">
                            <i data-lucide="calendar" class="icon-xxs"></i>
                            ${goal.target_date ? formatDate(goal.target_date) : 'No deadline'}
                        </span>
                        <span class="text-xs font-medium ${daysLeft.color}">
                            ${daysLeft.text}
                        </span>
                    </div>
                </div>
            `;
        }).join("");

        // Also render Dashboard goals widget
        renderDashboardGoalsWidget();

        if (window.lucide) window.lucide.createIcons();
    }

    function renderDashboardGoalsWidget() {
        const dashGoalsList = document.getElementById("dash-goals-list");
        if (!dashGoalsList) return;

        const activeGoals = goalsList.filter(g => g.status !== "Completed" && g.current_progress < 100).slice(0, 3);
        if (activeGoals.length === 0) {
            dashGoalsList.innerHTML = `
                <div class="empty-state-sm">
                    <p class="text-sm text-muted">No active goals. Set your first goal to track progress.</p>
                </div>
            `;
            return;
        }

        dashGoalsList.innerHTML = activeGoals.map(goal => {
            const p = Math.min(100, Math.max(0, parseInt(goal.current_progress, 10) || 0));
            return `
                <div class="dash-goal-row">
                    <div class="flex justify-between items-center text-sm font-medium mb-1">
                        <span class="truncate max-w-[200px] text-main">${escapeHtml(goal.title)}</span>
                        <span class="text-xs text-indigo-400 font-bold">${p}%</span>
                    </div>
                    <div class="progress-bar-track progress-bar-track-sm">
                        <div class="progress-bar-fill" style="width: ${p}%;"></div>
                    </div>
                </div>
            `;
        }).join("");
    }

    function updateGoalCounters() {
        const total = goalsList.length;
        const completed = goalsList.filter(g => g.status === "Completed" || g.current_progress >= 100).length;
        const active = total - completed;

        const totalEl = document.getElementById("goals-count-total");
        const activeEl = document.getElementById("goals-count-active");
        const completedEl = document.getElementById("goals-count-completed");

        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (completedEl) completedEl.textContent = completed;

        const dashActiveGoals = document.getElementById("dash-goals-active");
        if (dashActiveGoals) dashActiveGoals.textContent = active;
    }

    function calculateDaysRemaining(targetDateStr) {
        if (!targetDateStr) return { text: "Ongoing", color: "text-muted" };
        const target = new Date(targetDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: "text-rose-500" };
        if (diffDays === 0) return { text: "Due today", color: "text-amber-500" };
        if (diffDays <= 7) return { text: `${diffDays} days left`, color: "text-amber-400" };
        return { text: `${diffDays} days left`, color: "text-muted" };
    }

    const GoalService = {
        init() {
            loadGoals();
            this.bindEvents();
        },

        refresh() {
            loadGoals();
        },

        getGoalsList() {
            return goalsList;
        },

        bindEvents() {
            // Status tabs
            document.querySelectorAll(".goals-tab-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".goals-tab-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    currentFilterStatus = btn.dataset.status;
                    renderGoals();
                });
            });

            // Category filter
            const catSelect = document.getElementById("goals-filter-category");
            if (catSelect) {
                catSelect.addEventListener("change", (e) => {
                    currentCategoryFilter = e.target.value;
                    renderGoals();
                });
            }

            // Goal Form
            const goalForm = document.getElementById("goal-form");
            if (goalForm) {
                goalForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    await DailyDeskGoals.handleFormSubmit();
                });
            }
        },

        openGoalModal(goalId = null) {
            const modalTitle = document.getElementById("goal-modal-title");
            const form = document.getElementById("goal-form");
            const idInput = document.getElementById("goal-id");
            const progressSlider = document.getElementById("goal-input-progress");
            const progressVal = document.getElementById("goal-progress-display");

            form.reset();

            if (goalId) {
                const goal = goalsList.find(g => g.id === goalId);
                if (goal) {
                    modalTitle.textContent = "Edit Goal";
                    idInput.value = goal.id;
                    document.getElementById("goal-input-title").value = goal.title;
                    document.getElementById("goal-input-desc").value = goal.description || "";
                    document.getElementById("goal-input-category").value = goal.category || "Personal";
                    document.getElementById("goal-input-target-date").value = goal.target_date || "";
                    document.getElementById("goal-input-target-value").value = goal.target_value || "";
                    progressSlider.value = goal.current_progress || 0;
                    progressVal.textContent = `${goal.current_progress || 0}%`;
                }
            } else {
                modalTitle.textContent = "Create New Goal";
                idInput.value = "";
                progressSlider.value = 0;
                progressVal.textContent = "0%";
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 60);
                document.getElementById("goal-input-target-date").value = futureDate.toISOString().split("T")[0];
            }

            progressSlider.oninput = function() {
                progressVal.textContent = `${this.value}%`;
            };

            window.DailyDeskApp.openModal("goal-modal");
        },

        async handleFormSubmit() {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) {
                window.DailyDeskApp.showToast("Please log in to save goals", "warning");
                return;
            }

            const id = document.getElementById("goal-id").value;
            const title = document.getElementById("goal-input-title").value.trim();
            const description = document.getElementById("goal-input-desc").value.trim();
            const category = document.getElementById("goal-input-category").value;
            const target_date = document.getElementById("goal-input-target-date").value;
            const target_value = document.getElementById("goal-input-target-value").value.trim();
            const current_progress = parseInt(document.getElementById("goal-input-progress").value, 10) || 0;

            if (!title) {
                window.DailyDeskApp.showToast("Goal title is required", "warning");
                return;
            }

            try {
                if (id) {
                    await window.DailyDeskDB.updateGoal(id, {
                        title,
                        description,
                        category,
                        target_date,
                        target_value,
                        current_progress,
                        status: current_progress >= 100 ? "Completed" : "In Progress"
                    }, user.id);
                    window.DailyDeskApp.showToast("Goal updated successfully", "success");
                } else {
                    await window.DailyDeskDB.addGoal({
                        title,
                        description,
                        category,
                        target_date,
                        target_value,
                        current_progress,
                        status: current_progress >= 100 ? "Completed" : "In Progress"
                    }, user.id);
                    window.DailyDeskApp.showToast("Goal created successfully", "success");
                }

                window.DailyDeskApp.closeModal("goal-modal");
                await loadGoals();
                if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
                if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
            } catch (err) {
                window.DailyDeskApp.showToast("Error saving goal: " + err.message, "error");
            }
        },

        async adjustProgress(goalId, delta) {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) return;

            const goal = goalsList.find(g => g.id === goalId);
            if (!goal) return;

            const newProgress = Math.min(100, Math.max(0, (goal.current_progress || 0) + delta));
            try {
                await window.DailyDeskDB.updateGoal(goalId, {
                    current_progress: newProgress,
                    status: newProgress >= 100 ? "Completed" : "In Progress"
                }, user.id);

                if (newProgress === 100) {
                    window.DailyDeskApp.showToast(`Goal Reached: ${goal.title}! 🎉`, "success");
                    if (window.confetti) window.confetti({ particleCount: 70, spread: 80 });
                }

                await loadGoals();
                if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
            } catch (err) {
                window.DailyDeskApp.showToast("Error adjusting progress: " + err.message, "error");
            }
        },

        async toggleComplete(goalId) {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) return;

            const goal = goalsList.find(g => g.id === goalId);
            if (!goal) return;

            const isCurrentlyCompleted = goal.status === "Completed" || goal.current_progress >= 100;
            const newProgress = isCurrentlyCompleted ? 0 : 100;
            const newStatus = isCurrentlyCompleted ? "In Progress" : "Completed";

            try {
                await window.DailyDeskDB.updateGoal(goalId, {
                    current_progress: newProgress,
                    status: newStatus
                }, user.id);

                if (newStatus === "Completed") {
                    window.DailyDeskApp.showToast(`Celebration! Goal completed: ${goal.title}`, "success");
                    if (window.confetti) window.confetti({ particleCount: 80, spread: 90 });
                } else {
                    window.DailyDeskApp.showToast(`Goal reopened: ${goal.title}`, "info");
                }

                await loadGoals();
                if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
            } catch (err) {
                window.DailyDeskApp.showToast("Error updating goal: " + err.message, "error");
            }
        },

        confirmDelete(goalId) {
            const goal = goalsList.find(g => g.id === goalId);
            if (!goal) return;

            window.DailyDeskApp.showConfirm(
                "Delete Goal",
                `Are you sure you want to delete "${goal.title}"?`,
                async () => {
                    const user = window.DailyDeskAuth.getCurrentUser();
                    try {
                        await window.DailyDeskDB.deleteGoal(goalId, user.id);
                        window.DailyDeskApp.showToast("Goal removed", "info");
                        await loadGoals();
                        if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
                    } catch (err) {
                        window.DailyDeskApp.showToast("Error deleting goal: " + err.message, "error");
                    }
                }
            );
        }
    };

    function formatDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.DailyDeskGoals = GoalService;
})();
