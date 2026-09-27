// ==============================================================================
// DailyDesk Authentication & Profile Management
// ==============================================================================

(function() {
    let currentUser = null;
    let currentProfile = null;

    const AUTH_SESSION_KEY = "dailydesk_auth_session";

    async function initAuth() {
        // Try restoring session from localStorage or Supabase
        const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                currentUser = parsed.user;
                currentProfile = parsed.profile;
            } catch (e) {
                console.warn("Failed to restore session", e);
            }
        }

        // Check if real Supabase session is active
        const sb = window.DailyDeskSupabase.getClient();
        if (sb) {
            try {
                const { data: { session } } = await sb.auth.getSession();
                if (session && session.user) {
                    currentUser = session.user;
                    await fetchRemoteProfile(currentUser.id, currentUser.email);
                }
            } catch (err) {
                console.warn("Supabase getSession check:", err.message);
            }
        }

        // If no user is logged in, default to the rich Demo User so the app is immediately alive and previewable!
        if (!currentUser) {
            setDemoSession("user");
        }

        updateUIAuthState();
        window.DailyDeskDB.checkConnection();
    }

    async function fetchRemoteProfile(userId, email) {
        const sb = window.DailyDeskSupabase.getClient();
        if (!sb) return;

        try {
            const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();
            if (!error && data) {
                currentProfile = data;
            } else {
                // If profile doesn't exist yet, construct fallback
                currentProfile = {
                    id: userId,
                    email: email,
                    full_name: email.split("@")[0],
                    avatar_url: "",
                    currency: "$",
                    daily_goal_target: 5,
                    theme: "dark",
                    role: "user"
                };
            }
            saveSession();
        } catch (e) {
            console.warn("Error fetching remote profile:", e);
        }
    }

    function saveSession() {
        if (currentUser && currentProfile) {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
                user: currentUser,
                profile: currentProfile
            }));
        } else {
            localStorage.removeItem(AUTH_SESSION_KEY);
        }
    }

    function setDemoSession(role = "user") {
        if (role === "admin") {
            const admin = window.DAILY_CONFIG.SAMPLE_DATA.adminProfile;
            currentUser = { id: admin.id, email: admin.email };
            currentProfile = { ...admin };
        } else {
            const user = window.DAILY_CONFIG.SAMPLE_DATA.profile;
            currentUser = { id: user.id, email: user.email };
            currentProfile = { ...user };
        }
        saveSession();
    }

    const AuthService = {
        async init() {
            await initAuth();
        },

        getCurrentUser() {
            return currentUser;
        },

        getCurrentProfile() {
            return currentProfile || (currentUser ? {
                id: currentUser.id,
                email: currentUser.email,
                full_name: currentUser.email.split("@")[0],
                currency: "$",
                role: "user"
            } : null);
        },

        isAdmin() {
            return currentProfile && currentProfile.role === "admin";
        },

        async signUp(email, password, fullName) {
            const sb = window.DailyDeskSupabase.getClient();
            if (!sb) throw new Error("Supabase is not initialized");

            const { data, error } = await sb.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: "user"
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                currentUser = data.user;
                currentProfile = {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: fullName || data.user.email.split("@")[0],
                    avatar_url: "",
                    currency: "$",
                    daily_goal_target: 5,
                    theme: "dark",
                    role: "user"
                };

                // Insert into profiles if tables ready
                try {
                    await sb.from("profiles").upsert([currentProfile]);
                } catch (e) {}

                saveSession();
                updateUIAuthState();
                window.DailyDeskDB.logActivity("User Registered", "Auth", `New user created: ${email}`, currentUser.id);
            }
            return data;
        },

        async signIn(email, password) {
            const sb = window.DailyDeskSupabase.getClient();
            if (!sb) throw new Error("Supabase is not initialized");

            const { data, error } = await sb.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.user) {
                currentUser = data.user;
                await fetchRemoteProfile(currentUser.id, currentUser.email);
                updateUIAuthState();
                window.DailyDeskDB.logActivity("User Logged In", "Auth", `Signed in: ${email}`, currentUser.id);
            }
            return data;
        },

        async signOut() {
            const sb = window.DailyDeskSupabase.getClient();
            if (sb && currentUser && !currentUser.id.startsWith("demo-")) {
                try {
                    await sb.auth.signOut();
                } catch (e) {}
            }

            currentUser = null;
            currentProfile = null;
            localStorage.removeItem(AUTH_SESSION_KEY);
            updateUIAuthState();
            window.DailyDeskApp.showLanding();
        },

        loginAsDemo(role = "user") {
            setDemoSession(role);
            updateUIAuthState();
            window.DailyDeskDB.logActivity(
                "Demo Login", 
                "Auth", 
                role === "admin" ? "Switched to Administrator Workspace" : "Switched to Demo User Workspace",
                currentUser.id
            );
            window.DailyDeskApp.navigate("dashboard");
            window.DailyDeskApp.showToast(`Logged in as ${role === "admin" ? "Administrator" : "Standard User"}`, "success");
        },

        async updateProfile(updates) {
            if (!currentProfile) return;
            currentProfile = { ...currentProfile, ...updates };

            const sb = window.DailyDeskSupabase.getClient();
            if (sb && currentUser && !currentUser.id.startsWith("demo-") && window.DailyDeskDB.isTablesReady()) {
                await sb.from("profiles").update(updates).eq("id", currentUser.id);
            }

            saveSession();
            updateUIAuthState();
            window.DailyDeskDB.logActivity("Profile Updated", "Profile", "User updated preferences", currentUser.id);
            return currentProfile;
        }
    };

    function updateUIAuthState() {
        const profile = AuthService.getCurrentProfile();
        const isLoggedIn = !!currentUser;

        // Elements to update
        const userAvatarEl = document.getElementById("nav-user-avatar");
        const userNameEl = document.getElementById("nav-user-name");
        const userRoleBadge = document.getElementById("nav-user-role");
        const adminNavItems = document.querySelectorAll(".admin-only");
        const authButtons = document.querySelectorAll(".guest-only");
        const userDropdown = document.querySelectorAll(".logged-in-only");

        if (isLoggedIn && profile) {
            if (userAvatarEl) {
                userAvatarEl.src = profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || 'DD')}`;
            }
            if (userNameEl) userNameEl.textContent = profile.full_name || "DailyDesk User";
            if (userRoleBadge) {
                userRoleBadge.textContent = profile.role === "admin" ? "Admin" : "Pro";
                userRoleBadge.className = `badge badge-${profile.role === "admin" ? "danger" : "primary"}`;
            }

            // Admin features visibility
            adminNavItems.forEach(el => {
                el.style.display = profile.role === "admin" ? "flex" : "none";
            });

            authButtons.forEach(el => el.style.display = "none");
            userDropdown.forEach(el => el.style.display = "flex");
        } else {
            adminNavItems.forEach(el => el.style.display = "none");
            authButtons.forEach(el => el.style.display = "flex");
            userDropdown.forEach(el => el.style.display = "none");
        }
    }

    window.DailyDeskAuth = AuthService;
})();
