const fs = require('node:fs');
const path = require('node:path');

function loadCommands(client) {
  const slashPayload = [];
  client.commands = new Map();        
  client.prefixCommands = new Map(); 

  const base = path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(base)) return slashPayload;

  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.lstatSync(p);
      if (stat.isDirectory()) {
        walk(p);
        continue;
      }
      if (!name.endsWith('.js')) continue;

      const cmd = require(p);
      if (!cmd?.data || typeof cmd.execute !== 'function') {
        console.warn(`[commands] ${name} no exporta { data, execute }`);
        continue;
      }

      if (cmd.data.type === 'prefix') {
        const key = String(cmd.data.name).toLowerCase();
        client.prefixCommands.set(key, cmd);
        continue; 
      }

      if (typeof cmd.data.toJSON === 'function') {
        client.commands.set(cmd.data.name, cmd);
        slashPayload.push(cmd.data.toJSON());
      } else {
        console.warn(`[commands] ${name} no es builder (falta .toJSON).`);
      }
    }
  };

  walk(base);
  return slashPayload;
}

module.exports = { loadCommands };
