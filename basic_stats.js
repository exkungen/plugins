import BasePlugin from './base-plugin.js';

import Sequelize from 'sequelize';
import Discord from 'discord.js'
import fs from 'fs';
const { DataTypes } = Sequelize;

export default class DiscordStats extends BasePlugin {
    static get description() {
        return (
            'Basic Discord bot to display player stats'
        );
    }

    static get defaultEnabled() {
        return false;
    }

    static get optionsSpecification() {
        return {
            discordClient: {
                required: true,
                description: 'Discord connector name.',
                connector: 'discord',
                default: 'discord'
            },
            database: {
                required: true,
                connector: 'sequelize',
                description: 'The Sequelize connector to log server information to.',
                default: 'mysql'
            },
            channelID: {
                required: true,
                description: 'ID of channel to turn into RCON console.',
                default: '',
                example: '667741905228136459'
            },
            prefix: {
                required: true,
                description: 'Prefix to be used for commands.',
                default: ""
            },
        };
    }

    constructor(server, options, connectors) {
        super(server, options, connectors);

        this.models = {};

        this.createModel('Server', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING
            }
        });

        this.createModel('Match', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            dlc: {
                type: DataTypes.STRING
            },
            mapClassname: {
                type: DataTypes.STRING
            },
            layerClassname: {
                type: DataTypes.STRING
            },
            map: {
                type: DataTypes.STRING
            },
            layer: {
                type: DataTypes.STRING
            },
            startTime: {
                type: DataTypes.DATE,
                notNull: true
            },
            endTime: {
                type: DataTypes.DATE
            },
            winner: {
                type: DataTypes.STRING
            }
        });

        this.createModel('TickRate', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            time: {
                type: DataTypes.DATE,
                notNull: true
            },
            tickRate: {
                type: DataTypes.FLOAT,
                notNull: true
            }
        });

        this.createModel('PlayerCount', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            time: {
                type: DataTypes.DATE,
                notNull: true,
                defaultValue: DataTypes.NOW
            },
            players: {
                type: DataTypes.INTEGER,
                notNull: true
            },
            publicQueue: {
                type: DataTypes.INTEGER,
                notNull: true
            },
            reserveQueue: {
                type: DataTypes.INTEGER,
                notNull: true
            }
        });

        this.createModel(
            'SteamUser',
            {
                steamID: {
                    type: DataTypes.STRING,
                    primaryKey: true
                },
                lastName: {
                    type: DataTypes.STRING
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            }
        );

        this.createModel(
            'Wound',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                time: {
                    type: DataTypes.DATE,
                    notNull: true
                },
                victimName: {
                    type: DataTypes.STRING
                },
                victimTeamID: {
                    type: DataTypes.INTEGER
                },
                victimSquadID: {
                    type: DataTypes.INTEGER
                },
                attackerName: {
                    type: DataTypes.STRING
                },
                attackerTeamID: {
                    type: DataTypes.INTEGER
                },
                attackerSquadID: {
                    type: DataTypes.INTEGER
                },
                damage: {
                    type: DataTypes.FLOAT
                },
                weapon: {
                    type: DataTypes.STRING
                },
                teamkill: {
                    type: DataTypes.BOOLEAN
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            }
        );

        this.createModel(
            'Death',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                time: {
                    type: DataTypes.DATE,
                    notNull: true
                },
                woundTime: {
                    type: DataTypes.DATE
                },
                victimName: {
                    type: DataTypes.STRING
                },
                victimTeamID: {
                    type: DataTypes.INTEGER
                },
                victimSquadID: {
                    type: DataTypes.INTEGER
                },
                attackerName: {
                    type: DataTypes.STRING
                },
                attackerTeamID: {
                    type: DataTypes.INTEGER
                },
                attackerSquadID: {
                    type: DataTypes.INTEGER
                },
                damage: {
                    type: DataTypes.FLOAT
                },
                weapon: {
                    type: DataTypes.STRING
                },
                teamkill: {
                    type: DataTypes.BOOLEAN
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            }
        );

        this.createModel(
            'Revive',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                time: {
                    type: DataTypes.DATE,
                    notNull: true
                },
                woundTime: {
                    type: DataTypes.DATE
                },
                victimName: {
                    type: DataTypes.STRING
                },
                victimTeamID: {
                    type: DataTypes.INTEGER
                },
                victimSquadID: {
                    type: DataTypes.INTEGER
                },
                attackerName: {
                    type: DataTypes.STRING
                },
                attackerTeamID: {
                    type: DataTypes.INTEGER
                },
                attackerSquadID: {
                    type: DataTypes.INTEGER
                },
                damage: {
                    type: DataTypes.FLOAT
                },
                weapon: {
                    type: DataTypes.STRING
                },
                teamkill: {
                    type: DataTypes.BOOLEAN
                },
                reviverName: {
                    type: DataTypes.STRING
                },
                reviverTeamID: {
                    type: DataTypes.INTEGER
                },
                reviverSquadID: {
                    type: DataTypes.INTEGER
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            }
        );

        this.onMessage = this.onMessage.bind(this);
        if (!fs.existsSync("./linkedAccounts.json")) {
            fs.writeFileSync("./linkedAccounts.json", JSON.stringify([]));
        }
        this.linkedAccounts = JSON.parse(fs.readFileSync("./linkedAccounts.json"));
    }

    createModel(name, schema) {
        this.models[name] = this.options.database.define(`DBLog_${name}`, schema, {
            timestamps: false
        });
    }

    async prepareToMount() {
        await this.models.Server.sync();
        await this.models.Match.sync();
        await this.models.TickRate.sync();
        await this.models.PlayerCount.sync();
        await this.models.SteamUser.sync();
        await this.models.Wound.sync();
        await this.models.Death.sync();
        await this.models.Revive.sync();
    }

    async mount() {
        this.options.discordClient.on('message', this.onMessage);
    }

    async unmount() {
        this.options.discordClient.removeEventListener('message', this.onMessage);
    }

    async onMessage(message) {
        const prefix = this.options.prefix;
        if (!message.content.startsWith(prefix)) return;
        if (message.author.bot) return;
        const cmd = message.content.split(" ")[0].slice(prefix.length);
        if (message.channel.id != this.options.channelID) return;
        switch (cmd) {
            case "link":
                {
                    await message.delete();
                    const steamID = message.content.split(" ")[1];
                    if (!steamID) {
                        message.reply("Please provide a steamID");
                        break;
                    }
                    const user = await this.findUser(steamID);
                    if (!user) {
                        message.reply("No user found with that steamID");
                        break;
                    }
                    if (this.linkedAccounts.find((x) => x.steamID == steamID || message.author.id == x.discordID)) return message.reply("Account already linked");
                    this.linkedAccounts.push({
                        discordID: message.author.id,
                        steamID: steamID
                    });
                    fs.writeFileSync("./linkedAccounts.json", JSON.stringify(this.linkedAccounts));
                    message.reply("Account successfully linked");
                    break;
                }

            case "unlink":
                {
                    await message.delete();
                    if (!this.linkedAccounts.find(x => x.discordID === message.author.id)) {
                        message.reply("Please link your account first");
                        break;
                    }
                    this.linkedAccounts = this.linkedAccounts.filter(x => x.discordID !== message.author.id);

                    fs.writeFileSync("./linkedAccounts.json", JSON.stringify(this.linkedAccounts));
                    message.reply("Account successfully unlinked");
                    break;
                }

            case "stats":
                {
                    const steamID = this.linkedAccounts.find(x => x.discordID === message.author.id)?.steamID;
                    if (!steamID) {
                        message.reply("Please link your account first");
                        break;
                    }
                    const user = await this.findUser(steamID);
                    if (!user) {
                        message.reply("No account found with this steamID");
                        break;
                    }
                    const content = await this.getUserStats(user);
                    message.reply(content);
                    break;

                }

            default: break;
        }
    }

    async findUser(steamID) {
        return await this.models.SteamUser.findOne({
            where: {
                steamID: steamID   
            }
        });
    }

    async getUserStats(user) {
        const kills = await this.models.Death.count({
            where: {
                attacker: user.steamID
            }
        });

        const deaths = await this.models.Death.count({
            where: {
                victim: user.steamID
            }
        });

        const revives = await this.models.Revive.count({
            where: {
                reviver: user.steamID
            }
        });

        const revived = await this.models.Revive.count({
            where: {
                victim: user.steamID
            }
        });

        const hits = await this.models.Wound.count({
            where: {
                attacker: user.steamID
            }
        });

        const wounded = await this.models.Wound.count({
            where: {
                victim: user.steamID
            }
        });

        const tks = await this.models.Death.count({
            where: {
                attacker: user.steamID,
                teamkill: 1
            }
        });

        const matcheCount = await this.models.Death.findOne({
            where: {
                attacker: user.steamID
            },
            group: ['match'],
            attributes: ['match', [Sequelize.fn('COUNT', Sequelize.col('match')), 'count']],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });


        const mostKilledPlayer = await this.models.Death.findOne({
            where: {
                attacker: user.steamID,
                victim: {
                    [Sequelize.Op.ne]: user.steamID
                }
            },
            attributes: ['victim', [Sequelize.fn('COUNT', Sequelize.col('victim')), 'count'], 'victimName'],
            group: ['victim', 'victimName'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });

        const mostDiedPlayer = await this.models.Death.findOne({
            where: {
                victim: user.steamID,
                attacker: {
                    [Sequelize.Op.ne]: user.steamID
                }
            },

            attributes: ['attacker', [Sequelize.fn('COUNT', Sequelize.col('attacker')), 'count'], 'attackerName'],
            group: ['attacker', 'attackerName'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });

        const mostRevivedPlayer = await this.models.Revive.findOne({
            where: {
                reviver: user.steamID
            },
            attributes: ['victim', [Sequelize.fn('COUNT', Sequelize.col('victim')), 'count'], 'victimName'],
            group: ['victim', 'victimName'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });

        const kdr = deaths === 0 ? kills : kills / deaths;
        const rpd = revives === 0 ? 0 : revives / deaths;
        const hpr = hits === 0 ? 0 : hits / revives;

        const content = new Discord.MessageEmbed()
            .setTitle(`${user.lastName} - ${user.steamID} STATS`)
            .setURL(`https://steamcommunity.com/profiles/${user.steamID}`)
            .setThumbnail(`https://cdn.discordapp.com/attachments/948790710054838282/1000573694822842409/elite_color.png`)
            .addFields(
                { name: 'Kills', value: kills, inline: true },
                { name: 'Deaths', value: deaths, inline: true },
                { name: 'KD', value: kdr.toFixed(2), inline: true },
                { name: 'Revive', value: revives, inline: true },
                { name: 'Revived', value: revived, inline: true },
                { name: 'RPD', value: rpd.toFixed(2), inline: true },
                { name: 'Wound', value: hits, inline: true },
                { name: 'Wounded', value: wounded, inline: true },
                { name: 'HPR', value: hpr.toFixed(2), inline: true },
                { name: 'TK', value: tks, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: 'Played Match', value: matcheCount ? matcheCount.dataValues.count : 0, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: 'Most Killed', value: mostKilledPlayer ? `${mostKilledPlayer.victimName} (${mostKilledPlayer.dataValues.count})` : "N/A", inline: true },
                { name: 'Most Died', value: mostDiedPlayer ? `${mostDiedPlayer.attackerName} (${mostDiedPlayer.dataValues.count})` : "N/A", inline: true },
                { name: 'Most Revived', value: mostRevivedPlayer ? `${mostRevivedPlayer.victimName} (${mostRevivedPlayer.dataValues.count})` : "N/A", inline: true },
            )
            .setTimestamp()
            .setFooter('WE-STUDIOS | ❤️ SJS ❤️ 11T', 'https://cdn.discordapp.com/attachments/948790710054838282/1000573694822842409/elite_color.png');
        return content;
    }
}