
class Product {
    constructor(id, name, description, price, stock) {
        this.id = id;
        this.setName(name);
        this.description = description;
        this.setPrice(price);
        this.setStock(stock);
    }

    setName(name) {
        if (typeof name !== 'string' || !name.trim()) {
            throw new Error('Назва товару не може бути порожньою');
        }

        this.name = name.trim();
    }

    setPrice(price) {
        if (typeof price !== 'number' ||
            !Number.isFinite(price) || price < 0) {
            throw new Error('Ціна повинна бути невід’ємним числом');
        }

        this.price = price;
    }

    setStock(stock) {
        if (!Number.isInteger(stock) || stock < 0) {
            throw new Error('Кількість товару повинна бути невід’ємним цілим числом');
        }

        this.stock = stock;
    }
}

module.exports = Product;
