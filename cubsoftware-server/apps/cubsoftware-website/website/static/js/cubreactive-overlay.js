// CubReactive Overlay - Bot WebSocket Connection & Rendering

class CubReactiveOverlay {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.disabled = false;
        this.participants = new Map();
        this.userConfigs = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 2000;

        // Store initial config if provided
        if (TARGET_USER_ID && USER_CONFIG && Object.keys(USER_CONFIG).length > 0) {
            USER_CONFIG.hasCubReactive = true;
            this.userConfigs.set(TARGET_USER_ID, USER_CONFIG);
        }
    }

    async init() {
        this.showStatus('Connecting to CubReactive...', 'connecting');
        await this.connect();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Connect to our bot's WebSocket server
            const wsUrl = WS_URL || `wss://${window.location.hostname}:3848`;
            console.log('Connecting to CubReactive WebSocket:', wsUrl);

            try {
                this.ws = new WebSocket(wsUrl);
            } catch (e) {
                console.error('WebSocket creation failed:', e);
                this.handleReconnect();
                return;
            }

            const timeout = setTimeout(() => {
                if (this.ws.readyState !== WebSocket.OPEN) {
                    this.ws.close();
                    this.handleReconnect();
                }
            }, 10000);

            this.ws.onopen = () => {
                clearTimeout(timeout);
                console.log('WebSocket connected, subscribing...');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.showStatus('');

                // Start keepalive ping (Cloudflare drops idle WS after ~100s)
                this.startPing();

                // Subscribe to voice updates for our target user
                this.send({
                    type: 'SUBSCRIBE',
                    userId: TARGET_USER_ID,
                    mode: MODE
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Message parse error:', e);
                }
            };

            this.ws.onerror = (error) => {
                clearTimeout(timeout);
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = (event) => {
                clearTimeout(timeout);
                this.stopPing();
                console.log('WebSocket closed, code:', event.code);
                this.connected = false;
                if (!this.disabled) {
                    this.handleReconnect();
                }
            };
        });
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
            this.showStatus('Reconnecting...', 'connecting');
            setTimeout(() => this.connect(), delay);
        } else {
            this.showStatus('Connection failed. Please refresh the page.', 'error');
        }
    }

    handleMessage(data) {
        console.log('Received:', data.type, data);

        switch (data.type) {
            case 'READY':
                console.log('Server ready');
                break;

            case 'VOICE_STATE_UPDATE':
                this.handleVoiceStateUpdate(data.userId, data.data);
                break;

            case 'CHANNEL_UPDATE':
                this.handleChannelUpdate(data.channelId, data.members);
                break;

            case 'NOT_IN_VOICE':
                this.showStatus('Join a voice channel to see your avatar', 'info');
                this.participants.clear();
                this.render();
                break;

            case 'CONFIG_UPDATED':
                console.log('Config updated, refreshing...');
                const refreshId = data.userId || TARGET_USER_ID;
                if (refreshId) {
                    this.fetchUserConfig(refreshId).then(() => this.render());
                }
                break;

            case 'DISABLED':
                this.disabled = true;
                this.showStatus('CubReactive is disabled for this user', 'error');
                this.participants.clear();
                this.render();
                break;

            case 'PONG':
                // Heartbeat response
                break;
        }
    }

    async handleVoiceStateUpdate(userId, state) {
        if (state.left) {
            // User left voice
            this.participants.delete(userId);

            if (userId === TARGET_USER_ID) {
                this.showStatus('Join a voice channel to see your avatar', 'info');
            }
        } else {
            // Update participant state
            const participant = {
                id: userId,
                username: state.username || 'Unknown',
                avatar: state.avatar || '',
                speaking: state.speaking || false,
                muted: state.muted || false,
                deafened: state.deafened || false,
                channelId: state.channelId
            };

            this.participants.set(userId, participant);

            // Fetch user config if we don't have it
            if (!this.userConfigs.has(userId)) {
                await this.fetchUserConfig(userId);
            }

            this.showStatus('');
        }

        this.render();
    }

    handleChannelUpdate(channelId, members) {
        console.log('Channel update:', channelId, members);

        // Clear participants not in this channel
        this.participants.forEach((participant, oduserId) => {
            if (!members.find(m => m.userId === oduserId)) {
                this.participants.delete(oduserId);
            }
        });

        // Update all members
        members.forEach(async (member) => {
            const participant = {
                id: member.userId,
                username: member.username || 'Unknown',
                avatar: member.avatar || '',
                speaking: member.speaking || false,
                muted: member.muted || false,
                deafened: member.deafened || false,
                channelId: channelId
            };

            this.participants.set(member.userId, participant);

            // Fetch user config if we don't have it
            if (!this.userConfigs.has(member.userId)) {
                await this.fetchUserConfig(member.userId);
            }
        });

        this.showStatus('');
        this.render();
    }

    async fetchUserConfig(userId) {
        try {
            const response = await fetch(`${API_BASE}/api/cubreactive/user/${userId}`);
            if (response.ok) {
                const config = await response.json();
                config.hasCubReactive = true;
                this.userConfigs.set(userId, config);
                console.log(`Loaded CubReactive config for user ${userId}`);
            } else {
                this.userConfigs.set(userId, {
                    hasCubReactive: false,
                    images: {},
                    settings: this.getDefaultSettings()
                });
                console.log(`User ${userId} doesn't have CubReactive - using Discord avatar`);
            }
        } catch (error) {
            console.log(`Error fetching config for user ${userId}:`, error);
            this.userConfigs.set(userId, {
                hasCubReactive: false,
                images: {},
                settings: this.getDefaultSettings()
            });
        }
    }

    getDefaultSettings() {
        return {
            bounce_on_speak: true,
            dim_when_idle: false,
            show_name: true,
            grayscale_muted: true,
            grayscale_deafened: true,
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
            show_status_icons: true,
            idle_opacity: 100,
            flip_horizontal: false
        };
    }

    getStateImage(participant) {
        const config = this.userConfigs.get(participant.id);
        const images = config?.images || {};

        if (config?.hasCubReactive) {
            if (participant.deafened && images.deafened) {
                return images.deafened;
            }
            if (participant.muted && images.muted) {
                return images.muted;
            }
            if (participant.speaking && images.speaking) {
                return images.speaking;
            }
            if (images.idle) {
                return images.idle;
            }
            if (config.avatar_url) {
                return config.avatar_url;
            }
        }

        return participant.avatar;
    }

    getShapeBorderRadius(shape) {
        switch (shape) {
            case 'circle': return '50%';
            case 'square': return '0';
            case 'hexagon': return '0';
            case 'rounded':
            default: return '12px';
        }
    }

    getAnimationClass(style) {
        switch (style) {
            case 'bounce': return 'anim-bounce';
            case 'pulse': return 'anim-pulse';
            case 'glow': return 'anim-glow';
            case 'shake': return 'anim-shake';
            case 'wave': return 'anim-wave';
            case 'none':
            default: return '';
        }
    }

    render() {
        const container = document.getElementById('overlay-container');

        // Remove avatars for participants that left
        container.querySelectorAll('.avatar-wrapper').forEach(el => {
            if (!this.participants.has(el.dataset.userId)) {
                el.remove();
            }
        });

        let participantsToRender = Array.from(this.participants.values());

        // Get settings from first participant or target user
        let mainConfig = null;
        if (MODE === 'individual' && TARGET_USER_ID) {
            participantsToRender = participantsToRender.filter(p => p.id === TARGET_USER_ID);
            mainConfig = this.userConfigs.get(TARGET_USER_ID);
        } else if (participantsToRender.length > 0) {
            mainConfig = this.userConfigs.get(participantsToRender[0].id);
        }

        const mainSettings = mainConfig?.settings || this.getDefaultSettings();

        // Apply hide self
        if (mainSettings.hide_self && TARGET_USER_ID) {
            participantsToRender = participantsToRender.filter(p => p.id !== TARGET_USER_ID);
        }

        // Apply max participants
        if (mainSettings.max_participants > 0) {
            participantsToRender = participantsToRender.slice(0, mainSettings.max_participants);
        }

        // Determine position
        let position = 'center';
        if (MODE === 'individual') {
            position = 'center';
        } else {
            position = mainSettings.overlay_position || 'bottom';
        }

        // Update container
        container.className = `overlay-container position-${position}`;
        container.style.gap = `${mainSettings.spacing || 20}px`;

        // Apply overlay background
        const overlayBg = mainSettings.overlay_background || 'transparent';
        document.body.style.background = overlayBg;

        // Apply transition duration CSS variable
        const transitionDuration = mainSettings.transition_duration || 200;
        container.style.setProperty('--transition-duration', `${transitionDuration}ms`);

        participantsToRender.forEach(participant => {
            const config = this.userConfigs.get(participant.id);
            const settings = config?.settings || this.getDefaultSettings();
            const imageUrl = this.getStateImage(participant);

            // Get all settings with defaults
            const avatarSize = settings.avatar_size || 180;
            const avatarShape = settings.avatar_shape || 'rounded';
            const borderEnabled = settings.border_enabled || false;
            const borderColor = settings.border_color || '#5865f2';
            const borderWidth = settings.border_width || 3;
            const glowEnabled = settings.glow_enabled || false;
            const glowColor = settings.glow_color || '#5865f2';
            const speakingRingEnabled = settings.speaking_ring_enabled !== false;
            const speakingRingColor = settings.speaking_ring_color || '#57f287';
            const speakingRingWidth = settings.speaking_ring_width || 4;
            const shadowEnabled = settings.shadow_enabled || false;
            const shadowColor = settings.shadow_color || '#000000';
            const shadowBlur = settings.shadow_blur || 10;
            const nameColor = settings.name_color || '#ffffff';
            const nameSize = settings.name_size || 14;
            const nameBgEnabled = settings.name_background_enabled || false;
            const nameBgColor = settings.name_background_color || 'rgba(0,0,0,0.5)';
            const animationStyle = settings.animation_style || 'bounce';
            const grayscaleMuted = settings.grayscale_muted !== false;
            const grayscaleDeafened = settings.grayscale_deafened !== false;
            const dimWhenIdle = settings.dim_when_idle || false;
            const showName = settings.show_name !== false;
            const bounceOnSpeak = settings.bounce_on_speak !== false;
            const showStatusIcons = settings.show_status_icons !== false;
            const idleOpacity = settings.idle_opacity || 100;
            const flipHorizontal = settings.flip_horizontal || false;

            // Check if element already exists for this participant
            let wrapper = container.querySelector(`[data-user-id="${participant.id}"]`);
            let isNew = false;

            if (!wrapper) {
                isNew = true;
                wrapper = document.createElement('div');
                wrapper.className = 'avatar-wrapper';
                wrapper.dataset.userId = participant.id;
                wrapper.style.transition = `all ${transitionDuration}ms ease`;

                // Avatar container
                const avatar = document.createElement('div');
                avatar.className = 'avatar';
                avatar.style.position = 'relative';
                avatar.style.overflow = 'visible';

                // Image wrapper (for clipping)
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'img-wrapper';
                imgWrapper.style.width = '100%';
                imgWrapper.style.height = '100%';
                imgWrapper.style.overflow = 'hidden';

                // Image
                const img = document.createElement('img');
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.transition = `all ${transitionDuration}ms ease`;
                img.onerror = () => { img.src = participant.avatar; };

                imgWrapper.appendChild(img);
                avatar.appendChild(imgWrapper);

                // Status icon placeholder
                const statusIcon = document.createElement('div');
                statusIcon.className = 'status-icon';
                statusIcon.style.display = 'none';
                avatar.appendChild(statusIcon);

                wrapper.appendChild(avatar);

                // Username element
                const username = document.createElement('div');
                username.className = 'username';
                wrapper.appendChild(username);
            }

            // Update existing elements
            const avatar = wrapper.querySelector('.avatar');
            const img = wrapper.querySelector('img');
            const statusIcon = wrapper.querySelector('.status-icon');
            const username = wrapper.querySelector('.username');

            // Update wrapper animation class
            wrapper.className = 'avatar-wrapper';
            wrapper.dataset.userId = participant.id;
            if (participant.speaking && bounceOnSpeak) {
                const animClass = this.getAnimationClass(animationStyle);
                if (animClass) wrapper.classList.add(animClass);
            }

            // Update avatar styling
            avatar.style.width = `${avatarSize}px`;
            avatar.style.height = `${avatarSize}px`;
            avatar.style.borderRadius = this.getShapeBorderRadius(avatarShape);
            avatar.style.transition = `all ${transitionDuration}ms ease`;
            avatar.style.clipPath = avatarShape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : '';
            avatar.style.border = borderEnabled ? `${borderWidth}px solid ${borderColor}` : '';

            // Box shadow (speaking ring + glow)
            let boxShadows = [];
            if (speakingRingEnabled && participant.speaking) {
                boxShadows.push(`0 0 0 ${speakingRingWidth}px ${speakingRingColor}`);
            }
            if (glowEnabled && participant.speaking) {
                boxShadows.push(`0 0 20px ${glowColor}`, `0 0 40px ${glowColor}`);
            }
            avatar.style.boxShadow = boxShadows.join(', ');

            // Drop shadow
            avatar.style.filter = shadowEnabled ? `drop-shadow(0 4px ${shadowBlur}px ${shadowColor})` : '';

            // Image wrapper shape
            const imgWrapper = wrapper.querySelector('.img-wrapper');
            imgWrapper.style.borderRadius = this.getShapeBorderRadius(avatarShape);
            imgWrapper.style.clipPath = avatarShape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : '';

            // Update image src only if changed (prevents reload flicker)
            if (img.src !== new URL(imageUrl, window.location.origin).href) {
                img.src = imageUrl;
            }
            img.alt = participant.username;
            img.style.transform = flipHorizontal ? 'scaleX(-1)' : '';

            // Apply filters based on state
            let filters = [];
            let opacity = 1;
            if (participant.deafened && grayscaleDeafened) {
                filters.push('grayscale(80%)', 'brightness(0.7)');
            } else if (participant.muted && grayscaleMuted) {
                filters.push('grayscale(50%)');
            } else if (!participant.speaking) {
                opacity = idleOpacity / 100;
            }
            img.style.filter = filters.join(' ');
            wrapper.style.opacity = opacity;

            // Status icons
            if (showStatusIcons && (participant.muted || participant.deafened)) {
                statusIcon.style.display = 'flex';
                statusIcon.innerHTML = participant.deafened ? this.getDeafenedIcon() : this.getMutedIcon();
            } else {
                statusIcon.style.display = 'none';
            }

            // Username
            if (showName) {
                username.style.display = '';
                username.textContent = participant.username;
                username.style.color = nameColor;
                username.style.fontSize = `${nameSize}px`;
                username.style.background = nameBgEnabled ? nameBgColor : '';
                username.style.padding = nameBgEnabled ? '4px 8px' : '';
                username.style.borderRadius = nameBgEnabled ? '4px' : '';
            } else {
                username.style.display = 'none';
            }

            if (isNew) {
                container.appendChild(wrapper);
            }
        });

        this.ensureAnimationStyles();
    }

    getMutedIcon() {
        return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C10.9 2 10 2.9 10 4V10C10 11.1 10.9 12 12 12C13.1 12 14 11.1 14 10V4C14 2.9 13.1 2 12 2Z"/>
            <path d="M19 10V11C19 14.3 16.3 17 13 17H11C7.7 17 5 14.3 5 11V10H3V11C3 15.2 6.1 18.6 10 19.4V22H14V19.4C17.9 18.6 21 15.2 21 11V10H19Z"/>
            <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2"/>
        </svg>`;
    }

    getDeafenedIcon() {
        return `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C8.13 2 5 5.13 5 9V15C5 16.1 5.9 17 7 17H9V11H7V9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9V11H15V17H17C18.1 17 19 16.1 19 15V9C19 5.13 15.87 2 12 2Z"/>
            <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2"/>
        </svg>`;
    }

    ensureAnimationStyles() {
        if (document.getElementById('cubreactive-animations')) return;

        const style = document.createElement('style');
        style.id = 'cubreactive-animations';
        style.textContent = `
            .status-icon {
                position: absolute;
                bottom: -5px;
                right: -5px;
                background: #ed4245;
                border-radius: 50%;
                padding: 4px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .anim-bounce {
                animation: cr-bounce 0.5s ease infinite;
            }
            .anim-pulse {
                animation: cr-pulse 1s ease infinite;
            }
            .anim-glow .avatar {
                animation: cr-glow 1s ease infinite;
            }
            .anim-shake {
                animation: cr-shake 0.5s ease infinite;
            }
            .anim-wave {
                animation: cr-wave 1s ease infinite;
            }

            @keyframes cr-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            @keyframes cr-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            @keyframes cr-glow {
                0%, 100% { box-shadow: 0 0 20px var(--glow-color, #5865f2); }
                50% { box-shadow: 0 0 40px var(--glow-color, #5865f2), 0 0 60px var(--glow-color, #5865f2); }
            }

            @keyframes cr-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-3px); }
                75% { transform: translateX(3px); }
            }

            @keyframes cr-wave {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-3deg); }
                75% { transform: rotate(3deg); }
            }
        `;
        document.head.appendChild(style);
    }

    startPing() {
        this.stopPing();
        this.pingInterval = setInterval(() => {
            this.send({ type: 'PING' });
        }, 30000);
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    send(payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }

    showStatus(message, type = '') {
        const overlay = document.getElementById('status-overlay');
        overlay.textContent = message;
        overlay.className = 'status-overlay ' + type;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const overlay = new CubReactiveOverlay();
    overlay.init();
});
