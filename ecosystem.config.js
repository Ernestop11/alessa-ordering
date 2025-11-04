module.exports = {
  apps: [
    {
      name: 'alessa',
      cwd: '/home/youruser/alessa',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
