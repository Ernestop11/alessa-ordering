module.exports = {
  apps: [
    {
      name: 'alessa-ordering',
      namespace: 'alessa',
      cwd: '/var/www/alessa-ordering',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000  // DEDICATED PORT - No conflicts
      },
      error_file: '/var/log/pm2/alessa-ordering-error.log',
      out_file: '/var/log/pm2/alessa-ordering-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}
