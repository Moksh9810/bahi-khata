// Form schemas for different asset types
export const formSchemas = {
  stocks: [
    { name: 'symbol', label: 'Stock Symbol', type: 'text', placeholder: 'e.g., TCS', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', placeholder: 'No. of shares', required: true },
    { name: 'buy_price', label: 'Buy Price (₹)', type: 'number', placeholder: 'Price per share', step: 0.01, required: true },
    { name: 'current_price', label: 'Current Price (₹)', type: 'number', placeholder: 'Current price per share', step: 0.01, required: false },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  mf: [
    { name: 'scheme', label: 'Scheme Name', type: 'text', placeholder: 'e.g., HDFC Balanced Fund', required: true },
    { name: 'units', label: 'Units Held', type: 'number', placeholder: 'No. of units', step: 0.001, required: true },
    { name: 'buy_nav', label: 'Buy NAV (₹)', type: 'number', placeholder: 'NAV at purchase', step: 0.01, required: true },
    { name: 'current_nav', label: 'Current NAV (₹)', type: 'number', placeholder: 'Current NAV', step: 0.01, required: false },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  bonds: [
    { name: 'name', label: 'Bond Name', type: 'text', placeholder: 'e.g., Government Securities 7%', required: true },
    { name: 'quantity', label: 'Face Value (₹)', type: 'number', placeholder: 'Total face value', required: true },
    { name: 'buy_price', label: 'Purchase Price (₹)', type: 'number', placeholder: 'Price at purchase', step: 0.01, required: true },
    { name: 'coupon_rate', label: 'Coupon Rate (%)', type: 'number', placeholder: '5.5', step: 0.01, required: true },
    { name: 'maturity_date', label: 'Maturity Date', type: 'date', required: true },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  loans: [
    { name: 'name', label: 'Loan Description', type: 'text', placeholder: 'e.g., Personal Loan to Friend', required: true },
    { name: 'quantity', label: 'Amount Lent (₹)', type: 'number', placeholder: 'Total amount', required: true },
    { name: 'buy_price', label: 'Interest Rate (%)', type: 'number', placeholder: 'Annual rate', step: 0.01, required: true },
    { name: 'maturity_date', label: 'Due Date', type: 'date', required: true },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  crypto: [
    { name: 'symbol', label: 'Cryptocurrency', type: 'text', placeholder: 'e.g., BTC, ETH', required: true },
    { name: 'quantity', label: 'Amount Held', type: 'number', placeholder: 'No. of coins', step: 0.00000001, required: true },
    { name: 'buy_price', label: 'Buy Price (₹)', type: 'number', placeholder: 'Price per coin', step: 0.01, required: true },
    { name: 'current_price', label: 'Current Price (₹)', type: 'number', placeholder: 'Current price per coin', step: 0.01, required: false },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  gold: [
    { name: 'name', label: 'Gold Type', type: 'text', placeholder: 'e.g., Physical, SGBs, ETF', required: true },
    { name: 'quantity', label: 'Quantity (grams)', type: 'number', placeholder: 'Weight in grams', step: 0.01, required: true },
    { name: 'buy_price', label: 'Buy Price (₹/gram)', type: 'number', placeholder: 'Price per gram', step: 0.01, required: true },
    { name: 'current_price', label: 'Current Price (₹/gram)', type: 'number', placeholder: 'Current price per gram', step: 0.01, required: false },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  properties: [
    { name: 'name', label: 'Property Address/Name', type: 'text', placeholder: 'e.g., Mumbai Apartment', required: true },
    { name: 'quantity', label: 'Purchase Price (₹)', type: 'number', placeholder: 'Buying amount', required: true },
    { name: 'buy_price', label: 'Current Value (₹)', type: 'number', placeholder: 'Current estimated value', required: true },
    { name: 'rental_income', label: 'Monthly Rental (₹)', type: 'number', placeholder: 'Rental income (optional)', required: false },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  fds: [
    { name: 'name', label: 'Bank/Issuer', type: 'text', placeholder: 'e.g., HDFC Bank', required: true },
    { name: 'quantity', label: 'Deposit Amount (₹)', type: 'number', placeholder: 'FD amount', required: true },
    { name: 'buy_price', label: 'Interest Rate (%)', type: 'number', placeholder: 'Annual rate', step: 0.01, required: true },
    { name: 'maturity_date', label: 'Maturity Date', type: 'date', required: true },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ]
};

export const assetTypeLabels = {
  stocks: 'Stock',
  mf: 'Mutual Fund',
  bonds: 'Bond',
  loans: 'Loan',
  crypto: 'Cryptocurrency',
  gold: 'Gold',
  properties: 'Property',
  fds: 'Fixed Deposit'
};

export const assetTypeIcons = {
  stocks: 'show_chart',
  mf: 'account_balance',
  bonds: 'payments',
  loans: 'real_estate_agent',
  crypto: 'currency_bitcoin',
  gold: 'diamond',
  properties: 'apartment',
  fds: 'savings'
};
