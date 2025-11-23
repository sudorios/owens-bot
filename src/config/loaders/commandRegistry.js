// src/config/loaders/commandRegistry.js

const fs = require('node:fs');
const path = require('node:path');

function loadCommands(client) {
  const slashPayload = [];
  client.commands = new Map();
  client.prefixCommands = new Map();

  const commandPaths = [
    path.resolve(__dirname, '../../app/core/commands'),
    path.resolve(__dirname, '../../app/config/commands'),
  ];

  const walk = (dir) => {
    let entries;

    try {
      entries = fs.readdirSync(dir);
    } catch (err) {
      console.error(`[commands] No se pudo leer el directorio: ${dir}`, err);
      return;
    }

    for (const name of entries) {
      const fullPath = path.join(dir, name);

      let stat;
      try {
        stat = fs.lstatSync(fullPath);
      } catch (err) {
        console.error(`[commands] No se pudo acceder a: ${fullPath}`, err);
        continue;
      }

      
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      
      if (!name.endsWith('.js')) continue;

      let cmd;
      try {
        cmd = require(fullPath);
      } catch (err) {
        console.error(`[commands] Error al cargar ${name}`, err);
        continue;
      }

      
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
        console.warn(`[commands] ${name} parece slash pero no tiene .toJSON()`);
      }
    }
  };

 
  for (const basePath of commandPaths) {
    if (fs.existsSync(basePath)) {
      walk(basePath);
    } else {
      console.warn(`[commands] Directorio no encontrado: ${basePath}`);
    }
  }

  return slashPayload;
}

module.exports = { loadCommands };