/**
 * PM2 Ecosystem Configuration
 * CUB Software - Home Server Setup
 *
 * Usage:
 *   pm2 start ecosystem.config.js       # Start all apps
 *   pm2 start ecosystem.config.js --only questcord  # Start specific app
 *   pm2 stop all                        # Stop all apps
 *   pm2 restart all                     # Restart all apps
 *   pm2 logs                            # View all logs
 *   pm2 logs questcord                  # View specific app logs
 *   pm2 monit                           # Monitor dashboard
 *   pm2 save                            # Save current process list
 *   pm2 startup                         # Generate startup script
 */

module.exports = {
    apps: [
        // ============================================
        // CubSoftware Website (Flask/Python)
        // ============================================
        {
            name: 'cubsoftware-website',
            script: 'main.py',
            cwd: './apps/cubsoftware-website',
            interpreter: 'python',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,
            env: {
                FLASK_ENV: 'production',
                FLASK_DEBUG: '0'
            },
            env_development: {
                FLASK_ENV: 'development',
                FLASK_DEBUG: '1'
            },
            // Logging
            error_file: './logs/cubsoftware-website-error.log',
            out_file: './logs/cubsoftware-website-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true
        },

        // ============================================
        // QuestCord (Discord Bot + Web Dashboard)
        // ============================================
        {
            name: 'questcord',
            script: 'src/index.js',  // Skip start.js to avoid npm install on every restart
            cwd: './apps/questcord',
            interpreter: 'node',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,
            // Node.js specific settings
            node_args: '--max-old-space-size=512',
            // Environment variables
            env: {
                NODE_ENV: 'production'
            },
            env_development: {
                NODE_ENV: 'development'
            },
            // Logging
            error_file: './logs/questcord-error.log',
            out_file: './logs/questcord-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true
        },

        // ============================================
        // The Onion Bot (Solibot - Discord Bot)
        // ============================================
        {
            name: 'onion-bot',
            script: 'index.js',
            cwd: '../The Onion Bot',  // Relative to cubsoftware-server
            interpreter: 'node',
            watch: false,
            autorestart: true,
            max_restarts: 10,
            restart_delay: 5000,
            // Node.js specific settings
            node_args: '--max-old-space-size=256',
            // Environment variables
            env: {
                NODE_ENV: 'production'
            },
            env_development: {
                NODE_ENV: 'development',
                DEBUG: 'true'
            },
            // Logging
            error_file: './logs/onion-bot-error.log',
            out_file: './logs/onion-bot-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true
        }

        // ============================================
        // CubVault - Desktop App (NOT included)
        // ============================================
        // CubVault is an Electron desktop application
        // It requires a GUI and is not suitable for PM2/server deployment
        // Run it separately on your desktop machine
    ]
};
