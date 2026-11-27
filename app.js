// === СкидкаМаркет App Logic ===

// Initial mock products with discounts
const initialProducts = [
  { id: 1, name: "Кофе в зёрнах Arabica 1кг", store: "Пятёрочка", category: "groceries", emoji: "☕", oldPrice: 1499, price: 899, discount: "-40%" },
  { id: 2, name: "Шоколад Ritter Sport 100г", store: "Магнит", category: "groceries", emoji: "🍫", oldPrice: 199, price: 99, discount: "-50%" },
  { id: 3, name: "Беспроводные наушники Pro", store: "Эльдорадо", category: "electronics", emoji: "🎧", oldPrice: 3990, price: 2390, discount: "-40%" },
  { id: 4, name: "Худи оверсайз тёплое", store: "Gloria Jeans", category: "clothes", emoji: "🧥", oldPrice: 2899, price: 1739, discount: "-40%" },
  { id: 5, name: "Оливковое масло Extra Virgin 500мл", store: "Перекрёсток", category: "groceries", emoji: "🫒", oldPrice: 850, price: 549, discount: "-35%" },
  { id: 6, name: "Умный фитнес-браслет 8", store: "DNS", category: "electronics", emoji: "⌚", oldPrice: 3490, price: 2290, discount: "-34%" },
  { id: 7, name: "Кроссовки беговые Breathable", store: "Спортмастер", category: "clothes", emoji: "👟", oldPrice: 5990, price: 3590, discount: "-40%" },
  { id: 8, name: "Набор сывороток для лица", store: "Золотое Яблоко", category: "beauty", emoji: "✨", oldPrice: 2190, price: 1290, discount: "-41%" }
];

// Initial loyalty cards for stores
const defaultCards = [
  { id: 'c1', shop: 'Пятёрочка', num: '280045612398', discount: 'Скидка 10% + Баллы', bg: 'linear-gradient(135deg, #10b981, #059669)', level: 'Золотой уровень' },
  { id: 'c2', shop: 'Магнит', num: '770098234150', discount: 'Кэшбэк 5%', bg: 'linear-gradient(135deg, #ef4444, #dc2626)', level: 'Премиум' },
  { id: 'c3', shop: 'Перекрёсток', num: '400511879023', discount: 'Скидка 15% на любимые товары', bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', level: 'Клубный' },
  { id: 'c4', shop: 'Спортмастер', num: '992015678432', discount: 'Бонусы до 30% покупки', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', level: 'Серебряный' }
];

// Safe LocalStorage helper
function getStoredCards() {
  try {
    const raw = localStorage.getItem('user_discount_cards');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  return defaultCards;
}

function saveStoredCards(cards) {
  try {
    localStorage.setItem('user_discount_cards', JSON.stringify(cards));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// App State
let state = {
  currentCategory: 'all',
  searchQuery: '',
  cart: {}, // productId: quantity
  cards: getStoredCards(),
  activePromo: null,
  bonuses: 450
};

// Available Promo Codes
const promoCodes = {
  'SUPER20': { type: 'percent', value: 20, desc: 'Скидка 20% на весь заказ' },
  'SKIDKA10': { type: 'percent', value: 10, desc: 'Скидка 10% на чек' },
  'EXTRA300': { type: 'fixed', value: 300, desc: 'Минус 300 ₽' }
};

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const productCountEl = document.getElementById('productCount');
const searchInput = document.getElementById('searchInput');
const loyaltyCardsContainer = document.getElementById('loyaltyCardsContainer');
const cartItemsList = document.getElementById('cartItemsList');
const cartBadge = document.getElementById('cartBadge');
const sumOriginalEl = document.getElementById('sumOriginal');
const sumDiscountEl = document.getElementById('sumDiscount');
const sumPromoEl = document.getElementById('sumPromo');
const sumTotalEl = document.getElementById('sumTotal');
const promoRow = document.getElementById('promoRow');
const promoCodeInput = document.getElementById('promoCodeInput');
const promoNotice = document.getElementById('promoNotice');
const toastMsg = document.getElementById('toastMsg');

// Barcode Modal Elements
const barcodeModal = document.getElementById('barcodeModal');
const modalShopName = document.getElementById('modalShopName');
const modalDiscountRate = document.getElementById('modalDiscountRate');
const modalCardNumber = document.getElementById('modalCardNumber');
const barcodeCanvas = document.getElementById('barcodeCanvas');

// Add Card Modal Elements
const addCardModal = document.getElementById('addCardModal');
let selectedColorBg = 'linear-gradient(135deg, #10b981, #059669)';

// Initialize safely
function initApp() {
  try {
    renderProducts();
    renderCards();
    setupNavigation();
    setupSearch();
    setupCategoryFilter();
    setupCartEvents();
    setupCardModals();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Toast notification
function showToast(text) {
  toastMsg.textContent = text;
  toastMsg.classList.add('show');
  setTimeout(() => toastMsg.classList.remove('show'), 2200);
}

// Navigation Tabs
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabs = document.querySelectorAll('.content-tab');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      const targetTab = document.getElementById(targetId);
      if (targetTab) {
        targetTab.classList.add('active');
      }

      if (targetId === 'tab-cart') {
        renderCart();
      }
    });
  });
}

// Search
function setupSearch() {
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderProducts();
  });
}

// Category filter
function setupCategoryFilter() {
  const catButtons = document.querySelectorAll('.cat-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCategory = btn.getAttribute('data-cat');
      renderProducts();
    });
  });
}

// Render Products
function renderProducts() {
  const filtered = initialProducts.filter(p => {
    const matchCategory = state.currentCategory === 'all' || p.category === state.currentCategory;
    const matchSearch = !state.searchQuery || 
      p.name.toLowerCase().includes(state.searchQuery) || 
      p.store.toLowerCase().includes(state.searchQuery);
    return matchCategory && matchSearch;
  });

  productCountEl.textContent = `${filtered.length} товаров`;

  if (filtered.length === 0) {
    productsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--text-muted);">
        <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
        <div style="font-weight: 600;">Ничего не найдено</div>
        <div style="font-size: 12px; margin-top: 4px;">Попробуйте изменить запрос или категорию</div>
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = filtered.map(item => `
    <div class="product-card">
      <div class="product-badge">${item.discount}</div>
      <div class="product-img">${item.emoji}</div>
      <div class="product-store">${item.store}</div>
      <div class="product-name" title="${item.name}">${item.name}</div>
      <div class="product-prices">
        <span class="price-current">${item.price} ₽</span>
        <span class="price-old">${item.oldPrice} ₽</span>
      </div>
      <button class="add-btn" onclick="addToCart(${item.id})">
        🛒 В корзину
      </button>
    </div>
  `).join('');
}

// Add to Cart
window.addToCart = function(productId) {
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  updateCartBadge();
  showToast("Товар добавлен со скидкой!");
};

// Update Cart Badge
function updateCartBadge() {
  const totalCount = Object.values(state.cart).reduce((a, b) => a + b, 0);
  if (totalCount > 0) {
    cartBadge.textContent = totalCount;
    cartBadge.style.display = 'block';
  } else {
    cartBadge.style.display = 'none';
  }
}

// Cart Management
function setupCartEvents() {
  document.getElementById('applyPromoBtn').addEventListener('click', () => {
    const code = promoCodeInput.value.trim().toUpperCase();
    if (!code) return;

    if (promoCodes[code]) {
      state.activePromo = { code, ...promoCodes[code] };
      promoNotice.style.display = 'block';
      promoNotice.style.color = 'var(--secondary)';
      promoNotice.innerHTML = `✅ Промокод <b>${code}</b> активирован: ${promoCodes[code].desc}!`;
      showToast(`Промокод ${code} применён!`);
    } else {
      promoNotice.style.display = 'block';
      promoNotice.style.color = 'var(--danger)';
      promoNotice.textContent = `❌ Промокод "${code}" не найден. Попробуйте SUPER20 или SKIDKA10.`;
    }
    renderCart();
  });
}

function renderCart() {
  const cartIds = Object.keys(state.cart).map(Number);
  
  if (cartIds.length === 0) {
    cartItemsList.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); background: white; border-radius: var(--radius); border: 1px solid var(--border); margin-bottom: 14px;">
        <div style="font-size: 40px; margin-bottom: 8px;">🛒</div>
        <div style="font-weight: 700; font-size: 15px; color: var(--text);">Ваша корзина скидок пуста</div>
        <div style="font-size: 12px; margin-top: 4px;">Перейдите во вкладку «Скидки» и выберите товары по акции!</div>
      </div>
    `;
    sumOriginalEl.textContent = '0 ₽';
    sumDiscountEl.textContent = '-0 ₽';
    promoRow.style.display = 'none';
    sumTotalEl.textContent = '0 ₽';
    return;
  }

  let originalTotal = 0;
  let discountedTotal = 0;

  cartItemsList.innerHTML = cartIds.map(id => {
    const product = initialProducts.find(p => p.id === id);
    const qty = state.cart[id];
    if (!product || qty <= 0) return '';

    originalTotal += product.oldPrice * qty;
    discountedTotal += product.price * qty;

    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${product.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${product.name}</div>
          <div class="cart-item-prices">
            <span style="color: var(--primary);">${product.price * qty} ₽</span>
            <span style="color: var(--text-muted); text-decoration: line-through; font-size: 11px;">${product.oldPrice * qty} ₽</span>
          </div>
        </div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(${id}, -1)">−</button>
          <span style="font-weight: 700; font-size: 13px;">${qty}</span>
          <button class="qty-btn" onclick="changeQty(${id}, 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  const storeSavings = originalTotal - discountedTotal;
  let promoDiscount = 0;

  if (state.activePromo) {
    if (state.activePromo.type === 'percent') {
      promoDiscount = Math.round(discountedTotal * (state.activePromo.value / 100));
    } else if (state.activePromo.type === 'fixed') {
      promoDiscount = Math.min(state.activePromo.value, discountedTotal);
    }
  }

  const finalTotal = Math.max(0, discountedTotal - promoDiscount);

  sumOriginalEl.textContent = `${originalTotal} ₽`;
  const savingsPct = originalTotal > 0 ? Math.round((storeSavings / originalTotal) * 100) : 0;
  sumDiscountEl.textContent = `-${storeSavings} ₽ (${savingsPct}%)`;

  if (promoDiscount > 0) {
    promoRow.style.display = 'flex';
    sumPromoEl.textContent = `-${promoDiscount} ₽`;
  } else {
    promoRow.style.display = 'none';
  }

  sumTotalEl.textContent = `${finalTotal} ₽`;
}

window.changeQty = function(id, delta) {
  if (!state.cart[id]) return;
  state.cart[id] += delta;
  if (state.cart[id] <= 0) {
    delete state.cart[id];
  }
  updateCartBadge();
  renderCart();
};

window.checkoutOrder = function() {
  const totalCount = Object.values(state.cart).reduce((a, b) => a + b, 0);
  if (totalCount === 0) {
    showToast("Корзина пуста!");
    return;
  }
  state.bonuses += Math.round(totalCount * 15);
  document.getElementById('userBonusCount').textContent = state.bonuses;
  state.cart = {};
  state.activePromo = null;
  promoCodeInput.value = '';
  promoNotice.style.display = 'none';
  updateCartBadge();
  renderCart();
  showToast("Заказ оформлен! Начислены бонусы ⭐");
};

// Loyalty Cards Management
function renderCards() {
  loyaltyCardsContainer.innerHTML = state.cards.map(c => `
    <div class="loyalty-card" style="background: ${c.bg};" onclick="openBarcodeModal('${c.id}')">
      <div class="card-head">
        <span class="card-shop">🏪 ${c.shop}</span>
        <span class="card-discount-val">${c.discount}</span>
      </div>
      <div class="card-number">${formatCardNumber(c.num)}</div>
      <div class="card-footer">
        <span>${c.level || 'Дисконтная карта'}</span>
        <span class="card-action-hint">Показать кассиру ➔</span>
      </div>
    </div>
  `).join('');
}

function formatCardNumber(num) {
  return num.replace(/(\d{4})/g, '$1 ').trim();
}

// Draw Barcode on Canvas (Pure JavaScript, No external library required)
function drawBarcode(canvas, code) {
  const ctx = canvas.getContext('2d');
  canvas.width = 300;
  canvas.height = 90;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f172a';

  // Deterministic bar pattern derived from card number
  let x = 15;
  const barHeight = 80;

  // Start guard bars
  ctx.fillRect(x, 5, 2, barHeight); x += 4;
  ctx.fillRect(x, 5, 2, barHeight); x += 5;

  for (let i = 0; i < code.length; i++) {
    const parsed = parseInt(code[i], 10);
    const digit = Number.isNaN(parsed) ? (code.charCodeAt(i) % 10) : parsed;
    const pattern = getBarPattern(digit);
    
    for (let p = 0; p < pattern.length; p++) {
      const width = pattern[p];
      if (p % 2 === 0) {
        ctx.fillRect(x, 5, width, barHeight);
      }
      x += width + 1;
    }
    x += 1;
  }

  // End guard bars
  ctx.fillRect(x, 5, 2, barHeight); x += 4;
  ctx.fillRect(x, 5, 2, barHeight);
}

function getBarPattern(digit) {
  // Pattern widths for bars & spaces
  const patterns = [
    [2, 1, 2, 2],
    [3, 1, 1, 2],
    [1, 2, 3, 1],
    [2, 3, 1, 1],
    [1, 1, 2, 3],
    [2, 2, 1, 2],
    [1, 3, 2, 1],
    [3, 2, 1, 1],
    [1, 1, 3, 2],
    [2, 1, 3, 1]
  ];
  return patterns[digit % patterns.length];
}

// Open Barcode Modal
window.openBarcodeModal = function(cardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;

  modalShopName.textContent = card.shop;
  modalDiscountRate.textContent = card.discount;
  modalCardNumber.textContent = formatCardNumber(card.num);
  drawBarcode(barcodeCanvas, card.num);

  barcodeModal.classList.add('active');
};

// Setup Modals
function setupCardModals() {
  document.getElementById('closeBarcodeModalBtn').addEventListener('click', () => {
    barcodeModal.classList.remove('active');
  });

  barcodeModal.addEventListener('click', (e) => {
    if (e.target === barcodeModal) {
      barcodeModal.classList.remove('active');
    }
  });

  const btnOpenAddCardModal = document.getElementById('btnOpenAddCardModal');
  btnOpenAddCardModal.addEventListener('click', () => {
    addCardModal.classList.add('active');
  });

  document.getElementById('closeAddCardModalBtn').addEventListener('click', () => {
    addCardModal.classList.remove('active');
  });

  addCardModal.addEventListener('click', (e) => {
    if (e.target === addCardModal) {
      addCardModal.classList.remove('active');
    }
  });

  // Color picker for new card
  const colorDots = document.querySelectorAll('.color-dot');
  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      colorDots.forEach(d => {
        d.style.boxShadow = 'none';
        d.classList.remove('selected');
      });
      dot.classList.add('selected');
      selectedColorBg = dot.getAttribute('data-color');
      dot.style.boxShadow = `0 0 0 3px ${dot.style.background}`;
    });
  });

  // Save new card
  document.getElementById('saveNewCardBtn').addEventListener('click', () => {
    const shop = document.getElementById('newCardShop').value.trim();
    const num = document.getElementById('newCardNum').value.trim().replace(/\s+/g, '');
    const discount = document.getElementById('newCardDiscount').value.trim() || 'Скидка на кассе';

    if (!shop || !num) {
      alert('Пожалуйста, заполните название магазина и номер карты!');
      return;
    }

    const newCard = {
      id: 'c_' + Date.now(),
      shop: shop,
      num: num,
      discount: discount,
      bg: selectedColorBg,
      level: 'Пользовательская карта'
    };

    state.cards.push(newCard);
    saveStoredCards(state.cards);
    renderCards();

    // Reset inputs
    document.getElementById('newCardShop').value = '';
    document.getElementById('newCardNum').value = '';
    document.getElementById('newCardDiscount').value = '';
    addCardModal.classList.remove('active');
    showToast(`Карта «${shop}» добавлена!`);
  });
}

// Service Worker Registration for PWA / Offline / Mobile App (skip inside Capacitor native wrapper)
if ('serviceWorker' in navigator && !window.Capacitor) {
  const registerSW = () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  };
  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}
