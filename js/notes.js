// ==============================================================================
// DailyDesk Notes Module
// ==============================================================================

(function() {
    let notesList = [];
    let currentCategoryFilter = "all";
    let searchQuery = "";

    async function loadNotes() {
        const user = window.DailyDeskAuth.getCurrentUser();
        if (!user) return;

        try {
            notesList = await window.DailyDeskDB.getNotes(user.id);
            renderNotes();
            updateNotesCounters();
        } catch (err) {
            window.DailyDeskApp.showToast("Failed to load notes: " + err.message, "error");
        }
    }

    function getFilteredNotes() {
        return notesList.filter(note => {
            if (currentCategoryFilter !== "all" && note.category !== currentCategoryFilter) {
                return false;
            }
            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                const mTitle = (note.title || "").toLowerCase().includes(q);
                const mBody = (note.content || "").toLowerCase().includes(q);
                if (!mTitle && !mBody) return false;
            }
            return true;
        });
    }

    function renderNotes() {
        const pinnedContainer = document.getElementById("notes-pinned-grid");
        const allContainer = document.getElementById("notes-all-grid");
        const pinnedSection = document.getElementById("notes-pinned-section");

        if (!allContainer) return;

        const filtered = getFilteredNotes();
        const pinned = filtered.filter(n => n.is_pinned);
        const unpinned = filtered.filter(n => !n.is_pinned);

        // Pinned section visibility
        if (pinnedSection) {
            pinnedSection.style.display = pinned.length > 0 ? "block" : "none";
        }

        if (pinnedContainer) {
            pinnedContainer.innerHTML = pinned.map(note => renderNoteCard(note)).join("");
        }

        if (unpinned.length === 0 && pinned.length === 0) {
            allContainer.innerHTML = `
                <div class="empty-state w-full col-span-full">
                    <div class="empty-state-icon">
                        <i data-lucide="file-text"></i>
                    </div>
                    <h3>No notes found</h3>
                    <p>Capture your ideas, meeting notes, project specs, or daily thoughts.</p>
                    <button class="btn btn-primary" onclick="DailyDeskNotes.openNoteModal()">
                        <i data-lucide="plus"></i> Create Note
                    </button>
                </div>
            `;
        } else {
            allContainer.innerHTML = unpinned.map(note => renderNoteCard(note)).join("");
        }

        // Render dashboard preview widget
        renderDashboardNotesWidget();

        if (window.lucide) window.lucide.createIcons();
    }

    function renderNoteCard(note) {
        const color = note.color || "indigo";
        const dateStr = note.updated_at ? formatRelativeTime(note.updated_at) : "Recently";

        return `
            <div class="note-card note-color-${color}" data-id="${note.id}">
                <div class="note-card-header">
                    <span class="badge badge-subtle font-mono text-xs">${escapeHtml(note.category || 'General')}</span>
                    <div class="note-card-actions">
                        <button class="btn-icon btn-icon-sm ${note.is_pinned ? 'text-amber active-pin' : ''}" 
                                onclick="DailyDeskNotes.togglePin('${note.id}')" 
                                title="${note.is_pinned ? 'Unpin Note' : 'Pin Note'}">
                            <i data-lucide="pin"></i>
                        </button>
                        <button class="btn-icon btn-icon-sm" onclick="DailyDeskNotes.openNoteModal('${note.id}')" title="Edit Note">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="btn-icon btn-icon-sm btn-icon-danger" onclick="DailyDeskNotes.confirmDelete('${note.id}')" title="Delete Note">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <h4 class="note-title">${escapeHtml(note.title)}</h4>
                <div class="note-content">${escapeHtml(note.content)}</div>
                <div class="note-footer">
                    <span class="text-xs text-muted">
                        <i data-lucide="clock" class="icon-xxs"></i> ${dateStr}
                    </span>
                    <button class="btn-copy text-xs" onclick="DailyDeskNotes.copyContent('${note.id}')" title="Copy to clipboard">
                        <i data-lucide="copy" class="icon-xxs"></i> Copy
                    </button>
                </div>
            </div>
        `;
    }

    function renderDashboardNotesWidget() {
        const dashNotesGrid = document.getElementById("dash-notes-grid");
        if (!dashNotesGrid) return;

        const recents = notesList.slice(0, 3);
        if (recents.length === 0) {
            dashNotesGrid.innerHTML = `
                <div class="empty-state-sm">
                    <p class="text-sm text-muted">No notes yet. Create one to keep thoughts organized.</p>
                </div>
            `;
            return;
        }

        dashNotesGrid.innerHTML = recents.map(note => `
            <div class="dash-note-mini note-color-${note.color || 'indigo'}" onclick="DailyDeskNotes.openNoteModal('${note.id}')">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-semibold uppercase tracking-wider text-muted">${note.category}</span>
                    ${note.is_pinned ? '<i data-lucide="pin" class="icon-xxs text-amber"></i>' : ''}
                </div>
                <h5 class="font-semibold text-sm line-clamp-1 mb-1">${escapeHtml(note.title)}</h5>
                <p class="text-xs text-muted line-clamp-2">${escapeHtml(note.content)}</p>
            </div>
        `).join("");
    }

    function updateNotesCounters() {
        const total = notesList.length;
        const pinned = notesList.filter(n => n.is_pinned).length;
        const totalEl = document.getElementById("notes-count-total");
        const pinnedEl = document.getElementById("notes-count-pinned");
        if (totalEl) totalEl.textContent = total;
        if (pinnedEl) pinnedEl.textContent = pinned;

        const dashNotesCount = document.getElementById("dash-notes-count");
        if (dashNotesCount) dashNotesCount.textContent = total;
    }

    const NoteService = {
        init() {
            loadNotes();
            this.bindEvents();
        },

        refresh() {
            loadNotes();
        },

        getNotesList() {
            return notesList;
        },

        bindEvents() {
            const searchInput = document.getElementById("notes-search-input");
            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    searchQuery = e.target.value;
                    renderNotes();
                });
            }

            const catSelect = document.getElementById("notes-filter-category");
            if (catSelect) {
                catSelect.addEventListener("change", (e) => {
                    currentCategoryFilter = e.target.value;
                    renderNotes();
                });
            }

            const noteForm = document.getElementById("note-form");
            if (noteForm) {
                noteForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    await DailyDeskNotes.handleFormSubmit();
                });
            }
        },

        openNoteModal(noteId = null) {
            const modalTitle = document.getElementById("note-modal-title");
            const form = document.getElementById("note-form");
            const idInput = document.getElementById("note-id");

            form.reset();

            if (noteId) {
                const note = notesList.find(n => n.id === noteId);
                if (note) {
                    modalTitle.textContent = "Edit Note";
                    idInput.value = note.id;
                    document.getElementById("note-input-title").value = note.title;
                    document.getElementById("note-input-content").value = note.content || "";
                    document.getElementById("note-input-category").value = note.category || "General";
                    document.getElementById("note-input-color").value = note.color || "indigo";
                    document.getElementById("note-input-pinned").checked = !!note.is_pinned;
                }
            } else {
                modalTitle.textContent = "Create Note";
                idInput.value = "";
                document.getElementById("note-input-color").value = "indigo";
                document.getElementById("note-input-pinned").checked = false;
            }

            window.DailyDeskApp.openModal("note-modal");
        },

        async handleFormSubmit() {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) {
                window.DailyDeskApp.showToast("Please log in to save notes", "warning");
                return;
            }

            const id = document.getElementById("note-id").value;
            const title = document.getElementById("note-input-title").value.trim();
            const content = document.getElementById("note-input-content").value.trim();
            const category = document.getElementById("note-input-category").value;
            const color = document.getElementById("note-input-color").value;
            const is_pinned = document.getElementById("note-input-pinned").checked;

            if (!title) {
                window.DailyDeskApp.showToast("Note title is required", "warning");
                return;
            }

            try {
                if (id) {
                    await window.DailyDeskDB.updateNote(id, {
                        title,
                        content,
                        category,
                        color,
                        is_pinned
                    }, user.id);
                    window.DailyDeskApp.showToast("Note updated successfully", "success");
                } else {
                    await window.DailyDeskDB.addNote({
                        title,
                        content,
                        category,
                        color,
                        is_pinned
                    }, user.id);
                    window.DailyDeskApp.showToast("Note created successfully", "success");
                }

                window.DailyDeskApp.closeModal("note-modal");
                await loadNotes();
                if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
            } catch (err) {
                window.DailyDeskApp.showToast("Error saving note: " + err.message, "error");
            }
        },

        async togglePin(noteId) {
            const user = window.DailyDeskAuth.getCurrentUser();
            if (!user) return;

            const note = notesList.find(n => n.id === noteId);
            if (!note) return;

            try {
                await window.DailyDeskDB.updateNote(noteId, { is_pinned: !note.is_pinned }, user.id);
                window.DailyDeskApp.showToast(note.is_pinned ? "Note unpinned" : "Note pinned to top", "info");
                await loadNotes();
            } catch (err) {
                window.DailyDeskApp.showToast("Error pinning note: " + err.message, "error");
            }
        },

        confirmDelete(noteId) {
            const note = notesList.find(n => n.id === noteId);
            if (!note) return;

            window.DailyDeskApp.showConfirm(
                "Delete Note",
                `Are you sure you want to permanently delete "${note.title}"?`,
                async () => {
                    const user = window.DailyDeskAuth.getCurrentUser();
                    try {
                        await window.DailyDeskDB.deleteNote(noteId, user.id);
                        window.DailyDeskApp.showToast("Note removed", "info");
                        await loadNotes();
                        if (window.DailyDeskMyDay) window.DailyDeskMyDay.refresh();
                    } catch (err) {
                        window.DailyDeskApp.showToast("Error deleting note: " + err.message, "error");
                    }
                }
            );
        },

        copyContent(noteId) {
            const note = notesList.find(n => n.id === noteId);
            if (!note) return;
            const fullText = `${note.title}\n\n${note.content}`;
            navigator.clipboard.writeText(fullText).then(() => {
                window.DailyDeskApp.showToast("Note text copied to clipboard!", "success");
            }).catch(() => {
                window.DailyDeskApp.showToast("Failed to copy to clipboard", "error");
            });
        }
    };

    function formatRelativeTime(dateStr) {
        if (!dateStr) return "";
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.DailyDeskNotes = NoteService;
})();
