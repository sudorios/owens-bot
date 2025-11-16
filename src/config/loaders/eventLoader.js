const fs = require('node:fs');
const path = require('node:path');

module.exports = function loadEvents(client) {
  const dir = path.join(__dirname, '..', 'events');
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const evt = require(path.join(dir, file));
    if (!evt?.name || typeof evt?.execute !== 'function') {
      console.warn(`[events] ${file} no exporta { name, execute }`);
      continue;
    }
    client.on(evt.name, (...args) => evt.execute(...args, client));
  }
};
            