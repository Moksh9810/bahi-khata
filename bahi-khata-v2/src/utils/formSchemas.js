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
    { name: 'name', label: 'Bond Name', type: 'text', placeholder: 'e.g., SGB 2028', required: true },
    { name: 'quantity', label: 'Total Face Value (₹)', type: 'number', placeholder: 'e.g., 40000', required: true },
    { name: 'buy_price', label: 'Total Purchase Price (₹)', type: 'number', placeholder: 'e.g., 39500', step: 0.01, required: true },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: true },
    { name: 'interest_rate', label: 'Interest Rate (%)', type: 'number', placeholder: 'Annual rate (e.g., 5.5)', step: 0.01, required: false },
    { name: 'payout_frequency', label: 'Payout Frequency', type: 'select', options: ['Cumulative (At Maturity)', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'], required: true },
    { name: 'current_price', label: 'Total Current Market Price (₹)', type: 'number', placeholder: 'Manual total current price', step: 0.01, required: false }
  ],

  loans: [
    { name: 'name', label: 'Borrower Name / Loan Title', type: 'text', placeholder: 'e.g., Personal Loan', required: true },
    { name: 'quantity', label: 'Principal Amount (₹)', type: 'number', placeholder: 'Amount lent', required: true },
    { name: 'purchase_date', label: 'Issue Date', type: 'date', required: true },
    { name: 'interest_rate', label: 'Interest Rate (%)', type: 'number', placeholder: 'Annual rate', step: 0.01, required: false },
    { name: 'payout_frequency', label: 'Return Type', type: 'select', options: ['Monthly Fixed (EMI)', 'Quarterly', 'Yearly', 'At Maturity'], required: true },
    { name: 'payout_amount', label: 'Fixed Return Amount (₹)', type: 'number', placeholder: 'EMI or payout amount', step: 0.01, required: false }
  ],

  crypto: [
    { name: 'symbol', label: 'Cryptocurrency', type: 'text', placeholder: 'e.g., BTC, ETH', required: true },
    { name: 'quantity', label: 'Amount Held', type: 'number', placeholder: 'No. of coins', step: 0.00000001, required: true },
    { name: 'buy_price', label: 'Buy Price (₹)', type: 'number', placeholder: 'Price per coin', step: 0.01, required: true },
    { name: 'current_price', label: 'Current Price (₹)', type: 'number', placeholder: 'Current price per coin', step: 0.01, required: false },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', required: false },
  ],

  gold: [
    { name: 'name', label: 'Gold Type', type: 'text', placeholder: 'e.g., 22K jewellery, 24K coins, SGB', required: true },
    { name: 'quantity', label: 'Quantity (grams)', type: 'number', placeholder: 'Weight in grams', step: 0.01, required: true },
    { name: 'buy_price', label: 'Buy Price (₹/gram)', type: 'number', placeholder: 'Price per gram', step: 0.01, required: true },
    { name: 'current_price', label: 'Current Price (₹/gram)', type: 'number', placeholder: 'Filled automatically from the live rate', step: 0.01, required: false },
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