module.exports = {
  apps: [{
    name: 'alfred-ai',
    namespace: 'alessa',
    cwd: '/srv/agent-console',
    script: 'server.cjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 4010,  // DEDICATED PORT FOR ALFRED
      ALFRED_MODE: 'production',
      ALESSA_API_URL: 'http://localhost:4000',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    error_file: '/var/log/pm2/alfred-error.log',
    out_file: '/var/log/pm2/alfred-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

