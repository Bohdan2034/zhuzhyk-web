
const CART_KEY = 'zhuzhyk-cart';

let cart = loadCart();

const cartButton = document.querySelector('.cart-button');
const cartCount = document.getElementById('cartCount');
const cartOverlay = document.getElementById('cartOverlay');
const cartPanel = document.getElementById('cartPanel');
const closeCartButton = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatCartPrice(price) {
    return new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH'
    }).format(price);
}

function renderCart() {
    cartItems.replaceChildren();

    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Ваш кошик порожній.';
        cartItems.appendChild(empty);
    }

    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';

        const title = document.createElement('strong');
        title.textContent = item.name;

        const price = document.createElement('span');
        price.textContent = formatCartPrice(item.price);

        const controls = document.createElement('div');
        controls.className = 'cart-item-controls';

        const minus = document.createElement('button');
        minus.textContent = '−';
        minus.type = 'button';
        minus.addEventListener('click', () => changeQuantity(item.id, -1));

        const quantity = document.createElement('span');
        quantity.textContent = item.quantity;

        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.type = 'button';
        plus.addEventListener('click', () => changeQuantity(item.id, 1));

        const remove = document.createElement('button');
        remove.textContent = 'Видалити';
        remove.type = 'button';
        remove.addEventListener('click', () => removeFromCart(item.id));

        controls.append(minus, quantity, plus, remove);
        row.append(title, price, controls);
        cartItems.appendChild(row);

        total += item.price * item.quantity;
        count += item.quantity;
    });

    cartTotal.textContent = formatCartPrice(total);
    cartCount.textContent = count;
}

function addToCart(product) {
    const stock = Number(product.stock);
    const price = Number(product.price);

    if (
        !Number.isFinite(stock) ||
        stock <= 0 ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return;
    }

    const existing = cart.find(item => String(item.id) === String(product.id));

    if (existing) {
        if (existing.quantity >= stock) {
            alert('Більше товарів немає в наявності.');
            return;
        }

        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price,
            stock,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
}

function changeQuantity(id, difference) {
    const item = cart.find(item => String(item.id) === String(id));
    if (!item) return;

    const next = item.quantity + difference;

    if (next <= 0) {
        removeFromCart(id);
        return;
    }

    if (next > item.stock) {
        alert('Недостатньо товару на складі.');
        return;
    }

    item.quantity = next;
    saveCart();
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => String(item.id) !== String(id));
    saveCart();
    renderCart();
}

function openCart() {
    cartOverlay.hidden = false;
    cartPanel.hidden = false;
}

function closeCart() {
    cartOverlay.hidden = true;
    cartPanel.hidden = true;
}

cartButton.addEventListener('click', openCart);
closeCartButton.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

renderCart();

window.addToCart = addToCart;
