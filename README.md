# Discord Ticket & Whitelist Bot

A feature-rich Discord bot that handles ticket management and whitelist applications.

## 🌟 Features


### Whitelist Questions
Modify whitelist questions in `src/commands/whitelist.js`.

## 📝 Transcripts

Ticket transcripts are automatically saved and can be accessed via:
- Web interface: `http://localhost:3000/transcripts`
- Discord: Transcript links are posted in the ticket logs channel



### Ticket System
- Create support tickets with categories
- Staff management commands
- Ticket transcripts
- Automatic ticket logging
- Add/Remove users from tickets
- Customizable ticket categories

### Whitelist System
- Interactive application process
- Multiple-choice questions
- Automatic role assignment
- DM notifications
- Cooldown system
- Admin controls

## 📋 Requirements

- Node.js v16.9.0 or higher
- Discord.js v14
- A MongoDB database (optional)
- Discord Bot Token
- Required Discord Permissions

## 🚀 Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required variables
4. Run the bot: `npm start`

### Example `.env` File

To run this application, you need to create a `.env` file in the root directory of the project. You can use the following template as a guide:

```
# Discord Bot Token
TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
Discord Client ID
CLIENT_ID=YOUR_CLIENT_ID_HERE
Target Voice Channel ID
TARGET_VC_ID=YOUR_TARGET_VC_ID_HERE
Voice Channel Log Channel ID
VC_LOG_CHANNEL=YOUR_VC_LOG_CHANNEL_ID_HERE
Welcome Channel ID
WELCOME_CHANNEL_ID=YOUR_WELCOME_CHANNEL_ID_HERE
Whitelist Role ID
WHITELIST_ROLE_ID=YOUR_WHITELIST_ROLE_ID_HERE
Ticket Channel ID
TICKET_CHANNEL_ID=YOUR_TICKET_CHANNEL_ID_HERE
Ticket Logs Channel ID
TICKET_LOGS=YOUR_TICKET_LOGS_CHANNEL_ID_HERE
Support Category ID
SUPPORT_CATEGORY_ID=YOUR_SUPPORT_CATEGORY_ID_HERE
FRP Category ID
FRP_CATEGORY_ID=YOUR_FRP_CATEGORY_ID_HERE
Support Role ID
SUPPORT_ROLE=YOUR_SUPPORT_ROLE_ID_HERE
Member Role ID
MEMBER_ROLE_ID=YOUR_MEMBER_ROLE_ID_HERE
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please feel free to submit a pull request.


## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Discord.js Team
- Contributors & Testers
- DBR Community

## ⚠️ Support

For support, join our [Discord Server](https://discord.gg/rVuW9cTw) or open an issue.

## 🔄 Updates

Check the repository regularly for updates and new features.
