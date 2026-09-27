// ==============================================================================
// DailyDesk Main Application Controller & Router
// ==============================================================================

(function() {
    let currentView = "landing";
    let pendingConfirmAction = null;

    const VIEWS = ["landing", "dashboard", "myday", "tasks", "expenses", "notes", "goals", "admin", "profile"];

    async function initApp() {
        // 1. Initialize Theme
        initTheme();

        // 2. Initialize Auth
        await window.DailyDeskAuth.init();

        // 3. Initialize Feature Modules
        window.DailyDeskTasks.init();
        window.DailyDeskExpenses.init();
        window.DailyDeskNotes.init();
        window.DailyDeskGoals.init();
        window.DailyDeskSearch.init();

        // 4. Bind Global UI Events
        bindUIEvents();

        // 5. Check URL hash for direct routing or default
        const hash = window.location.hash.replace("#", "");
        if (VIEWS.includes(hash)) {
            navigate(hash);
        } else {
            // Check if logged in: if so, go to dashboard, else show landing
            const user = window.DailyDeskAuth.getCurrentUser();
            if (user) {
                navigate("dashboard");
            } else {
                showLanding();
            }
        }

        // Render Lucide icons
        if (window.lucide) window.lucide.createIcons();
    }

    function initTheme() {
        const saved = localStorage.getItem("dailydesk_theme") || "dark";
        document.documentElement.setAttribute("data-theme", saved);
        updateThemeToggleIcons(saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("dailydesk_theme", next);
        updateThemeToggleIcons(next);

        // Re-render charts with new theme colors
        if (window.DailyDeskExpenses) window.DailyDeskExpenses.refresh();
        if (window.DailyDeskDashboard) window.DailyDeskDashboard.refresh();
        showToast(`Switched to ${next} theme`, "info", 1500);
    }

    function updateThemeToggleIcons(theme) {
        document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
            btn.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
        });
        if (window.lucide) window.lucide.createIcons();
    }

    function navigate(viewName) {
        if (!VIEWS.includes(viewName)) viewName = "dashboard";

        // Admin view gate check
        if (viewName === "admin" && !window.DailyDeskAuth.isAdmin()) {
            showToast("Admin access restricted. Please log in as Admin.", "error");
            viewName = "dashboard";
        }

        currentView = viewName;
        window.location.hash = viewName;

        // Hide landing page, show app shell
        const landingEl = document.getElementById("landing-page-view");
        const appShellEl = document.getElementById("app-main-shell");

        if (viewName === "landing") {
            if (landingEl) landingEl.style.display = "block";
            if (appShellEl) appShellEl.style.display = "none";
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        if (landingEl) landingEl.style.display = "none";
        if (appShellEl) appShellEl.style.display = "flex";

        // Toggle view containers
        document.querySelectorAll(".page-view").forEach(el => {
            el.classList.remove("active");
        });

        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) targetView.classList.add("active");

        // Update active sidebar nav links
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
            if (link.dataset.view === viewName) link.classList.add("active");
        });

        // Trigger module refreshes
        if (viewName === "dashboard") {
            renderDashboardSummary();
        } else if (viewName === "myday") {
            window.DailyDeskMyDay.refresh();
        } else if (viewName === "tasks") {
            window.DailyDeskTasks.refresh();
        } else if (viewName === "expenses") {
            window.DailyDeskExpenses.refresh();
        } else if (viewName === "notes") {
            window.DailyDeskNotes.refresh();
        } else if (viewName === "goals") {
            window.DailyDeskGoals.refresh();
        } else if (viewName === "admin") {
            window.DailyDeskAdmin.refresh();
        } else if (viewName === "profile") {
            renderProfileSettings();
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.lucide) window.lucide.createIcons();
    }

    function showLanding() {
        navigate("landing");
    }

    function renderDashboardSummary() {
        const now = new Date();
        const profile = window.DailyDeskAuth.getCurrentProfile();
        const currency = (profile && profile.currency) || window.DAILY_CONFIG.DEFAULT_CURRENCY;

        // Date Display
        const dateEl = document.getElementById("dash-header-date");
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
        }

        // Welcome Greeting
        const welcomeEl = document.getElementById("dash-welcome-name");
        if (welcomeEl) {
            const firstName = (profile && profile.full_name) ? profile.full_name.split(" ")[0] : "Friend";
            welcomeEl.textContent = firstName;
        }

        // Refresh sub-widgets
        window.DailyDeskTasks.refresh();
        window.DailyDeskExpenses.refresh();
        window.DailyDeskNotes.refresh();
        window.DailyDeskGoals.refresh();
    }

    function renderProfileSettings() {
        const profile = window.DailyDeskAuth.getCurrentProfile();
        if (!profile) return;

        const nameInput = document.getElementById("prof-input-name");
        const emailInput = document.getElementById("prof-input-email");
        const currencySelect = document.getElementById("prof-input-currency");
        const avatarImg = document.getElementById("prof-avatar-preview");
        const roleBadge = document.getElementById("prof-role-badge");

        if (nameInput) nameInput.value = profile.full_name || "";
        if (emailInput) emailInput.value = profile.email || "";
        if (currencySelect) currencySelect.value = profile.currency || "$";
        if (avatarImg) {
            avatarImg.src = profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || 'DD')}`;
        }
        if (roleBadge) {
            roleBadge.textContent = profile.role === "admin" ? "Administrator" : "Standard User";
            roleBadge.className = `badge ${profile.role === "admin" ? "badge-danger" : "badge-primary"}`;
        }
    }

    function bindUIEvents() {
        // Sidebar Navigation
        document.querySelectorAll("[data-view-target]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const target = btn.getAttribute("data-view-target");
                navigate(target);
                // Close mobile sidebar if open
                closeMobileSidebar();
            });
        });

        // Theme toggle buttons
        document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
            btn.addEventListener("click", toggleTheme);
        });

        // Mobile Menu Toggle
        const menuToggle = document.getElementById("mobile-menu-toggle");
        if (menuToggle) {
            menuToggle.addEventListener("click", () => {
                document.getElementById("app-sidebar").classList.toggle("open");
            });
        }

        const sidebarClose = document.getElementById("sidebar-close-btn");
        if (sidebarClose) {
            sidebarClose.addEventListener("click", closeMobileSidebar);
        }

        // Profile Form Submit
        const profileForm = document.getElementById("profile-form");
        if (profileForm) {
            profileForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const full_name = document.getElementById("prof-input-name").value.trim();
                const currency = document.getElementById("prof-input-currency").value;

                try {
                    await window.DailyDeskAuth.updateProfile({ full_name, currency });
                    showToast("Profile settings updated successfully!", "success");
                    renderDashboardSummary();
                } catch (err) {
                    showToast("Error updating profile: " + err.message, "error");
                }
            });
        }

        // Auth Form (Login / Register modal)
        const authForm = document.getElementById("auth-form");
        if (authForm) {
            authForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const mode = document.getElementById("auth-mode").value; // 'signin' or 'signup'
                const email = document.getElementById("auth-email").value.trim();
                const password = document.getElementById("auth-password").value;
                const name = document.getElementById("auth-name").value.trim();

                try {
                    if (mode === "signup") {
                        await window.DailyDeskAuth.signUp(email, password, name);
                        showToast("Account created successfully! Welcome to DailyDesk.", "success");
                    } else {
                        await window.DailyDeskAuth.signIn(email, password);
                        showToast("Signed in successfully!", "success");
                    }
                    closeModal("auth-modal");
                    navigate("dashboard");
                } catch (err) {
                    showToast(err.message || "Authentication error", "error");
                }
            });
        }

        // Modal backdrop click and Escape key listeners
        document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
            backdrop.addEventListener("click", (e) => {
                if (e.target === backdrop) {
                    backdrop.classList.remove("active");
                }
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                document.querySelectorAll(".modal-backdrop.active").forEach(m => m.classList.remove("active"));
            }
        });

        // Confirmation Modal Buttons
        const confirmBtn = document.getElementById("btn-confirm-proceed");
        if (confirmBtn) {
            confirmBtn.addEventListener("click", () => {
                if (pendingConfirmAction) pendingConfirmAction();
                closeModal("confirm-modal");
                pendingConfirmAction = null;
            });
        }

        // Copy SQL Script Button
        const copySqlBtn = document.getElementById("btn-copy-sql");
        if (copySqlBtn) {
            copySqlBtn.addEventListener("click", () => {
                const sqlText = document.getElementById("sql-script-content").innerText;
                navigator.clipboard.writeText(sqlText).then(() => {
                    showToast("SQL script copied! Paste into Supabase SQL Editor.", "success");
                }).catch(() => {
                    showToast("Failed to copy SQL text", "error");
                });
            });
        }
    }

    function closeMobileSidebar() {
        const sidebar = document.getElementById("app-sidebar");
        if (sidebar) sidebar.classList.remove("open");
    }

    // Modal Operations
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add("active");
            if (window.lucide) window.lucide.createIcons();
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("active");
    }

    function showConfirm(title, message, onProceed) {
        const modalTitle = document.getElementById("confirm-modal-title");
        const modalMsg = document.getElementById("confirm-modal-message");

        if (modalTitle) modalTitle.textContent = title;
        if (modalMsg) modalMsg.textContent = message;

        pendingConfirmAction = onProceed;
        openModal("confirm-modal");
    }

    // Toast Notification Engine
    function showToast(message, type = "info", duration = 3200) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast-card toast-${type}`;

        let iconName = "info";
        if (type === "success") iconName = "check-circle";
        if (type === "error") iconName = "alert-circle";
        if (type === "warning") iconName = "alert-triangle";

        toast.innerHTML = `
            <div class="toast-icon">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Animate entrance
        setTimeout(() => toast.classList.add("show"), 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Global App Object
    window.DailyDeskApp = {
        init: initApp,
        navigate,
        showLanding,
        openModal,
        closeModal,
        showToast,
        showConfirm,
        toggleTheme,
        openAuthModal(mode = "signin") {
            const modeInput = document.getElementById("auth-mode");
            const titleEl = document.getElementById("auth-modal-title");
            const submitBtn = document.getElementById("auth-submit-btn");
            const nameField = document.getElementById("auth-name-container");

            if (modeInput) modeInput.value = mode;
            if (nameField) nameField.style.display = mode === "signup" ? "block" : "none";
            if (titleEl) titleEl.textContent = mode === "signup" ? "Create DailyDesk Account" : "Sign In to DailyDesk";
            if (submitBtn) submitBtn.textContent = mode === "signup" ? "Create Account" : "Sign In";

            openModal("auth-modal");
        },
        toggleAuthMode() {
            const currentMode = document.getElementById("auth-mode").value;
            this.openAuthModal(currentMode === "signup" ? "signin" : "signup");
        }
    };

    window.DailyDeskDashboard = {
        refresh: renderDashboardSummary
    };


    // Auto-boot when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApp);
    } else {
        initApp();
    }
})();
