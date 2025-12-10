/**
 * shop.js
 * Shop page functionality with category filtering
 */

const ShopModule = {
    currentCategory: null,
    currentSort: 'default',
    showInStock: true,
    showOutOfStock: false,
    searchQuery: '',
    currentPage: 1,
    itemsPerPage: 12,
    allProducts: [],

    init() {
        this.loadCategoryFromURL();
        this.setupFilters();
        this.setupLoadMore();
        this.renderProducts();
    },

    loadCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCategory = urlParams.get('category');

        // Update page title if category is selected
        if (this.currentCategory) {
            const pageTitle = document.querySelector('.page-title h1');
            if (pageTitle) {
                pageTitle.textContent = this.currentCategory;
            }

            // Highlight active category in sidebar
            document.querySelectorAll('.category-filter-link').forEach(link => {
                if (link.dataset.category === this.currentCategory) {
                    link.parentElement.classList.add('current-cat');
                } else {
                    link.parentElement.classList.remove('current-cat');
                }
            });
        }
    },

    setupFilters() {
        // Category filter
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            if (this.currentCategory) {
                categorySelect.value = this.currentCategory;
            }

            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value || null;
                this.renderProducts();
            });
        }

        // Sort filter
        const sortSelect = document.getElementById('sortFilter');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderProducts();
            });
        }

        // Availability filters
        const inStockCheckbox = document.getElementById('inStock');
        const outOfStockCheckbox = document.getElementById('outOfStock');

        if (inStockCheckbox) {
            inStockCheckbox.addEventListener('change', (e) => {
                this.showInStock = e.target.checked;
                this.renderProducts();
            });
        }

        if (outOfStockCheckbox) {
            outOfStockCheckbox.addEventListener('change', (e) => {
                this.showOutOfStock = e.target.checked;
                this.renderProducts();
            });
        }

        // Reset filters button
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Search input
        const searchInput = document.getElementById('shopSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderProducts();
            });
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clearSearch');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('shopSearchInput');
                if (searchInput) {
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.renderProducts();
                }
            });
        }
    },

    resetFilters() {
        // Reset all filter states
        this.currentCategory = null;
        this.currentSort = 'default';
        this.showInStock = true;
        this.showOutOfStock = false;
        this.searchQuery = '';

        // Reset UI elements
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) categorySelect.value = '';

        const sortSelect = document.getElementById('sortFilter');
        if (sortSelect) sortSelect.value = 'default';

        const inStockCheckbox = document.getElementById('inStock');
        if (inStockCheckbox) inStockCheckbox.checked = true;

        const outOfStockCheckbox = document.getElementById('outOfStock');
        if (outOfStockCheckbox) outOfStockCheckbox.checked = false;

        const searchInput = document.getElementById('shopSearchInput');
        if (searchInput) searchInput.value = '';

        // Redirect to shop.html without query parameters
        window.location.href = 'shop.html';
    },

    setupLoadMore() {
        const loadMoreBtn = document.querySelector('.btn-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage++;
                this.renderProducts(true); // true means append, not replace
            });
        }
    },

    resetPagination() {
        this.currentPage = 1;
    },

    async renderProducts(append = false) {
        const container = document.getElementById('productGrid');
        const loadMoreBtn = document.querySelector('.btn-load-more');
        if (!container) return;

        // Reset pagination when not appending
        if (!append) {
            this.resetPagination();
        }

        // Fetch products from both Supabase and localStorage
        let supabaseProducts = [];
        let localProducts = [];

        try {
            // Try to get products from Supabase
            if (typeof SupabaseDB !== 'undefined') {
                supabaseProducts = this.currentCategory
                    ? await SupabaseDB.getProductsByCategory(this.currentCategory)
                    : await SupabaseDB.getProducts();
            }
        } catch (error) {
            console.log('Supabase not available or error:', error);
        }

        // Get products from localStorage (Store.js)
        if (typeof Store !== 'undefined') {
            localProducts = this.currentCategory
                ? Store.getProductsByCategory(this.currentCategory)
                : Store.getProducts();
        }

        // Merge products from both sources, removing duplicates by ID
        const productMap = new Map();

        // Add Supabase products first
        supabaseProducts.forEach(p => productMap.set(p.id, p));

        // Add localStorage products (won't override if ID already exists)
        localProducts.forEach(p => {
            if (!productMap.has(p.id)) {
                productMap.set(p.id, p);
            }
        });

        let products = Array.from(productMap.values());

        // Filter by visibility
        products = products.filter(p => p.visibility !== false);

        // Apply search filter
        if (this.searchQuery) {
            products = products.filter(p => {
                const searchIn = `${p.name} ${p.description || ''} ${p.category || ''} ${p.subcategory || ''}`.toLowerCase();
                return searchIn.includes(this.searchQuery);
            });
        }

        // Apply availability filter
        products = products.filter(p => {
            const inStock = (p.stock || 0) > 0;
            if (inStock && this.showInStock) return true;
            if (!inStock && this.showOutOfStock) return true;
            return false;
        });

        // Apply sorting
        products = this.sortProducts(products);

        // Store all products for pagination
        this.allProducts = products;

        // Calculate pagination
        const totalProducts = products.length;
        const startIndex = 0;
        const endIndex = this.currentPage * this.itemsPerPage;
        const displayProducts = products.slice(startIndex, endIndex);
        const hasMore = endIndex < totalProducts;

        // Update search result count
        const searchResultCount = document.getElementById('searchResultCount');
        if (searchResultCount) {
            if (this.searchQuery) {
                searchResultCount.textContent = `Found ${totalProducts} product${totalProducts !== 1 ? 's' : ''}`;
            } else {
                searchResultCount.textContent = '';
            }
        }

        // Update results count in header
        const filterResults = document.querySelector('.filter-results');
        if (filterResults) {
            filterResults.textContent = `Showing ${Math.min(displayProducts.length, totalProducts)} of ${totalProducts} results`;
        }

        if (totalProducts === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                    <h4>No products found</h4>
                    <p class="text-muted">${this.searchQuery ? 'Try a different search term or adjust your filters' : 'Try adjusting your filters'}</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        // Render products
        container.innerHTML = displayProducts.map(product => this.createProductCard(product)).join('');

        // Show/hide load more button
        if (loadMoreBtn) {
            loadMoreBtn.style.display = hasMore ? 'inline-block' : 'none';
        }
    },

    sortProducts(products) {
        switch (this.currentSort) {
            case 'price-low':
                return [...products].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            case 'price-high':
                return [...products].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            case 'name':
                return [...products].sort((a, b) => a.name.localeCompare(b.name));
            case 'newest':
                return [...products].sort((a, b) => (b.id || 0) - (a.id || 0));
            default:
                return products;
        }
    },

    createProductCard(product) {
        const price = parseFloat(product.price);
        const oldPrice = product.oldPrice ? parseFloat(product.oldPrice) : null;
        const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
        const inStock = (product.stock || 0) > 0;

        return `
            <div class="col-xl-3 col-lg-4 col-sm-6 col-12 mb--30">
                <div class="axil-product product-style-one">
                    <div class="thumbnail">
                        <a href="single-product.html?id=${product.id}">
                            <img src="${product.image}" alt="${product.name}">
                        </a>
                        ${discount > 0 ? `
                            <div class="label-block label-right">
                                <div class="product-badget">${discount}% OFF</div>
                            </div>
                        ` : ''}
                        ${!inStock ? `
                            <div class="label-block label-left">
                                <div class="product-badget bg-danger">Out of Stock</div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="product-content">
                        <div class="inner">
                            <h5 class="title"><a href="single-product.html?id=${product.id}">${product.name}</a></h5>
                            ${product.category ? `<div class="product-category"><small class="text-muted">${product.category}</small></div>` : ''}
                            <div class="product-price-variant">
                                ${oldPrice ? `<span class="price old-price">KES ${oldPrice}</span>` : ''}
                                <span class="price current-price">KES ${price}</span>
                            </div>
                            <div class="product-hover-action">
                                <ul class="cart-action">
                                    <li class="quickview"><a href="#" data-bs-toggle="modal" data-bs-target="#quick-view-modal"><i class="far fa-eye"></i></a></li>
                                    ${inStock ? `
                                        <li class="select-option">
                                            <a href="#" onclick="Store.addToCart(${product.id}); return false;" class="axil-btn btn-bg-primary">
                                                <i class="far fa-shopping-cart"></i> Add to Cart
                                            </a>
                                        </li>
                                    ` : `
                                        <li class="select-option"><a href="single-product.html?id=${product.id}">View Details</a></li>
                                    `}
                                    <li class="wishlist"><a href="wishlist.html"><i class="far fa-heart"></i></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ShopModule.init());
} else {
    ShopModule.init();
}
