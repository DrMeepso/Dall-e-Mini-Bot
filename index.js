const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', { token: process.env['token'] });
manager.on('shardCreate', shard => console.log(`[Shard Manager] Launched shard ${shard.id}`));
manager.spawn({ amount: 5, delay: 5500, timeout: 30000 });