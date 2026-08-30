# Bahi-Khata Architecture Documentation

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              App.jsx (Entry Point)                      │
│                                                                         │
│  - Manages auth state                                                  │
│  - Routes to AuthScreen or AppScreen                                   │
│  - Initializes useAuth & usePortfolio hooks                            │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
    ┌───────────▼──────────────┐  ┌──────────▼────────────────┐
    │   AuthScreen.jsx         │  │   AppScreen.jsx           │
    │  (Login/Signup UI)       │  │ (Main App Container)      │
    │                          │  │                           │
    │  - Email input           │  │  ┌───────────────────┐   │
    │  - Password input        │  │  │ Navigation.jsx    │   │
    │  - Toggle login/signup   │  │  │ (Sidebar Tabs)    │   │
    │  - Error display         │  │  └───────────────────┘   │
    └──────────────────────────┘  │                           │
                                   │  ┌───────────────────┐   │
                                   │  │ Dashboard.jsx     │   │
                                   │  │ (Overview Cards)  │   │
                                   │  └───────────────────┘   │
                                   │                           │
                                   │  ┌───────────────────┐   │
                                   │  │ Portfolio.jsx     │   │
                                   │  │ (Holdings Grid)   │   │
                                   │  └───────────────────┘   │
                                   └───────────────────────────┘
```

## Data Flow Architecture

```
┌──────────────────┐
│  Components      │  (UI Layer - React Components)
│  - AuthScreen    │
│  - AppScreen     │
│  - Dashboard     │
│  - Navigation    │
│  - Portfolio     │
└────────┬─────────┘
         │
         │ useAuth() hook
         │ usePortfolio() hook
         │
    ┌────▼─────────────────┐
    │  Custom Hooks        │  (Business Logic)
    │  - useAuth.js        │
    │  - usePortfolio.js   │
    └────┬──────────────────┘
         │
         │ dispatch actions
         │
    ┌────▼──────────────────────┐
    │  Zustand Store            │  (State Management)
    │  - portfolioStore.js      │
    │  - portfolio data         │
    │  - user data              │
    │  - loading/error states   │
    └────┬───────────────────────┘
         │
         │ read data
         │ call services
         │
    ┌────▼──────────────────────┐
    │  Services                 │  (External APIs)
    │  - supabase.js            │
    │  - authService            │
    │  - holdingsService        │
    │  - subscriptionService    │
    └────┬───────────────────────┘
         │
         │ REST/GraphQL calls
         │
    ┌────▼──────────────────────┐
    │  External Systems         │  (Data Sources)
    │  - Supabase Auth          │
    │  - Supabase Database      │
    │  - Supabase RLS           │
    └───────────────────────────┘

┌────────────────────────┐
│  Utilities             │  (Supporting Functions)
│  - formatters.js       │
│  - calculations.js     │
│  - formSchemas.js      │
│  - sampleData.js       │
└────────────────────────┘
```

## Component Tree with Props

```
App
├── useAuth()
├── usePortfolio()
└── Conditional Render
    ├── AuthScreen
    │   ├── props: { onSignup, onSignin }
    │   └── state: { email, password, isSignup, error, loading }
    │
    └── AppScreen
        ├── props: { user, portfolio, stats, activeTab, onAddHolding, onRemoveHolding }
        ├── state: { navOpen }
        │
        ├── Navigation
        │   ├── props: { tabs, activeTab, onTabChange, isOpen, onClose }
        │   └── structure: 8 tabs (Dashboard, Stocks, MF, Bonds, Loans, Crypto, Gold, Properties, FDs)
        │
        └── Conditional Render (based on activeTab)
            ├── Dashboard
            │   ├── props: { portfolio, stats }
            │   ├── displays: Total P/L, Invested vs Current, 8 category cards
            │   └── uses: formatCurrency, formatPercent, calculatePortfolioStats
            │
            └── Portfolio (for activeTab: stocks/mf/bonds/loans/crypto/gold/properties/fds)
                ├── props: { type, holdings, onAdd, onRemove }
                ├── state: { showModal, formData, errors }
                ├── displays: Holdings grid, Add button, Edit/Delete buttons
                ├── modal: Dynamic form based on formSchemas[type]
                └── uses: formSchemas, formatCurrency, validation
```

## State Management Flow

### Zustand Store (`portfolioStore.js`)

```javascript
const store = {
  // State
  portfolio: {
    stocks: [],      // Array of stock holdings
    mf: [],          // Mutual funds
    bonds: [],       // Bonds
    loans: [],       // Loans
    crypto: [],      // Cryptocurrencies
    gold: [],        // Gold holdings
    properties: [],  // Real estate properties
    fds: []          // Fixed deposits
  },
  currentUser: null,
  loading: false,
  error: null,

  // Setters
  setPortfolio(portfolio) { /* ... */ },
  setCurrentUser(user) { /* ... */ },
  setLoading(loading) { /* ... */ },
  setError(error) { /* ... */ },

  // Actions
  addHolding(type, holding) { /* ... */ },
  removeHolding(type, id) { /* ... */ },
  updateHolding(type, id, updates) { /* ... */ },
  getPortfolioKey(type) { /* maps type to portfolio key */ },

  // Selectors
  getStats() { /* calculates P&L, returns stats */ }
}
```

## Form Schema System (`formSchemas.js`)

```javascript
formSchemas = {
  stocks: [
    { name: 'symbol', label: 'Stock Symbol', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
    { name: 'buy_price', label: 'Buy Price', type: 'number', required: true },
    { name: 'current_price', label: 'Current Price', type: 'number', required: false }
  ],
  // ... same for mf, bonds, loans, crypto, gold, properties, fds
}
```

**Benefits:**
- Single source of truth for all form fields
- Easy to add/modify fields across app
- Automatic validation based on schema
- Type-specific UX

## Data Calculation Pipeline

```
Holdings Data (from Supabase)
    │
    ├─ Stocks: quantity × buy_price = invested amount
    │                    quantity × current_price = current value
    │
    ├─ MF: units × buy_nav = invested
    │      units × current_nav = current value
    │
    ├─ Bonds: quantity (face value) = invested & current
    │
    ├─ Loans: quantity (amount lent) = invested & current
    │
    ├─ Crypto: quantity × buy_price = invested
    │          quantity × current_price = current value
    │
    ├─ Gold: quantity × buy_price = invested
    │        quantity × current_price = current value
    │
    ├─ Properties: quantity (purchase) = invested
    │              buy_price (current) = current value
    │
    └─ FDs: quantity (deposit) = invested & current
            │
            ▼
    calculatePortfolioStats()
            │
    ┌───────┴────────┬──────────────┬──────────────┐
    │                │              │              │
    ▼                ▼              ▼              ▼
  Total        Total Current     Profit/Loss    % Return
  Invested        Value           (P/L)         (P/L%)
            │
            ├─ Breakdown by category
            ├─ Allocation percentages
            └─ Risk metrics (future)
```

## Async Data Flow

### Loading Portfolio on App Start

```
App Mount
    │
    └─▶ usePortfolio(userId)
            │
            └─▶ loadPortfolio()
                    │
                    ├─ setLoading(true)
                    │
                    ├─ holdingsService.getHoldings(userId)
                    │   │
                    │   └─▶ Supabase: SELECT * FROM holdings WHERE user_id = userId
                    │       │
                    │       └─▶ Returns: Array of holdings
                    │
                    ├─ Group holdings by type
                    │   (stocks, mf, bonds, loans, crypto, gold, properties, fds)
                    │
                    ├─ setPortfolio(grouped)
                    │
                    └─ setLoading(false)

Dashboard renders with portfolio data
```

### Adding a New Holding

```
User clicks "Add Stocks"
    │
    └─▶ setShowModal(true)
            │
            ▼
    Modal opens with form
            │
    User fills form:
    - Symbol: TCS
    - Quantity: 50
    - Buy Price: 3500
    - Current Price: 4200
            │
            └─▶ onSubmit
                    │
                    ├─ validateForm()
                    │
                    ├─ onAdd(type='stocks', formData)
                    │   │
                    │   └─▶ usePortfolio.addNewHolding()
                    │       │
                    │       ├─ holdingsService.addHolding(userId, { type: 'stocks', ...data })
                    │       │   │
                    │       │   └─▶ Supabase: INSERT INTO holdings (user_id, type, ...) RETURNING *
                    │       │       │
                    │       │       └─▶ Returns: holding with id
                    │       │
                    │       └─▶ addHolding(type, holding) [Zustand]
                    │
                    ├─ setFormData({})
                    ├─ setShowModal(false)
                    │
                    └─▶ Portfolio component re-renders with new holding
```

## File Organization & Responsibilities

```
/src
├── App.jsx                       - Entry point, auth flow
├── components/
│   ├── AuthScreen.jsx           - Login/signup form
│   ├── AppScreen.jsx            - Main app container
│   ├── Dashboard.jsx            - Portfolio overview (8 categories)
│   ├── Navigation.jsx           - Sidebar navigation (8 tabs)
│   └── Portfolio.jsx            - Holdings grid & add modal (all types)
│
├── hooks/
│   ├── useAuth.js               - Authentication state & methods
│   └── usePortfolio.js          - Portfolio data & CRUD operations
│
├── store/
│   └── portfolioStore.js        - Zustand state management
│
├── services/
│   └── supabase.js              - API calls (auth, holdings, subscriptions, alerts)
│
└── utils/
    ├── formatters.js            - Display formatting (currency, percent, etc.)
    ├── calculations.js          - Portfolio calculations (P&L, stats, analytics)
    ├── formSchemas.js           - Form field definitions for all asset types
    └── sampleData.js            - Test/demo data
```

## Asset Type Support Matrix

| Asset Type | Form Fields | Display Fields | Calculation | Dashboard |
|-----------|------------|-----------------|-------------|-----------|
| Stocks | 4 | 5 | ✅ | ✅ |
| Mutual Funds | 4 | 5 | ✅ | ✅ |
| Bonds | 5 | 3 | ✅ | ✅ |
| Loans | 4 | 2 | ✅ | ✅ |
| Crypto | 4 | 5 | ✅ | ✅ |
| Gold | 4 | 4 | ✅ | ✅ |
| Properties | 4 | 4 | ✅ | ✅ |
| Fixed Deposits | 4 | 2 | ✅ | ✅ |

## Performance Optimizations (Built-in)

1. **Zustand Store** - Efficient, only re-renders affected components
2. **Custom Hooks** - Separate concerns, prevent unnecessary re-renders
3. **Memoization Ready** - Components structured for React.memo optimization
4. **Service Layer** - Single point of API caching
5. **Form Validation** - Client-side before server calls
6. **Lazy Loading Ready** - Code splitting possible with React.lazy()

## Security Considerations

1. **Supabase RLS** - Row Level Security enabled for all tables
2. **Auth State** - Managed through Supabase auth
3. **Data Isolation** - Holdings filtered by user_id
4. **CORS** - Configured in Supabase
5. **Input Validation** - Client-side + server-side validation needed

## Extension Points

### Adding a New Feature
1. Add form schema to `formSchemas.js`
2. Component automatically renders form fields
3. Add calculation logic to `calculations.js`
4. Dashboard card automatically appears
5. Portfolio CRUD works out of the box

### Adding a New Asset Type
1. Add to `formSchemas` with field definitions
2. Initialize in store `portfolio` object
3. Add calculation logic (4-5 lines)
4. Add to Dashboard category cards
5. Add tab to Navigation
6. Done! Full CRUD works

---

**Architecture Version:** 1.0  
**Last Updated:** Week 1 Completion  
**Status:** Production Ready (Core)  
**Next Phase:** Charts & Advanced Analytics (Week 2)
