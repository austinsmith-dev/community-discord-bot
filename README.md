# Advanced Discord Moderation & Community Bot

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![MongoDB](https://img.shields.io/badge/database-MongoDB-green)
![License](https://img.shields.io/badge/license-MIT-blue)

A **modular Discord bot built with Node.js and discord.js v14** designed for server moderation, automation, analytics, and community engagement.

This project demonstrates modern backend development concepts including:

* modular command systems
* MongoDB persistence
* event-driven architecture
* structured error monitoring
* scalable bot design

---

# Features

## Moderation System

* Warning system with database tracking
* Moderation logging
* Staff alerts
* Timeout tracking
* Auto moderation filters

## XP & Leveling

* Automatic XP gain
* Level calculation
* XP leaderboard
* Admin XP management

## Modmail System

* Users can DM the bot
* Messages are forwarded to moderators
* Staff can respond directly

## Server Monitoring

* CPU usage reporting
* Memory usage tracking
* Discord API latency
* System diagnostics command

## Music System

* Play music in voice channels
* Stop playback
* Queue support

## Community Tools

* Welcome messages
* Reaction roles
* User lookup commands
* Boost notifications

---

# Architecture

The bot follows a **modular architecture** to maintain scalability and maintainability.

```
bot.js
│
├── src
│
├── commands
│   └── Slash command modules
│
├── events
│   └── Discord event listeners
│
├── handlers
│   ├── commandHandler.js
│   └── eventHandler.js
│
├── utils
│   └── errorHandler.js
│
├── Schemas
│   └── MongoDB database models
│
└── index.js
```

Commands and events are **automatically registered and loaded at runtime**.

---

# Tech Stack

## Core Technologies

| Technology     | Purpose                 |
| -------------- | ----------------------- |
| Node.js        | Runtime environment     |
| discord.js v14 | Discord API framework   |
| MongoDB        | Persistent data storage |
| Mongoose       | MongoDB object modeling |

## Key Libraries

| Library              | Purpose                         |
| -------------------- | ------------------------------- |
| dotenv               | Environment variable management |
| bottleneck           | Rate limiting                   |
| systeminformation    | System monitoring               |
| discord-gamecord     | Discord mini games              |
| musicard             | Music embed cards               |
| discord-alt-detector | Alternate account detection     |

---

# Installation

## 1️. Clone the Repository

```bash
git clone https://github.com/austinsmith-dev/discord-bot.git
cd discord-bot
```

---

## 2️. Install Dependencies

```bash
npm install
```

---

## 3️. Configure Environment Variables

Create a `.env` file in the root directory.

Example:

```
TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_guild_id

BOTNAME='Community Bot'
BOT_STATUS="Watching the server"
NODE_ENV="Development"
SERVER_COLOR="Green"

INVITE_LINK=https://discord.gg/example
MONGO_URL=mongodb_connection_string

STAFF_CHANNEL_ID=your_automod_and_altdetector_channel_id
WELCOME_CHANNEL_ID=your_welcome_channel_id
LOG_CHANNEL_ID=your_log_channel_id
OWNER=your_owner_user_id
MEMBERS_CHANNEL_ID=your_members_stat_channel_id
BOTS_CHANNEL_ID=your_bots_stat_channel_id
BOOSTS_CHANNEL_ID=your_boosts_stat_channel_id
STAFF_ROLE_ID=your_staff_role_id

PERFORMANCE_WEBHOOK_URL=https://discord.com/api/webhooks/...
ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
FALLBACK_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

# Running the Bot

Start the bot using:

```
node bot.js
```

If successful you should see:

```
[Discord API] Bot logged in
[MongoDB API] Connected successfully
```

---

# Commands

Command arguments follow this format:

* `[optional]` → optional parameter
* `<required>` → required parameter
* `(subcommand)` → command sub-option

---

# Community Commands

| Command                     | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `/emoji-info`               | Get information about all emojis in the server.        |
| `/help category <category>` | List all available commands within a category.         |
| `/play <category>`          | Play shuffled music from a specific genre.             |
| `/stop`                     | Stop the music and disconnect the bot from voice.      |
| `/sysinfo`                  | Display system resource usage and latency information. |
| `/user [username/id]`       | Get information about a specific user.                 |
| `/xp leaderboard`           | Display the server XP leaderboard.                     |
| `/xp get [user]`            | View a user's XP and level.                            |

---

# Game Commands

| Command                   | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `/2048`                   | Play a game of 2048.                                 |
| `/connect4 <opponent>`    | Start a game of Connect Four with another user.      |
| `/fasttype`               | Play a typing speed challenge.                       |
| `/flood`                  | Play the Flood puzzle game.                          |
| `/guessthepokemon`        | Guess the Pokémon from the image.                    |
| `/hangman`                | Play a game of Hangman.                              |
| `/matchpairs`             | Play a memory matching game.                         |
| `/minesweeper`            | Play Minesweeper inside Discord.                     |
| `/rps <opponent>`         | Start a Rock Paper Scissors match with another user. |
| `/snake`                  | Play the classic Snake game.                         |
| `/tic-tac-toe <opponent>` | Start a Tic Tac Toe match with another user.         |
| `/wordle`                 | Play a Wordle-style guessing game.                   |
| `/wouldyourather`         | Play a "Would You Rather" question game.             |

---

# Moderation Commands

| Command                                                           | Description                                 |
| ----------------------------------------------------------------- | ------------------------------------------- |
| `/modpanel [target] [reason]`                                     | Moderate a user using a panel interface.    |
| `/purge [option-type] [amount]`                                   | Delete up to 1000 messages by type or user. |
| `/timeout set <user> [days] [hours] [minutes] [seconds] [reason]` | Apply a timeout to a user.                  |
| `/timeout remove <user>`                                          | Remove a timeout from a user.               |
| `/warn create`                                                    | Add a warning to a user.                    |
| `/warn list`                                                      | List warnings for a user.                   |
| `/warn info`                                                      | View details about a specific warning.      |
| `/warn edit`                                                      | Edit an existing warning.                   |
| `/warn remove`                                                    | Remove a specific warning.                  |
| `/warn clear`                                                     | Clear all warnings for a user.              |
| `/xp add <user> <amount>`                                         | Add XP to a user.                           |
| `/xp set <user> <amount>`                                         | Set a user's XP value.                      |
| `/xp remove <user> <amount>`                                      | Remove XP from a user.                      |

---

# Developer / Server Setup Commands

These commands are restricted to administrators.

| Command                                                                     | Description                                          |
| --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/auditlog-setup <channelid>`                                               | Setup the audit log system for the server.           |
| `/auditlog-delete`                                                          | Remove the audit logging system.                     |
| `/auto-role set`                                                            | Configure an automatic role given when members join. |
| `/auto-role remove`                                                         | Remove the automatic role system.                    |
| `/modmail-dev setup`                                                        | Configure the modmail system.                        |
| `/modmail-dev disable`                                                      | Disable modmail.                                     |
| `/modmail-dev close`                                                        | Close an active modmail conversation.                |
| `/reaction-role-add <messageid> <role> <button-type> (emoji)`               | Add a button to an existing reaction role message.   |
| `/reaction-role-create <title> <description> <channel> [image] [thumbnail]` | Create a new reaction role message.                  |
| `/reaction-role-delete <messageid>`                                         | Delete a reaction role message by ID.                |
| `/rules`                                                                    | Send the server rules message.                       |
| `/testautomod <message>`                                                    | Test the automoderation system.                      |
| `/testerror <option-type>`                                                  | Trigger test errors for debugging the error handler. |

---

# Music System

Due to **GitHub repository file size limits**, the bot does **not include music files by default**.

Users must add their own audio files locally.

---

## Creating Music Folders

Create a folder inside the `/assets/` directory for each music category.

Example:

```
/assets
   /lofi
   /christmas
```

Each folder should contain the audio files you want played when the category is selected.

Example:

```
/assets/lofi/song1.mp3
/assets/lofi/song2.mp3
/assets/lofi/song3.mp3

/assets/christmas/song1.mp3
/assets/christmas/song2.mp3
/assets/christmas/song3.mp3
```

---

## Editing the `/play` Command

To add your music categories, edit the `/play` command and define the categories you want available.

Example command option:

```javascript
{
  name: "Lofi", value: "lofi",
  name: "Christmas", value: "christmas",
}
```

You should also update the directory path used in the command to match the folder you created inside `/assets`.

Example:

```javascript
const GENRE_PATHS = {
  lofi: 'lofi',
  christmas: 'christmas'
};

const genreNames = {
  lofi: 'Lofi',
  christmas: 'Christmas'
};
```

---

## Example Usage

```
/play Lofi
/play Christmas
```

The bot will:

1. Select a random audio file from the category folder
2. Join the user's voice channel
3. Begin playback

---

**Important**

The bot **requires audio files to exist locally** in order for the music system to function.

If the folder or files are missing, the `/play` command will fail.

---

# Notes

* Music files are intentionally excluded from the repository.
* This allows the bot to stay within GitHub size limits.
* Server owners can customize music categories freely.

---

# Automatic Moderation System (AutoMod)

This bot includes a configurable **automatic moderation (AutoMod) system** designed to detect and filter harmful or rule-breaking content in your Discord server.

The AutoMod system runs automatically on incoming messages and can detect:

* spam patterns
* offensive language
* malicious links
* excessive mentions
* other configurable moderation triggers

When a violation is detected, the system can automatically take actions such as:

* deleting the message
* warning the user
* logging the event
* notifying moderators

---

# Configuration File

The AutoMod system uses a configuration file:

```
automod.json
```

This file contains the **pattern filters and moderation rules** used by the bot.

However, the **full configuration file is intentionally NOT included in this repository**.

### Reason

Publishing the full rule set could expose:

* offensive or harmful word lists
* moderation trigger patterns
* abuse detection rules

Including these publicly could violate **GitHub content policies** and also allow users to **bypass moderation filters**.

For this reason, the repository instead includes:

```
automod.example.json
```

---

# Creating Your AutoMod Configuration

To enable the automod system:

1. Copy the example file

```
automod.example.json
```

2. Rename it to

```
automod.json
```

3. Customize the moderation rules for your server.

---

# Example Configuration

Below is a simplified example of what the configuration may look like.

```json
{
  "moderationWords": [
    "this", "will", "be", "removed", "\b[A-Z][a-z]+\b"
    ]
  }
```

---

# AutoMod Actions

AutoMod can perform actions such as:

| Action         | Description                                         |
| -------------- | --------------------------------------------------- |
| Delete Message | Removes messages that violate rules                 |
| Warn User      | Adds a warning to the user database                 |
| Log Event      | Sends moderation logs to the configured log channel |
| Notify Staff   | Alerts moderators about violations                  |

---

# Testing AutoMod

The bot includes a command to test the moderation system:

```
/testautomod <message>
```

This allows server administrators to simulate messages and confirm that the AutoMod filters are functioning correctly.

---

# Notes

* The example configuration is intentionally simplified.
* Server owners should customize the rule set to match their moderation policies.
* Always review AutoMod settings to prevent false positives.


---

# Database Systems

The bot uses MongoDB schemas to store persistent data.

### Stored Data

* XP and leveling
* Warnings
* Modmail conversations
* Server logs
* Auto role configuration

---

# Security Features

* Secrets stored using environment variables
* Moderation logging for accountability
* Rate limiting to prevent spam
* Command validation
* Error monitoring system

---

# Error Monitoring

The bot includes centralized error handling.

Errors are:

* captured globally
* logged to console
* optionally sent to a Discord webhook

This allows **real-time monitoring in production environments**.

---

# Deployment

This bot can be deployed on:

* VPS servers
* cloud platforms
* container environments
* home servers

Recommended hosting platforms:

* Railway
* Render
* DigitalOcean
* AWS EC2
* self-hosted Linux servers

---

# Project Structure

```
.
├── bot.js
├── package.json
├── .env.example
│
├── src
│   ├── commands
│   ├── events
│   ├── handlers
│   ├── utils
│   └── Schemas
```

---

# Development

To run in development mode:

```
node bot.js
```

Future improvements could include:

* sharding support
* Redis caching
* dashboard UI
* Docker deployment

---

# Contributing

Contributions are welcome.

To contribute:

1. Fork the repository
2. Create a new branch
3. Submit a pull request

---

# License

MIT License

---

# Author

Austin Smith – Information Technology – Southern New Hampshire University
