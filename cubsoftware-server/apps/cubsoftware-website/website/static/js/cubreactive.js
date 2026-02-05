// CubReactive - Setup Page JavaScript

let isSpeaking = false;

// Preset themes
const THEMES = {
    default: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'bounce',
        avatar_shape: 'rounded',
        avatar_size: 180,
        border_enabled: false,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#57f287',
        speaking_ring_width: 4,
        shadow_enabled: false,
        name_color: '#ffffff',
        name_size: 14,
        name_background_enabled: false,
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 100,
        transition_style: 'fade',
        transition_duration: 200
    },
    discord: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'none',
        avatar_shape: 'circle',
        avatar_size: 150,
        border_enabled: false,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#57f287',
        speaking_ring_width: 3,
        shadow_enabled: false,
        name_color: '#ffffff',
        name_size: 12,
        name_background_enabled: true,
        name_background_color: '#000000',
        grayscale_muted: false,
        grayscale_deafened: false,
        idle_opacity: 60,
        transition_style: 'fade',
        transition_duration: 150
    },
    neon: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'pulse',
        avatar_shape: 'rounded',
        avatar_size: 200,
        border_enabled: true,
        border_color: '#00ff00',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#00ff00',
        speaking_ring_enabled: true,
        speaking_ring_color: '#00ff00',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#00ff00',
        shadow_blur: 20,
        name_color: '#00ff00',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#000000',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 70,
        transition_style: 'fade',
        transition_duration: 200
    },
    minimal: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'none',
        avatar_shape: 'square',
        avatar_size: 120,
        border_enabled: true,
        border_color: '#ffffff',
        border_width: 2,
        glow_enabled: false,
        speaking_ring_enabled: false,
        shadow_enabled: false,
        name_color: '#ffffff',
        name_size: 11,
        name_background_enabled: false,
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 50,
        transition_style: 'none',
        transition_duration: 0
    },
    retro: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'shake',
        avatar_shape: 'square',
        avatar_size: 180,
        border_enabled: true,
        border_color: '#feca57',
        border_width: 5,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#ff6b6b',
        speaking_ring_width: 6,
        shadow_enabled: true,
        shadow_color: '#000000',
        shadow_blur: 15,
        name_color: '#feca57',
        name_size: 16,
        name_background_enabled: true,
        name_background_color: '#000000',
        grayscale_muted: false,
        grayscale_deafened: true,
        idle_opacity: 100,
        transition_style: 'slide',
        transition_duration: 300
    }
};

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Copy URL to clipboard
function copyUrl(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    document.execCommand('copy');
    showToast('URL copied to clipboard!');
}

// Toggle preview speaking state
function togglePreviewSpeaking() {
    const avatar = document.getElementById('preview-avatar');
    const image = document.getElementById('preview-image');
    const settings = USER_CONFIG.settings || {};

    isSpeaking = !isSpeaking;

    if (isSpeaking) {
        avatar.classList.add('speaking');
        avatar.classList.remove('dimmed');

        const speakingImg = USER_CONFIG.images?.speaking;
        if (speakingImg) {
            image.src = speakingImg;
        } else if (USER_AVATAR) {
            image.src = USER_AVATAR;
        }
    } else {
        avatar.classList.remove('speaking');
        if (settings.dim_when_idle) {
            avatar.classList.add('dimmed');
        }

        const idleImg = USER_CONFIG.images?.idle;
        if (idleImg) {
            image.src = idleImg;
        } else if (USER_AVATAR) {
            image.src = USER_AVATAR;
        }
    }
}

// Upload image for a state
async function uploadImage(state, file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('state', state);

    showToast('Uploading and resizing...', 'info');

    try {
        const response = await fetch('/api/cubreactive/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showToast(`${state} image uploaded (1024x1024)!`);

            const preview = document.getElementById(`preview-${state}`);
            const cacheBust = '?t=' + Date.now();
            preview.innerHTML = `<img src="${data.image_url}${cacheBust}" alt="${state}">`;

            if (!USER_CONFIG.images) USER_CONFIG.images = {};
            USER_CONFIG.images[state] = data.image_url;

            const card = document.querySelector(`.image-upload-card[data-state="${state}"]`);
            const deleteBtn = card.querySelector('.btn-delete');
            deleteBtn.disabled = false;

            const badge = card.querySelector('.default-badge');
            if (badge) badge.remove();

            updateMainPreview();
        } else {
            showToast(data.error || 'Upload failed', 'error');
        }
    } catch (error) {
        showToast('Upload failed: ' + error.message, 'error');
    }
}

// Delete image for a state
async function deleteImage(state) {
    try {
        const response = await fetch('/api/cubreactive/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state })
        });

        const data = await response.json();

        if (data.success) {
            showToast(`${state} image removed`);

            const preview = document.getElementById(`preview-${state}`);
            if (USER_AVATAR) {
                preview.innerHTML = `<img src="${USER_AVATAR}" alt="${state} (Default)" class="default-avatar">`;
            }

            if (USER_CONFIG.images) {
                USER_CONFIG.images[state] = null;
            }

            const card = document.querySelector(`.image-upload-card[data-state="${state}"]`);
            const deleteBtn = card.querySelector('.btn-delete');
            deleteBtn.disabled = true;

            const info = card.querySelector('.image-info');
            if (!info.querySelector('.default-badge')) {
                const badge = document.createElement('span');
                badge.className = 'default-badge';
                badge.textContent = 'Using Discord Avatar';
                info.appendChild(badge);
            }

            updateMainPreview();
        } else {
            showToast(data.error || 'Delete failed', 'error');
        }
    } catch (error) {
        showToast('Delete failed: ' + error.message, 'error');
    }
}

// Update main preview image
function updateMainPreview() {
    const image = document.getElementById('preview-image');
    if (!image) return;

    if (isSpeaking) {
        const speakingImg = USER_CONFIG.images?.speaking;
        image.src = speakingImg || USER_AVATAR || '';
    } else {
        const idleImg = USER_CONFIG.images?.idle;
        image.src = idleImg || USER_AVATAR || '';
    }
}

// Get value from element with fallback
function getVal(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'range' || el.type === 'number') return parseInt(el.value) || fallback;
    return el.value || fallback;
}

// Set value on element
function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') {
        el.checked = value;
        // Trigger change event for toggle options
        el.dispatchEvent(new Event('change'));
    } else {
        el.value = value;
        // Update slider display if present
        const valueDisplay = document.getElementById(id.replace('setting-', '') + '-value');
        if (valueDisplay) {
            const suffix = id.includes('opacity') ? '%' : (id.includes('duration') ? 'ms' : 'px');
            valueDisplay.textContent = value + (id.includes('max-participants') ? '' : suffix);
        }
    }
}

// Apply a preset theme
function applyTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;

    // Apply all theme settings to form elements
    setVal('setting-bounce', theme.bounce_on_speak);
    setVal('setting-dim', theme.dim_when_idle);
    setVal('setting-grayscale-muted', theme.grayscale_muted);
    setVal('setting-grayscale-deafened', theme.grayscale_deafened);

    // Animation style
    document.querySelectorAll('.style-btn[data-style]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === theme.animation_style);
    });
    setVal('setting-animation', theme.animation_style);

    // Shape
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.shape === theme.avatar_shape);
    });
    setVal('setting-shape', theme.avatar_shape);

    setVal('setting-size', theme.avatar_size);
    setVal('setting-border', theme.border_enabled);
    if (theme.border_color) setVal('setting-border-color', theme.border_color);
    if (theme.border_width) setVal('setting-border-width', theme.border_width);

    setVal('setting-glow', theme.glow_enabled);
    if (theme.glow_color) setVal('setting-glow-color', theme.glow_color);

    setVal('setting-speaking-ring', theme.speaking_ring_enabled);
    if (theme.speaking_ring_color) setVal('setting-speaking-ring-color', theme.speaking_ring_color);
    if (theme.speaking_ring_width) setVal('setting-speaking-ring-width', theme.speaking_ring_width);

    setVal('setting-shadow', theme.shadow_enabled);
    if (theme.shadow_color) setVal('setting-shadow-color', theme.shadow_color);
    if (theme.shadow_blur) setVal('setting-shadow-blur', theme.shadow_blur);

    setVal('setting-name-color', theme.name_color);
    setVal('setting-name-size', theme.name_size);
    setVal('setting-name-bg', theme.name_background_enabled);
    if (theme.name_background_color) setVal('setting-name-bg-color', theme.name_background_color);

    setVal('setting-idle-opacity', theme.idle_opacity);

    // Transition style
    document.querySelectorAll('.style-btn[data-transition]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.transition === theme.transition_style);
    });
    setVal('setting-transition', theme.transition_style);
    setVal('setting-transition-duration', theme.transition_duration);

    showToast(`Applied ${themeName} theme! Click Save to keep changes.`, 'success');
}

// Save settings
async function saveSettings() {
    const overlayBgTransparent = getVal('setting-overlay-bg-transparent', true);

    const settings = {
        bounce_on_speak: getVal('setting-bounce', true),
        dim_when_idle: getVal('setting-dim', false),
        show_name: getVal('setting-name', true),
        grayscale_muted: getVal('setting-grayscale-muted', true),
        grayscale_deafened: getVal('setting-grayscale-deafened', true),
        animation_style: getVal('setting-animation', 'bounce'),
        avatar_shape: getVal('setting-shape', 'rounded'),
        avatar_size: getVal('setting-size', 180),
        border_enabled: getVal('setting-border', false),
        border_color: getVal('setting-border-color', '#5865f2'),
        border_width: getVal('setting-border-width', 3),
        glow_enabled: getVal('setting-glow', false),
        glow_color: getVal('setting-glow-color', '#5865f2'),
        name_color: getVal('setting-name-color', '#ffffff'),
        name_size: getVal('setting-name-size', 14),
        overlay_position: getVal('setting-position', 'bottom'),
        spacing: getVal('setting-spacing', 20),
        speaking_ring_enabled: getVal('setting-speaking-ring', true),
        speaking_ring_color: getVal('setting-speaking-ring-color', '#57f287'),
        speaking_ring_width: getVal('setting-speaking-ring-width', 4),
        shadow_enabled: getVal('setting-shadow', false),
        shadow_color: getVal('setting-shadow-color', '#000000'),
        shadow_blur: getVal('setting-shadow-blur', 10),
        transition_style: getVal('setting-transition', 'fade'),
        transition_duration: getVal('setting-transition-duration', 200),
        show_status_icons: getVal('setting-status-icons', true),
        name_background_enabled: getVal('setting-name-bg', false),
        name_background_color: getVal('setting-name-bg-color', '#000000') + '80',
        overlay_background: overlayBgTransparent ? 'transparent' : getVal('setting-overlay-bg', '#000000'),
        idle_opacity: getVal('setting-idle-opacity', 100),
        flip_horizontal: getVal('setting-flip', false),
        hide_self: getVal('setting-hide-self', false),
        max_participants: getVal('setting-max-participants', 0),
        theme: 'custom'
    };

    try {
        const response = await fetch('/api/cubreactive/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Settings saved!');
            USER_CONFIG.settings = settings;

            const avatar = document.getElementById('preview-avatar');
            if (avatar) {
                if (settings.dim_when_idle && !isSpeaking) {
                    avatar.classList.add('dimmed');
                } else {
                    avatar.classList.remove('dimmed');
                }
            }
        } else {
            showToast(data.error || 'Save failed', 'error');
        }
    } catch (error) {
        showToast('Save failed: ' + error.message, 'error');
    }
}

// Initialize button groups
function initButtonGroup(selector, hiddenInputId, dataAttr) {
    const buttons = document.querySelectorAll(selector);
    const hiddenInput = document.getElementById(hiddenInputId);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (hiddenInput) {
                hiddenInput.value = btn.dataset[dataAttr];
            }
        });
    });
}

// Initialize slider with value display
function initSlider(sliderId, valueId, suffix = 'px') {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);

    if (slider && valueDisplay) {
        slider.addEventListener('input', () => {
            valueDisplay.textContent = slider.value + suffix;
        });
    }
}

// Initialize toggle that shows/hides options
function initToggleOptions(toggleId, optionsId) {
    const toggle = document.getElementById(toggleId);
    const options = document.getElementById(optionsId);

    if (toggle && options) {
        toggle.addEventListener('change', () => {
            options.style.display = toggle.checked ? 'block' : 'none';
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set up file upload listeners
    ['speaking', 'idle', 'muted', 'deafened'].forEach(state => {
        const input = document.getElementById(`upload-${state}`);
        if (input) {
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    uploadImage(state, e.target.files[0]);
                }
            });
        }
    });

    // Apply initial dim setting
    const avatar = document.getElementById('preview-avatar');
    if (avatar && USER_CONFIG.settings?.dim_when_idle) {
        avatar.classList.add('dimmed');
    }

    // Initialize button groups
    initButtonGroup('.position-btn', 'setting-position', 'position');
    initButtonGroup('.style-btn[data-style]', 'setting-animation', 'style');
    initButtonGroup('.style-btn[data-transition]', 'setting-transition', 'transition');
    initButtonGroup('.shape-btn', 'setting-shape', 'shape');

    // Initialize sliders
    initSlider('setting-size', 'size-value');
    initSlider('setting-border-width', 'border-width-value');
    initSlider('setting-name-size', 'name-size-value');
    initSlider('setting-spacing', 'spacing-value');
    initSlider('setting-speaking-ring-width', 'speaking-ring-width-value');
    initSlider('setting-shadow-blur', 'shadow-blur-value');
    initSlider('setting-transition-duration', 'transition-duration-value', 'ms');
    initSlider('setting-idle-opacity', 'idle-opacity-value', '%');
    initSlider('setting-max-participants', 'max-participants-value', '');

    // Initialize toggle options
    initToggleOptions('setting-border', 'border-options');
    initToggleOptions('setting-glow', 'glow-options');
    initToggleOptions('setting-shadow', 'shadow-options');
    initToggleOptions('setting-speaking-ring', 'speaking-ring-options');
    initToggleOptions('setting-name-bg', 'name-bg-options');
});
