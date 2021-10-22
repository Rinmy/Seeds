"use strict";

const Discord = require("discord.js");
const Https = require("https");
const Fs = require("fs");

const discord = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	],
});

// このプログラムに必要なコンフィグ
const CONFIG = require("./config.json");

// Discord用コマンドリスト
const COMMANDS_LIST = require("./commands.json");

function sleep(seconds) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, seconds);
	});
}

function appendLog(content) {
	const date = new Date();
	const currentTime = `${date.getFullYear()}.${
		date.getMonth() + 1
	}.${date.getDate()}|${date.getHours()}:${date.getMinutes()}`;
	const log = `${currentTime}\n${content}\n\n---------------------\n\n`;

	Fs.appendFileSync("./error.log", log);
}

function sendCommandsList() {
	/*const a = new URL(`/api/v8/applications/${CONFIG["bot"]["application_id"]}/commands/876121522908053554`, "https://discord.com");
	const b = {
		host: a.host,
		port: 443,
		method: "DELETE",
		path: a.pathname,
		headers: {
			"Authorization": `Bot ${CONFIG["bot"]["token"]}`
		}
	};

	const c = Https.request(b, (response) => {
		let data = "";
		response.on("data", (chunk) => {
			data += chunk;
		});

		response.on("end", () => {
			if(response.statusCode !== 204){
				appendLog(data);
			}
		});
	});

	c.on("error", (error) => {
		appendLog(error.message);
	});

	c.end();*/
	/*
	const COMMANDS_URL = new URL(`/api/v8/applications/${CONFIG["bot"]["application_id"]}/commands`, "https://discord.com");
	const OPTIONS = {
		host: COMMANDS_URL.host,
		port: 443,
		method: "POST",
		path: COMMANDS_URL.pathname,
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bot ${CONFIG["bot"]["token"]}`
		}
	};

	const request = Https.request(OPTIONS, (response) => {
		let data = "";
		response.on("data", (chunk) => {
			data += chunk;
		});


		response.on("end", () => {
			if(response.statusCode !== 200){
				appendLog(data);
			}
		});
	});

	request.on("error", (error) => {
		appendLog(error.message);
	});

	request.write(JSON.stringify(COMMANDS_LIST));
	request.end();*/
}

class Commands {
	constructor(interaction) {
		this.interaction = interaction;
		this.command = interaction.commandName;
		this.interactionId = interaction.id;
		this.token = interaction.token;
		this.webhook = interaction.webhook;
		this.guildId = interaction.guildId;
		this.instance = "";
		this.options = interaction.options;
	}

	embedIcon(type) {
		switch (type) {
			case "success":
				return "https://freeiconshop.com/wp-content/uploads/edd/checkmark-flat.png";
			case "failed":
				return "https://icon-library.com/images/failed-icon/failed-icon-7.jpg";
			case "load":
				return "https://i.stack.imgur.com/kOnzy.gif";
			case "question":
				return "https://icooon-mono.com/i/icon_11571/icon_115710_256.png";
			default:
				return "https://icooon-mono.com/i/icon_11571/icon_115710_256.png";
		}
	}

	embedColor(type) {
		switch (type) {
			case "on":
				return 2001125;
			case "off":
				return 16725063;
			case "success":
				return 3270553;
			case "failed":
				return 16725063;
			case "load":
				return 0;
			case "question":
				return 14135295;
			default:
				return 0;
		}
	}

	async callback(message, type) {
		await discord.api
			.interactions(this.interactionId, this.token)
			.callback.post({
				data: {
					type: 4,
					data: {
						content: "ㅤ",
						embeds: [
							{
								title: "",
								color: this.embedColor(type),
								author: {
									name: message,
									icon_url: this.embedIcon(type),
								},
								description: "",
							},
						],
					},
				},
			});
	}

	async edit(message, type, description = "") {
		await this.webhook.editMessage("@original", {
			content: "ㅤ",
			embeds: [
				{
					title: "",
					color: this.embedColor(type),
					author: {
						name: message,
						icon_url: this.embedIcon(type),
					},
					description: description,
				},
			],
		});
	}

	async delete() {
		await this.webhook.deleteMessage("@original");
	}

	async do() {
		try {
			switch (this.command) {
				case "hello":
					const embed = new Discord.MessageEmbed()
						.setColor("#29B6F6")
						.setTitle("")
						.setAuthor(
							"要件を...",
							"https://icooon-mono.com/i/icon_11571/icon_115710_256.png"
						)
						.setDescription("");

					const button = new Discord.MessageActionRow().addComponents(
						new Discord.MessageButton()
							.setLabel("test")
							.setURL("https://www.google.com/")
							.setStyle("LINK")
					);

					await this.interaction.reply({
						embeds: [embed],
						components: [button],
					});
					break;

				default:
					await this.callback("不明なコマンドです", "failed");
					break;
			}

			await sleep(10000);
			await this.delete();
		} catch (error1) {
			try {
				await this.edit(
					"エラーが発生しました",
					"failed",
					error1.message
				);
			} catch (error2) {
				appendLog(error2.message);
			}
			appendLog(error1.message);
		}
	}
}

function deepl(text) {
	return new Promise((resolve, reject) => {
		const URL = `https://api-free.deepl.com/v2/translate?auth_key=${CONFIG["deepl"]["key"]}&text=${text}&target_lang=JA`;

		const request = Https.get(URL, (response) => {
			let data = "";
			response.on("data", (chunk) => {
				data += chunk;
			});

			response.on("end", () => {
				if (response.statusCode !== 200) {
					appendLog(data);
					reject;
				} else {
					resolve(JSON.parse(data)["translations"][0]["text"]);
				}
			});
		});

		request.on("error", (error) => {
			appendLog(error.message);
			reject;
		});

		request.end();
	});
}

function checkTranslateStatus(guild) {
	let status = false;

	guild.emojis.cache.forEach((emoji) => {
		if (emoji.name === "deepl") {
			status = true;
		}
	});

	return status;
}

function what(guild) {
	const embed = new Discord.MessageEmbed()
		.setColor("#29B6F6")
		.setTitle("")
		.setAuthor(
			"(。´・ω・)ん?",
			"https://walfiegif.files.wordpress.com/2020/11/out-transparent-2.gif?w=50"
		)
		.setDescription("");

	const developerButton = new Discord.MessageActionRow().addComponents(
		new Discord.MessageButton()
			.setLabel("Developer Portal")
			.setURL("https://discord.com/developers/applications/")
			.setStyle("LINK")
	);

	const translateStatus = checkTranslateStatus(guild);
	const translateButton = new Discord.MessageActionRow().addComponents(
		new Discord.MessageButton()
			.setLabel(translateStatus ? "翻訳機能無効化" : "翻訳機能有効化")
			.setCustomId(
				translateStatus ? "disable-translate" : "enable-translate"
			)
			.setStyle(translateStatus ? "DANGER" : "PRIMARY")
	);

	return {embeds: [embed], components: [translateButton, developerButton]};
}

function update(text) {
	const embed = new Discord.MessageEmbed()
		.setColor("#29B6F6")
		.setTitle("")
		.setAuthor(
			text,
			"https://walfiegif.files.wordpress.com/2021/06/out-transparent-1.gif?w=50"
		)
		.setDescription("");

	return {embeds: [embed], components: []};
}

discord.on("messageCreate", (message) => {
	if (message.author.bot) {
		return;
	}

	if (message.mentions.has(discord.user)) {
		try {
			message.delete();
			message.channel.send(what(message.guild));
		} catch (error) {
			appendLog(error.message);
		}
	}
});

discord.on("messageReactionAdd", async (reaction) => {
	if (reaction.emoji.name === "deepl") {
		const text = await deepl(reaction.message.content);

		reaction.message.reply("```" + text + "```");
	}
});

discord.on("interactionCreate", (interaction) => {
	if (interaction.isCommand()) {
		const command = new Commands(interaction);
		command.do();
	} else if (interaction.isButton()) {
		try {
			switch (interaction.customId) {
				case "enable-translate":
					if (!checkTranslateStatus(interaction.guild)) {
						interaction.guild.emojis.create(
							"./emoji/deepl.png",
							"deepl"
						);
					}

					interaction.update(update("( ´∀｀)bｸﾞｯ!"));
					break;

				case "disable-translate":
					interaction.guild.emojis.cache.forEach((emoji) => {
						if (emoji.name === "deepl") {
							emoji.delete();
						}
					});

					interaction.update(update("(ﾟДﾟ)ﾉ ｧｨ"));
					break;

				default:
					interaction.update(update("(´・ω・`)知らんがな"));
					break;
			}
		} catch (error) {
			appendLog(error.message);
		}
	} else {
		try {
			interaction.update(update("'`ｨ (ﾟдﾟ)/"));
		} catch (error) {
			appendLog(error.message);
		}
	}
});

discord.once("ready", () => {
	console.log("ready!");
	//sendCommandsList();
});

discord.login(CONFIG["bot"]["token"]);
