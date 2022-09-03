const Discordjs = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const superagent = require('superagent');
const fs = require('fs');
const { createCanvas, Image } = require('canvas')

const bot = new Discordjs.Client({ intents: [Discordjs.GatewayIntentBits.Guilds] })
console.log("[Bot] Starting Bot")

bot.on("ready", () => {

	console.log(`[Bot] Logged in as ${bot.user.username}`)
	var commands = [
		new SlashCommandBuilder()
			.setName('generate')
			.setDescription('Generates a image using Dall-e')
			.addStringOption(option =>
				option.setName('prompt')
					.setDescription('The prmot to generate an image of')
					.setRequired(true)
			)
	]

	var rest = new REST({ version: '9' }).setToken(bot.token);

	rest.put(Routes.applicationGuildCommands(bot.user.id, '691458137261342760'), { body: commands })
	rest.put(Routes.applicationCommands(bot.user.id), { body: commands },);

})

bot.login(process.env['token'])

bot.on('error', err => {

	console.error(err)

})

bot.on('interactionCreate', async interaction => {

	if (interaction.commandName == "generate") {
		const canvas = createCanvas(256 * 3, 256 * 3)
		const ctx = canvas.getContext('2d')

		var Embed = new Discordjs.EmbedBuilder()
			.setColor("#f4c2c2")
			.setTitle('Dall-e Mini')
			.setDescription('Generating Image')
			.setFooter({ text: 'Time waited: 0' })

		interaction.reply({ embeds: [Embed] }).catch(e => { console.log(e) })

		var starttime = Date.now()
		var UpdateLoop = setInterval(() => {

			var Embed = new Discordjs.EmbedBuilder()
				.setColor("#f4c2c2")
				.setTitle('Dall-e Mini')
				.setDescription('Generating Image')
				.setFooter({ text: 'Time waited: ' + Math.round((Date.now() - starttime) / 1000) });
			interaction.editReply({ embeds: [Embed] }).catch(e => { console.log(e) })

		}, 5000)

		fs.appendFile('latest.log', "\nUser asked for: " + interaction.options.data[0].value, function(err) {
			if (err) throw err;
		});

		superagent
			.post(`https://bf.dallemini.ai/generate`)
			.send({ prompt: interaction.options.data[0].value })
			.end((err, res) => {

				if (err) {
					interaction.editReply("Error occured, please try again later").catch(e => { })
				} else {
					try {
						var Embeds = []
						for (var i = 0; i < res.body.images.length; i++) {

							var newimage = new Image;
							newimage.onload = function() {
								ctx.drawImage(newimage, 256 * (i - (Math.floor(i / 3)) * 3), Math.floor(i / 3) * 256, 256, 256)
							}
							newimage.src = "data:image/png;base64," + res.body.images[i]

						}
						clearInterval(UpdateLoop)
						setTimeout(() => {
							interaction.editReply({ content: `Heres what i think ${interaction.options.data[0].value} looks like`, files: [new Discordjs.AttachmentBuilder(canvas.toBuffer(), "output.png")], embeds: [] }).catch(e => { })
						}, 1500)
					} catch (e) {
						interaction.editReply("Error occured, please try again later").catch(e => { })
					}
				}
			})
	}

});