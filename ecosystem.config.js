module.exports = {
  apps: [
    {
      name: 'bradley-io-wargames',
      script: './wargames-server.js',
      cwd: '/home/bisenbek/projects/bradleyio',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/wargames-error.log',
      out_file: './logs/wargames-out.log',
      log_file: './logs/wargames-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
