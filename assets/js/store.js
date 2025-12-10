/**
 * store.js
 * Advanced Client-Side Data Store
 */

const Store = {
    KEYS: {
        PRODUCTS: 'df_products',
        ORDERS: 'df_orders',
        SETTINGS: 'df_settings',
        USERS: 'df_users',
        CART: 'df_cart'
    },

    defaults: {
        products: [
            { id: 1, name: "Roco Wireless Headphone", price: "49.00", oldPrice: "60.00", category: "Accessories", image: "assets/images/product/electric/product-01.png", stock: 15, sold: 120 },
            { id: 2, name: "Smart Digital Watch", price: "100.00", category: "Electronics", image: "assets/images/product/electric/product-02.png", stock: 5, sold: 45 },
            { id: 3, name: "Logitech Streamcam", price: "29.99", oldPrice: "49.99", category: "Computers", image: "assets/images/product/electric/product-03.png", stock: 50, sold: 12 },
            { id: 4, name: "Gaming Mouse", price: "35.00", category: "Computers", image: "assets/images/product/electric/product-08.png", stock: 8, sold: 200 },
            { id: 5, name: "Google Home", price: "129.00", category: "Electronics", image: "assets/images/product/electric/product-07.png", stock: 20, sold: 75 },
            { id: 6, name: "Bass Meets Clarity", price: "39.99", category: "Accessories", image: "assets/images/product/electric/product-05.png", stock: 30, sold: 15 },
            { id: 7, name: "Mice Logitech", price: "25.00", category: "Computers", image: "assets/images/product/electric/product-06.png", stock: 100, sold: 300 },
            { id: 8, name: "3D Wireless Headset", price: "55.00", category: "Accessories", image: "assets/images/product/electric/product-04.png", stock: 12, sold: 88 }
        ],
        settings: {
            siteName: "Digiflow Store",
            currency: "KES",
            taxRate: 16,
            shippingFee: 250,
            mpesaKey: "",
            mpesaSecret: ""
        },
        orders: [
            // Sample Order for Demo
            {
                id: 1001,
                customer: "John Doe",
                email: "john@example.com",
                date: new Date().toISOString(),
                status: "Pending",
                total: 149.00,
                items: [
                    { name: "Roco Wireless Headphone", qty: 1, price: 49.00 },
                    { name: "Smart Digital Watch", qty: 1, price: 100.00 }
                ]
            }
        ],
        cart: [],
        homeSettings: {
            hotWeek: [1, 2, 3], // Array of product IDs
            newArrivals: [1, 2, 3, 4], // Array of product IDs
            mostSold: [1, 2, 3, 4], // Array of product IDs
            exploreProducts: [1, 2, 3, 4], // Array of product IDs
            dontMiss: {
                title: "Enhance Your Music Experience",
                subtitle: "Don’t Miss!!",
                bgImage: "assets/images/product/poster/poster-03.png",
                link: "shop.html"
            }
        }
    },

    init() {
        if (!localStorage.getItem(this.KEYS.PRODUCTS)) {
            localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(this.defaults.products));
        }
        if (!localStorage.getItem(this.KEYS.ORDERS)) {
            localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(this.defaults.orders));
        }
        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(this.defaults.settings));
        }
        if (!localStorage.getItem(this.KEYS.CART)) {
            localStorage.setItem(this.KEYS.CART, JSON.stringify(this.defaults.cart));
        }
        // Initialize Home Settings if not present
        if (!localStorage.getItem('df_home_settings')) {
            localStorage.setItem('df_home_settings', JSON.stringify(this.defaults.homeSettings));
        }

        // Update cart counter on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateCartCounter());
        } else {
            this.updateCartCounter();
        }
    },

    // --- Generic Getters/Setters ---
    get(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // --- Cart ---
    getCart() { return this.get(this.KEYS.CART); },

    getCartCount() {
        return this.getCart().reduce((total, item) => total + item.qty, 0);
    },

    updateCartCounter() {
        const count = this.getCartCount();
        const counters = document.querySelectorAll('.cart-count');
        counters.forEach(counter => {
            counter.textContent = count;
        });
    },

    updateQuantity(productId, newQty) {
        const cart = this.getCart();
        const item = cart.find(i => i.id == productId);
        if (item) {
            item.qty = Math.max(1, parseInt(newQty)); // Minimum quantity is 1
            this.set(this.KEYS.CART, cart);
            this.updateCartCounter();
        }
    },

    addToCart(productId) {
        const cart = this.getCart();
        const existing = cart.find(item => item.id == productId);
        if (existing) {
            existing.qty += 1;
        } else {
            const product = this.getProducts().find(p => p.id == productId);
            if (product) {
                cart.push({ ...product, qty: 1 });
            }
        }
        this.set(this.KEYS.CART, cart);
        this.updateCartCounter();
        alert("Added to Cart!");
    },

    removeFromCart(productId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id != productId);
        this.set(this.KEYS.CART, cart);
        this.updateCartCounter();
        return cart;
    },

    clearCart() {
        this.set(this.KEYS.CART, []);
        this.updateCartCounter();
    },

    getCartTotal() {
        return this.getCart().reduce((acc, item) => acc + (item.price * item.qty), 0).toFixed(2);
    },

    // --- Products ---
    getProducts() { return this.get(this.KEYS.PRODUCTS); },
    saveProducts(data) { this.set(this.KEYS.PRODUCTS, data); },

    addProduct(product) {
        const list = this.getProducts();
        product.id = Date.now();
        product.stock = parseInt(product.stock) || 0;
        product.sold = 0;
        list.push(product);
        this.saveProducts(list);
        return product;
    },

    updateProduct(id, updates) {
        const list = this.getProducts();
        const idx = list.findIndex(p => p.id == id);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates };
            this.saveProducts(list);
        }
    },

    deleteProduct(id) {
        const list = this.getProducts().filter(p => p.id != id);
        this.saveProducts(list);
    },

    // --- Orders ---
    getOrders() { return this.get(this.KEYS.ORDERS); },
    placeOrder(order) {
        const list = this.getOrders();
        order.id = Math.floor(1000 + Math.random() * 9000); // Simple ID
        order.date = new Date().toISOString();
        order.status = "Pending";
        list.unshift(order); // Newest first
        this.set(this.KEYS.ORDERS, list);

        // Update Stock
        const products = this.getProducts();
        order.items.forEach(item => {
            const p = products.find(prod => prod.name === item.name); // match by name for simplicity or ID if available
            if (p) {
                p.stock = Math.max(0, p.stock - item.qty);
                p.sold = (p.sold || 0) + item.qty;
            }
        });
        this.saveProducts(products);
    },
    updateOrderStatus(id, status) {
        const list = this.getOrders();
        const order = list.find(o => o.id == id);
        if (order) {
            order.status = status;
            this.set(this.KEYS.ORDERS, list);
        }
    },

    // --- Settings ---
    getSettings() { return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS)); },
    saveSettings(settings) { this.set(this.KEYS.SETTINGS, settings); },

    // --- Home Settings ---
    getHomeSettings() {
        return JSON.parse(localStorage.getItem('df_home_settings')) || this.defaults.homeSettings;
    },
    saveHomeSettings(settings) {
        localStorage.setItem('df_home_settings', JSON.stringify(settings));
    },

    // --- Analytics ---
    getStats() {
        const products = this.getProducts();
        const orders = this.getOrders();

        const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
        const totalOrders = orders.length;
        const lowStock = products.filter(p => p.stock < 10).length;

        return {
            revenue: totalSales.toFixed(2),
            orders: totalOrders,
            products: products.length,
            lowStock: lowStock
        };
    },

    // Helper to handle Image Upload (Base64)
    fileToBase64: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    // Search products by name, description, or category
    searchProducts(query) {
        const searchTerm = query.toLowerCase().trim();
        return this.getProducts().filter(p => {
            // Only show visible products
            if (p.visibility === false) return false;

            return (
                p.name.toLowerCase().includes(searchTerm) ||
                (p.description && p.description.toLowerCase().includes(searchTerm)) ||
                (p.category && p.category.toLowerCase().includes(searchTerm)) ||
                (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm))
            );
        });
    },

    // Get products by category
    getProductsByCategory(category) {
        if (!category) return this.getProducts().filter(p => p.visibility !== false);

        return this.getProducts().filter(p => {
            if (p.visibility === false) return false;
            return p.category && p.category.toLowerCase() === category.toLowerCase();
        });
    },

    // Simplify for shop.html compatibility
    getAll() { return this.getProducts(); }
};

Store.init();
