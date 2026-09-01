# MYWEALTH Architecture Documentation

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.jsx (Entry Point)                  │
│                                                                 │
│  - Manages auth state                                           │
│  - Routes to AuthScreen or AppScreen                            │
│  - Initializes useAuth & usePortfolio hooks                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
    ┌───────────▼──────────┐  ┌──────▼────────────────┐
    │   AuthScreen.jsx     │  │   AppScreen.jsx       │
    │  (Login/Signup UI)   │  │ (Main App Container)  │
    │                      │  │                       │
    │  - Email input       │  │  ┌──────────────────┐│
    │  - Password input    │  │  │ Navigation.jsx   ││
    │  - Toggle login      │  │  │ (Sidebar Tabs)   ││
    │  - Error display     │  │  └──────────────────┘│
    └──────────────────────┘  │                       │
                               │  ┌──────────────────┐│
                               │  │ Dashboard.jsx    ││
                               │  │ (Overview Cards) ││
                               │  └──────────────────┘│
                               │                       │
                               │  ┌──────────────────┐│
                               │  │ Portfolio.jsx    ││
                               │  │ (Holdings Grid)  ││
                               │  └──────────────────┘│
                               └───────────────────────┘
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
|-----------|------------|-----------------|-------------|----------|
| Stocks | 4 | 5 | ✅ | ✅ |
| Mutual Funds | 4 | 5 | ✅ | ✅ |
| Bonds | 5 | 3 | ✅ | ✅ |
| Loans | 4 | 2 | ✅ | ✅ |
| Crypto | 4 | 5 | ✅ | ✅ |
| Gold | 4 | 4 | ✅ | ✅ |
| Properties | 4 | 4 | ✅ | ✅ |
| Fixed Deposits | 4 | 2 | ✅ | ✅ |

---

**Application Name:** MYWEALTH  
**Architecture Version:** 1.0  
**Status:** Production Ready (Core)