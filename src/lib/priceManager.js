// lib/priceManager.js

// Simple in-memory price store (for server-side usage)
let currentPricePerKg = 1500;

// Initialize price from environment variable or default
export const initializePrice = () => {
  currentPricePerKg = Number(process.env.DEFAULT_PRICE_PER_KG) || 1500;
  return currentPricePerKg;
};

// Get current price
export const getCurrentPrice = () => {
  return currentPricePerKg;
};

// Set new price
export const setCurrentPrice = (newPrice) => {
  currentPricePerKg = Number(newPrice);
  return currentPricePerKg;
};

// Optional: Load price from database or file for persistence
export const loadPriceFromStorage = async () => {
  try {
    // You could load from a file or database here
    // For now, we'll use the environment variable
    return initializePrice();
  } catch (error) {
    console.error('Error loading price from storage:', error);
    return currentPricePerKg;
  }
};

// Optional: Save price to persistent storage
export const savePriceToStorage = async (price) => {
  try {
    // You could save to a file or database here
    console.log('Price saved to storage:', price);
    return true;
  } catch (error) {
    console.error('Error saving price to storage:', error);
    return false;
  }
};