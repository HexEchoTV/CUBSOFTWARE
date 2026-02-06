// CubPresence Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    const statusDot = document.getElementById('statusDot');
    const statusTitle = document.getElementById('statusTitle');
    const statusDetail = document.getElementById('statusDetail');
    const presenceInfo = document.getElementById('presenceInfo');
    const connectedActions = document.getElementById('connectedActions');
    const noConfig = document.getElementById('noConfig');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const openSiteBtn = document.getElementById('openSiteBtn');

    // Get current state from background
    function updateUI(state) {
        statusDot.className = 'status-dot ' + (state.connectionState || 'disconnected');

        if (state.connectionState === 'connected') {
            statusTitle.textContent = 'Connected to Discord';
            statusDetail.textContent = 'Rich Presence is active';
            connectedActions.style.display = 'block';
            noConfig.style.display = 'none';

            if (state.config) {
                presenceInfo.style.display = 'block';
                document.getElementById('infoDetails').textContent = state.config.details || '-';
                document.getElementById('infoState').textContent = state.config.state || '-';
            }
        } else if (state.connectionState === 'connecting' || state.connectionState === 'authorizing') {
            statusTitle.textContent = state.connectionState === 'authorizing' ? 'Authorizing...' : 'Connecting...';
            statusDetail.textContent = 'Please wait...';
            connectedActions.style.display = 'none';
            presenceInfo.style.display = 'none';
            noConfig.style.display = 'none';
        } else {
            statusTitle.textContent = 'Disconnected';
            statusDetail.textContent = state.error || 'Not connected to Discord';
            connectedActions.style.display = 'none';
            presenceInfo.style.display = 'none';
            noConfig.style.display = state.config ? 'none' : 'block';
        }
    }

    // Initial state
    try {
        const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
        updateUI(state);
    } catch (err) {
        updateUI({ connectionState: 'disconnected', error: 'Extension error' });
    }

    // Listen for state updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'STATE_UPDATE') {
            updateUI(message);
        }
    });

    // Disconnect button
    disconnectBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
        updateUI({ connectionState: 'disconnected' });
    });

    // Open website button
    openSiteBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://cubsoftware.site/apps/cubpresence' });
    });
});
