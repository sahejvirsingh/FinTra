export function formatCurrency(amount: number, currency: string) {
  // Use 'en-US' locale as a stable base for formatting, the currency code will determine the symbol
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  }).format(amount);
}
