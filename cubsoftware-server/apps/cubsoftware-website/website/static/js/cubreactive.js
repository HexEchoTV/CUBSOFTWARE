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
    },
    cyberpunk: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'pulse',
        avatar_shape: 'hexagon',
        avatar_size: 200,
        border_enabled: true,
        border_color: '#ff00ff',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#ff00ff',
        speaking_ring_enabled: true,
        speaking_ring_color: '#00ffff',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#ff00ff',
        shadow_blur: 25,
        name_color: '#00ffff',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#0a0a0a',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 80,
        transition_style: 'fade',
        transition_duration: 150
    },
    fire: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'shake',
        avatar_shape: 'circle',
        avatar_size: 180,
        border_enabled: true,
        border_color: '#ff4500',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#ff6600',
        speaking_ring_enabled: true,
        speaking_ring_color: '#ff4500',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#ff2200',
        shadow_blur: 20,
        name_color: '#ff8c00',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#1a0000',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 90,
        transition_style: 'fade',
        transition_duration: 200
    },
    ice: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'pulse',
        avatar_shape: 'rounded',
        avatar_size: 170,
        border_enabled: true,
        border_color: '#88ccff',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#44aaff',
        speaking_ring_enabled: true,
        speaking_ring_color: '#66ddff',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#0066cc',
        shadow_blur: 15,
        name_color: '#aaddff',
        name_size: 13,
        name_background_enabled: false,
        grayscale_muted: false,
        grayscale_deafened: true,
        idle_opacity: 60,
        transition_style: 'fade',
        transition_duration: 300
    },
    sunset: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'wave',
        avatar_shape: 'circle',
        avatar_size: 190,
        border_enabled: true,
        border_color: '#ff6b9d',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#c44569',
        speaking_ring_enabled: true,
        speaking_ring_color: '#f8a5c2',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#c44569',
        shadow_blur: 18,
        name_color: '#f8a5c2',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#2d132c',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 85,
        transition_style: 'fade',
        transition_duration: 250
    },
    matrix: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'none',
        avatar_shape: 'square',
        avatar_size: 160,
        border_enabled: true,
        border_color: '#00ff41',
        border_width: 2,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#00ff41',
        speaking_ring_width: 3,
        shadow_enabled: false,
        name_color: '#00ff41',
        name_size: 12,
        name_background_enabled: true,
        name_background_color: '#000000',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 40,
        transition_style: 'none',
        transition_duration: 0
    },
    pastel: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'bounce',
        avatar_shape: 'circle',
        avatar_size: 170,
        border_enabled: true,
        border_color: '#b8a9c9',
        border_width: 4,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#a8d8ea',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#b8a9c9',
        shadow_blur: 12,
        name_color: '#f6e6cb',
        name_size: 13,
        name_background_enabled: true,
        name_background_color: '#2a2a3a',
        grayscale_muted: false,
        grayscale_deafened: false,
        idle_opacity: 100,
        transition_style: 'fade',
        transition_duration: 300
    },
    gold: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'pulse',
        avatar_shape: 'rounded',
        avatar_size: 190,
        border_enabled: true,
        border_color: '#ffd700',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#daa520',
        speaking_ring_enabled: true,
        speaking_ring_color: '#ffd700',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#b8860b',
        shadow_blur: 20,
        name_color: '#ffd700',
        name_size: 15,
        name_background_enabled: true,
        name_background_color: '#1a1200',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 90,
        transition_style: 'fade',
        transition_duration: 200
    },
    ocean: {
        bounce_on_speak: true,
        dim_when_idle: true,
        animation_style: 'wave',
        avatar_shape: 'circle',
        avatar_size: 180,
        border_enabled: true,
        border_color: '#0077b6',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#00b4d8',
        speaking_ring_enabled: true,
        speaking_ring_color: '#90e0ef',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#023e8a',
        shadow_blur: 18,
        name_color: '#caf0f8',
        name_size: 13,
        name_background_enabled: true,
        name_background_color: '#03045e',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 55,
        transition_style: 'fade',
        transition_duration: 350
    },
    cherry: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'bounce',
        avatar_shape: 'rounded',
        avatar_size: 175,
        border_enabled: true,
        border_color: '#e91e63',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#e91e63',
        speaking_ring_enabled: true,
        speaking_ring_color: '#f48fb1',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#880e4f',
        shadow_blur: 15,
        name_color: '#fce4ec',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#311b1b',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 85,
        transition_style: 'fade',
        transition_duration: 200
    },
    toxic: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'shake',
        avatar_shape: 'hexagon',
        avatar_size: 185,
        border_enabled: true,
        border_color: '#76ff03',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#76ff03',
        speaking_ring_enabled: true,
        speaking_ring_color: '#b2ff59',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#33691e',
        shadow_blur: 22,
        name_color: '#ccff90',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#0a0f00',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 75,
        transition_style: 'fade',
        transition_duration: 150
    },
    galaxy: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'pulse',
        avatar_shape: 'circle',
        avatar_size: 200,
        border_enabled: true,
        border_color: '#7c4dff',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#b388ff',
        speaking_ring_enabled: true,
        speaking_ring_color: '#ea80fc',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#4a148c',
        shadow_blur: 25,
        name_color: '#e1bee7',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#12005e',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 80,
        transition_style: 'fade',
        transition_duration: 200
    },
    stealth: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'none',
        avatar_shape: 'rounded',
        avatar_size: 150,
        border_enabled: true,
        border_color: '#333333',
        border_width: 2,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#555555',
        speaking_ring_width: 3,
        shadow_enabled: false,
        name_color: '#888888',
        name_size: 11,
        name_background_enabled: false,
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 30,
        transition_style: 'fade',
        transition_duration: 100
    },
    candy: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'bounce',
        avatar_shape: 'circle',
        avatar_size: 180,
        border_enabled: true,
        border_color: '#ff6fff',
        border_width: 5,
        glow_enabled: true,
        glow_color: '#ff6fff',
        speaking_ring_enabled: true,
        speaking_ring_color: '#ffde59',
        speaking_ring_width: 6,
        shadow_enabled: true,
        shadow_color: '#ff6fff',
        shadow_blur: 15,
        name_color: '#ffde59',
        name_size: 15,
        name_background_enabled: true,
        name_background_color: '#3d1f5c',
        grayscale_muted: false,
        grayscale_deafened: false,
        idle_opacity: 100,
        transition_style: 'fade',
        transition_duration: 200
    },
    blood: {
        bounce_on_speak: true,
        dim_when_idle: true,
        animation_style: 'shake',
        avatar_shape: 'square',
        avatar_size: 175,
        border_enabled: true,
        border_color: '#b71c1c',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#d50000',
        speaking_ring_enabled: true,
        speaking_ring_color: '#ff1744',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#b71c1c',
        shadow_blur: 20,
        name_color: '#ff8a80',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#1a0000',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 50,
        transition_style: 'fade',
        transition_duration: 150
    },
    midnight: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'float',
        avatar_shape: 'circle',
        avatar_size: 180,
        border_enabled: true,
        border_color: '#1a237e',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#3949ab',
        speaking_ring_enabled: true,
        speaking_ring_color: '#5c6bc0',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#0d1137',
        shadow_blur: 18,
        name_color: '#9fa8da',
        name_size: 13,
        name_background_enabled: true,
        name_background_color: '#0a0d24',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 45,
        transition_style: 'fade',
        transition_duration: 300
    },
    forest: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'wave',
        avatar_shape: 'rounded',
        avatar_size: 175,
        border_enabled: true,
        border_color: '#2e7d32',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#43a047',
        speaking_ring_enabled: true,
        speaking_ring_color: '#66bb6a',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#1b5e20',
        shadow_blur: 15,
        name_color: '#a5d6a7',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#0d260f',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 85,
        transition_style: 'fade',
        transition_duration: 250
    },
    lavender: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'bounce',
        avatar_shape: 'circle',
        avatar_size: 170,
        border_enabled: true,
        border_color: '#ce93d8',
        border_width: 4,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#f48fb1',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#ab47bc',
        shadow_blur: 12,
        name_color: '#f3e5f5',
        name_size: 13,
        name_background_enabled: true,
        name_background_color: '#2a1a2e',
        grayscale_muted: false,
        grayscale_deafened: false,
        idle_opacity: 100,
        transition_style: 'fade',
        transition_duration: 200
    },
    ember: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'pulse',
        avatar_shape: 'rounded',
        avatar_size: 185,
        border_enabled: true,
        border_color: '#ff5722',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#ff7043',
        speaking_ring_enabled: true,
        speaking_ring_color: '#ffab91',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#bf360c',
        shadow_blur: 20,
        name_color: '#ffccbc',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#1a0800',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 80,
        transition_style: 'fade',
        transition_duration: 150
    },
    arctic: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'float',
        avatar_shape: 'hexagon',
        avatar_size: 175,
        border_enabled: true,
        border_color: '#e1f5fe',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#b3e5fc',
        speaking_ring_enabled: true,
        speaking_ring_color: '#81d4fa',
        speaking_ring_width: 4,
        shadow_enabled: true,
        shadow_color: '#4fc3f7',
        shadow_blur: 18,
        name_color: '#e1f5fe',
        name_size: 13,
        name_background_enabled: true,
        name_background_color: '#01579b',
        grayscale_muted: false,
        grayscale_deafened: true,
        idle_opacity: 55,
        transition_style: 'blur',
        transition_duration: 300
    },
    shadow: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'none',
        avatar_shape: 'rounded',
        avatar_size: 160,
        border_enabled: true,
        border_color: '#424242',
        border_width: 2,
        glow_enabled: false,
        speaking_ring_enabled: true,
        speaking_ring_color: '#616161',
        speaking_ring_width: 3,
        shadow_enabled: true,
        shadow_color: '#000000',
        shadow_blur: 25,
        name_color: '#9e9e9e',
        name_size: 12,
        name_background_enabled: false,
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 35,
        transition_style: 'fade',
        transition_duration: 200
    },
    rainbow: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'spin',
        avatar_shape: 'circle',
        avatar_size: 190,
        border_enabled: true,
        border_color: '#ff1744',
        border_width: 5,
        glow_enabled: true,
        glow_color: '#f50057',
        speaking_ring_enabled: true,
        speaking_ring_color: '#d500f9',
        speaking_ring_width: 6,
        shadow_enabled: true,
        shadow_color: '#651fff',
        shadow_blur: 25,
        name_color: '#00e5ff',
        name_size: 15,
        name_background_enabled: true,
        name_background_color: '#1a0a2e',
        grayscale_muted: false,
        grayscale_deafened: false,
        idle_opacity: 100,
        transition_style: 'rotate',
        transition_duration: 200
    },
    copper: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'pulse',
        avatar_shape: 'rounded',
        avatar_size: 180,
        border_enabled: true,
        border_color: '#bf8040',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#cd9754',
        speaking_ring_enabled: true,
        speaking_ring_color: '#e6ac69',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#8b5a2b',
        shadow_blur: 18,
        name_color: '#f4d4a5',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#1a1005',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 85,
        transition_style: 'fade',
        transition_duration: 200
    },
    electric: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'jello',
        avatar_shape: 'hexagon',
        avatar_size: 185,
        border_enabled: true,
        border_color: '#2979ff',
        border_width: 3,
        glow_enabled: true,
        glow_color: '#448aff',
        speaking_ring_enabled: true,
        speaking_ring_color: '#82b1ff',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#2962ff',
        shadow_blur: 22,
        name_color: '#82b1ff',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#0a1929',
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 75,
        transition_style: 'flash',
        transition_duration: 100
    },
    phantom: {
        bounce_on_speak: false,
        dim_when_idle: true,
        animation_style: 'float',
        avatar_shape: 'blob',
        avatar_size: 175,
        border_enabled: false,
        glow_enabled: true,
        glow_color: '#b0bec5',
        speaking_ring_enabled: true,
        speaking_ring_color: '#cfd8dc',
        speaking_ring_width: 3,
        shadow_enabled: true,
        shadow_color: '#607d8b',
        shadow_blur: 30,
        name_color: '#eceff1',
        name_size: 13,
        name_background_enabled: false,
        grayscale_muted: true,
        grayscale_deafened: true,
        idle_opacity: 40,
        transition_style: 'blur',
        transition_duration: 350
    },
    vaporwave: {
        bounce_on_speak: true,
        dim_when_idle: false,
        animation_style: 'wave',
        avatar_shape: 'rounded',
        avatar_size: 185,
        border_enabled: true,
        border_color: '#ff71ce',
        border_width: 4,
        glow_enabled: true,
        glow_color: '#01cdfe',
        speaking_ring_enabled: true,
        speaking_ring_color: '#05ffa1',
        speaking_ring_width: 5,
        shadow_enabled: true,
        shadow_color: '#b967ff',
        shadow_blur: 20,
        name_color: '#fffb96',
        name_size: 14,
        name_background_enabled: true,
        name_background_color: '#1a0a2e',
        grayscale_muted: false,
        grayscale_deafened: true,
        idle_opacity: 85,
        transition_style: 'fade',
        transition_duration: 250
    }
};

// Toggle CubReactive on/off
async function toggleCubReactive(enabled) {
    try {
        const res = await fetch('/api/cubreactive/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
        });
        const data = await res.json();
        if (data.success) {
            const statusEl = document.getElementById('enabled-status');
            if (enabled) {
                statusEl.textContent = 'Enabled';
                statusEl.className = 'status-on';
                showToast('CubReactive enabled');
            } else {
                statusEl.textContent = 'Disabled';
                statusEl.className = 'status-off';
                showToast('CubReactive disabled - overlay will stop working', 'error');
            }
        }
    } catch (e) {
        showToast('Failed to update', 'error');
    }
}

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

// Get shape styles (border-radius and clip-path)
function getShapeStyles(shape) {
    const shapes = {
        'circle': { borderRadius: '50%', clipPath: '' },
        'square': { borderRadius: '0', clipPath: '' },
        'rounded': { borderRadius: '12px', clipPath: '' },
        'hexagon': { borderRadius: '0', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' },
        'diamond': { borderRadius: '0', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
        'octagon': { borderRadius: '0', clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' },
        'star': { borderRadius: '0', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
        'heart': { borderRadius: '0', clipPath: 'polygon(50% 20%, 55% 12%, 65% 5%, 78% 3%, 90% 10%, 97% 25%, 95% 45%, 80% 65%, 50% 100%, 20% 65%, 5% 45%, 3% 25%, 10% 10%, 22% 3%, 35% 5%, 45% 12%)' },
        'shield': { borderRadius: '0', clipPath: 'polygon(50% 0%, 100% 10%, 100% 60%, 50% 100%, 0% 60%, 0% 10%)' },
        'blob': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', clipPath: '' }
    };
    return shapes[shape] || shapes['rounded'];
}

// Get animation class name
function getAnimationClass(style) {
    const classes = {
        'bounce': 'anim-bounce',
        'pulse': 'anim-pulse',
        'glow': 'anim-glow',
        'shake': 'anim-shake',
        'wave': 'anim-wave',
        'float': 'anim-float',
        'spin': 'anim-spin',
        'jello': 'anim-jello',
        'heartbeat': 'anim-heartbeat',
        'flash': 'anim-flash',
        'rubberband': 'anim-rubberband',
        'breathe': 'anim-breathe',
        'none': ''
    };
    return classes[style] || '';
}

// Update preview to reflect current settings
function updatePreview() {
    const wrapper = document.getElementById('preview-wrapper');
    const avatar = document.getElementById('preview-avatar');
    const image = document.getElementById('preview-image');
    const username = document.getElementById('preview-username');
    const stateLabel = document.getElementById('preview-state-label');

    if (!wrapper || !avatar || !image) return;

    // Get current form values
    const size = getVal('setting-size', 180);
    const shape = getVal('setting-shape', 'rounded');
    const borderEnabled = getVal('setting-border', false);
    const borderColor = getVal('setting-border-color', '#5865f2');
    const borderWidth = getVal('setting-border-width', 3);
    const borderStyle = getVal('setting-border-style', 'solid');
    const glowEnabled = getVal('setting-glow', false);
    const glowColor = getVal('setting-glow-color', '#5865f2');
    const speakingRingEnabled = getVal('setting-speaking-ring', true);
    const speakingRingColor = getVal('setting-speaking-ring-color', '#57f287');
    const speakingRingWidth = getVal('setting-speaking-ring-width', 4);
    const shadowEnabled = getVal('setting-shadow', false);
    const shadowColor = getVal('setting-shadow-color', '#000000');
    const shadowBlur = getVal('setting-shadow-blur', 10);
    const showName = getVal('setting-name', true);
    const nameColor = getVal('setting-name-color', '#ffffff');
    const nameSize = getVal('setting-name-size', 14);
    const nameBgEnabled = getVal('setting-name-bg', false);
    const nameBgColor = getVal('setting-name-bg-color', '#000000');
    const nameShadowEnabled = getVal('setting-name-shadow', false);
    const nameShadowColor = getVal('setting-name-shadow-color', '#000000');
    const nameGlowEnabled = getVal('setting-name-glow', false);
    const nameGlowColor = getVal('setting-name-glow-color', '#5865f2');
    const idleOpacity = getVal('setting-idle-opacity', 100);
    const dimWhenIdle = getVal('setting-dim', false);
    const animStyle = getVal('setting-animation', 'bounce');
    const animSpeed = getVal('setting-animation-speed', 100);
    const idleAnimStyle = getVal('setting-idle-animation', 'none');
    const flipHorizontal = getVal('setting-flip', false);
    const filterBrightness = getVal('setting-filter-brightness', 100);
    const filterContrast = getVal('setting-filter-contrast', 100);
    const filterSaturate = getVal('setting-filter-saturate', 100);
    const filterHue = getVal('setting-filter-hue', 0);

    // Apply size
    avatar.style.width = size + 'px';
    avatar.style.height = size + 'px';

    // Apply shape - only to img-wrapper, NOT to avatar (so frame/outline aren't clipped)
    const shapeStyles = getShapeStyles(shape);

    // Avatar gets border-radius only (no clip-path) so children aren't clipped
    avatar.style.borderRadius = shapeStyles.borderRadius;
    avatar.style.clipPath = 'none';
    avatar.style.overflow = 'visible';

    // img-wrapper gets full shape for proper image clipping
    const imgWrapper = document.getElementById('preview-img-wrapper');
    if (imgWrapper) {
        imgWrapper.style.borderRadius = shapeStyles.borderRadius;
        imgWrapper.style.clipPath = shapeStyles.clipPath || 'none';
        imgWrapper.style.overflow = 'hidden';
    }

    // Apply border
    if (borderEnabled) {
        avatar.style.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
    } else {
        avatar.style.border = 'none';
    }

    // Build box-shadow
    let shadows = [];
    if (shadowEnabled) {
        shadows.push(`0 0 ${shadowBlur}px ${shadowColor}`);
    }
    if (isSpeaking && glowEnabled) {
        shadows.push(`0 0 20px ${glowColor}`);
    }
    if (isSpeaking && speakingRingEnabled) {
        shadows.push(`0 0 0 ${speakingRingWidth}px ${speakingRingColor}`);
    }
    avatar.style.boxShadow = shadows.length > 0 ? shadows.join(', ') : 'none';

    // Apply flip
    image.style.transform = flipHorizontal ? 'scaleX(-1)' : 'none';

    // Build image filter
    let filters = [];
    if (filterBrightness !== 100) filters.push(`brightness(${filterBrightness}%)`);
    if (filterContrast !== 100) filters.push(`contrast(${filterContrast}%)`);
    if (filterSaturate !== 100) filters.push(`saturate(${filterSaturate}%)`);
    if (filterHue !== 0) filters.push(`hue-rotate(${filterHue}deg)`);

    // Apply opacity and grayscale based on state
    if (!isSpeaking && dimWhenIdle) {
        avatar.style.opacity = (idleOpacity / 100).toString();
        filters.push('grayscale(20%)');
    } else {
        avatar.style.opacity = '1';
    }

    image.style.filter = filters.length > 0 ? filters.join(' ') : 'none';

    // Apply animation speed
    const speedFactor = 100 / animSpeed;
    avatar.style.animationDuration = (0.5 * speedFactor) + 's';

    // Apply animation class when speaking or idle
    const allAnimClasses = ['anim-bounce', 'anim-pulse', 'anim-glow', 'anim-shake', 'anim-wave',
                           'anim-float', 'anim-spin', 'anim-jello', 'anim-heartbeat', 'anim-flash',
                           'anim-rubberband', 'anim-breathe'];
    allAnimClasses.forEach(c => avatar.classList.remove(c));

    if (isSpeaking) {
        const animClass = getAnimationClass(animStyle);
        if (animClass) {
            avatar.classList.add(animClass);
        }
    } else if (idleAnimStyle !== 'none') {
        const idleAnimClass = getAnimationClass(idleAnimStyle);
        if (idleAnimClass) {
            avatar.classList.add(idleAnimClass);
        }
    }

    // Update username visibility and style
    const nameFont = getVal('setting-name-font', 'default');
    const namePosition = getVal('setting-name-position', 'bottom');

    const fontMap = {
        'default': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'gaming': '"Orbitron", sans-serif',
        'handwritten': '"Comic Sans MS", cursive',
        'retro': '"Press Start 2P", monospace',
        'monospace': '"Courier New", monospace',
        'elegant': '"Playfair Display", serif',
        'bold': '"Impact", sans-serif',
        'pixel': '"VT323", monospace'
    };

    if (username) {
        username.style.display = showName ? 'block' : 'none';
        username.style.color = nameColor;
        username.style.fontSize = nameSize + 'px';
        username.style.fontFamily = fontMap[nameFont] || fontMap['default'];

        if (nameBgEnabled) {
            username.style.background = nameBgColor + '80';
            username.style.padding = '2px 8px';
            username.style.borderRadius = '4px';
        } else {
            username.style.background = 'transparent';
            username.style.padding = '0';
        }

        // Apply text shadow/glow
        let textShadows = [];
        if (nameShadowEnabled) {
            textShadows.push(`2px 2px 4px ${nameShadowColor}`);
        }
        if (nameGlowEnabled) {
            textShadows.push(`0 0 10px ${nameGlowColor}`);
            textShadows.push(`0 0 20px ${nameGlowColor}`);
        }
        username.style.textShadow = textShadows.length > 0 ? textShadows.join(', ') : '0 2px 4px rgba(0,0,0,0.5)';
    }

    // Apply name position to wrapper
    if (wrapper) {
        wrapper.classList.remove('name-top', 'name-left', 'name-right', 'name-bottom', 'name-inside-bottom', 'name-inside-top');
        if (namePosition === 'top') {
            wrapper.classList.add('name-top');
        } else if (namePosition === 'left') {
            wrapper.classList.add('name-left');
        } else if (namePosition === 'right') {
            wrapper.classList.add('name-right');
        } else if (namePosition === 'inside-bottom') {
            wrapper.classList.add('name-inside-bottom');
        } else if (namePosition === 'inside-top') {
            wrapper.classList.add('name-inside-top');
        } else {
            wrapper.classList.add('name-bottom');
        }
    }

    // Update image based on speaking state
    if (isSpeaking) {
        const speakingImg = USER_CONFIG.images?.speaking;
        image.src = speakingImg || USER_AVATAR || '';
    } else {
        const idleImg = USER_CONFIG.images?.idle;
        image.src = idleImg || USER_AVATAR || '';
    }

    // Update state label
    if (stateLabel) {
        if (isSpeaking) {
            stateLabel.textContent = 'Speaking';
            stateLabel.className = 'preview-state speaking';
        } else {
            stateLabel.textContent = 'Idle';
            stateLabel.className = 'preview-state';
        }
    }

    // === NEW EFFECT PREVIEWS ===

    // Particles - stays inside avatar and gets clipped by avatar shape
    const particlesEnabled = getVal('setting-particles', false);
    const particleType = getVal('setting-particle-type', 'sparkles');
    const particleColor = getVal('setting-particle-color', '#ffdd00');
    const particleCount = getVal('setting-particle-count', 15);
    const particlesContainer = document.getElementById('preview-particles');

    if (particlesContainer) {
        if (particlesEnabled && isSpeaking) {
            particlesContainer.style.display = 'block';
            // Apply clip-path and overflow to keep particles inside avatar shape
            particlesContainer.style.clipPath = shapeStyles.clipPath || 'none';
            particlesContainer.style.borderRadius = shapeStyles.borderRadius;
            particlesContainer.style.overflow = 'hidden';
            updatePreviewParticles(particlesContainer, particleType, particleColor, parseInt(particleCount));
        } else {
            particlesContainer.style.display = 'none';
        }
    }

    // Animated Border
    const animBorderEnabled = getVal('setting-animated-border', false);
    const animBorderType = getVal('setting-animated-border-type', 'rainbow');
    const animBorderEl = document.getElementById('preview-anim-border');

    if (animBorderEl) {
        if (animBorderEnabled && isSpeaking) {
            animBorderEl.style.display = 'block';
            animBorderEl.className = `preview-anim-border anim-border-${animBorderType}`;
            animBorderEl.style.top = '-4px';
            animBorderEl.style.right = '-4px';
            animBorderEl.style.bottom = '-4px';
            animBorderEl.style.left = '-4px';
            animBorderEl.style.borderRadius = shapeStyles.borderRadius;
        } else {
            animBorderEl.style.display = 'none';
        }
    }

    // Background Effect
    const bgEffectEnabled = getVal('setting-bg-effect', false);
    const bgEffectType = getVal('setting-bg-effect-type', 'glow-aura');
    const bgEffectColor = getVal('setting-bg-effect-color', '#5865f2');
    const bgEffectEl = document.getElementById('preview-bg-effect');

    if (bgEffectEl) {
        if (bgEffectEnabled) {
            bgEffectEl.style.display = 'block';
            bgEffectEl.className = `preview-bg-effect bg-effect-${bgEffectType}`;
            bgEffectEl.style.setProperty('--bg-effect-color', bgEffectColor);
        } else {
            bgEffectEl.style.display = 'none';
        }
    }

    // Outline
    const outlineEnabled = getVal('setting-outline', false);
    const outlineColor = getVal('setting-outline-color', '#ffffff');
    const outlineWidth = getVal('setting-outline-width', 2);
    const outlineOffset = getVal('setting-outline-offset', 3);
    const outlineEl = document.getElementById('preview-outline');

    if (outlineEl) {
        if (outlineEnabled) {
            outlineEl.style.display = 'block';
            outlineEl.style.top = `-${outlineOffset}px`;
            outlineEl.style.right = `-${outlineOffset}px`;
            outlineEl.style.bottom = `-${outlineOffset}px`;
            outlineEl.style.left = `-${outlineOffset}px`;
            outlineEl.style.border = `${outlineWidth}px solid ${outlineColor}`;
            outlineEl.style.borderRadius = shapeStyles.borderRadius;
        } else {
            outlineEl.style.display = 'none';
        }
    }

    // Frame
    const frame = getVal('setting-frame', 'none');
    const frameColor = getVal('setting-frame-color', '#ffd700');
    const frameEl = document.getElementById('preview-frame');

    if (frameEl) {
        if (frame !== 'none') {
            frameEl.style.display = 'block';
            frameEl.className = `preview-frame avatar-frame-${frame}`;
            frameEl.style.setProperty('--frame-color', frameColor);
            frameEl.style.top = '-8px';
            frameEl.style.right = '-8px';
            frameEl.style.bottom = '-8px';
            frameEl.style.left = '-8px';
            frameEl.style.borderRadius = shapeStyles.borderRadius;
        } else {
            frameEl.style.display = 'none';
        }
    }

    // Accessory
    const accessory = getVal('setting-accessory', 'none');
    const accessoryEl = document.getElementById('preview-accessory');

    if (accessoryEl) {
        if (accessory !== 'none') {
            accessoryEl.style.display = 'block';
            accessoryEl.className = `preview-accessory avatar-accessory-${accessory}`;
            accessoryEl.innerHTML = getAccessoryHtml(accessory);
        } else {
            accessoryEl.style.display = 'none';
        }
    }

    // Mirror
    const mirrorEnabled = getVal('setting-mirror', false);
    const mirrorOpacity = getVal('setting-mirror-opacity', 30);
    const mirrorEl = document.getElementById('preview-mirror');

    if (mirrorEl) {
        if (mirrorEnabled) {
            mirrorEl.style.display = 'block';
            mirrorEl.style.backgroundImage = `url(${image.src})`;
            mirrorEl.style.opacity = mirrorOpacity / 100;
        } else {
            mirrorEl.style.display = 'none';
        }
    }

    // Voice Indicator
    const voiceIndicatorEnabled = getVal('setting-voice-indicator', false);
    const voiceIndicatorType = getVal('setting-voice-indicator-type', 'bar');
    const voiceIndicatorColor = getVal('setting-voice-indicator-color', '#57f287');
    const voiceIndicatorEl = document.getElementById('preview-voice-indicator');

    if (voiceIndicatorEl) {
        if (voiceIndicatorEnabled && isSpeaking) {
            voiceIndicatorEl.style.display = 'flex';
            voiceIndicatorEl.style.setProperty('--voice-indicator-color', voiceIndicatorColor);
            updatePreviewVoiceIndicator(voiceIndicatorEl, voiceIndicatorType);
        } else {
            voiceIndicatorEl.style.display = 'none';
        }
    }

    // Status Text
    const statusTextEnabled = getVal('setting-status-text-enabled', false);
    const statusText = getVal('setting-status-text', '');
    const statusTextColor = getVal('setting-status-text-color', '#888888');
    const statusTextEl = document.getElementById('preview-status-text');

    if (statusTextEl) {
        if (statusTextEnabled && statusText) {
            statusTextEl.style.display = 'block';
            statusTextEl.textContent = statusText;
            statusTextEl.style.color = statusTextColor;
        } else {
            statusTextEl.style.display = 'none';
        }
    }
}

// Helper function to update preview particles
function updatePreviewParticles(container, type, color, count) {
    // Regenerate if count or type changed
    if (container.childElementCount !== count || container.dataset.lastType !== type) {
        container.innerHTML = '';
        container.dataset.lastType = type;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle particle-${type}`;
            particle.style.setProperty('--particle-color', color);
            // Random horizontal position
            particle.style.left = `${Math.random() * 100}%`;
            // Start particles at the bottom (0-20% from bottom)
            particle.style.bottom = `${Math.random() * 20}%`;
            // Use negative delay to spread particles across their animation cycle
            const duration = 2 + Math.random() * 2;
            particle.style.animationDelay = `${-Math.random() * duration}s`;
            particle.style.animationDuration = `${duration}s`;
            // Random size variation
            const scale = 0.6 + Math.random() * 0.8;
            particle.style.setProperty('--scale', scale);
            container.appendChild(particle);
        }
    }
}

// Helper function to update preview voice indicator
function updatePreviewVoiceIndicator(container, style) {
    const currentType = container.dataset.lastType;
    if (currentType === style) return;

    container.dataset.lastType = style;
    container.innerHTML = '';

    if (style === 'bar') {
        for (let i = 0; i < 5; i++) {
            const bar = document.createElement('div');
            bar.className = 'voice-bar';
            bar.style.animationDelay = `${i * 0.1}s`;
            container.appendChild(bar);
        }
    } else if (style === 'dots') {
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'voice-dot';
            dot.style.animationDelay = `${i * 0.15}s`;
            container.appendChild(dot);
        }
    } else if (style === 'wave') {
        for (let i = 0; i < 3; i++) {
            const wave = document.createElement('div');
            wave.className = 'voice-wave';
            wave.style.animationDelay = `${i * 0.2}s`;
            container.appendChild(wave);
        }
    } else if (style === 'ring') {
        container.innerHTML = '<div class="voice-ring"></div>';
    }
}

// Helper function to get accessory HTML
function getAccessoryHtml(accessory) {
    const accessories = {
        'crown': '<svg viewBox="0 0 24 24" fill="#ffd700" width="40" height="30"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z"/></svg>',
        'halo': '<div class="accessory-halo"></div>',
        'horns': '<svg viewBox="0 0 24 24" fill="#cc0000" width="50" height="25"><path d="M4 12L2 2L7 8L12 2L17 8L22 2L20 12H4Z"/></svg>',
        'cat-ears': '<div class="accessory-cat-ears"><span></span><span></span></div>',
        'headphones': '<svg viewBox="0 0 24 24" fill="#333" width="60" height="30"><path d="M12 1C7 1 3 5 3 10V17C3 18.66 4.34 20 6 20H9V12H5V10C5 6.13 8.13 3 12 3S19 6.13 19 10V12H15V20H18C19.66 20 21 18.66 21 17V10C21 5 17 1 12 1Z"/></svg>',
        'santa-hat': '<svg viewBox="0 0 24 24" fill="#e74c3c" width="45" height="35"><path d="M12 2C10 2 8.5 3.5 8.5 5.5C8.5 6.5 9 7.4 9.7 8H5L3 18H21L19 8H14.3C15 7.4 15.5 6.5 15.5 5.5C15.5 3.5 14 2 12 2Z"/><circle cx="12" cy="5" r="2" fill="white"/></svg>',
        'party-hat': '<svg viewBox="0 0 24 24" width="35" height="35"><path d="M12 2L4 22H20L12 2Z" fill="#9b59b6"/><circle cx="8" cy="16" r="1.5" fill="#ff6b6b"/><circle cx="12" cy="12" r="1.5" fill="#4ecdc4"/><circle cx="16" cy="16" r="1.5" fill="#ffe66d"/></svg>'
    };
    return accessories[accessory] || '';
}

// Toggle preview speaking state
function togglePreviewSpeaking() {
    isSpeaking = !isSpeaking;
    updatePreview();
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
    updatePreview();
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

    // Update preview with new theme settings
    updatePreview();

    showToast(`Applied ${themeName} theme! Click Save to keep changes.`, 'success');
}

// Save settings
async function saveSettings() {
    const overlayBgTransparent = getVal('setting-overlay-bg-transparent', true);

    const settings = {
        // Basic settings
        bounce_on_speak: getVal('setting-bounce', true),
        dim_when_idle: getVal('setting-dim', false),
        show_name: getVal('setting-name', true),
        grayscale_muted: getVal('setting-grayscale-muted', true),
        grayscale_deafened: getVal('setting-grayscale-deafened', true),
        animation_style: getVal('setting-animation', 'bounce'),
        animation_speed: getVal('setting-animation-speed', 100),
        idle_animation_style: getVal('setting-idle-animation', 'none'),
        avatar_shape: getVal('setting-shape', 'rounded'),
        avatar_size: getVal('setting-size', 180),
        border_enabled: getVal('setting-border', false),
        border_color: getVal('setting-border-color', '#5865f2'),
        border_width: getVal('setting-border-width', 3),
        border_style: getVal('setting-border-style', 'solid'),
        glow_enabled: getVal('setting-glow', false),
        glow_color: getVal('setting-glow-color', '#5865f2'),
        name_color: getVal('setting-name-color', '#ffffff'),
        name_size: getVal('setting-name-size', 14),
        name_shadow_enabled: getVal('setting-name-shadow', false),
        name_shadow_color: getVal('setting-name-shadow-color', '#000000'),
        name_glow_enabled: getVal('setting-name-glow', false),
        name_glow_color: getVal('setting-name-glow-color', '#5865f2'),
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
        entry_animation: getVal('setting-entry-animation', 'fade'),
        entry_duration: getVal('setting-entry-duration', 500),
        show_status_icons: getVal('setting-status-icons', true),
        name_background_enabled: getVal('setting-name-bg', false),
        name_background_color: getVal('setting-name-bg-color', '#000000') + '80',
        overlay_background: overlayBgTransparent ? 'transparent' : getVal('setting-overlay-bg', '#000000'),
        idle_opacity: getVal('setting-idle-opacity', 100),
        flip_horizontal: getVal('setting-flip', false),
        hide_self: getVal('setting-hide-self', false),
        max_participants: getVal('setting-max-participants', 0),
        filter_brightness: getVal('setting-filter-brightness', 100),
        filter_contrast: getVal('setting-filter-contrast', 100),
        filter_saturate: getVal('setting-filter-saturate', 100),
        filter_hue: getVal('setting-filter-hue', 0),

        // Particle effects
        particles_enabled: getVal('setting-particles', false),
        particle_type: getVal('setting-particle-type', 'sparkles'),
        particle_color: getVal('setting-particle-color', '#ffdd00'),
        particle_count: getVal('setting-particle-count', 15),

        // Animated border
        animated_border_enabled: getVal('setting-animated-border', false),
        animated_border_type: getVal('setting-animated-border-type', 'rainbow'),
        animated_border_speed: getVal('setting-animated-border-speed', 5),

        // Background effects
        bg_effect_enabled: getVal('setting-bg-effect', false),
        bg_effect_type: getVal('setting-bg-effect-type', 'glow-aura'),
        bg_effect_color: getVal('setting-bg-effect-color', '#5865f2'),
        bg_effect_size: getVal('setting-bg-effect-size', 50),

        // Outline
        outline_enabled: getVal('setting-outline', false),
        outline_color: getVal('setting-outline-color', '#ffffff'),
        outline_width: getVal('setting-outline-width', 2),
        outline_offset: getVal('setting-outline-offset', 3),

        // Accessories
        accessory: getVal('setting-accessory', 'none'),
        frame: getVal('setting-frame', 'none'),
        frame_color: getVal('setting-frame-color', '#ffd700'),

        // Mirror/reflection
        mirror_enabled: getVal('setting-mirror', false),
        mirror_opacity: getVal('setting-mirror-opacity', 30),

        // Tilt
        tilt_enabled: getVal('setting-tilt', false),
        tilt_amount: getVal('setting-tilt-amount', 5),

        // Voice indicator
        voice_indicator_enabled: getVal('setting-voice-indicator', false),
        voice_indicator_type: getVal('setting-voice-indicator-type', 'bar'),
        voice_indicator_color: getVal('setting-voice-indicator-color', '#57f287'),

        // Username styling
        name_font: getVal('setting-name-font', 'default'),
        name_position: getVal('setting-name-position', 'bottom'),
        name_animation: getVal('setting-name-animation', 'none'),

        // Status text
        status_text_enabled: getVal('setting-status-text-enabled', false),
        status_text: getVal('setting-status-text', ''),
        status_text_color: getVal('setting-status-text-color', '#888888'),

        // Group mode
        group_layout: getVal('setting-group-layout', 'horizontal'),
        speaking_highlight: getVal('setting-speaking-highlight', 'none'),
        sort_order: getVal('setting-sort-order', 'join-order'),

        // Custom CSS
        custom_css: getVal('setting-custom-css', ''),

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

// Initialize button group with preview update
function initButtonGroupWithPreview(selector, hiddenInputId, dataAttr) {
    const buttons = document.querySelectorAll(selector);
    const hiddenInput = document.getElementById(hiddenInputId);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (hiddenInput) {
                hiddenInput.value = btn.dataset[dataAttr];
            }
            updatePreview();
        });
    });
}

// Initialize slider with preview update
function initSliderWithPreview(sliderId, valueId, suffix = 'px') {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);

    if (slider && valueDisplay) {
        slider.addEventListener('input', () => {
            valueDisplay.textContent = slider.value + suffix;
            updatePreview();
        });
    }
}

// Initialize toggle with preview update
function initToggleWithPreview(toggleId) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
        toggle.addEventListener('change', () => {
            updatePreview();
        });
    }
}

// Initialize color picker with preview update
function initColorWithPreview(colorId) {
    const color = document.getElementById(colorId);
    if (color) {
        color.addEventListener('input', () => {
            updatePreview();
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

    // Initialize button groups with preview update
    initButtonGroupWithPreview('.position-btn', 'setting-position', 'position');
    initButtonGroupWithPreview('.style-btn[data-style]', 'setting-animation', 'style');
    initButtonGroupWithPreview('.style-btn[data-idle-style]', 'setting-idle-animation', 'idleStyle');
    initButtonGroupWithPreview('.style-btn[data-transition]', 'setting-transition', 'transition');
    initButtonGroupWithPreview('.style-btn[data-entry]', 'setting-entry-animation', 'entry');
    initButtonGroupWithPreview('.style-btn[data-border-style]', 'setting-border-style', 'borderStyle');
    initButtonGroupWithPreview('.shape-btn', 'setting-shape', 'shape');

    // Initialize sliders with preview update
    initSliderWithPreview('setting-size', 'size-value');
    initSliderWithPreview('setting-border-width', 'border-width-value');
    initSliderWithPreview('setting-name-size', 'name-size-value');
    initSliderWithPreview('setting-spacing', 'spacing-value');
    initSliderWithPreview('setting-speaking-ring-width', 'speaking-ring-width-value');
    initSliderWithPreview('setting-shadow-blur', 'shadow-blur-value');
    initSliderWithPreview('setting-transition-duration', 'transition-duration-value', 'ms');
    initSliderWithPreview('setting-idle-opacity', 'idle-opacity-value', '%');
    initSliderWithPreview('setting-max-participants', 'max-participants-value', '');
    initSliderWithPreview('setting-animation-speed', 'animation-speed-value', '%');
    initSliderWithPreview('setting-entry-duration', 'entry-duration-value', 'ms');
    initSliderWithPreview('setting-filter-brightness', 'filter-brightness-value', '%');
    initSliderWithPreview('setting-filter-contrast', 'filter-contrast-value', '%');
    initSliderWithPreview('setting-filter-saturate', 'filter-saturate-value', '%');
    initSliderWithPreview('setting-filter-hue', 'filter-hue-value', '°');

    // Initialize toggle options (show/hide sub-options)
    initToggleOptions('setting-border', 'border-options');
    initToggleOptions('setting-glow', 'glow-options');
    initToggleOptions('setting-shadow', 'shadow-options');
    initToggleOptions('setting-speaking-ring', 'speaking-ring-options');
    initToggleOptions('setting-name-bg', 'name-bg-options');
    initToggleOptions('setting-name-shadow', 'name-shadow-options');
    initToggleOptions('setting-name-glow', 'name-glow-options');

    // Initialize toggles with preview update
    initToggleWithPreview('setting-bounce');
    initToggleWithPreview('setting-dim');
    initToggleWithPreview('setting-name');
    initToggleWithPreview('setting-grayscale-muted');
    initToggleWithPreview('setting-grayscale-deafened');
    initToggleWithPreview('setting-border');
    initToggleWithPreview('setting-glow');
    initToggleWithPreview('setting-shadow');
    initToggleWithPreview('setting-speaking-ring');
    initToggleWithPreview('setting-name-bg');
    initToggleWithPreview('setting-flip');
    initToggleWithPreview('setting-hide-self');
    initToggleWithPreview('setting-name-shadow');
    initToggleWithPreview('setting-name-glow');

    // Initialize color pickers with preview update
    initColorWithPreview('setting-border-color');
    initColorWithPreview('setting-glow-color');
    initColorWithPreview('setting-name-color');
    initColorWithPreview('setting-speaking-ring-color');
    initColorWithPreview('setting-shadow-color');
    initColorWithPreview('setting-name-bg-color');
    initColorWithPreview('setting-name-shadow-color');
    initColorWithPreview('setting-name-glow-color');

    // === NEW FEATURE INITIALIZATIONS ===

    // New button groups
    initButtonGroupWithPreview('.style-btn[data-particle]', 'setting-particle-type', 'particle');
    initButtonGroupWithPreview('.style-btn[data-anim-border]', 'setting-animated-border-type', 'animBorder');
    initButtonGroupWithPreview('.style-btn[data-bg-effect]', 'setting-bg-effect-type', 'bgEffect');
    initButtonGroupWithPreview('.style-btn[data-accessory]', 'setting-accessory', 'accessory');
    initButtonGroupWithPreview('.style-btn[data-frame]', 'setting-frame', 'frame');
    initButtonGroupWithPreview('.style-btn[data-voice-indicator]', 'setting-voice-indicator-type', 'voiceIndicator');
    initButtonGroupWithPreview('.style-btn[data-font]', 'setting-name-font', 'font');
    initButtonGroupWithPreview('.style-btn[data-name-pos]', 'setting-name-position', 'namePos');
    initButtonGroupWithPreview('.style-btn[data-name-anim]', 'setting-name-animation', 'nameAnim');
    initButtonGroupWithPreview('.style-btn[data-layout]', 'setting-group-layout', 'layout');
    initButtonGroupWithPreview('.style-btn[data-highlight]', 'setting-speaking-highlight', 'highlight');
    initButtonGroupWithPreview('.style-btn[data-sort]', 'setting-sort-order', 'sort');

    // New toggle options (show/hide sub-options)
    initToggleOptions('setting-particles', 'particles-options');
    initToggleOptions('setting-animated-border', 'animated-border-options');
    initToggleOptions('setting-bg-effect', 'bg-effect-options');
    initToggleOptions('setting-outline', 'outline-options');
    initToggleOptions('setting-mirror', 'mirror-options');
    initToggleOptions('setting-tilt', 'tilt-options');
    initToggleOptions('setting-voice-indicator', 'voice-indicator-options');
    initToggleOptions('setting-status-text-enabled', 'status-text-options');

    // New toggles with preview update
    initToggleWithPreview('setting-particles');
    initToggleWithPreview('setting-animated-border');
    initToggleWithPreview('setting-bg-effect');
    initToggleWithPreview('setting-outline');
    initToggleWithPreview('setting-mirror');
    initToggleWithPreview('setting-tilt');
    initToggleWithPreview('setting-voice-indicator');
    initToggleWithPreview('setting-status-text-enabled');

    // New sliders with preview update
    initSliderWithPreview('setting-particle-count', 'particle-count-value', '');
    initSliderWithPreview('setting-animated-border-speed', 'animated-border-speed-value', '');
    initSliderWithPreview('setting-bg-effect-size', 'bg-effect-size-value', 'px');
    initSliderWithPreview('setting-outline-width', 'outline-width-value', 'px');
    initSliderWithPreview('setting-outline-offset', 'outline-offset-value', 'px');
    initSliderWithPreview('setting-mirror-opacity', 'mirror-opacity-value', '%');
    initSliderWithPreview('setting-tilt-amount', 'tilt-amount-value', '°');

    // New color pickers with preview update
    initColorWithPreview('setting-particle-color');
    // Note: animated border uses rainbow or gradient, no single color option
    initColorWithPreview('setting-bg-effect-color');
    initColorWithPreview('setting-outline-color');
    initColorWithPreview('setting-frame-color');
    initColorWithPreview('setting-voice-indicator-color');
    initColorWithPreview('setting-status-text-color');

    // Status text input
    const statusTextInput = document.getElementById('setting-status-text');
    if (statusTextInput) {
        statusTextInput.addEventListener('input', updatePreview);
    }

    // Custom CSS textarea
    const customCssInput = document.getElementById('setting-custom-css');
    if (customCssInput) {
        customCssInput.addEventListener('input', updatePreview);
    }

    // Initial preview update
    updatePreview();
});

// Download standalone overlay HTML file
async function downloadOverlay(mode = 'individual') {
    showToast('Generating overlay file...', 'info');

    try {
        // Fetch the overlay JavaScript
        const overlayJsResponse = await fetch('/static/js/cubreactive-overlay.js');
        const overlayJs = await overlayJsResponse.text();

        // Fetch the overlay CSS
        const overlayCssResponse = await fetch('/static/css/cubreactive-overlay.css');
        const overlayCss = await overlayCssResponse.text();

        // Get current config
        const config = USER_CONFIG || {};
        const settings = config.settings || {};
        const images = config.images || {};

        // Convert image URLs to absolute URLs
        const baseUrl = window.location.origin;
        const absoluteImages = {};
        for (const [key, value] of Object.entries(images)) {
            if (value) {
                absoluteImages[key] = value.startsWith('http') ? value : baseUrl + value;
            }
        }

        // Generate the standalone HTML
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CubReactive Overlay</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: transparent;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        ${overlayCss}
    </style>
</head>
<body>
    <div id="status-overlay" class="status-overlay"></div>
    <div id="overlay-container" class="overlay-container"></div>

    <script>
        // Configuration
        const MODE = '${mode}';
        const TARGET_USER_ID = '${USER_ID}';
        const API_BASE = '${baseUrl}';
        const DISCORD_CLIENT_ID = '794365445557846066';
        const USER_CONFIG = ${JSON.stringify({
            images: absoluteImages,
            settings: settings
        })};

        ${overlayJs}
    </script>
</body>
</html>`;

        // Create and download the file
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cubreactive-${mode}-${USER_ID}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Overlay downloaded! Add it as a local file in OBS.', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to generate overlay: ' + error.message, 'error');
    }
}

// Export settings to JSON file
function exportSettings() {
    const config = USER_CONFIG || {};
    const exportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        settings: config.settings || {},
        // Don't export images (they're user-specific)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cubreactive-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Settings exported successfully!', 'success');
}

// Import settings from JSON file
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.settings) {
                showToast('Invalid settings file', 'error');
                return;
            }

            // Apply imported settings to the form
            applySettingsToForm(data.settings);
            showToast('Settings imported! Click Save to apply.', 'success');
            updatePreview();
        } catch (error) {
            console.error('Import error:', error);
            showToast('Failed to import settings: ' + error.message, 'error');
        }
    };

    input.click();
}

// Apply settings object to form elements
function applySettingsToForm(settings) {
    // Helper to set slider value
    const setSlider = (id, value, valueId, suffix = 'px') => {
        const slider = document.getElementById(id);
        const display = document.getElementById(valueId);
        if (slider && value !== undefined) {
            slider.value = value;
            if (display) display.textContent = value + suffix;
        }
    };

    // Helper to set checkbox
    const setCheckbox = (id, value) => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.checked = !!value;
    };

    // Helper to set color
    const setColor = (id, value) => {
        const input = document.getElementById(id);
        if (input && value) input.value = value;
    };

    // Helper to set button group
    const setButtonGroup = (selector, value, dataAttr) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset[dataAttr] === value) {
                btn.classList.add('active');
            }
        });
    };

    // Apply sliders
    setSlider('setting-size', settings.size, 'size-value');
    setSlider('setting-border-width', settings.borderWidth, 'border-width-value');
    setSlider('setting-name-size', settings.nameSize, 'name-size-value');
    setSlider('setting-spacing', settings.spacing, 'spacing-value');
    setSlider('setting-speaking-ring-width', settings.speakingRingWidth, 'speaking-ring-width-value');
    setSlider('setting-shadow-blur', settings.shadowBlur, 'shadow-blur-value');
    setSlider('setting-transition-duration', settings.transitionDuration, 'transition-duration-value', 'ms');
    setSlider('setting-idle-opacity', settings.idleOpacity, 'idle-opacity-value', '%');
    setSlider('setting-animation-speed', settings.animationSpeed, 'animation-speed-value', '%');
    setSlider('setting-entry-duration', settings.entryDuration, 'entry-duration-value', 'ms');
    setSlider('setting-filter-brightness', settings.filterBrightness, 'filter-brightness-value', '%');
    setSlider('setting-filter-contrast', settings.filterContrast, 'filter-contrast-value', '%');
    setSlider('setting-filter-saturate', settings.filterSaturate, 'filter-saturate-value', '%');
    setSlider('setting-filter-hue', settings.filterHue, 'filter-hue-value', '°');
    setSlider('setting-particle-count', settings.particle_count, 'particle-count-value', '');
    setSlider('setting-animated-border-speed', settings.animated_border_speed, 'animated-border-speed-value', '');
    setSlider('setting-bg-effect-size', settings.bg_effect_size, 'bg-effect-size-value', '%');
    setSlider('setting-outline-width', settings.outline_width, 'outline-width-value', 'px');
    setSlider('setting-outline-offset', settings.outline_offset, 'outline-offset-value', 'px');
    setSlider('setting-mirror-opacity', settings.mirror_opacity, 'mirror-opacity-value', '%');
    setSlider('setting-tilt-amount', settings.tilt_amount, 'tilt-amount-value', '°');

    // Apply checkboxes
    setCheckbox('setting-bounce', settings.bounce);
    setCheckbox('setting-dim', settings.dimWhenIdle);
    setCheckbox('setting-name', settings.showName);
    setCheckbox('setting-grayscale-muted', settings.grayscaleMuted);
    setCheckbox('setting-grayscale-deafened', settings.grayscaleDeafened);
    setCheckbox('setting-border', settings.border);
    setCheckbox('setting-glow', settings.glow);
    setCheckbox('setting-shadow', settings.shadow);
    setCheckbox('setting-speaking-ring', settings.speakingRing);
    setCheckbox('setting-name-bg', settings.nameBg);
    setCheckbox('setting-flip', settings.flip);
    setCheckbox('setting-hide-self', settings.hideSelf);
    setCheckbox('setting-name-shadow', settings.nameShadow);
    setCheckbox('setting-name-glow', settings.nameGlow);
    setCheckbox('setting-particles', settings.particles_enabled);
    setCheckbox('setting-animated-border', settings.animated_border_enabled);
    setCheckbox('setting-bg-effect', settings.bg_effect_enabled);
    setCheckbox('setting-outline', settings.outline_enabled);
    setCheckbox('setting-mirror', settings.mirror_enabled);
    setCheckbox('setting-tilt', settings.tilt_enabled);
    setCheckbox('setting-voice-indicator', settings.voice_indicator_enabled);
    setCheckbox('setting-status-text-enabled', settings.status_text_enabled);

    // Apply colors
    setColor('setting-border-color', settings.borderColor);
    setColor('setting-glow-color', settings.glowColor);
    setColor('setting-name-color', settings.nameColor);
    setColor('setting-speaking-ring-color', settings.speakingRingColor);
    setColor('setting-shadow-color', settings.shadowColor);
    setColor('setting-name-bg-color', settings.nameBgColor);
    setColor('setting-name-shadow-color', settings.nameShadowColor);
    setColor('setting-name-glow-color', settings.nameGlowColor);
    setColor('setting-particle-color', settings.particle_color);
    // Note: animated border has no color input (uses rainbow/gradient)
    setColor('setting-bg-effect-color', settings.bg_effect_color);
    setColor('setting-outline-color', settings.outline_color);
    setColor('setting-frame-color', settings.frame_color);
    setColor('setting-voice-indicator-color', settings.voice_indicator_color);
    setColor('setting-status-text-color', settings.status_text_color);

    // Apply button groups
    setButtonGroup('.position-btn', settings.position, 'position');
    setButtonGroup('.style-btn[data-style]', settings.animation, 'style');
    setButtonGroup('.style-btn[data-idle-style]', settings.idleAnimation, 'idleStyle');
    setButtonGroup('.style-btn[data-transition]', settings.transition, 'transition');
    setButtonGroup('.style-btn[data-entry]', settings.entryAnimation, 'entry');
    setButtonGroup('.style-btn[data-border-style]', settings.borderStyle, 'borderStyle');
    setButtonGroup('.shape-btn', settings.shape, 'shape');
    setButtonGroup('.style-btn[data-particle]', settings.particle_type, 'particle');
    setButtonGroup('.style-btn[data-anim-border]', settings.animated_border_type, 'animBorder');
    setButtonGroup('.style-btn[data-bg-effect]', settings.bg_effect_type, 'bgEffect');
    setButtonGroup('.style-btn[data-accessory]', settings.accessory, 'accessory');
    setButtonGroup('.style-btn[data-frame]', settings.frame, 'frame');
    setButtonGroup('.style-btn[data-voice-indicator]', settings.voice_indicator_type, 'voiceIndicator');
    setButtonGroup('.style-btn[data-font]', settings.name_font, 'font');
    setButtonGroup('.style-btn[data-name-pos]', settings.name_position, 'namePos');
    setButtonGroup('.style-btn[data-name-anim]', settings.name_animation, 'nameAnim');
    setButtonGroup('.style-btn[data-layout]', settings.group_layout, 'layout');
    setButtonGroup('.style-btn[data-highlight]', settings.speaking_highlight, 'highlight');
    setButtonGroup('.style-btn[data-sort]', settings.sort_order, 'sort');

    // Apply text inputs
    const statusTextInput = document.getElementById('setting-status-text');
    if (statusTextInput && settings.status_text) {
        statusTextInput.value = settings.status_text;
    }

    const customCssInput = document.getElementById('setting-custom-css');
    if (customCssInput && settings.custom_css) {
        customCssInput.value = settings.custom_css;
    }

    // Update toggle options visibility
    ['border', 'glow', 'shadow', 'speaking-ring', 'name-bg', 'name-shadow', 'name-glow',
     'particles', 'animated-border', 'bg-effect', 'outline', 'mirror', 'tilt', 'voice-indicator', 'status-text-enabled'].forEach(opt => {
        const toggle = document.getElementById(`setting-${opt}`);
        const options = document.getElementById(`${opt}-options`);
        if (toggle && options) {
            options.style.display = toggle.checked ? 'block' : 'none';
        }
    });
}

// Generate a share code (base64 encoded settings)
function generateShareCode() {
    const config = USER_CONFIG || {};
    const settings = config.settings || {};

    // Create a compact version of settings
    const compactSettings = JSON.stringify(settings);
    const shareCode = btoa(compactSettings);

    // Copy to clipboard
    navigator.clipboard.writeText(shareCode).then(() => {
        showToast('Share code copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback: show in prompt
        prompt('Copy this share code:', shareCode);
    });
}

// Copy the share code to clipboard
function copyShareCode() {
    generateShareCode();
}

// Apply a share code
function applyShareCode() {
    const shareCodeInput = document.getElementById('share-code-input');
    const shareCode = shareCodeInput ? shareCodeInput.value.trim() : prompt('Paste share code:');

    if (!shareCode) {
        showToast('No share code provided', 'error');
        return;
    }

    try {
        const decoded = atob(shareCode);
        const settings = JSON.parse(decoded);

        applySettingsToForm(settings);
        showToast('Settings applied from share code! Click Save to keep.', 'success');
        updatePreview();
    } catch (error) {
        console.error('Share code error:', error);
        showToast('Invalid share code', 'error');
    }
}
