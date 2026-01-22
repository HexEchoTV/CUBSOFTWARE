// Debug Logger - Sends debug information to Discord channel
const DEBUG_CHANNEL_ID = '1446034344371159150';

class DebugLogger {
    constructor() {
        this.client = null;
        this.debugChannel = null;
        this.enabled = true;
        this.queue = [];
        this.lastMessageTime = 0;
        this.messageCount = 0;
        this.rateLimitWindow = 5000; // 5 seconds
        this.maxMessagesPerWindow = 4; // 4 messages per 5 seconds (staying under Discord's 5/5s limit)
    }

    setClient(client) {
        this.client = client;
        this.debugChannel = client.channels.cache.get(DEBUG_CHANNEL_ID);

        if (!this.debugChannel) {
            console.log('[DEBUG] Debug channel not found, attempting to fetch...');
            client.channels.fetch(DEBUG_CHANNEL_ID).then(channel => {
                this.debugChannel = channel;
                console.log('[DEBUG] Debug channel fetched successfully');
                this.flushQueue();
            }).catch(err => {
                console.error('[DEBUG] Failed to fetch debug channel:', err);
            });
        } else {
            this.flushQueue();
        }

        // Flush queue every 10 seconds to handle rate-limited messages
        setInterval(() => {
            if (this.queue.length > 0) {
                this.flushQueue();
            }
        }, 10000);
    }

    async log(category, message, data = null) {
        if (!this.enabled) return;

        const timestamp = new Date().toISOString();
        const logMessage = `**[${category}]** ${timestamp}\n${message}${data ? `\n\`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 1800)}\n\`\`\`` : ''}`;

        console.log(`[DEBUG ${category}] ${message}`, data || '');

        if (!this.debugChannel) {
            this.queue.push(logMessage);
            return;
        }

        // Rate limiting logic
        const now = Date.now();
        if (now - this.lastMessageTime > this.rateLimitWindow) {
            // Reset counter if we're in a new window
            this.messageCount = 0;
            this.lastMessageTime = now;
        }

        if (this.messageCount >= this.maxMessagesPerWindow) {
            // Queue message if we're at the limit
            console.log('[DEBUG] Rate limit reached, queueing message...');
            this.queue.push(logMessage);
            return;
        }

        try {
            await this.debugChannel.send(logMessage.substring(0, 2000));
            this.messageCount++;
        } catch (error) {
            console.error('[DEBUG] Failed to send debug message:', error);
        }
    }

    async flushQueue() {
        if (!this.debugChannel || this.queue.length === 0) return;

        console.log(`[DEBUG] Flushing ${this.queue.length} queued messages...`);

        for (const message of this.queue) {
            try {
                await this.debugChannel.send(message.substring(0, 2000));
                await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit prevention
            } catch (error) {
                console.error('[DEBUG] Failed to send queued message:', error);
            }
        }

        this.queue = [];
    }

    async error(category, error, context = null) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context
        };
        await this.log(`ERROR:${category}`, `❌ Error occurred`, errorData);
    }

    async success(category, message, data = null) {
        await this.log(`SUCCESS:${category}`, `✅ ${message}`, data);
    }

    async info(category, message, data = null) {
        await this.log(`INFO:${category}`, `ℹ️ ${message}`, data);
    }

    async warn(category, message, data = null) {
        await this.log(`WARN:${category}`, `⚠️ ${message}`, data);
    }
}

const debugLogger = new DebugLogger();

module.exports = { debugLogger };
