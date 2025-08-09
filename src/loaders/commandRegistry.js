const fs = require('node:fs');
const path = require('node:path');

function loadSlashCommands(client) {
  const commands = [];
  client.commands = new Map();

  const base = path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(base)) return commands;

  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.lstatSync(p);
      if (stat.isDirectory()) {
        walk(p);
      } else if (name.endsWith('.js')) {
        const cmd = require(p);
        if (cmd?.data && cmd?.execute) {
          client.commands.set(cmd.data.name, cmd);
          commands.push(cmd.data.toJSON());
        } else {
          console.warn(`[commands] ${name} no exporta { data, execute }`);
        }
      }
    }
  };

  walk(base);
  return commands;
}

module.exports = { loadSlashCommands };
