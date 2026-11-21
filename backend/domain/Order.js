
class Order {
    constructor(id, userId, items = [], status = 'created') {
        this.id = id;
        this.userId = userId;
        this.items = [];
        this.status = status;

        items.forEach(item => this.addItem(item));
    }

    addItem(item) {
        if (!item || !Number.isInteger(item.productId) ||
            item.productId <= 0 ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0 ||
            typeof item.price !== 'number' ||
            !Number.isFinite(item.price) ||
            item.price < 0) {
            throw new Error('Некоректна позиція замовлення');
        }

        this.items.push({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        });
    }

    calculateTotal() {
        return Math.round(
            this.items.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            ) * 100
        ) / 100;
    }

    get totalPrice() {
        return this.calculateTotal();
    }
}

module.exports = Order;
