// ==============================================================================
// DailyDesk Expense Tracker Module
// ==============================================================================

(function() {
    let expensesList = [];
    let currentCategoryFilter = "all";
    let currentDateFilter = "all"; // 'all', 'today', 'week', 'month'
    let searchQuery = "";
    let categoryChartInstance = null;
    let timelineChartInstance = null;

    async function loadExpenses() {
        const user = window.DailyDeskAuth.getCurrentUser();
        if (!user) return;

        try {
            expensesList = await window.DailyDeskDB.getExpenses(user.id);
            renderExpenses();
            calculateExpenseMetrics();
            renderCharts();
        } catch (err) {
            window.DailyDeskApp.showToast("Failed to load expenses: " + err.message, "error");
        }
    }

    function calculateExpenseMetrics() {
        const profile = window.DailyDeskAuth.getCurrentProfile();
        const currency = (profile && profile.currency) || window.DAILY_CONFIG.DEFAULT_CURRENCY;
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // Start of week (7 days ago)
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        // Start of month
        const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

        let todaySum = 0;
        let weekSum = 0;
        let monthSum = 0;
        let totalSum = 0;

        expensesList.forEach(exp => {
            const amt = parseFloat(exp.amount) || 0;
            totalSum += amt;
            if (exp.date === todayStr) todaySum += amt;
            if (exp.date >= weekAgoStr) weekSum += amt;
            if (exp.date >= startOfMonthStr) monthSum += amt;
        });

        // Update cards in Expenses View
        const elToday = document.getElementById("exp-metric-today");
        const elWeek = document.getElementById("exp-metric-week");
        const elMonth = document.getElementById("exp-metric-month");
        const elTotal = document.getElementById("exp-metric-total");

        if (elToday) elToday.textContent = `${currency}${todaySum.toFixed(2)}`;
        if (elWeek) elWeek.textContent = `${currency}${weekSum.toFixed(2)}`;
        if (elMonth) elMonth.textContent = `${currency}${monthSum.toFixed(2)}`;
        if (elTotal) elTotal.textContent = `${currency}${totalSum.toFixed(2)}`;

        // Update Dashboard cards
        const dashToday = document.getElementById("dash-exp-today");
        const dashMonth = document.getElementById("dash-exp-month");
        if (dashToday) dashToday.textContent = `${currency}${todaySum.toFixed(2)}`;
        if (dashMonth) dashMonth.textContent = `${currency}${monthSum.toFixed(2)}`;

        return { todaySum, weekSum, monthSum, totalSum, currency };
    }

    function getFilteredExpenses() {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

        return expensesList.filter(exp => {
            // Category filter
            if (currentCategoryFilter !== "all" && exp.category !== currentCategoryFilter) {
                return false;
            }

            // Date filter
            if (currentDateFilter === "today" && exp.date !== todayStr) {
                return false;
            } else if (currentDateFilter === "week" && exp.date < weekAgoStr) {
                return false;
            } else if (currentDateFilter === "month" && exp.date < startOfMonthStr) {
                return false;
            }

            // Search query
            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                const matchTitle = (exp.title || "").toLowerCase().includes(q);
                const matchDesc = (exp.description || "").toLowerCase().includes(q);
                const matchCat = (exp.category || "").toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchCat) return false;
            }

            return true;
        }).sort((a, b) => (b.date || "") > (a.date || "") ? 1 : -1);
    }

    function renderExpenses() {
        const container = document.getElementById("expenses-table-body");
        if (!container) return;

        const profile = window.DailyDeskAuth.getCurrentProfile();
        const currency = (profile && profile.currency) || window.DAILY_CONFIG.DEFAULT_CURRENCY;
        const filtered = getFilteredExpenses();

        if (filtered.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i data-lucide="receipt"></i>
                            </div>
                            <h3>No expense records found</h3>
                            <p>No expenses match your active filter. Log an expense to keep track of your budget.</p>
                            <button class="btn btn-primary" onclick="DailyDeskExpenses.openExpenseModal()">
                                <i data-lucide="plus"></i> Log Expense
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        container.innerHTML = filtered.map(exp => {
            const catObj = window.DAILY_CONFIG.EXPENSE_CATEGORIES.find(c => c.id === exp.category) || {
                color: "#6B7280",
                icon: "tag"
            };

            return `
                <tr class="expense-row" data-id="${exp.id}">
                    <td class="font-medium text-main">
                        <div class="expense-title-cell">
                            <span class="cat-dot" style="background-color: ${catObj.color};"></span>
                            <div>
                                <span class="font-semibold">${escapeHtml(exp.title)}</span>
                                ${exp.description ? `<p class="text-xs text-muted mt-0.5">${escapeHtml(exp.description)}</p>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge badge-subtle" style="border-left: 3px solid ${catObj.color};">
                            ${exp.category}
                        </span>
                    </td>
                    <td class="text-muted text-sm">
                        ${exp.date ? formatDate(exp.date) : "—"}
                    </td>
                    <td class="text-muted text-sm">
                        <span class="badge badge-outline">${exp.payment_method || 'Card'}</span>
                    </td>
                    <td class="text-right font-bold text-main">
                        ${currency}${parseFloat(exp.amount).toFixed(2)}
                    </td>
                    <td class="text-right">
                        <div class="row-actions">
                            <button class="btn-icon" onclick="DailyDeskExpenses.openExpenseModal('${exp.id}')" title="Edit">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-icon btn-icon-danger" onclick="DailyDeskExpenses.confirmDelete('${exp.id}')" title="Delete">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (window.lucide) window.lucide.createIcons();
    }

    function renderCharts() {
        if (!window.Chart) return;

        const profile = window.DailyDeskAuth.getCurrentProfile();
        const currency = (profile && profile.currency) || window.DAILY_CONFIG.DEFAULT_CURRENCY;

        // 1. Category Distribution Donut Chart
        const catCanvas = document.getElementById("expense-category-chart");
        if (catCanvas) {
            const catTotals = {};
            expensesList.forEach(e => {
                const c = e.category || "Other";
                catTotals[c] = (catTotals[c] || 0) + (parseFloat(e.amount) || 0);
            });

            const labels = Object.keys(catTotals);
            const dataValues = Object.values(catTotals);
            const bgColors = labels.map(label => {
                const found = window.DAILY_CONFIG.EXPENSE_CATEGORIES.find(c => c.id === label);
                return found ? found.color : "#6366F1";
            });

            if (categoryChartInstance) {
                categoryChartInstance.destroy();
            }

            categoryChartInstance = new Chart(catCanvas, {
                type: "doughnut",
                data: {
                    labels: labels.length ? labels : ["No data"],
                    datasets: [{
                        data: dataValues.length ? dataValues : [1],
                        backgroundColor: bgColors.length ? bgColors : ["#4B5563"],
                        borderWidth: 2,
                        borderColor: document.documentElement.getAttribute("data-theme") === "light" ? "#FFFFFF" : "#1E293B"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                color: document.documentElement.getAttribute("data-theme") === "light" ? "#475569" : "#94A3B8",
                                boxWidth: 12,
                                padding: 12,
                                font: { family: "Inter", size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    return ` ${ctx.label}: ${currency}${Number(ctx.raw).toFixed(2)}`;
                                }
                            }
                        }
                    },
                    cutout: "70%"
                }
            });
        }

        // 2. Timeline / Monthly Spending Bar Chart
        const timeCanvas = document.getElementById("expense-timeline-chart");
        if (timeCanvas) {
            // Group last 7 days or weeks
            const daysMap = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const str = d.toISOString().split("T")[0];
                const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                daysMap[str] = { label: dayName, total: 0 };
            }

            expensesList.forEach(e => {
                if (daysMap[e.date]) {
                    daysMap[e.date].total += (parseFloat(e.amount) || 0);
                }
            });

            const dayLabels = Object.values(daysMap).map(d => d.label);
            const dayValues = Object.values(daysMap).map(d => d.total);

            if (timelineChartInstance) {
                timelineChartInstance.destroy();
            }

            timelineChartInstance = new Chart(timeCanvas, {
                type: "bar",
                data: {
                    labels: dayLabels,
                    datasets: [{
                        label: "Daily Spend",
                        data: dayValues,
                        backgroundColor: "#6366F1",
                        hoverBackgroundColor: "#818CF8",
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: document.documentElement.getAttribute("data-theme") === "light" ? "#F1F5F9" : "#334155"
                            },
                            ticks: {
                                color: document.documentElement.getAttribute("data-theme") === "light" ? "#64748B" : "#94A3B8",
                                callback: val => `${currency}${val}`
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: document.documentElement.getAttribute("data-theme") === "light" ? "#64748B" : "#94A3B8"
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => ` Spending: ${currency}${Number(ctx.raw).toFixed(2)}`
                            }
                        }
                    }
                }
            });
        }
    }

    const ExpenseService = {
        init() {
            loadExpenses();
            this.bindEvents();
        },

        refresh() {
            loadExpenses();
        },

        getExpensesList() {
            return expensesList;
        },

        bindEvents() {
            // Category filter
            const catSelect = document.getElementById("expense-filter-cat");
            if (catSelect) {
                catSelect.addEventListener("change", (e) => {
                    currentCategoryFilter = e.target.value;
                    renderExpenses();
                });
            }

            // Date filter pills
            document.querySelectorAll(".expense-date-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".expense-date-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    currentDateFilter = btn.dataset.date;
                    renderExpenses();
                });
            });

            // Search input
            const searchInput = document.getElementById("expense-search-input");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    searchQuery = e.target.value;
                    renderExpenses();
                });
            }

            // Expense Form submission
            const expForm = document.getElementById("expense-form");
            if (expForm) {
                expForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    await DailyDeskExpenses.handleFormSubmit();
                });
            }

            // Export to CSV button
            const exportBtn = document.getElementById("btn-export-expenses");
            if (exportBtn) {
                exportBtn.addEventListener("click", () => {
                    DailyDeskExpenses.exportCSV();
                });
            }
        },

        openExpenseModal(expId = null) {
            const modalTitle = document.getElementById("expense-modal-title");
            const form = document.getElementById("expense-form");
            const idInput = document.getElementById("expense-id");

            form.reset();

            if (expId) {
                const exp = expensesList.find(e => e.id === expId);
                if (exp) {
                    modalTitle.textContent = "Edit Expense";
                    idInput.value = exp.id;
                    document.getElementById("exp-input-title").value = exp.title;
                    document.getElementById("exp-input-desc").value = exp.description || "";
                    document.getElementById("exp-input-amount").value = exp.amount;
                    document.getElementById("exp-input-category").value = exp.category;
                    document.getElementById("exp-input-method").value = exp.payment_method || "Card";
                    document.getElementById("exp-input-date").value = exp.date;
                }
            } else {
                modalTitle.textContent = "Log New Expense";
                idInput.value = "";
                document.getElementById("exp-input-date").value = new Date().toISOString().split("T")[0];
            }

            window.DailyDeskApp.openModal("expense-modal");
        },

        async handleFormSubmit() {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) {
                window.DailyDeskApp.showToast("Please log in to record expenses", "warning");
                return;
            }

            const id = document.getElementById("expense-id").value;
            const title = document.getElementById("exp-input-title").value.trim();
            const description = document.getElementById("exp-input-desc").value.trim();
            const amount = parseFloat(document.getElementById("exp-input-amount").value);
            const category = document.getElementById("exp-input-category").value;
            const payment_method = document.getElementById("exp-input-method").value;
            const date = document.getElementById("exp-input-date").value;

            if (!title) {
                window.DailyDeskApp.showToast("Expense title is required", "warning");
                return;
            }
            if (isNaN(amount) || amount <= 0) {
                window.DailyDeskApp.showToast("Please enter a valid amount", "warning");
                return;
            }

            try {
                if (id) {
                    await window.DailyDeskDB.updateExpense(id, {
                        title,
                        description,
                        amount,
                        category,
                        payment_method,
                        date
                    }, user.id);
                    window.DailyDeskApp.showToast("Expense updated successfully", "success");
                } else {
                    await window.DailyDeskDB.addExpense({
                        title,
                        description,
                        amount,
                        category,
                        payment_method,
                        date
                    }, user.id);
                    window.DailyDeskApp.showToast("Expense logged successfully", "success");
                }

                window.DailyDeskApp.closeModal("expense-modal");
                await loadExpenses();
                if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
                if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
            } catch (err) {
                window.DailyDeskApp.showToast("Error saving expense: " + err.message, "error");
            }
        },

        confirmDelete(expId) {
            const exp = expensesList.find(e => e.id === expId);
            if (!exp) return;

            window.DailyDeskApp.showConfirm(
                "Delete Expense",
                `Are you sure you want to delete "${exp.title}" for ${window.DAILY_CONFIG.DEFAULT_CURRENCY}${exp.amount}?`,
                async () => {
                    const user = window.DailyDeskAuth.getCurrentUser();
                    try {
                        await window.DailyDeskDB.deleteExpense(expId, user.id);
                        window.DailyDeskApp.showToast("Expense record removed", "info");
                        await loadExpenses();
                        if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
                        if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
                    } catch (err) {
                        window.DailyDeskApp.showToast("Error deleting expense: " + err.message, "error");
                    }
                }
            );
        },

        exportCSV() {
            if (expensesList.length === 0) {
                window.DailyDeskApp.showToast("No expense records to export", "info");
                return;
            }

            const headers = ["Title", "Category", "Amount", "Payment Method", "Date", "Description"];
            const rows = expensesList.map(e => [
                `"${(e.title || '').replace(/"/g, '""')}"`,
                `"${e.category || ''}"`,
                e.amount,
                `"${e.payment_method || ''}"`,
                `"${e.date || ''}"`,
                `"${(e.description || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `dailydesk-expenses-${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.DailyDeskApp.showToast("Expenses exported to CSV successfully", "success");
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

    window.DailyDeskExpenses = ExpenseService;
})();
