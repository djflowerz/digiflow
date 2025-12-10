/**
 * ShopRenderer.js
 * Handles dynamic rendering of the Shop page grid and filters
 */

const ShopRenderer = {
    init() {
        this.renderShopGrid();
        this.bindEvents();
    },

    bindEvents() {
        // Sort handler
        const sortSelect = document.querySelector('.single-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.renderShopGrid({ sort: e.target.value });
            });
        }
    },

    renderShopGrid(filters = {}) {
        const container = document.getElementById('productGrid');
        if (!container) return; // Not on shop page

        // Get all products
        let products = Store.getProducts();

        // Apply filters (basic implementation)
        // Note: Real filtering would parse URL params or filter inputs
        // For now, we render all to prove the fix

        // Handle URL params if any
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        if (category) {
            products = products.filter(p => p.category === category);
        }

        // Pagination/Slicing could go here

        if (products.length === 0) {
            container.innerHTML = '<div class="col-12 text-center">No products found.</div>';
            return;
        }

        const html = products.map(product => this.createShopProductCard(product)).join('');
        container.innerHTML = html;

        // Update results count
        const countSpan = document.querySelector('.filter-results');
        if (countSpan) {
            countSpan.innerText = `Showing 1-${products.length} of ${products.length} results`;
        }
    },

    createShopProductCard(product) {
        return `
            <div class="col-xl-4 col-sm-6">
                <div class="axil-product product-style-one mb--30">
                    <div class="thumbnail">
                        <a href="single-product.html?id=${product.id}">
                            <img src="${product.image}" alt="${product.name}" style="height: 200px; object-fit: contain;">
                        </a>
                        ${product.oldPrice ? `<div class="label-block label-right"><div class="product-badget">SALE</div></div>` : ''}
                        <div class="product-hover-action">
                            <ul class="cart-action">
                                <li class="quickview"><a href="#" data-bs-toggle="modal" data-bs-target="#quick-view-modal"><i class="far fa-eye"></i></a></li>
                                <li class="select-option"><a href="#" onclick="Store.addToCart(${product.id}); updateMiniCart(); return false;">Add to Cart</a></li>
                                <li class="wishlist"><a href="wishlist.html"><i class="far fa-heart"></i></a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="product-content">
                        <div class="inner">
                            <h5 class="title"><a href="single-product.html?id=${product.id}">${product.name}</a></h5>
                            <div class="product-price-variant">
                                <span class="price current-price">KES ${product.price}</span>
                                ${product.oldPrice ? `<span class="price old-price">KES ${product.oldPrice}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Store
    setTimeout(() => ShopRenderer.init(), 100);
});
