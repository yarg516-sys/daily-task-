// ==============================================================================
// DailyDesk Supabase Client & Data Layer
// ==============================================================================

(function() {
    let client = null;
    let isSupabaseOnline = false;
    let tablesConfigured = false;

    // Check if Supabase JS library is loaded
    function getClient() {
        if (!client && window.supabase && window.supabase.createClient) {
            client = window.supabase.createClient(
                window.DAILY_CONFIG.SUPABASE_URL,
                window.DAILY_CONFIG.SUPABASE_ANON_KEY
            );
        }
        return client;
    }

    // Local state storage key prefix
    const STORAGE_KEY = "dailydesk_v2_data";

    function getLocalData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn("Error reading local state", e);
        }
        // Initialize with rich sample data
        const initial = JSON.parse(JSON.stringify(window.DAILY_CONFIG.SAMPLE_DATA));
        saveLocalData(initial);
        return initial;
    }

    function saveLocalData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving local state", e);
        }
    }

    // Verification check for Supabase tables
    async function testSupabaseConnection() {
        const sb = getClient();
        if (!sb) {
            updateConnectionStatus(false, "Supabase Client Missing");
            return false;
        }

        try {
            // Attempt to query tasks table with limit 1
            const { data, error } = await sb.from("tasks").select("id").limit(1);
            if (error) {
                // If 404/relation does not exist, schema has not been run
                if (error.code === "PGRST204" || error.code === "42P01" || error.message?.includes("not found") || error.code === "PGRST301") {
                    tablesConfigured = false;
                    isSupabaseOnline = true; // Auth works, schema pending
                    updateConnectionStatus(true, "Schema Pending", "warning");
                    return false;
                }
                console.warn("Supabase query warning:", error.message);
                tablesConfigured = false;
                updateConnectionStatus(true, "Schema Pending", "warning");
                return false;
            }

            tablesConfigured = true;
            isSupabaseOnline = true;
            updateConnectionStatus(true, "Supabase Connected", "success");
            return true;
        } catch (err) {
            console.warn("Supabase connection check failed:", err);
            isSupabaseOnline = false;
            tablesConfigured = false;
            updateConnectionStatus(false, "Offline / Local Demo", "offline");
            return false;
        }
    }

    function updateConnectionStatus(online, label, type) {
        const pill = document.getElementById("db-status-pill");
        if (!pill) return;

        pill.className = `status-pill status-${type || (online ? "success" : "offline")}`;
        pill.innerHTML = `
            <span class="status-indicator"></span>
            <span class="status-text">${label}</span>
        `;
    }

    // CRUD Helper for Generic Entities
    const DataService = {
        async checkConnection() {
            return await testSupabaseConnection();
        },

        isTablesReady() {
            return tablesConfigured;
        },

        // --- TASKS ---
        async getTasks(userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb
                    .from("tasks")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false });
                if (!error && data) return data;
            }
            return getLocalData().tasks || [];
        },

        async addTask(task, userId) {
            const sb = getClient();
            const newTask = {
                id: "task-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                user_id: userId,
                title: task.title,
                description: task.description || "",
                category: task.category || "Work",
                priority: task.priority || "Medium",
                due_date: task.due_date || new Date().toISOString().split("T")[0],
                completed: false,
                created_at: new Date().toISOString()
            };

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("tasks").insert([newTask]).select();
                if (error) throw new Error(error.message);
                this.logActivity("Task Created", "Task", `Created '${newTask.title}'`, userId);
                return data[0];
            }

            const local = getLocalData();
            local.tasks.unshift(newTask);
            saveLocalData(local);
            this.logActivity("Task Created", "Task", `Created '${newTask.title}'`, userId);
            return newTask;
        },

        async updateTask(id, updates, userId) {
            const sb = getClient();
            updates.updated_at = new Date().toISOString();

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("tasks").update(updates).eq("id", id).select();
                if (error) throw new Error(error.message);
                return data[0];
            }

            const local = getLocalData();
            const idx = local.tasks.findIndex(t => t.id === id);
            if (idx !== -1) {
                local.tasks[idx] = { ...local.tasks[idx], ...updates };
                saveLocalData(local);
                return local.tasks[idx];
            }
            return null;
        },

        async deleteTask(id, userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { error } = await sb.from("tasks").delete().eq("id", id);
                if (error) throw new Error(error.message);
                this.logActivity("Task Deleted", "Task", `Deleted task ID ${id}`, userId);
                return true;
            }

            const local = getLocalData();
            local.tasks = local.tasks.filter(t => t.id !== id);
            saveLocalData(local);
            this.logActivity("Task Deleted", "Task", `Deleted task ID ${id}`, userId);
            return true;
        },

        // --- EXPENSES ---
        async getExpenses(userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb
                    .from("expenses")
                    .select("*")
                    .eq("user_id", userId)
                    .order("date", { ascending: false });
                if (!error && data) return data;
            }
            return getLocalData().expenses || [];
        },

        async addExpense(expense, userId) {
            const sb = getClient();
            const newExp = {
                id: "exp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                user_id: userId,
                title: expense.title,
                description: expense.description || "",
                category: expense.category || "Other",
                amount: parseFloat(expense.amount) || 0,
                payment_method: expense.payment_method || "Card",
                date: expense.date || new Date().toISOString().split("T")[0],
                created_at: new Date().toISOString()
            };

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("expenses").insert([newExp]).select();
                if (error) throw new Error(error.message);
                this.logActivity("Expense Logged", "Expense", `Added ${window.DAILY_CONFIG.DEFAULT_CURRENCY}${newExp.amount} for ${newExp.title}`, userId);
                return data[0];
            }

            const local = getLocalData();
            local.expenses.unshift(newExp);
            saveLocalData(local);
            this.logActivity("Expense Logged", "Expense", `Added ${window.DAILY_CONFIG.DEFAULT_CURRENCY}${newExp.amount} for ${newExp.title}`, userId);
            return newExp;
        },

        async updateExpense(id, updates, userId) {
            const sb = getClient();
            if (updates.amount) updates.amount = parseFloat(updates.amount);
            updates.updated_at = new Date().toISOString();

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("expenses").update(updates).eq("id", id).select();
                if (error) throw new Error(error.message);
                return data[0];
            }

            const local = getLocalData();
            const idx = local.expenses.findIndex(e => e.id === id);
            if (idx !== -1) {
                local.expenses[idx] = { ...local.expenses[idx], ...updates };
                saveLocalData(local);
                return local.expenses[idx];
            }
            return null;
        },

        async deleteExpense(id, userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { error } = await sb.from("expenses").delete().eq("id", id);
                if (error) throw new Error(error.message);
                this.logActivity("Expense Deleted", "Expense", `Deleted expense record`, userId);
                return true;
            }

            const local = getLocalData();
            local.expenses = local.expenses.filter(e => e.id !== id);
            saveLocalData(local);
            this.logActivity("Expense Deleted", "Expense", `Deleted expense record`, userId);
            return true;
        },

        // --- NOTES ---
        async getNotes(userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb
                    .from("notes")
                    .select("*")
                    .eq("user_id", userId)
                    .order("is_pinned", { ascending: false })
                    .order("created_at", { ascending: false });
                if (!error && data) return data;
            }
            return getLocalData().notes || [];
        },

        async addNote(note, userId) {
            const sb = getClient();
            const newNote = {
                id: "note-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                user_id: userId,
                title: note.title,
                content: note.content || "",
                category: note.category || "General",
                color: note.color || "indigo",
                is_pinned: !!note.is_pinned,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("notes").insert([newNote]).select();
                if (error) throw new Error(error.message);
                this.logActivity("Note Created", "Note", `Created note '${newNote.title}'`, userId);
                return data[0];
            }

            const local = getLocalData();
            local.notes.unshift(newNote);
            saveLocalData(local);
            this.logActivity("Note Created", "Note", `Created note '${newNote.title}'`, userId);
            return newNote;
        },

        async updateNote(id, updates, userId) {
            const sb = getClient();
            updates.updated_at = new Date().toISOString();

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("notes").update(updates).eq("id", id).select();
                if (error) throw new Error(error.message);
                return data[0];
            }

            const local = getLocalData();
            const idx = local.notes.findIndex(n => n.id === id);
            if (idx !== -1) {
                local.notes[idx] = { ...local.notes[idx], ...updates };
                saveLocalData(local);
                return local.notes[idx];
            }
            return null;
        },

        async deleteNote(id, userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { error } = await sb.from("notes").delete().eq("id", id);
                if (error) throw new Error(error.message);
                this.logActivity("Note Deleted", "Note", `Deleted note`, userId);
                return true;
            }

            const local = getLocalData();
            local.notes = local.notes.filter(n => n.id !== id);
            saveLocalData(local);
            this.logActivity("Note Deleted", "Note", `Deleted note`, userId);
            return true;
        },

        // --- GOALS ---
        async getGoals(userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb
                    .from("goals")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false });
                if (!error && data) return data;
            }
            return getLocalData().goals || [];
        },

        async addGoal(goal, userId) {
            const sb = getClient();
            const newGoal = {
                id: "goal-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                user_id: userId,
                title: goal.title,
                description: goal.description || "",
                category: goal.category || "Personal",
                target_date: goal.target_date || new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
                current_progress: parseInt(goal.current_progress, 10) || 0,
                target_value: goal.target_value || "",
                status: goal.status || "In Progress",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("goals").insert([newGoal]).select();
                if (error) throw new Error(error.message);
                this.logActivity("Goal Created", "Goal", `Set new goal '${newGoal.title}'`, userId);
                return data[0];
            }

            const local = getLocalData();
            local.goals.unshift(newGoal);
            saveLocalData(local);
            this.logActivity("Goal Created", "Goal", `Set new goal '${newGoal.title}'`, userId);
            return newGoal;
        },

        async updateGoal(id, updates, userId) {
            const sb = getClient();
            if (updates.current_progress !== undefined) {
                updates.current_progress = Math.min(100, Math.max(0, parseInt(updates.current_progress, 10) || 0));
                if (updates.current_progress === 100) {
                    updates.status = "Completed";
                }
            }
            updates.updated_at = new Date().toISOString();

            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { data, error } = await sb.from("goals").update(updates).eq("id", id).select();
                if (error) throw new Error(error.message);
                return data[0];
            }

            const local = getLocalData();
            const idx = local.goals.findIndex(g => g.id === id);
            if (idx !== -1) {
                local.goals[idx] = { ...local.goals[idx], ...updates };
                saveLocalData(local);
                return local.goals[idx];
            }
            return null;
        },

        async deleteGoal(id, userId) {
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                const { error } = await sb.from("goals").delete().eq("id", id);
                if (error) throw new Error(error.message);
                this.logActivity("Goal Deleted", "Goal", `Deleted goal`, userId);
                return true;
            }

            const local = getLocalData();
            local.goals = local.goals.filter(g => g.id !== id);
            saveLocalData(local);
            this.logActivity("Goal Deleted", "Goal", `Deleted goal`, userId);
            return true;
        },

        // --- ACTIVITY LOGS ---
        logActivity(action, entity_type, details, userId) {
            const entry = {
                action,
                entity_type,
                details,
                timestamp: "Just now",
                created_at: new Date().toISOString()
            };
            const local = getLocalData();
            if (!local.activityLogs) local.activityLogs = [];
            local.activityLogs.unshift(entry);
            if (local.activityLogs.length > 50) local.activityLogs.pop();
            saveLocalData(local);

            // Also try to insert into Supabase if available
            const sb = getClient();
            if (tablesConfigured && sb && userId && !userId.startsWith("demo-")) {
                sb.from("activity_logs").insert([{
                    user_id: userId,
                    action,
                    entity_type,
                    details: { note: details }
                }]).then(() => {}).catch(() => {});
            }
        },

        getActivityLogs() {
            return getLocalData().activityLogs || [];
        },

        // Reset to initial sample data
        resetSampleData() {
            localStorage.removeItem(STORAGE_KEY);
            return getLocalData();
        }
    };

    window.DailyDeskDB = DataService;
    window.DailyDeskSupabase = {
        getClient,
        testConnection: testSupabaseConnection
    };
})();
