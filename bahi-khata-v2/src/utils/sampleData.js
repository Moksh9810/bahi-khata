// Sample portfolio data for demonstration and testing
export const samplePortfolio = {
  stocks: [
    {
      id: '1',
      symbol: 'TCS',
      quantity: 50,
      buy_price: 3500,
      current_price: 4200
    },
    {
      id: '2',
      symbol: 'INFY',
      quantity: 30,
      buy_price: 1800,
      current_price: 1950
    }
  ],

  mf: [
    {
      id: '3',
      scheme: 'HDFC Growth Fund',
      units: 500,
      buy_nav: 150,
      current_nav: 185
    },
    {
      id: '4',
      scheme: 'AXIS Balance Advantage',
      units: 300,
      buy_nav: 120,
      current_nav: 135
    }
  ],

  bonds: [
    {
      id: '5',
      name: 'Government Securities 7%',
      quantity: 100000,
      buy_price: 98000,
      coupon_rate: 7,
      maturity_date: '2029-12-31'
    }
  ],

  loans: [
    {
      id: '6',
      name: 'Personal Loan to Rajesh',
      quantity: 50000,
      buy_price: 8,
      maturity_date: '2026-12-31'
    }
  ],

  crypto: [
    {
      id: '7',
      symbol: 'BTC',
      quantity: 0.5,
      buy_price: 2800000,
      current_price: 3100000
    }
  ],

  gold: [
    {
      id: '8',
      name: 'Physical Gold',
      quantity: 100,
      buy_price: 6300,
      current_price: 6500
    }
  ],

  properties: [
    {
      id: '9',
      name: 'Mumbai Apartment',
      quantity: 2500000,
      buy_price: 3200000,
      rental_income: 25000
    }
  ],

  fds: [
    {
      id: '10',
      name: 'HDFC Bank FD',
      quantity: 500000,
      buy_price: 7.5,
      maturity_date: '2027-06-30'
    }
  ]
};

// Expected portfolio stats for sample data
export const expectedStats = {
  invested: 4553000, // Total invested amount
  currentValue: 5241500, // Total current value
  pl: 688500, // Profit/Loss
  pctReturn: 15.13 // Percentage return
};
