// ==============================================================================
// DailyDesk Task Manager Module
// ==============================================================================

(function() {
    let tasksList = [];
    let currentFilterTab = "all"; // 'all', 'today', 'upcoming', 'completed'
    let currentCategoryFilter = "all";
    let currentPriorityFilter = "all";
    let currentSortOption = "due_date_asc";
    let searchQuery = "";

    async function loadTasks() {
        const user = window.DailyDeskAuth.getCurrentUser();
        if (!user) return;

        try {
            tasksList = await window.DailyDeskDB.getTasks(user.id);
            renderTasks();
            updateTaskCounters();
        } catch (err) {
            window.DailyDeskApp.showToast("Failed to load tasks: " + err.message, "error");
        }
    }

    function renderTasks() {
        const container = document.getElementById("tasks-container");
        if (!container) return;

        const filtered = getFilteredTasks();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i data-lucide="check-circle-2"></i>
                    </div>
                    <h3>No tasks found</h3>
                    <p>There are no tasks matching your current filter criteria. Create a new task to stay productive!</p>
                    <button class="btn btn-primary" onclick="DailyDeskTasks.openTaskModal()">
                        <i data-lucide="plus"></i> Add New Task
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        const todayStr = new Date().toISOString().split("T")[0];

        container.innerHTML = filtered.map(task => {
            const isCompleted = !!task.completed;
            const isOverdue = !isCompleted && task.due_date && task.due_date < todayStr;
            const isToday = task.due_date === todayStr;

            let dueBadgeClass = "badge-outline";
            let dueBadgeLabel = task.due_date ? formatDate(task.due_date) : "No Due Date";

            if (isOverdue) {
                dueBadgeClass = "badge-danger";
                dueBadgeLabel = `Overdue (${formatDate(task.due_date)})`;
            } else if (isToday) {
                dueBadgeClass = "badge-amber";
                dueBadgeLabel = "Due Today";
            }

            const priorityBadge = `badge-priority-${task.priority ? task.priority.toLowerCase() : "medium"}`;

            return `
                <div class="task-card ${isCompleted ? 'is-completed' : ''}" data-task-id="${task.id}">
                    <div class="task-card-left">
                        <button class="task-checkbox ${isCompleted ? 'checked' : ''}" 
                                onclick="DailyDeskTasks.toggleComplete('${task.id}')"
                                title="${isCompleted ? 'Mark Pending' : 'Mark Completed'}"
                                aria-label="Toggle Complete">
                            <i data-lucide="${isCompleted ? 'check' : 'circle'}"></i>
                        </button>
                        <div class="task-info">
                            <div class="task-title-row">
                                <h4 class="task-title">${escapeHtml(task.title)}</h4>
                            </div>
                            ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
                            <div class="task-meta-row">
                                <span class="badge ${priorityBadge}">
                                    <i data-lucide="flag" class="icon-xs"></i> ${task.priority || 'Medium'}
                                </span>
                                <span class="badge badge-category">
                                    <i data-lucide="folder" class="icon-xs"></i> ${task.category || 'Work'}
                                </span>
                                <span class="badge ${dueBadgeClass}">
                                    <i data-lucide="calendar" class="icon-xs"></i> ${dueBadgeLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="task-card-actions">
                        <button class="btn-icon" onclick="DailyDeskTasks.openTaskModal('${task.id}')" title="Edit Task">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger" onclick="DailyDeskTasks.confirmDelete('${task.id}')" title="Delete Task">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        renderDashboardTasksWidget();

        if (window.lucide) window.lucide.createIcons();
    }

    function renderDashboardTasksWidget() {
        const container = document.getElementById("dash-priority-tasks-list");
        if (!container) return;

        const priorityTasks = tasksList
            .filter(t => !t.completed)
            .sort((a, b) => {
                const pWeights = { High: 3, Medium: 2, Low: 1 };
                return (pWeights[b.priority] || 2) - (pWeights[a.priority] || 2);
            })
            .slice(0, 4);

        if (priorityTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state-sm">
                    <p class="text-sm text-muted">All priority tasks cleared! Enjoy your organized day.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = priorityTasks.map(t => `
            <div class="task-card py-2.5 px-3.5">
                <div class="task-card-left">
                    <button class="task-checkbox" onclick="DailyDeskTasks.toggleComplete('${t.id}')">
                        <i data-lucide="circle"></i>
                    </button>
                    <div>
                        <span class="font-semibold text-sm text-main">${escapeHtml(t.title)}</span>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="badge badge-priority-${(t.priority || 'medium').toLowerCase()} text-xs">${t.priority}</span>
                            <span class="text-xs text-muted">${t.category}</span>
                            <span class="text-xs text-muted">• Due ${t.due_date ? formatDate(t.due_date) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <button class="btn-icon btn-icon-sm" onclick="DailyDeskTasks.openTaskModal('${t.id}')">
                    <i data-lucide="edit-3"></i>
                </button>
            </div>
        `).join("");
    }


    function getFilteredTasks() {
        const todayStr = new Date().toISOString().split("T")[0];

        return tasksList.filter(task => {
            // Tab filter
            if (currentFilterTab === "today") {
                if (task.due_date !== todayStr) return false;
            } else if (currentFilterTab === "upcoming") {
                if (task.completed || !task.due_date || task.due_date <= todayStr) return false;
            } else if (currentFilterTab === "completed") {
                if (!task.completed) return false;
            } else if (currentFilterTab === "pending") {
                if (task.completed) return false;
            }

            // Category filter
            if (currentCategoryFilter !== "all" && task.category !== currentCategoryFilter) {
                return false;
            }

            // Priority filter
            if (currentPriorityFilter !== "all" && task.priority !== currentPriorityFilter) {
                return false;
            }

            // Search query
            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                const matchTitle = (task.title || "").toLowerCase().includes(q);
                const matchDesc = (task.description || "").toLowerCase().includes(q);
                if (!matchTitle && !matchDesc) return false;
            }

            return true;
        }).sort((a, b) => {
            if (currentSortOption === "due_date_asc") {
                return (a.due_date || "9999") > (b.due_date || "9999") ? 1 : -1;
            } else if (currentSortOption === "due_date_desc") {
                return (a.due_date || "0000") < (b.due_date || "0000") ? 1 : -1;
            } else if (currentSortOption === "priority_high") {
                const pWeights = { High: 3, Medium: 2, Low: 1 };
                return (pWeights[b.priority] || 2) - (pWeights[a.priority] || 2);
            } else if (currentSortOption === "title_asc") {
                return a.title.localeCompare(b.title);
            }
            return (b.created_at || "") > (a.created_at || "") ? 1 : -1;
        });
    }

    function updateTaskCounters() {
        const todayStr = new Date().toISOString().split("T")[0];
        const total = tasksList.length;
        const completed = tasksList.filter(t => t.completed).length;
        const pending = total - completed;
        const todayCount = tasksList.filter(t => t.due_date === todayStr && !t.completed).length;

        const countTotal = document.getElementById("task-count-total");
        const countCompleted = document.getElementById("task-count-completed");
        const countPending = document.getElementById("task-count-pending");
        const countToday = document.getElementById("task-count-today");

        if (countTotal) countTotal.textContent = total;
        if (countCompleted) countCompleted.textContent = completed;
        if (countPending) countPending.textContent = pending;
        if (countToday) countToday.textContent = todayCount;

        // Dashboard widgets
        const dashCompleted = document.getElementById("dash-task-completed");
        const dashPending = document.getElementById("dash-task-pending");
        const dashTotal = document.getElementById("dash-task-total");
        if (dashCompleted) dashCompleted.textContent = completed;
        if (dashPending) dashPending.textContent = pending;
        if (dashTotal) dashTotal.textContent = total;

        // Calculate productivity completion rate
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const prodScoreEl = document.getElementById("dash-prod-score");
        const prodBarEl = document.getElementById("dash-prod-bar");
        if (prodScoreEl) prodScoreEl.textContent = `${rate}%`;
        if (prodBarEl) prodBarEl.style.width = `${rate}%`;
    }

    const TaskService = {
        init() {
            loadTasks();
            this.bindEvents();
        },

        refresh() {
            loadTasks();
        },

        getTasksList() {
            return tasksList;
        },

        bindEvents() {
            // Tab filtering
            document.querySelectorAll(".tasks-tab-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    document.querySelectorAll(".tasks-tab-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    currentFilterTab = btn.dataset.tab;
                    renderTasks();
                });
            });

            // Category filter select
            const catSelect = document.getElementById("task-filter-category");
            if (catSelect) {
                catSelect.addEventListener("change", (e) => {
                    currentCategoryFilter = e.target.value;
                    renderTasks();
                });
            }

            // Priority filter select
            const prioSelect = document.getElementById("task-filter-priority");
            if (prioSelect) {
                prioSelect.addEventListener("change", (e) => {
                    currentPriorityFilter = e.target.value;
                    renderTasks();
                });
            }

            // Sort select
            const sortSelect = document.getElementById("task-sort-by");
            if (sortSelect) {
                sortSelect.addEventListener("change", (e) => {
                    currentSortOption = e.target.value;
                    renderTasks();
                });
            }

            // Search input
            const searchInput = document.getElementById("task-search-input");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    searchQuery = e.target.value;
                    renderTasks();
                });
            }

            // Task Form submission
            const taskForm = document.getElementById("task-form");
            if (taskForm) {
                taskForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    await DailyDeskTasks.handleFormSubmit();
                });
            }
        },

        openTaskModal(taskId = null) {
            const modal = document.getElementById("task-modal");
            const modalTitle = document.getElementById("task-modal-title");
            const form = document.getElementById("task-form");
            const idInput = document.getElementById("task-id");

            form.reset();

            if (taskId) {
                const task = tasksList.find(t => t.id === taskId);
                if (task) {
                    modalTitle.textContent = "Edit Task";
                    idInput.value = task.id;
                    document.getElementById("task-input-title").value = task.title;
                    document.getElementById("task-input-desc").value = task.description || "";
                    document.getElementById("task-input-category").value = task.category || "Work";
                    document.getElementById("task-input-priority").value = task.priority || "Medium";
                    document.getElementById("task-input-due").value = task.due_date || "";
                }
            } else {
                modalTitle.textContent = "Create New Task";
                idInput.value = "";
                document.getElementById("task-input-due").value = new Date().toISOString().split("T")[0];
            }

            window.DailyDeskApp.openModal("task-modal");
        },

        async handleFormSubmit() {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) {
                window.DailyDeskApp.showToast("Please log in to save tasks", "warning");
                return;
            }

            const id = document.getElementById("task-id").value;
            const title = document.getElementById("task-input-title").value.trim();
            const description = document.getElementById("task-input-desc").value.trim();
            const category = document.getElementById("task-input-category").value;
            const priority = document.getElementById("task-input-priority").value;
            const due_date = document.getElementById("task-input-due").value;

            if (!title) {
                window.DailyDeskApp.showToast("Task title is required", "warning");
                return;
            }

            try {
                if (id) {
                    // Update
                    await window.DailyDeskDB.updateTask(id, {
                        title,
                        description,
                        category,
                        priority,
                        due_date
                    }, user.id);
                    window.DailyDeskApp.showToast("Task updated successfully", "success");
                } else {
                    // Add
                    await window.DailyDeskDB.addTask({
                        title,
                        description,
                        category,
                        priority,
                        due_date
                    }, user.id);
                    window.DailyDeskApp.showToast("Task created successfully", "success");
                }

                window.DailyDeskApp.closeModal("task-modal");
                await loadTasks();
                if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
                if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
            } catch (err) {
                window.DailyDeskApp.showToast("Error saving task: " + err.message, "error");
            }
        },

        async toggleComplete(taskId) {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) return;

            const task = tasksList.find(t => t.id === taskId);
            if (!task) return;

            const newCompleted = !task.completed;
            try {
                await window.DailyDeskDB.updateTask(taskId, {
                    completed: newCompleted,
                    completed_at: newCompleted ? new Date().toISOString() : null
                }, user.id);

                if (newCompleted) {
                    window.DailyDeskApp.showToast(`Completed: ${task.title}`, "success");
                    // Trigger celebratory micro-confetti if completed
                    if (window.confetti) {
                        window.confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
                    }
                }

                await loadTasks();
                if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
                if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
            } catch (err) {
                window.DailyDeskApp.showToast("Error updating task: " + err.message, "error");
            }
        },

        confirmDelete(taskId) {
            const task = tasksList.find(t => t.id === taskId);
            if (!task) return;

            window.DailyDeskApp.showConfirm(
                "Delete Task",
                `Are you sure you want to permanently delete "${task.title}"?`,
                async () => {
                    const user = window.DailyDeskAuth.getCurrentUser();
                    try {
                        await window.DailyDeskDB.deleteTask(taskId, user.id);
                        window.DailyDeskApp.showToast("Task deleted", "info");
                        await loadTasks();
                        if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
                        if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
                    } catch (err) {
                        window.DailyDeskApp.showToast("Error deleting task: " + err.message, "error");
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
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.DailyDeskTasks = TaskService;
})();
