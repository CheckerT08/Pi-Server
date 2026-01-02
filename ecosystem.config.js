// Config Datei für pm2, predictability von pm2
// Wie startet app? welche ENV-Werte? 

export default {
  apps: [
    {
      name: "dashboard",
      script: "server.js",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
