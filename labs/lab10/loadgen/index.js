const API_BASE_URL = process.env.API_BASE_URL || 'http://app:3000';
const FLOWS = ['happy', 'slow-db', 'payment-error'];
const INTERVAL_MS = Number(process.env.LOAD_INTERVAL_MS || 1500);
const ORDERS_INTERVAL_MS = Number(process.env.ORDERS_INTERVAL_MS || 2500);

async function fireCheckout() {
  const flow = FLOWS[Math.floor(Math.random() * FLOWS.length)];
  const url = `${API_BASE_URL}/api/checkout?flow=${flow}`;
  try {
    const res = await fetch(url, { headers: { 'x-demo-load': 'checkout' } });
    const body = await res.json();
    const status = res.status;
    if (!res.ok) {
      console.warn('checkout failed', flow, status, body.error);
    }
  } catch (error) {
    console.error('checkout call failed', error.message);
  }
}

async function fireOrders() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`);
    await res.json();
  } catch (error) {
    console.error('orders call failed', error.message);
  }
}

setInterval(fireCheckout, INTERVAL_MS);
setInterval(fireOrders, ORDERS_INTERVAL_MS);

console.log('load generator started', { API_BASE_URL, INTERVAL_MS, ORDERS_INTERVAL_MS });
