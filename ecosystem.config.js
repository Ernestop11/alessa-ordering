module.exports = {
  apps: [
    {
      name: 'alessa',
      cwd: '/var/www/alessa-ordering',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
