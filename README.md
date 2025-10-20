# 🎁 FF Project - AI Rewards Hub & Portfolio Analytics

Advanced Web3 application with AI-powered portfolio analytics and enhanced rewards system.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
=======
# 🤖 Unified Telegram Bots Service

**BitSwapDEX Telegram Bots** - Unified service running both Simple Bot and AI Bot in a single Render worker service.

## 🚀 Features

### 🤖 Simple Bot
- **User Tracking**: Monitor user activity and engagement
- **Commands**: `/help`, `/price`, `/cell`, `/stats`, `/activity`, `/myreward`, `/register`
- **Automated Messages**: Real-time updates every 5 minutes
- **Live Data**: Fetches data from backend API with price correction
- **Database**: PostgreSQL integration for user activity

### 🧠 AI Bot
- **OpenAI Integration**: Powered by GPT for intelligent responses
- **BITS Documentation**: Comprehensive knowledge about BitSwapDEX
- **Natural Language**: Responds to questions about BITS project
- **Context Awareness**: Understands crypto and blockchain queries

## 💰 Cost
- **$7/month** - Single Render worker service
- **Both bots** running in one service
- **24/7 availability**

## 🔧 Configuration

### Environment Variables
```env
# Telegram Bot Tokens
TELEGRAM_BOT_TOKEN=7094285105:AAHLMP_ITMBNgug1xvYtp45B0aYw6aRzvDM
TELEGRAM_AI_BOT_TOKEN=7738929253:AAFnr7Y-WvQUOpVn7ikKfPPYNbR8RFEFnG8

# Telegram Group ID
TELEGRAM_GROUP_ID=-1002179349195

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Database Configuration
DATABASE_PASSWORD=your_database_password

# API URLs
BACKEND_API_URL=https://backend-server-f82y.onrender.com
FRONTEND_API_URL=https://bits-ai.io
```

## 📦 Files Structure
```
telegram-bots-deploy/
├── unified-bots.js          # Main service file
├── simple-bot.js            # Simple bot implementation
├── bot.js                   # AI bot implementation
├── ask-gpt.js              # OpenAI integration
├── docs.md                 # BITS documentation
├── package.json            # Dependencies
├── render.yaml             # Render deployment config
└── README.md               # This file
```

## 🚀 Deployment

### Render Deployment
1. Create new repository on GitHub
2. Push this code to the repository
3. Connect to Render
4. Deploy using `render.yaml` configuration
5. Set environment variables in Render dashboard

### Local Testing
```bash
npm install
npm start
```

## 📊 Data Sources
- **Primary**: Backend API (https://backend-server-f82y.onrender.com)
- **Fallback**: Frontend API (https://bits-ai.io)
- **Simulation**: Local data (if APIs unavailable)

## 🔄 Automated Features
- **Price Updates**: Every 5 minutes
- **User Activity Tracking**: Real-time
- **Database Sync**: PostgreSQL integration
- **Error Handling**: Graceful fallbacks

## 🛠️ Commands

### Simple Bot Commands
- `/help` - Show available commands
- `/price` - Get current BITS price
- `/cell` - Get cell status and statistics
- `/stats` - Advanced statistics
- `/activity` - Check your activity
- `/myreward` - Check your rewards
- `/register` - Register for tracking

### AI Bot Interactions
- Ask questions about BITS
- Get information about BitSwapDEX
- Crypto and blockchain queries
- Natural language responses

## 📈 Monitoring
- **Heartbeat**: Every minute
- **Error Logging**: Comprehensive error handling
- **Database Connection**: Automatic fallback
- **API Health**: Multiple fallback sources

## 🔒 Security
- **Environment Variables**: Secure token storage
- **Database SSL**: Encrypted connections
- **API Keys**: Protected configuration
- **Error Handling**: No sensitive data exposure

## 📞 Support
For issues or questions, contact the BitSwapDEX development team.

---
**BitSwapDEX Team** | **Version 1.0.0** | **MIT License**
>>>>>>> d57d2cbc012c01e57d4e4dc15346c51c7becdd77
