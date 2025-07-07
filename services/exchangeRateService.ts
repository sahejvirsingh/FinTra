import { Currency } from "../types";

const API_URL = 'https://api.exchangerate-api.com/v4/latest/';

interface ExchangeRateResponse {
  rates: {
    [key in Currency]?: number;
  };
  base: Currency;
  date: string;
}

export const getExchangeRate = async (
  baseCurrency: Currency,
  targetCurrency: Currency
): Promise<number | null> => {
  if (baseCurrency === targetCurrency) {
    return 1;
  }
  try {
    const response = await fetch(`${API_URL}${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    const data: ExchangeRateResponse = await response.json();
    const rate = data.rates[targetCurrency];
    return rate || null;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
};
