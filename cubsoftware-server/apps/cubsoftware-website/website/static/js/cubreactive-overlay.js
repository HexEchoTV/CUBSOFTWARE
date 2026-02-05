// CubReactive Overlay - Discord RPC Connection & Rendering

class CubReactiveOverlay {
    constructor() {
        this.ws = null;
        this.authenticated = false;
        this.currentChannel = null;
        this.participants = new Map();
        this.userConfigs = new Map();
        this.accessToken = null;
        this.minPort = 6463;
        this.maxPort = 6472;
        this.currentUserId = null; // The user viewing the overlay

        // Store initial config if provided
        if (TARGET_USER_ID && USER_CONFIG && Object.keys(USER_CONFIG).length > 0) {
            this.userConfigs.set(TARGET_USER_ID, USER_CONFIG);
        }
    }

    async init() {
        this.showStatus('Connecting to Discord...', 'connecting');

        try {
            await this.connect();
        } catch (error) {
            this.showStatus('Could not connect to Discord. Make sure Discord is running.', 'error');
            console.error('Connection failed:', error);

            // Retry after 5 seconds
            setTimeout(() => this.init(), 5000);
        }
    }

    async connect() {
        for (let port = this.minPort; port <= this.maxPort; port++) {
            try {
                await this.tryConnect(port);
                console.log(`Connected to Discord on port ${port}`);
                return;
            } catch (error) {
                console.log(`Port ${port} failed, trying next...`);
            }
        }
        throw new Error('Could not connect to any Discord RPC port');
    }

    tryConnect(port) {
        return new Promise((resolve, reject) => {
            const url = `ws://127.0.0.1:${port}/?v=1&client_id=${DISCORD_CLIENT_ID}&encoding=json`;

            this.ws = new WebSocket(url);

            const timeout = setTimeout(() => {
                this.ws.close();
                reject(new Error('Connection timeout'));
            }, 3000);

            this.ws.onopen = () => {
                clearTimeout(timeout);
                console.log('WebSocket connected, client_id:', DISCORD_CLIENT_ID);
            };

            this.ws.onmessage = (event) => {
                console.log('Raw message:', event.data.substring(0, 200));
                const data = JSON.parse(event.data);
                this.handleMessage(data, resolve, reject);
            };

            this.ws.onerror = (error) => {
                clearTimeout(timeout);
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket closed, code:', event.code, 'reason:', event.reason);
                this.authenticated = false;
                if (this.currentChannel) {
                    setTimeout(() => this.init(), 3000);
                }
            };
        });
    }

    handleMessage(data, resolveConnect, rejectConnect) {
        console.log('Received:', data.cmd, data.evt);

        switch (data.cmd) {
            case 'DISPATCH':
                this.handleDispatch(data);
                break;

            case 'AUTHORIZE':
                this.handleAuthorize(data);
                break;

            case 'AUTHENTICATE':
                if (data.evt === 'ERROR') {
                    console.error('Auth error:', data.data);
                    this.showStatus('Authentication failed', 'error');
                } else {
                    this.authenticated = true;
                    this.currentUserId = data.data?.user?.id;
                    this.showStatus('');
                    console.log('Authenticated successfully, user:', this.currentUserId);
                    this.subscribeToVoice();
                    if (resolveConnect) resolveConnect();
                }
                break;

            case 'SUBSCRIBE':
                console.log('Subscribed to:', data.evt);
                break;

            case 'GET_SELECTED_VOICE_CHANNEL':
                if (data.data) {
                    this.handleVoiceChannel(data.data);
                }
                break;

            default:
                if (data.cmd === 'DISPATCH' && data.evt === 'READY') {
                    this.authorize();
                }
        }

        if (data.evt === 'READY' && !this.authenticated) {
            this.authorize();
        }
    }

    authorize() {
        console.log('Sending AUTHORIZE command');
        this.send({
            cmd: 'AUTHORIZE',
            args: {
                client_id: DISCORD_CLIENT_ID,
                scopes: ['rpc', 'rpc.voice.read']
            },
            nonce: this.nonce()
        });
    }

    async handleAuthorize(data) {
        if (data.evt === 'ERROR') {
            console.error('Authorization error:', data.data);
            this.showStatus('Please authorize CubReactive in Discord', 'error');
            return;
        }

        const code = data.data.code;
        console.log('Got auth code, authenticating...');

        this.send({
            cmd: 'AUTHENTICATE',
            args: {
                access_token: code
            },
            nonce: this.nonce()
        });
    }

    subscribeToVoice() {
        this.send({
            cmd: 'GET_SELECTED_VOICE_CHANNEL',
            args: {},
            nonce: this.nonce()
        });

        this.send({
            cmd: 'SUBSCRIBE',
            args: {},
            evt: 'VOICE_CHANNEL_SELECT',
            nonce: this.nonce()
        });
    }

    handleVoiceChannel(channel) {
        if (!channel || !channel.id) {
            console.log('Not in a voice channel');
            this.currentChannel = null;
            this.participants.clear();
            this.render();
            return;
        }

        console.log('Voice channel:', channel.name);
        this.currentChannel = channel;

        const events = [
            'SPEAKING_START',
            'SPEAKING_STOP',
            'VOICE_STATE_CREATE',
            'VOICE_STATE_UPDATE',
            'VOICE_STATE_DELETE'
        ];

        events.forEach(evt => {
            this.send({
                cmd: 'SUBSCRIBE',
                args: { channel_id: channel.id },
                evt: evt,
                nonce: this.nonce()
            });
        });

        if (channel.voice_states) {
            channel.voice_states.forEach(state => {
                this.handleVoiceState(state);
            });
        }

        this.render();
    }

    handleDispatch(data) {
        switch (data.evt) {
            case 'VOICE_CHANNEL_SELECT':
                if (data.data.channel_id) {
                    this.send({
                        cmd: 'GET_SELECTED_VOICE_CHANNEL',
                        args: {},
                        nonce: this.nonce()
                    });
                } else {
                    this.currentChannel = null;
                    this.participants.clear();
                    this.render();
                }
                break;

            case 'SPEAKING_START':
                this.setSpeaking(data.data.user_id, true);
                break;

            case 'SPEAKING_STOP':
                this.setSpeaking(data.data.user_id, false);
                break;

            case 'VOICE_STATE_CREATE':
            case 'VOICE_STATE_UPDATE':
                this.handleVoiceState(data.data);
                break;

            case 'VOICE_STATE_DELETE':
                this.removeParticipant(data.data.user.id);
                break;
        }
    }

    async handleVoiceState(state) {
        const userId = state.user?.id || state.user_id;
        if (!userId) return;

        if (MODE === 'individual' && TARGET_USER_ID && userId !== TARGET_USER_ID) {
            return;
        }

        const participant = {
            id: userId,
            username: state.user?.username || state.nick || 'Unknown',
            avatar: this.getAvatarUrl(state.user),
            speaking: this.participants.get(userId)?.speaking || false,
            muted: state.voice_state?.mute || state.voice_state?.self_mute || false,
            deafened: state.voice_state?.deaf || state.voice_state?.self_deaf || false
        };

        this.participants.set(userId, participant);

        if (!this.userConfigs.has(userId)) {
            await this.fetchUserConfig(userId);
        }

        this.render();
    }

    removeParticipant(userId) {
        this.participants.delete(userId);
        this.render();
    }

    setSpeaking(userId, speaking) {
        const participant = this.participants.get(userId);
        if (participant) {
            participant.speaking = speaking;
            this.render();
        }
    }

    getAvatarUrl(user) {
        if (!user) return '';
        if (user.avatar) {
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
        }
        const discriminator = parseInt(user.discriminator || '0');
        return `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
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
        container.innerHTML = '';

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
        if (mainSettings.hide_self && this.currentUserId) {
            participantsToRender = participantsToRender.filter(p => p.id !== this.currentUserId);
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
            const transitionStyle = settings.transition_style || 'fade';

            const wrapper = document.createElement('div');
            wrapper.className = 'avatar-wrapper';
            wrapper.style.transition = `all ${transitionDuration}ms ease`;

            // Add animation class if speaking
            if (participant.speaking && bounceOnSpeak) {
                const animClass = this.getAnimationClass(animationStyle);
                if (animClass) wrapper.classList.add(animClass);
            }

            // Avatar container
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.style.width = `${avatarSize}px`;
            avatar.style.height = `${avatarSize}px`;
            avatar.style.borderRadius = this.getShapeBorderRadius(avatarShape);
            avatar.style.transition = `all ${transitionDuration}ms ease`;
            avatar.style.position = 'relative';
            avatar.style.overflow = 'visible';

            // Apply hexagon clip-path
            if (avatarShape === 'hexagon') {
                avatar.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
            }

            // Apply border
            if (borderEnabled) {
                avatar.style.border = `${borderWidth}px solid ${borderColor}`;
            }

            // Apply speaking ring
            if (speakingRingEnabled && participant.speaking) {
                avatar.style.boxShadow = `0 0 0 ${speakingRingWidth}px ${speakingRingColor}`;
            }

            // Apply glow when speaking
            if (glowEnabled && participant.speaking) {
                const existingShadow = avatar.style.boxShadow;
                const glowShadow = `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`;
                avatar.style.boxShadow = existingShadow ? `${existingShadow}, ${glowShadow}` : glowShadow;
            }

            // Apply drop shadow
            if (shadowEnabled) {
                avatar.style.filter = `drop-shadow(0 4px ${shadowBlur}px ${shadowColor})`;
            }

            // Image wrapper (for clipping)
            const imgWrapper = document.createElement('div');
            imgWrapper.style.width = '100%';
            imgWrapper.style.height = '100%';
            imgWrapper.style.borderRadius = this.getShapeBorderRadius(avatarShape);
            imgWrapper.style.overflow = 'hidden';
            if (avatarShape === 'hexagon') {
                imgWrapper.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
            }

            // Image
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = participant.username;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.transition = `all ${transitionDuration}ms ease`;
            img.onerror = () => {
                img.src = participant.avatar;
            };

            // Apply flip
            if (flipHorizontal) {
                img.style.transform = 'scaleX(-1)';
            }

            // Apply filters based on state
            let filters = [];
            let opacity = 1;

            if (participant.deafened && grayscaleDeafened) {
                filters.push('grayscale(80%)', 'brightness(0.7)');
            } else if (participant.muted && grayscaleMuted) {
                filters.push('grayscale(50%)');
            } else if (!participant.speaking && dimWhenIdle) {
                opacity = idleOpacity / 100;
            } else if (!participant.speaking) {
                opacity = idleOpacity / 100;
            }

            if (filters.length > 0) {
                img.style.filter = filters.join(' ');
            }
            wrapper.style.opacity = opacity;

            imgWrapper.appendChild(img);
            avatar.appendChild(imgWrapper);

            // Status icons
            if (showStatusIcons && (participant.muted || participant.deafened)) {
                const statusIcon = document.createElement('div');
                statusIcon.className = 'status-icon';
                statusIcon.innerHTML = participant.deafened ? this.getDeafenedIcon() : this.getMutedIcon();
                avatar.appendChild(statusIcon);
            }

            wrapper.appendChild(avatar);

            // Username
            if (showName) {
                const username = document.createElement('div');
                username.className = 'username';
                username.textContent = participant.username;
                username.style.color = nameColor;
                username.style.fontSize = `${nameSize}px`;
                if (nameBgEnabled) {
                    username.style.background = nameBgColor;
                    username.style.padding = '4px 8px';
                    username.style.borderRadius = '4px';
                }
                wrapper.appendChild(username);
            }

            container.appendChild(wrapper);
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

    send(payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }

    nonce() {
        return Math.random().toString(36).substring(2);
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
