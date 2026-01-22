// Resume Builder JavaScript

// State
let currentDocType = 'resume';
let currentTemplate = 'modern';
let skills = [];
let experiences = [];
let education = [];
let editingId = null;

// Elements
const docTabs = document.querySelectorAll('.doc-tab');
const resumeForm = document.getElementById('resumeForm');
const coverLetterForm = document.getElementById('coverLetterForm');
const templateSelect = document.getElementById('templateSelect');
const resumePreview = document.getElementById('resumePreview');
const savedList = document.getElementById('savedList');

// Initialize
function init() {
    setupEventListeners();
    loadSavedDocuments();
    updatePreview();

    // Set default date for cover letter
    document.getElementById('clDate').value = new Date().toISOString().split('T')[0];
}

// Setup event listeners
function setupEventListeners() {
    // Document type tabs
    docTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            docTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDocType = tab.dataset.type;
            toggleForms();
            updatePreview();
        });
    });

    // Template select
    templateSelect.addEventListener('change', () => {
        currentTemplate = templateSelect.value;
        updatePreview();
    });

    // Form inputs - update preview on change
    document.querySelectorAll('#resumeForm input, #resumeForm textarea').forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    document.querySelectorAll('#coverLetterForm input, #coverLetterForm textarea').forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Skills input
    const skillsInput = document.getElementById('skillsInput');
    skillsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const skill = skillsInput.value.trim();
            if (skill && !skills.includes(skill)) {
                skills.push(skill);
                renderSkills();
                updatePreview();
            }
            skillsInput.value = '';
        }
    });

    // Add experience
    document.getElementById('addExperience').addEventListener('click', () => {
        experiences.push({
            id: Date.now(),
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            description: ''
        });
        renderExperiences();
    });

    // Add education
    document.getElementById('addEducation').addEventListener('click', () => {
        education.push({
            id: Date.now(),
            degree: '',
            school: '',
            location: '',
            graduationDate: '',
            description: ''
        });
        renderEducation();
    });

    // Save draft
    document.getElementById('saveDraftBtn').addEventListener('click', saveDraft);

    // Download PDF
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdf);

    // Clear all
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        if (confirm('Delete all saved documents?')) {
            localStorage.removeItem('savedDocuments');
            loadSavedDocuments();
            showToast('All documents deleted');
        }
    });
}

// Toggle forms
function toggleForms() {
    if (currentDocType === 'cover-letter') {
        resumeForm.style.display = 'none';
        coverLetterForm.style.display = 'block';
    } else {
        resumeForm.style.display = 'block';
        coverLetterForm.style.display = 'none';
    }
}

// Render skills
function renderSkills() {
    const container = document.getElementById('skillsTags');
    container.innerHTML = skills.map((skill, index) => `
        <span class="tag">
            ${escapeHtml(skill)}
            <button class="remove-tag" onclick="removeSkill(${index})">×</button>
        </span>
    `).join('');
}

// Remove skill
window.removeSkill = function(index) {
    skills.splice(index, 1);
    renderSkills();
    updatePreview();
};

// Render experiences
function renderExperiences() {
    const container = document.getElementById('experienceList');
    container.innerHTML = experiences.map((exp, index) => `
        <div class="dynamic-item">
            <button class="remove-btn" onclick="removeExperience(${index})">×</button>
            <div class="form-row">
                <div class="form-group">
                    <label>Job Title</label>
                    <input type="text" value="${escapeHtml(exp.title)}" onchange="updateExperience(${index}, 'title', this.value)">
                </div>
                <div class="form-group">
                    <label>Company</label>
                    <input type="text" value="${escapeHtml(exp.company)}" onchange="updateExperience(${index}, 'company', this.value)">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" placeholder="Jan 2020" value="${escapeHtml(exp.startDate)}" onchange="updateExperience(${index}, 'startDate', this.value)">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" placeholder="Present" value="${escapeHtml(exp.endDate)}" onchange="updateExperience(${index}, 'endDate', this.value)">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="3" onchange="updateExperience(${index}, 'description', this.value)">${escapeHtml(exp.description)}</textarea>
            </div>
        </div>
    `).join('');
}

// Update experience
window.updateExperience = function(index, field, value) {
    experiences[index][field] = value;
    updatePreview();
};

// Remove experience
window.removeExperience = function(index) {
    experiences.splice(index, 1);
    renderExperiences();
    updatePreview();
};

// Render education
function renderEducation() {
    const container = document.getElementById('educationList');
    container.innerHTML = education.map((edu, index) => `
        <div class="dynamic-item">
            <button class="remove-btn" onclick="removeEducation(${index})">×</button>
            <div class="form-row">
                <div class="form-group">
                    <label>Degree</label>
                    <input type="text" value="${escapeHtml(edu.degree)}" onchange="updateEducation(${index}, 'degree', this.value)">
                </div>
                <div class="form-group">
                    <label>School</label>
                    <input type="text" value="${escapeHtml(edu.school)}" onchange="updateEducation(${index}, 'school', this.value)">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" value="${escapeHtml(edu.location)}" onchange="updateEducation(${index}, 'location', this.value)">
                </div>
                <div class="form-group">
                    <label>Graduation Date</label>
                    <input type="text" placeholder="May 2020" value="${escapeHtml(edu.graduationDate)}" onchange="updateEducation(${index}, 'graduationDate', this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

// Update education
window.updateEducation = function(index, field, value) {
    education[index][field] = value;
    updatePreview();
};

// Remove education
window.removeEducation = function(index) {
    education.splice(index, 1);
    renderEducation();
    updatePreview();
};

// Update preview
function updatePreview() {
    if (currentDocType === 'cover-letter') {
        updateCoverLetterPreview();
    } else {
        updateResumePreview();
    }
}

// Update resume preview
function updateResumePreview() {
    const fullName = document.getElementById('fullName').value || 'Your Name';
    const jobTitle = document.getElementById('jobTitle').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const location = document.getElementById('location').value;
    const website = document.getElementById('website').value;
    const summary = document.getElementById('summary').value;

    let contactHtml = '';
    if (email) contactHtml += `<span>${escapeHtml(email)}</span>`;
    if (phone) contactHtml += `<span>${escapeHtml(phone)}</span>`;
    if (location) contactHtml += `<span>${escapeHtml(location)}</span>`;
    if (website) contactHtml += `<span>${escapeHtml(website)}</span>`;

    let html = `
        <div class="preview-name">${escapeHtml(fullName)}</div>
        ${jobTitle ? `<div class="preview-title">${escapeHtml(jobTitle)}</div>` : ''}
        <div class="preview-contact">${contactHtml}</div>
    `;

    if (summary) {
        html += `
            <div class="section-title">Professional Summary</div>
            <div class="preview-summary">${escapeHtml(summary)}</div>
        `;
    }

    if (experiences.length > 0) {
        html += `<div class="section-title">Experience</div>`;
        experiences.forEach(exp => {
            if (exp.title || exp.company) {
                html += `
                    <div class="preview-item">
                        <div class="preview-item-header">
                            <span class="preview-item-title">${escapeHtml(exp.title)}</span>
                            <span class="preview-item-date">${escapeHtml(exp.startDate)}${exp.endDate ? ' - ' + escapeHtml(exp.endDate) : ''}</span>
                        </div>
                        <div class="preview-item-subtitle">${escapeHtml(exp.company)}</div>
                        ${exp.description ? `<div class="preview-item-description">${escapeHtml(exp.description)}</div>` : ''}
                    </div>
                `;
            }
        });
    }

    if (education.length > 0) {
        html += `<div class="section-title">Education</div>`;
        education.forEach(edu => {
            if (edu.degree || edu.school) {
                html += `
                    <div class="preview-item">
                        <div class="preview-item-header">
                            <span class="preview-item-title">${escapeHtml(edu.degree)}</span>
                            <span class="preview-item-date">${escapeHtml(edu.graduationDate)}</span>
                        </div>
                        <div class="preview-item-subtitle">${escapeHtml(edu.school)}${edu.location ? ', ' + escapeHtml(edu.location) : ''}</div>
                    </div>
                `;
            }
        });
    }

    if (skills.length > 0) {
        html += `
            <div class="section-title">Skills</div>
            <div class="preview-skills">
                ${skills.map(skill => `<span class="preview-skill">${escapeHtml(skill)}</span>`).join('')}
            </div>
        `;
    }

    resumePreview.innerHTML = html;
    resumePreview.className = `resume-preview template-${currentTemplate}`;
}

// Update cover letter preview
function updateCoverLetterPreview() {
    const name = document.getElementById('clName').value || 'Your Name';
    const email = document.getElementById('clEmail').value;
    const phone = document.getElementById('clPhone').value;
    const date = document.getElementById('clDate').value;
    const recipient = document.getElementById('clRecipient').value;
    const company = document.getElementById('clCompany').value;
    const address = document.getElementById('clAddress').value;
    const position = document.getElementById('clPosition').value;
    const opening = document.getElementById('clOpening').value;
    const body = document.getElementById('clBody').value;
    const closing = document.getElementById('clClosing').value;

    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

    let html = `
        <div class="cover-letter-preview">
            <div class="letter-header">
                <div>${escapeHtml(name)}</div>
                ${email ? `<div>${escapeHtml(email)}</div>` : ''}
                ${phone ? `<div>${escapeHtml(phone)}</div>` : ''}
            </div>

            ${formattedDate ? `<div class="letter-date">${formattedDate}</div>` : ''}

            <div class="letter-recipient">
                ${recipient ? `<div>${escapeHtml(recipient)}</div>` : ''}
                ${company ? `<div>${escapeHtml(company)}</div>` : ''}
                ${address ? `<div>${escapeHtml(address)}</div>` : ''}
            </div>

            <div class="letter-greeting">Dear ${recipient ? escapeHtml(recipient) : 'Hiring Manager'},</div>

            <div class="letter-body">
                ${opening ? `<p>${escapeHtml(opening)}</p>` : ''}
                ${body ? `<p>${escapeHtml(body)}</p>` : ''}
                ${closing ? `<p>${escapeHtml(closing)}</p>` : ''}
            </div>

            <div class="letter-closing">Sincerely,</div>
            <div class="letter-signature">${escapeHtml(name)}</div>
        </div>
    `;

    resumePreview.innerHTML = html;
    resumePreview.className = 'resume-preview';
}

// Save draft
function saveDraft() {
    const data = collectFormData();

    if (!data.fullName && !data.clName) {
        showToast('Please enter a name');
        return;
    }

    const saved = JSON.parse(localStorage.getItem('savedDocuments') || '[]');

    const doc = {
        id: editingId || Date.now(),
        type: currentDocType,
        template: currentTemplate,
        data: data,
        updatedAt: Date.now()
    };

    if (editingId) {
        const index = saved.findIndex(d => d.id === editingId);
        if (index !== -1) {
            saved[index] = doc;
        }
        editingId = null;
    } else {
        saved.unshift(doc);
    }

    localStorage.setItem('savedDocuments', JSON.stringify(saved));
    loadSavedDocuments();
    showToast('Document saved!');
}

// Collect form data
function collectFormData() {
    if (currentDocType === 'cover-letter') {
        return {
            clName: document.getElementById('clName').value,
            clEmail: document.getElementById('clEmail').value,
            clPhone: document.getElementById('clPhone').value,
            clDate: document.getElementById('clDate').value,
            clRecipient: document.getElementById('clRecipient').value,
            clCompany: document.getElementById('clCompany').value,
            clAddress: document.getElementById('clAddress').value,
            clPosition: document.getElementById('clPosition').value,
            clOpening: document.getElementById('clOpening').value,
            clBody: document.getElementById('clBody').value,
            clClosing: document.getElementById('clClosing').value
        };
    } else {
        return {
            fullName: document.getElementById('fullName').value,
            jobTitle: document.getElementById('jobTitle').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            website: document.getElementById('website').value,
            summary: document.getElementById('summary').value,
            experiences: [...experiences],
            education: [...education],
            skills: [...skills]
        };
    }
}

// Load saved documents
function loadSavedDocuments() {
    const saved = JSON.parse(localStorage.getItem('savedDocuments') || '[]');

    if (saved.length === 0) {
        savedList.innerHTML = '<div class="empty-state">No saved documents yet</div>';
        return;
    }

    savedList.innerHTML = saved.map(doc => {
        const name = doc.data.fullName || doc.data.clName || 'Untitled';
        const date = new Date(doc.updatedAt).toLocaleDateString();
        const typeLabel = doc.type === 'cover-letter' ? 'Cover Letter' : doc.type.toUpperCase();

        return `
            <div class="saved-item">
                <div class="saved-item-header">
                    <span class="saved-item-title">${escapeHtml(name)}</span>
                    <span class="saved-item-type">${typeLabel}</span>
                </div>
                <div class="saved-item-date">Last edited: ${date}</div>
                <div class="saved-item-actions">
                    <button onclick="loadDocument(${doc.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteDocument(${doc.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Load document for editing
window.loadDocument = function(id) {
    const saved = JSON.parse(localStorage.getItem('savedDocuments') || '[]');
    const doc = saved.find(d => d.id === id);

    if (!doc) return;

    editingId = id;
    currentDocType = doc.type;
    currentTemplate = doc.template || 'modern';

    // Update UI
    docTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === currentDocType);
    });
    templateSelect.value = currentTemplate;
    toggleForms();

    // Load data into form
    if (currentDocType === 'cover-letter') {
        Object.keys(doc.data).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.value = doc.data[key] || '';
        });
    } else {
        document.getElementById('fullName').value = doc.data.fullName || '';
        document.getElementById('jobTitle').value = doc.data.jobTitle || '';
        document.getElementById('email').value = doc.data.email || '';
        document.getElementById('phone').value = doc.data.phone || '';
        document.getElementById('location').value = doc.data.location || '';
        document.getElementById('website').value = doc.data.website || '';
        document.getElementById('summary').value = doc.data.summary || '';

        experiences = doc.data.experiences || [];
        education = doc.data.education || [];
        skills = doc.data.skills || [];

        renderExperiences();
        renderEducation();
        renderSkills();
    }

    updatePreview();
    showToast('Document loaded!');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Delete document
window.deleteDocument = function(id) {
    if (!confirm('Delete this document?')) return;

    let saved = JSON.parse(localStorage.getItem('savedDocuments') || '[]');
    saved = saved.filter(d => d.id !== id);
    localStorage.setItem('savedDocuments', JSON.stringify(saved));

    if (editingId === id) editingId = null;

    loadSavedDocuments();
    showToast('Document deleted');
};

// Download PDF
function downloadPdf() {
    const element = document.getElementById('resumePreview');
    const name = document.getElementById('fullName')?.value || document.getElementById('clName')?.value || 'document';
    const filename = `${name.replace(/\s+/g, '_')}_${currentDocType}.pdf`;

    const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
    showToast('Downloading PDF...');
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show toast
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
