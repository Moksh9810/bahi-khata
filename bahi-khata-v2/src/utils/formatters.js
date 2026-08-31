// Format currency in Indian Rupees.
// The sign goes in front of the symbol: -₹9,096, not ₹-9,096.
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '₹0';
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return sign + '₹' + Math.abs(rounded).toLocaleString('en-IN');
};

// Format percentage
export const formatPercent = (value, decimals = 2) => {
  if (!value && value !== 0) return '0%';
  return (parseFloat(value).toFixed(decimals)) + '%';
};

// Format date
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format number with commas
export const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return '0';
  return parseFloat(value).toFixed(decimals).toLocaleString('en-IN');
};

// Get color based on value (positive/negative)
export const getColorByValue = (value) => {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-error';
  return 'text-on-surface';
};

// Get icon class based on value
export const getIconByValue = (value) => {
  if (value > 0) return 'trending_up';
  if (value < 0) return 'trending_down';
  return 'trending_flat';
};

// Format large numbers (1.2M, 500K, etc)
export const formatCompactNumber = (value) => {
  if (!value && value !== 0) return '0';

  const absValue = Math.abs(value);

  if (absValue >= 10000000) {
    return (value / 10000000).toFixed(1) + 'Cr';
  }
  if (absValue >= 100000) {
    return (value / 100000).toFixed(1) + 'L';
  }
  if (absValue >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }

  return value.toFixed(0);
};

// Truncate long text
export const truncateText = (text, length = 20) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};
