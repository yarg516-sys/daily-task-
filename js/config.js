// ==============================================================================
// DailyDesk Configuration & Constants
// ==============================================================================

window.DAILY_CONFIG = {
    APP_NAME: "DailyDesk",
    TAGLINE: "Everything you need for a more organized day.",
    VERSION: "2.5.0",

    // Supabase Connection Credentials (provided for DailyDesk)
    SUPABASE_URL: "https://tgpkkiisuugnzbrhqiwp.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRncGtraWlzdXVnbnpicmhxaXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTUyMzYsImV4cCI6MjEwNjA5MTIzNn0.9HZEw-9ZXzEmlq-JZ3ixC1aba4pxUg9UDn8Sa0oDeE8",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ooxHv5ilo1X1HlSS5udbAQ_Wp2rJye7",

    // App Preferences Defaults
    DEFAULT_CURRENCY: "$",
    CURRENCIES: ["$", "€", "£", "₹", "¥", "A$", "C$"],

    // Categories
    TASK_CATEGORIES: ["Work", "Study", "Personal", "Shopping", "Health", "Other"],
    TASK_PRIORITIES: ["High", "Medium", "Low"],

    EXPENSE_CATEGORIES: [
        { id: "Food", name: "Food & Dining", color: "#F59E0B", icon: "utensils" },
        { id: "Transport", name: "Transportation", color: "#3B82F6", icon: "car" },
        { id: "Shopping", name: "Shopping & Retail", color: "#EC4899", icon: "shopping-bag" },
        { id: "Education", name: "Education & Books", color: "#8B5CF6", icon: "book-open" },
        { id: "Bills", name: "Bills & Utilities", color: "#EF4444", icon: "file-text" },
        { id: "Entertainment", name: "Entertainment", color: "#10B981", icon: "film" },
        { id: "Health", name: "Health & Fitness", color: "#06B6D4", icon: "heart-pulse" },
        { id: "Other", name: "Miscellaneous", color: "#6B7280", icon: "more-horizontal" }
    ],

    PAYMENT_METHODS: ["Card", "Cash", "Online/UPI", "Bank Transfer", "Other"],

    NOTE_CATEGORIES: ["General", "Work", "Study", "Ideas", "Personal", "Urgent"],
    NOTE_COLORS: [
        { id: "indigo", hex: "#6366F1", label: "Indigo" },
        { id: "emerald", hex: "#10B981", label: "Emerald" },
        { id: "amber", hex: "#F59E0B", label: "Amber" },
        { id: "rose", hex: "#F43F5E", label: "Rose" },
        { id: "sky", hex: "#0EA5E9", label: "Sky" },
        { id: "purple", hex: "#A855F7", label: "Purple" }
    ],

    GOAL_CATEGORIES: ["Study", "Career", "Personal", "Savings", "Fitness", "Other"],

    // Initial Realistic Sample Data for Presentation
    SAMPLE_DATA: {
        profile: {
            id: "demo-user-001",
            email: "alex.morgan@dailydesk.app",
            full_name: "Alex Morgan",
            avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            currency: "$",
            daily_goal_target: 5,
            theme: "dark",
            role: "user"
        },
        adminProfile: {
            id: "demo-admin-001",
            email: "admin@dailydesk.app",
            full_name: "Sarah Chen (Admin)",
            avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
            currency: "$",
            daily_goal_target: 8,
            theme: "dark",
            role: "admin"
        },
        tasks: [
            {
                id: "task-01",
                title: "Finalize DailyDesk Competition Pitch Deck",
                description: "Review slides 1-14 with Supabase architecture diagrams and live demo flow.",
                category: "Work",
                priority: "High",
                due_date: new Date().toISOString().split("T")[0],
                completed: false
            },
            {
                id: "task-02",
                title: "Morning 30-min Cardio & Stretch",
                description: "5km morning jog at park followed by hydration routine.",
                category: "Health",
                priority: "Medium",
                due_date: new Date().toISOString().split("T")[0],
                completed: true,
                completed_at: new Date().toISOString()
            },
            {
                id: "task-03",
                title: "Complete PostgreSQL RLS Security Audit",
                description: "Verify Row Level Security policies for user isolation across profiles and transactions.",
                category: "Work",
                priority: "High",
                due_date: new Date().toISOString().split("T")[0],
                completed: false
            },
            {
                id: "task-04",
                title: "Read Chapter 4 of Clean Architecture",
                description: "Study SOLID principles and dependency inversion in modern web systems.",
                category: "Study",
                priority: "Medium",
                due_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
                completed: false
            },
            {
                id: "task-05",
                title: "Weekly Grocery Restock",
                description: "Fresh produce, whole grains, almond milk, organic coffee beans.",
                category: "Shopping",
                priority: "Low",
                due_date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
                completed: false
            },
            {
                id: "task-06",
                title: "Monthly Budget Review & Savings Rebalance",
                description: "Transfer 25% surplus to high-yield investment goal.",
                category: "Personal",
                priority: "Medium",
                due_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
                completed: true,
                completed_at: new Date().toISOString()
            }
        ],
        expenses: [
            {
                id: "exp-01",
                title: "Healthy Artisan Lunch & Matcha Latte",
                description: "Organic avocado sourdough toast and cold matcha.",
                category: "Food",
                amount: 18.50,
                payment_method: "Card",
                date: new Date().toISOString().split("T")[0]
            },
            {
                id: "exp-02",
                title: "Monthly Metro & Commute Pass",
                description: "Unlimited high-speed transit travel card.",
                category: "Transport",
                amount: 45.00,
                payment_method: "Card",
                date: new Date().toISOString().split("T")[0]
            },
            {
                id: "exp-03",
                title: "High-Speed Fiber Internet Bill",
                description: "Monthly 1 Gbps broadband connection for home office.",
                category: "Bills",
                amount: 65.00,
                payment_method: "Online/UPI",
                date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0]
            },
            {
                id: "exp-04",
                title: "Web Development Masterclass Book",
                description: "Advanced PostgreSQL and Frontend Performance handbook.",
                category: "Education",
                amount: 38.25,
                payment_method: "Card",
                date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0]
            },
            {
                id: "exp-05",
                title: "Weekend Cinema & IMAX Tickets",
                description: "Science fiction premiere screening with friends.",
                category: "Entertainment",
                amount: 32.00,
                payment_method: "Online/UPI",
                date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0]
            },
            {
                id: "exp-06",
                title: "Ergonomic Desk Lumbar Pillow",
                description: "Memory foam support cushion for coding chair.",
                category: "Shopping",
                amount: 49.99,
                payment_method: "Card",
                date: new Date(Date.now() - 86400000 * 8).toISOString().split("T")[0]
            }
        ],
        notes: [
            {
                id: "note-01",
                title: "DailyDesk Presentation Key Talking Points",
                content: "1. Unified ecosystem: Tasks, Expenses, Notes, Goals, and My Day in one responsive suite.\n2. True Supabase backend with Row Level Security (RLS) guaranteeing total user isolation.\n3. Modern visual hierarchy: Glassmorphism, dark/light themes, responsive layout, and zero dependencies besides Chart.js and Supabase.\n4. Real CRUD operations with live charts and real-time state calculation.",
                category: "Work",
                color: "indigo",
                is_pinned: true,
                updated_at: new Date().toISOString()
            },
            {
                id: "note-02",
                title: "Morning Routine Checklist",
                content: "• 06:30 AM: Wake up & 500ml water\n• 07:00 AM: 30 min cardio & core workout\n• 07:45 AM: Healthy breakfast + daily review in DailyDesk My Day\n• 08:30 AM: Deep focus sprint on top 3 priority tasks",
                category: "Personal",
                color: "emerald",
                is_pinned: true,
                updated_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: "note-03",
                title: "Quarterly Learning Objectives",
                content: "Master TypeScript strict mode, PostgreSQL query optimization, and high-frequency real-time web systems. Read 2 technical whitepapers every weekend.",
                category: "Study",
                color: "sky",
                is_pinned: false,
                updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: "note-04",
                title: "Next Project Feature Brainstorm",
                content: "Explore AI daily assistant suggestions, automated receipt scanner integration, voice-to-task recognition, and calendar two-way sync.",
                category: "Ideas",
                color: "amber",
                is_pinned: false,
                updated_at: new Date(Date.now() - 86400000 * 4).toISOString()
            }
        ],
        goals: [
            {
                id: "goal-01",
                title: "Emergency Fund Milestone",
                description: "Build a robust 6-month safety net in high-yield savings account.",
                category: "Savings",
                target_date: new Date(Date.now() + 86400000 * 60).toISOString().split("T")[0],
                current_progress: 75,
                target_value: "$10,000 Saved",
                status: "In Progress"
            },
            {
                id: "goal-02",
                title: "Read 24 Non-Fiction Books",
                description: "Books on design systems, economics, neuroscience, and engineering leadership.",
                category: "Personal",
                target_date: new Date(Date.now() + 86400000 * 120).toISOString().split("T")[0],
                current_progress: 58,
                target_value: "14 / 24 Books",
                status: "In Progress"
            },
            {
                id: "goal-03",
                title: "Half Marathon Preparation",
                description: "Complete 21.1 km run under 1 hour and 55 minutes with structured training.",
                category: "Fitness",
                target_date: new Date(Date.now() + 86400000 * 45).toISOString().split("T")[0],
                current_progress: 80,
                target_value: "18 km Long Run",
                status: "In Progress"
            },
            {
                id: "goal-04",
                title: "Cloud Solutions Architect Certification",
                description: "Pass official architecture and database security professional exam.",
                category: "Career",
                target_date: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
                current_progress: 90,
                target_value: "Score > 85%",
                status: "In Progress"
            }
        ],
        activityLogs: [
            { action: "Task Created", entity_type: "Task", details: "Created 'Finalize DailyDesk Pitch Deck'", timestamp: "10 mins ago" },
            { action: "Expense Logged", entity_type: "Expense", details: "Added $18.50 for Healthy Artisan Lunch", timestamp: "45 mins ago" },
            { action: "Task Completed", entity_type: "Task", details: "Completed 'Morning 30-min Cardio'", timestamp: "2 hours ago" },
            { action: "Goal Updated", entity_type: "Goal", details: "Progress increased to 80% on 'Half Marathon'", timestamp: "Yesterday" },
            { action: "User Login", entity_type: "Auth", details: "User authenticated successfully", timestamp: "Today 08:30" }
        ]
    }
};
