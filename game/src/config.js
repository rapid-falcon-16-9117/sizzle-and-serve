// Sizzle & Serve — data tables: ingredients, recipes and tuning constants.
// Plain script: exposes window.SS_CONFIG for render.js and main.js.

window.SS_CONFIG = (function () {
  'use strict';

  // The eight ingredients on the bench, in key order (keys 1..8).
  // `layer` colours are what render.js paints when the ingredient is stacked
  // on the assembly plate; `glyph` colours paint the bench cell / ticket icon.
  var INGREDIENTS = [
    { id: 'bun',     name: '面包坯', en: 'Bun',     key: '1', main: '#e8a84c', dark: '#c07f2a', light: '#f7cd7f' },
    { id: 'patty',   name: '牛肉饼', en: 'Patty',   key: '2', main: '#7a4a21', dark: '#573311', light: '#9c6a35', grill: true },
    { id: 'cheese',  name: '芝士',   en: 'Cheese',  key: '3', main: '#f7b731', dark: '#d99413', light: '#ffd76a' },
    { id: 'lettuce', name: '生菜',   en: 'Lettuce', key: '4', main: '#58b531', dark: '#3d8520', light: '#8edd6d' },
    { id: 'tomato',  name: '番茄',   en: 'Tomato',  key: '5', main: '#e74c3c', dark: '#b93224', light: '#ff8a75' },
    { id: 'egg',     name: '煎蛋',   en: 'Egg',     key: '6', main: '#fdf6e3', dark: '#e8dcc0', light: '#ffffff', yolk: '#ffb703' },
    { id: 'bacon',   name: '培根',   en: 'Bacon',   key: '7', main: '#b03a2e', dark: '#7e241b', light: '#e5989b' },
    { id: 'onion',   name: '洋葱',   en: 'Onion',   key: '8', main: '#e8dff2', dark: '#b8a6d9', light: '#ffffff' },
  ];

  // Recipes: `stack` is the exact bottom-to-top ingredient order a plate must
  // match to serve the order. `price` is coins (and base score) for the dish.
  var RECIPES = [
    { name: '经典牛肉堡', en: 'Classic Beef Burger', price: 60,
      stack: ['bun', 'patty', 'lettuce', 'tomato', 'bun'] },
    { name: '芝士双层堡', en: 'Double Cheese Burger', price: 95,
      stack: ['bun', 'patty', 'cheese', 'patty', 'cheese', 'bun'] },
    { name: '花园鲜蔬堡', en: 'Garden Fresh Burger', price: 55,
      stack: ['bun', 'lettuce', 'tomato', 'onion', 'egg', 'bun'] },
    { name: '早餐培根蛋堡', en: 'Bacon & Egg Breakfast Burger', price: 80,
      stack: ['bun', 'bacon', 'egg', 'cheese', 'bun'] },
  ];

  return {
    INGREDIENTS: INGREDIENTS,
    RECIPES: RECIPES,
    WIDTH: 1280,
    HEIGHT: 800,
    SHIFT_SECONDS: 90,      // one shift lasts 90 seconds
    ORDER_SECONDS: 46,      // each order ticket counts down from here
    MAX_ORDERS: 3,          // order rail capacity
    MAX_PLATE: 8,           // tallest stack the plate can hold
    PATTY_RAW_UNTIL: 4,     // grill seconds: before this the patty is raw
    PATTY_BURNT_AT: 9.5,    // grill seconds: at/after this it is burnt
    TIMEOUT_PENALTY: 30,    // score lost when an order times out
    STREAK_BONUS: 5,        // extra score per point of serving streak
    TIME_BONUS_MAX: 15,     // up to this much score for serving an order fast
  };
})();
