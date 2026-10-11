const express = require('express');
const mineflayer = require('mineflayer');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let bot = null;
let botStatus = 'Offline';
let logMessages = [];

function log(msg) {
  const time = new Date().toLocaleTimeString();
  const entry = `[${time}] ${msg}`;
  console.log(entry);
  logMessages.push(entry);
  if (logMessages.length > 30) logMessages.shift();
}

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Aternos AFK Control Panel</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: sans-serif; background: #0f172a; color: #fff; padding: 20px; max-width: 500px; margin: auto; }
        h2 { text-align: center; color: #38bdf8; }
        .card { background: #1e293b; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
        label { display: block; margin-top: 10px; font-weight: bold; color: #cbd5e1; }
        input { width: 100%; padding: 10px; margin-top: 5px; box-sizing: border-box; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 6px; }
        button { width: 100%; padding: 12px; margin-top: 15px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold; }
        .btn-start { background: #22c55e; color: white; }
        .btn-stop { background: #ef4444; color: white; }
        .status { padding: 10px; text-align: center; border-radius: 6px; font-weight: bold; margin-bottom: 15px; }
        .status.Online { background: #15803d; }
        .status.Offline { background: #991b1b; }
        .status.Connecting { background: #c2410c; }
        .logs { background: #020617; padding: 10px; border-radius: 6px; height: 140px; overflow-y: scroll; font-family: monospace; font-size: 12px; color: #a7f3d0; }
      </style>
    </head>
    <body>
      <h2>🎮 Minecraft AFK Bot</h2>
      <div class="status ${botStatus}">Status: ${botStatus}</div>
      <div class="card">
        <form action="/start" method="POST">
          <label>Server IP / Host:</label>
          <input type="text" name="host" placeholder="myserver.aternos.me" required />
          
          <label>Port:</label>
          <input type="number" name="port" placeholder="44076" required />
          
          <label>Bot Username:</label>
          <input type="text" name="username" value="AFK_Bot_247" required />
          
          <label>Password (/register & /login):</label>
          <input type="password" name="password" placeholder="Password for AuthMe" required />
          
          <button type="submit" class="btn-start">▶ Connect Bot</button>
        </form>
        
        <form action="/stop" method="POST">
          <button type="submit" class="btn-stop">⏹ Disconnect Bot</button>
        </form>
      </div>

      <div class="card">
        <h3>Live Activity Log</h3>
        <div class="logs">${logMessages.join('<br>')}</div>
      </div>
    </body>
    </html>
  `);
});

app.post('/start', (req, res) => {
  const { host, port, username, password } = req.body;

  if (bot) {
    log('Bot is already connected.');
    return res.redirect('/');
  }

  botStatus = 'Connecting';
  log(`Connecting to ${host}:${port}...`);

  bot = mineflayer.createBot({
    host: host,
    port: parseInt(port),
    username: username,
    version: false
  });

  bot.on('spawn', () => {
    botStatus = 'Online';
    log(`✅ Joined server successfully!`);

    // Auto-Register & Login
    setTimeout(() => {
      if (bot) {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
        log(`Executed /register and /login.`);
      }
    }, 3000);

    // Anti-AFK Jump Loop (Runs every 25 seconds)
    setInterval(() => {
      if (bot) {
        bot.setControlState('jump', true);
        setTimeout(() => { if (bot) bot.setControlState('jump', false); }, 400);
      }
    }, 25000);
  });

  bot.on('end', () => {
    botStatus = 'Offline';
    log('❌ Disconnected from server.');
    bot = null;
  });

  bot.on('error', (err) => {
    botStatus = 'Offline';
    log(`⚠️ Error: ${err.message}`);
    bot = null;
  });

  res.redirect('/');
});

app.post('/stop', (req, res) => {
  if (bot) {
    bot.quit();
    bot = null;
    botStatus = 'Offline';
    log('Bot stopped.');
  }
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
