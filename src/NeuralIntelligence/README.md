# 🧠 Neural Intelligence Module

## Overview

Neural Intelligence is a **fully modular AI trading system** for cryptocurrency platforms. It provides:
- 🤖 AI-powered trading signals and analysis
- ⚙️ Multiple strategy management (Trend Following, Mean Reversion, Arbitrage, Volume Analysis)
- 🛡️ Risk management with configurable limits
- 📊 Real-time signal monitoring and activity logging
- 🎮 Three operating modes: Advisory, Semi-Automatic, Automated

## ✨ Key Features

- **Modular & Portable** - All files contained in one directory, can be moved anywhere
- **React Hooks** - Modern functional components with hooks
- **Context-Aware** - Integrates with existing wallet systems via context
- **Mock API** - Placeholder functions ready to connect to real backend
- **Responsive** - Mobile-first design, works on all screen sizes
- **Beautiful UI** - Modern glassmorphism design with smooth animations

---

## 📁 File Structure

```
src/NeuralIntelligence/
├── index.js                          # Main export file
├── NeuralIntelligencePage.jsx        # Main page component
├── api/
│   └── neuralIntelligence.js         # API layer (placeholder functions)
├── components/
│   ├── StatusCard.jsx                # AI status & mode selector
│   ├── StrategiesCard.jsx            # Strategy management
│   └── SignalsActivityCard.jsx       # Signals & activity log
├── data/
│   └── mockSignals.js                # Mock data for development
└── styles/
    └── NeuralIntelligence.css        # All styling
```

---

## 🚀 Quick Integration

### 1. Import the Module

```javascript
import { NeuralIntelligencePage } from './NeuralIntelligence';
```

### 2. Add to Router (React Router example)

```javascript
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { NeuralIntelligencePage } from './NeuralIntelligence';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/ai/neural" element={<NeuralIntelligencePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 3. Use in Tabs/Pages

```javascript
const [activeTab, setActiveTab] = useState('neural');

return (
  <div>
    {activeTab === 'neural' && <NeuralIntelligencePage />}
  </div>
);
```

---

## 🔌 Dependencies

The module requires these packages (already common in React projects):

```json
{
  "react": "^18.x",
  "react-toastify": "^9.x",
  "lucide-react": "^0.x"
}
```

**Optional:** Wallet context integration (see below)

---

## 🔧 Configuration

### Wallet Integration

The module expects a `WalletContext` with:

```javascript
{
  walletAddress: string,    // Connected wallet address
  isConnected: boolean       // Connection status
}
```

**To adapt to your project:**

1. Open `src/NeuralIntelligence/NeuralIntelligencePage.jsx`
2. Replace this line:
   ```javascript
   import WalletContext from '../../context/WalletContext';
   ```
   With your wallet context path:
   ```javascript
   import WalletContext from '../path/to/your/WalletContext';
   ```

**OR** if you don't use context, remove wallet checks:

```javascript
// Remove these lines:
const { walletAddress, isConnected } = useContext(WalletContext);

// Replace with:
const walletAddress = '0x...'; // Your wallet address source
const isConnected = true;      // Your connection status
```

### Backend API Connection

Replace mock functions in `api/neuralIntelligence.js`:

**Before (Mock):**
```javascript
export async function getAiStatus() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { mode: 'Advisory', status: 'Online', ... };
}
```

**After (Real API):**
```javascript
export async function getAiStatus() {
  const response = await fetch('https://your-api.com/ai/status');
  return await response.json();
}
```

---

## 📦 Moving to Another Domain/Project

### Option 1: Copy Entire Folder

```bash
# Copy the entire module
cp -r src/NeuralIntelligence /path/to/new-project/src/

# Update imports if needed
```

### Option 2: NPM Package (Advanced)

Create `package.json` inside `NeuralIntelligence/`:

```json
{
  "name": "@yourorg/neural-intelligence",
  "version": "1.0.0",
  "main": "index.js",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-toastify": "^9.0.0",
    "lucide-react": "^0.200.0"
  }
}
```

Then publish or use as local package.

---

## 🎨 Customization

### Change Color Scheme

Edit `styles/NeuralIntelligence.css`:

```css
/* Primary accent color */
#00FFA3 → Your color

/* Success color */
#00FFA3 → Your success color

/* Danger color */
#E6444D → Your danger color

/* Warning color */
#FFC107 → Your warning color
```

### Add New Strategies

Edit `data/mockSignals.js`:

```javascript
export const mockStrategies = [
  ...existing,
  {
    id: 'your-strategy',
    name: 'Your Strategy Name',
    enabled: false,
    riskLevel: 'Balanced',
    description: 'Your description',
    performance: { winRate: 70, avgProfit: 3.5, tradesLast30d: 20 }
  }
];
```

---

## 🧪 Testing

All functions use mocked data by default:

```javascript
import { NeuralAPI } from './NeuralIntelligence';

// Test API calls
const status = await NeuralAPI.getAiStatus();
const signals = await NeuralAPI.getAiSignals(10);
const config = await NeuralAPI.getAiConfig();
```

---

## 📱 Responsive Breakpoints

- **Desktop:** > 1024px (3-column layout)
- **Tablet:** 768px - 1024px (2-column layout)
- **Mobile:** < 768px (1-column layout)

---

## 🐛 Common Issues

### Issue: Icons not showing

**Solution:** Install lucide-react:
```bash
npm install lucide-react
```

### Issue: Toast notifications not working

**Solution:** Wrap app with ToastContainer:
```javascript
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <YourApp />
      <ToastContainer theme="dark" position="top-right" />
    </>
  );
}
```

### Issue: WalletContext error

**Solution:** See "Wallet Integration" section above to adapt to your context.

---

## 📄 License

This module is part of the BitSwapDEX_AI project.

---

## 🤝 Contributing

To add features or fix bugs:

1. Modify files in `src/NeuralIntelligence/`
2. Keep API layer separated (never mix API logic with UI)
3. Update mock data in `data/mockSignals.js` for new features
4. Test responsive design on mobile/tablet/desktop
5. Document changes in this README

---

## 📞 Support

For questions or issues with the Neural Intelligence module, contact the development team.

---

**Built with ❤️ for BitSwapDEX_AI**

