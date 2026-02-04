// Sticky Board JavaScript

class StickyBoard {
    constructor() {
        this.notes = [];
        this.nextNoteId = 1;
        this.editingNoteId = null;
        this.isViewOnly = false;
        this.dragState = null;
        this.resizeState = null;

        this.initElements();
        this.checkViewMode();
        this.bindEvents();
    }

    initElements() {
        // Board
        this.board = document.getElementById('board');

        // Header actions
        this.headerActions = document.getElementById('headerActions');
        this.addNoteBtn = document.getElementById('addNoteBtn');
        this.clearBoardBtn = document.getElementById('clearBoardBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.viewOnlyBanner = document.getElementById('viewOnlyBanner');

        // Note editor modal
        this.noteEditorModal = document.getElementById('noteEditorModal');
        this.editorTitle = document.getElementById('editorTitle');
        this.closeEditorBtn = document.getElementById('closeEditorBtn');
        this.noteText = document.getElementById('noteText');
        this.colorPicker = document.getElementById('colorPicker');
        this.fontPicker = document.getElementById('fontPicker');
        this.fontSizePicker = document.getElementById('fontSizePicker');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.saveNoteBtn = document.getElementById('saveNoteBtn');

        // Share modal
        this.shareModal = document.getElementById('shareModal');
        this.closeShareBtn = document.getElementById('closeShareBtn');
        this.shareLink = document.getElementById('shareLink');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');

        // Toast
        this.toast = document.getElementById('toast');
    }

    checkViewMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const data = urlParams.get('board');

        if (data) {
            try {
                const decoded = LZString.decompressFromEncodedURIComponent(data);
                const boardData = JSON.parse(decoded);
                this.notes = boardData.notes || [];
                this.nextNoteId = boardData.nextId || 1;
                this.isViewOnly = true;
                this.enableViewOnlyMode();
            } catch (e) {
                console.error('Error loading shared board:', e);
                this.loadFromStorage();
            }
        } else {
            this.loadFromStorage();
        }

        this.renderNotes();
    }

    enableViewOnlyMode() {
        this.headerActions.style.display = 'none';
        this.viewOnlyBanner.style.display = 'flex';
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('stickyBoard');
            if (saved) {
                const data = JSON.parse(saved);
                this.notes = data.notes || [];
                this.nextNoteId = data.nextId || 1;
            }
        } catch (e) {
            console.error('Error loading from storage:', e);
        }
    }

    saveToStorage() {
        if (this.isViewOnly) return;

        try {
            localStorage.setItem('stickyBoard', JSON.stringify({
                notes: this.notes,
                nextId: this.nextNoteId
            }));
        } catch (e) {
            console.error('Error saving to storage:', e);
        }
    }

    bindEvents() {
        // Add note
        this.addNoteBtn.addEventListener('click', () => this.createNote());

        // Clear board
        this.clearBoardBtn.addEventListener('click', () => this.clearBoard());

        // Share
        this.shareBtn.addEventListener('click', () => this.openShareModal());
        this.closeShareBtn.addEventListener('click', () => this.closeShareModal());
        this.copyLinkBtn.addEventListener('click', () => this.copyShareLink());

        // Note editor
        this.closeEditorBtn.addEventListener('click', () => this.closeEditor());
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.deleteNoteBtn.addEventListener('click', () => this.deleteNote());

        // Color picker
        this.colorPicker.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.colorPicker.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Close modals on overlay click
        this.noteEditorModal.addEventListener('click', (e) => {
            if (e.target === this.noteEditorModal) this.closeEditor();
        });
        this.shareModal.addEventListener('click', (e) => {
            if (e.target === this.shareModal) this.closeShareModal();
        });

        // Global mouse events for drag/resize
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', () => this.handleMouseUp());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditor();
                this.closeShareModal();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !this.isViewOnly) {
                e.preventDefault();
                this.createNote();
            }
        });
    }

    createNote() {
        if (this.isViewOnly) return;

        const boardRect = this.board.getBoundingClientRect();
        const note = {
            id: this.nextNoteId++,
            text: 'New note...',
            color: '#fff740',
            font: 'Poppins',
            fontSize: 14,
            x: Math.random() * (boardRect.width - 200) + 50,
            y: Math.random() * (boardRect.height - 200) + 50,
            width: 200,
            height: 200,
            zIndex: this.getMaxZIndex() + 1
        };

        this.notes.push(note);
        this.renderNote(note);
        this.saveToStorage();
        this.openEditor(note.id);
    }

    renderNotes() {
        this.board.innerHTML = '';
        this.notes.forEach(note => this.renderNote(note));
    }

    renderNote(note) {
        const el = document.createElement('div');
        el.className = 'sticky-note';
        el.dataset.id = note.id;
        el.style.cssText = `
            left: ${note.x}px;
            top: ${note.y}px;
            width: ${note.width}px;
            height: ${note.height}px;
            background: ${note.color};
            z-index: ${note.zIndex};
        `;

        el.innerHTML = `
            <div class="note-header">
                ${!this.isViewOnly ? `
                    <button class="note-edit-btn" title="Edit note">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
            <div class="note-content" style="font-family: '${note.font}', sans-serif; font-size: ${note.fontSize}px;">${this.escapeHtml(note.text)}</div>
            ${!this.isViewOnly ? '<div class="resize-handle"></div>' : ''}
        `;

        this.board.appendChild(el);

        // Bind events
        if (!this.isViewOnly) {
            const editBtn = el.querySelector('.note-edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openEditor(note.id);
                });
            }

            // Drag
            el.addEventListener('mousedown', (e) => this.startDrag(e, note));
            el.addEventListener('touchstart', (e) => this.startDrag(e, note), { passive: false });

            // Resize
            const resizeHandle = el.querySelector('.resize-handle');
            if (resizeHandle) {
                resizeHandle.addEventListener('mousedown', (e) => this.startResize(e, note));
                resizeHandle.addEventListener('touchstart', (e) => this.startResize(e, note), { passive: false });
            }

            // Double click to edit
            el.addEventListener('dblclick', () => this.openEditor(note.id));
        }
    }

    startDrag(e, note) {
        if (this.isViewOnly) return;
        if (e.target.closest('.note-edit-btn') || e.target.closest('.resize-handle')) return;

        e.preventDefault();
        const el = this.board.querySelector(`[data-id="${note.id}"]`);
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        // Bring to front
        note.zIndex = this.getMaxZIndex() + 1;
        el.style.zIndex = note.zIndex;

        this.dragState = {
            note,
            el,
            startX: clientX,
            startY: clientY,
            origX: note.x,
            origY: note.y
        };

        el.classList.add('dragging');
    }

    startResize(e, note) {
        if (this.isViewOnly) return;
        e.preventDefault();
        e.stopPropagation();

        const el = this.board.querySelector(`[data-id="${note.id}"]`);
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        this.resizeState = {
            note,
            el,
            startX: clientX,
            startY: clientY,
            origWidth: note.width,
            origHeight: note.height
        };
    }

    handleMouseMove(e) {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (this.dragState) {
            const { note, el, startX, startY, origX, origY } = this.dragState;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            const boardRect = this.board.getBoundingClientRect();
            const newX = Math.max(0, Math.min(boardRect.width - note.width, origX + deltaX));
            const newY = Math.max(0, Math.min(boardRect.height - note.height, origY + deltaY));

            note.x = newX;
            note.y = newY;
            el.style.left = newX + 'px';
            el.style.top = newY + 'px';
        }

        if (this.resizeState) {
            const { note, el, startX, startY, origWidth, origHeight } = this.resizeState;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            const newWidth = Math.max(150, origWidth + deltaX);
            const newHeight = Math.max(150, origHeight + deltaY);

            note.width = newWidth;
            note.height = newHeight;
            el.style.width = newWidth + 'px';
            el.style.height = newHeight + 'px';
        }
    }

    handleTouchMove(e) {
        if (this.dragState || this.resizeState) {
            e.preventDefault();
        }
        this.handleMouseMove(e);
    }

    handleMouseUp() {
        if (this.dragState) {
            this.dragState.el.classList.remove('dragging');
            this.dragState = null;
            this.saveToStorage();
        }

        if (this.resizeState) {
            this.resizeState = null;
            this.saveToStorage();
        }
    }

    getMaxZIndex() {
        return Math.max(0, ...this.notes.map(n => n.zIndex || 0));
    }

    openEditor(noteId) {
        if (this.isViewOnly) return;

        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        this.editingNoteId = noteId;
        this.editorTitle.textContent = 'Edit Note';
        this.noteText.value = note.text;
        this.fontPicker.value = note.font;
        this.fontSizePicker.value = note.fontSize;

        // Set active color
        this.colorPicker.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === note.color);
        });

        this.noteEditorModal.style.display = 'flex';
        this.noteText.focus();
    }

    closeEditor() {
        this.noteEditorModal.style.display = 'none';
        this.editingNoteId = null;
    }

    saveNote() {
        if (!this.editingNoteId) return;

        const note = this.notes.find(n => n.id === this.editingNoteId);
        if (!note) return;

        const activeColor = this.colorPicker.querySelector('.color-btn.active');

        note.text = this.noteText.value;
        note.color = activeColor ? activeColor.dataset.color : note.color;
        note.font = this.fontPicker.value;
        note.fontSize = parseInt(this.fontSizePicker.value);

        // Update DOM
        const el = this.board.querySelector(`[data-id="${note.id}"]`);
        if (el) {
            el.style.background = note.color;
            const content = el.querySelector('.note-content');
            content.textContent = note.text;
            content.style.fontFamily = `'${note.font}', sans-serif`;
            content.style.fontSize = note.fontSize + 'px';
        }

        this.saveToStorage();
        this.closeEditor();
        this.showToast('Note saved');
    }

    deleteNote() {
        if (!this.editingNoteId) return;

        if (!confirm('Delete this note?')) return;

        const el = this.board.querySelector(`[data-id="${this.editingNoteId}"]`);
        if (el) el.remove();

        this.notes = this.notes.filter(n => n.id !== this.editingNoteId);
        this.saveToStorage();
        this.closeEditor();
        this.showToast('Note deleted');
    }

    clearBoard() {
        if (this.isViewOnly) return;
        if (!confirm('Clear all notes from the board?')) return;

        this.notes = [];
        this.board.innerHTML = '';
        this.saveToStorage();
        this.showToast('Board cleared');
    }

    openShareModal() {
        const data = {
            notes: this.notes,
            nextId: this.nextNoteId
        };

        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data));
        const url = `${window.location.origin}${window.location.pathname}?board=${compressed}`;

        this.shareLink.value = url;
        this.shareModal.style.display = 'flex';
    }

    closeShareModal() {
        this.shareModal.style.display = 'none';
    }

    copyShareLink() {
        this.shareLink.select();
        navigator.clipboard.writeText(this.shareLink.value).then(() => {
            this.showToast('Link copied to clipboard');
        }).catch(() => {
            document.execCommand('copy');
            this.showToast('Link copied');
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        setTimeout(() => this.toast.classList.remove('show'), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new StickyBoard();
});
