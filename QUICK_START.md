# Bahi-Khata Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ (LTS recommended)
- npm or yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation Steps

```bash
# Navigate to project directory
cd /tmp/bahi-khata-v2

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## 📱 Using the Application

### 1. Authentication Flow

#### Sign Up
1. Open app → "Don't have an account?" → "Sign Up"
2. Enter email (e.g., user@example.com)
3. Enter password (min 6 characters)
4. Click "Sign Up"
5. Account created, logged in automatically

#### Sign In
1. Open app → Enter email and password
2. Click "Login"
3. Redirected to Dashboard

#### Logout
1. Click logout icon (top-right)
2. Redirected to login screen

### 2. Dashboard Overview

**After login, you see:**
- Total Portfolio P&L (top, large number)
- Percentage return (badge next to P&L)
- Invested amount (total money put in)
- Current Value (total portfolio worth today)
- 8 Category Cards showing:
  - Stocks, Mutual Funds, Bonds, Loans
  - Crypto, Gold, Properties, Fixed Deposits

**Each category shows:**
- Icon and name
- Current value
- Return percentage (green if positive, red if negative)

### 3. Managing Holdings

#### Add a Holding

**For Stocks:**
1. Click "Stocks" tab in sidebar
2. Click "Add Stock" button
3. Fill form:
   - Symbol (e.g., TCS, INFY, RELIANCE)
   - Quantity (number of shares)
   - Buy Price (₹ per share)
   - Current Price (optional)
4. Click "Save"
5. Holding appears in grid below

**For Other Asset Types:**
Same process, but form fields change:
- Mutual Funds: Scheme, Units, NAV
- Bonds: Name, Face Value, Coupon Rate, Maturity
- Loans: Description, Amount, Rate, Due Date
- Crypto: Symbol, Amount, Buy Price
- Gold: Type, Grams, Price per gram
- Properties: Address, Purchase, Current Value, Rental
- FDs: Bank, Amount, Rate, Maturity Date

#### Edit a Holding
1. Click "Edit" button on holding card (pencil icon)
2. Form opens with current data (feature ready, backend needs implementation)
3. Update fields
4. Click "Save"

#### Delete a Holding
1. Click "Delete" button on holding card (trash icon)
2. Holding removed immediately
3. Portfolio updates in real-time

### 4. Navigating Asset Types

**Sidebar Navigation (Desktop)**
- Always visible on left
- Click any tab to view holdings
- Active tab highlighted in purple

**Mobile Navigation**
- Click hamburger menu (top-left)
- Select category
- Menu closes automatically

**Available Categories (8 total)**
```
1. Dashboard       - Portfolio overview
2. Stocks         - Stock holdings
3. Mutual Funds   - MF investments
4. Bonds          - Bond portfolio
5. Loans          - Money lent
6. Crypto         - Cryptocurrency
7. Gold           - Gold holdings
8. Properties     - Real estate
9. Fixed Deposits - FDs and savings
```

### 5. Understanding Calculations

#### Portfolio P/L Calculation
```
For each holding:
  Profit/Loss = Current Value - Invested Amount

For Stocks & Crypto:
  Invested = Quantity × Buy Price
  Current = Quantity × Current Price
  P/L = Current - Invested

For Mutual Funds:
  Invested = Units × Buy NAV
  Current = Units × Current NAV
  P/L = Current - Invested

For Bonds, Loans, FDs:
  P/L ≈ 0 (principal stays same, interest accrues)

For Gold:
  Invested = Quantity × Buy Price
  Current = Quantity × Current Price
  P/L = Current - Invested

For Properties:
  Invested = Purchase Price
  Current = Current Value
  P/L = Current - Invested

Total Portfolio P/L = Sum of all P/L
```

#### Return Percentage
```
Return % = (Total P/L / Total Invested) × 100
```

---

## 🧪 Testing the Application

### Test Scenario 1: Full Portfolio Setup

```
1. Add 2 stocks:
   - TCS: 50 shares @ ₹3500, current ₹4200
   - INFY: 30 shares @ ₹1800, current ₹1950

2. Add 2 mutual funds:
   - HDFC Growth: 500 units @ ₹150, current ₹185
   - AXIS Balance: 300 units @ ₹120, current ₹135

3. Add 1 bond:
   - Gov Sec 7%: ₹100,000 face value

4. Add 1 loan:
   - Friend loan: ₹50,000

5. Check Dashboard:
   - Total Invested ≈ ₹553,000
   - Current Value ≈ ₹641,500
   - P/L ≈ ₹88,500
   - Return ≈ 16%
```

### Test Scenario 2: Crypto Investor

```
1. Add 0.5 BTC @ ₹28,00,000, current ₹31,00,000
2. Add 10 ETH @ ₹2,00,000, current ₹2,20,000
3. View Crypto tab
4. See portfolio value and gains
```

### Test Scenario 3: Real Estate Portfolio

```
1. Add property:
   - Mumbai Apt: ₹25 lacs purchased, now ₹32 lacs
   - Rental: ₹25,000/month

2. Add gold:
   - 100 grams @ ₹6,300/gram, current ₹6,500/gram

3. Add FD:
   - ₹5 lacs @ 7.5% interest, matures 2027

4. View in Dashboard
```

---

## 🎨 Understanding the UI

### Color Scheme

- **Primary (Purple)**: #D0BCFF - Buttons, active states, highlights
- **Success (Green)**: #4ADE80 - Positive returns, gains
- **Error (Red)**: #FFB4AB - Negative returns, losses
- **Surface**: Dark backgrounds with glass morphism effect

### Interactive Elements

**Buttons**
- Primary Button (Purple): Main actions
- Secondary Button (Border): Cancel, alternative actions
- Icon Buttons: Edit, Delete, Menu

**Forms**
- Required fields marked with *
- Real-time validation with error messages
- Clear on submission
- Scrollable on mobile

**Cards**
- Glass morphism effect (blur + transparency)
- Hover effects on desktop
- Touch-friendly on mobile

---

## ⚠️ Known Limitations (Week 1)

1. **Edit Functionality** - Edit button scaffolded, backend needed
2. **No Charts** - Charts coming Week 2
3. **No Analytics** - Advanced metrics coming Week 2
4. **No Export** - PDF export coming Week 3
5. **Light Mode** - Dark mode only, light mode Week 3
6. **No Mobile App** - React Native coming Week 4
7. **No Payments** - Razorpay integration Week 5

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Use different port
npm run dev -- --port 3000
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styles Not Loading
```bash
# Rebuild Tailwind
npm install -D tailwindcss postcss autoprefixer
npm run dev
```

### Form Not Submitting
- Check browser console (F12) for errors
- Verify all required fields filled
- Try different email if auth issue

---

## 📊 Sample Data

To test with pre-filled data, the app includes `sampleData.js`:

```javascript
import { samplePortfolio } from './utils/sampleData';

// Use in your component:
// const { portfolio } = samplePortfolio;
```

This gives you:
- 2 stocks (TCS, INFY)
- 2 mutual funds (HDFC, AXIS)
- 1 bond (Gov Sec)
- 1 loan (Personal)
- 1 crypto (BTC)
- 1 gold (100g)
- 1 property (Mumbai)
- 1 FD (HDFC Bank)

---

## 🚀 Next Steps

### Week 2: Charts & Analytics
- Portfolio growth chart
- Asset allocation pie chart
- Category performance bars
- Sharpe ratio calculation
- Volatility metrics

### Week 3: Premium Features
- Light/dark theme toggle
- PDF export
- ITR compliance report
- Onboarding flow
- Loading skeletons

### Week 4: Mobile App
- React Native version
- iOS & Android builds
- Offline support
- Push notifications

### Week 5: Monetization
- Razorpay integration
- Premium subscription plans
- Feature gating
- Freemium model

---

## 📚 Files & Structure

```
/tmp/bahi-khata-v2/
├── src/
│   ├── App.jsx                 - Main entry
│   ├── components/             - React components
│   ├── hooks/                  - Custom hooks
│   ├── store/                  - Zustand store
│   ├── services/               - API calls
│   └── utils/                  - Helpers
├── tailwind.config.js          - Stitch colors
├── vite.config.js              - Vite config
├── package.json                - Dependencies
├── WEEK1_COMPLETION.md         - Week 1 summary
├── ARCHITECTURE.md             - System design
└── QUICK_START.md              - This file
```

---

## 📞 Support

### Common Questions

**Q: How do I change the buy price?**
A: Edit functionality ready in UI, backend implementation needed for Week 2.

**Q: Can I export to Excel?**
A: PDF export coming Week 3. Excel coming Week 4.

**Q: Does this work offline?**
A: Currently requires internet. Offline mode coming Week 4 (mobile app).

**Q: How secure is my data?**
A: Uses Supabase with Row Level Security (RLS). Your data is encrypted and isolated.

**Q: Can I sync across devices?**
A: Yes, Supabase syncs in real-time across all devices.

---

## 🎯 Key Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Ready | Email/password login |
| 8 Asset Types | ✅ Ready | Full CRUD support |
| Portfolio Dashboard | ✅ Ready | Overview of all holdings |
| P&L Calculation | ✅ Ready | Real-time, all asset types |
| Responsive Design | ✅ Ready | Mobile, tablet, desktop |
| Dark Theme | ✅ Ready | Stitch design system |
| Add Holding | ✅ Ready | Dynamic forms |
| Edit Holding | 🔄 Partial | UI ready, backend needed |
| Delete Holding | ✅ Ready | Instant removal |
| Charts | 📋 Week 2 | Line, pie, bar charts |
| Advanced Analytics | 📋 Week 2 | Sharpe ratio, volatility |
| PDF Export | 📋 Week 3 | Annual reports |
| Light Mode | 📋 Week 3 | Theme toggle |
| Mobile App | 📋 Week 4 | React Native |
| Premium Plans | 📋 Week 5 | Razorpay integration |

---

**Version:** 1.0.0  
**Last Updated:** Week 1 (Days 1-5)  
**Status:** Alpha Ready  
**Next Release:** Week 2 (Charts & Analytics)
