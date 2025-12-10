/**
 * Home Renderer
 * Renders homepage sections dynamically based on Store/Supabase data
 */

const HomeRenderer = {
    init() {
        // Wait for Store to be ready if needed
        this.renderNewArrivals();
        this.renderMostSold();
        this.renderExploreProducts();
    },

    async renderNewArrivals() {
        const container = document.querySelector('.new-arrivals-product-activation');
        if (!container) return;

        // Get settings and products
        const settings = Store.getHomeSettings() || { newArrivals: [] };
        const allProducts = Store.getProducts();

        // Filter products
        const products = allProducts.filter(p => settings.newArrivals.includes(p.id));

        // If no products found suitable, maybe fallback to recent ones?
        const displayProducts = products.length > 0 ? products : allProducts.slice(0, 8);

        // Generate HTML
        const html = displayProducts.map(product => this.createProductCard(product)).join('');

        // If slick is already initialized, unslick it
        if ($(container).hasClass('slick-initialized')) {
            $(container).slick('unslick');
        }

        // Inject HTML
        container.innerHTML = html;

        // Re-initialize Slick (using same settings as main.js)
        this.initSlick(container);
    },

    async renderMostSold() {
        // Target the row inside the most sold area
        const container = document.querySelector('.axil-most-sold-product .row');
        if (!container) return;

        const settings = Store.getHomeSettings() || { mostSold: [] };
        const allProducts = Store.getProducts();

        // Use defaults if settings empty
        let products = allProducts.filter(p => settings.mostSold.includes(p.id));
        if (products.length === 0) products = allProducts.slice(0, 8);

        // Generate HTML for List Style
        const html = products.map(product => this.createListProductCard(product)).join('');

        // Inject HTML
        container.innerHTML = html;
        // Most Sold is a grid, no slick initialization needed
    },

    createListProductCard(product) {
        return `
            <div class="col">
                <div class="axil-product-list">
                    <div class="thumbnail">
                        <a href="single-product.html?id=${product.id}">
                            <img src="${product.image || 'assets/images/product/electric/product-09.png'}" 
                                 alt="${product.name}" style="height: 120px; object-fit: contain;">
                        </a>
                    </div>
                    <div class="product-content">
                        <div class="product-rating">
                            <span class="rating-icon">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fal fa-star"></i>
                            </span>
                            <span class="rating-number"><span>${product.sold || 0}+</span> Sold</span>
                        </div>
                        <h6 class="product-title"><a href="single-product.html?id=${product.id}">${product.name}</a></h6>
                        <div class="product-price-variant">
                            <span class="price current-price">KES ${product.price}</span>
                            ${product.oldPrice ? `<span class="price old-price">KES ${product.oldPrice}</span>` : ''}
                        </div>
                        <div class="product-cart">
                            <a href="#" onclick="Store.addToCart(${product.id}); updateMiniCart(); return false;" class="cart-btn"><i class="fal fa-shopping-cart"></i></a>
                            <a href="wishlist.html" class="cart-btn"><i class="fal fa-heart"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async renderExploreProducts() {
        // Simplified: Just render them as a generic grid or slider without the complex nesting for now, 
        // OR leave it static if it's too complex. 
        // User complaint was general "press a product on homepage". 
        // The Explore section has "Add to Cart" and "Select Option" buttons which link to single-product.

        // Let's target the inner row inside the slick-slide if possible, but the slider logic duplicates slides.
        // Safer to just leave Explore Products static for now unless requested, 
        // OR try to replace it with a simple slider.

        // Current decision: Skip dynamic render for Explore Products to avoid breaking layout, 
        // unless I can replicate the nested grid structure.
        // I will focus on New Arrivals and Most Sold which are the primary interaction points.
    },

    createProductCard(product) {
        // Calculate discount if applicable
        let badge = '';
        if (product.oldPrice && parseFloat(product.oldPrice) > parseFloat(product.price)) {
            const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
            badge = `<div class="label-block label-right"><div class="product-badget">${discount}% OFF</div></div>`;
        }

        return `
            <div class="slick-single-layout">
                <div class="axil-product product-style-two">
                    <div class="thumbnail">
                        <a href="single-product.html?id=${product.id}">
                            <img src="${product.image || 'assets/images/product/electric/product-01.png'}" alt="${product.name}" style="height: 200px; object-fit: contain;">
                        </a>
                        ${badge}
                    </div>
                    <div class="product-content">
                        <div class="inner">
                            <h5 class="title"><a href="single-product.html?id=${product.id}">${product.name}</a></h5>
                            <div class="product-price-variant">
                                ${product.oldPrice ? `<span class="price old-price">KES ${product.oldPrice}</span>` : ''}
                                <span class="price current-price">KES ${product.price}</span>
                            </div>
                            <div class="product-hover-action">
                                <ul class="cart-action">
                                    <li class="quickview"><a href="#" data-bs-toggle="modal" data-bs-target="#quick-view-modal"><i class="far fa-eye"></i></a></li>
                                    <li class="select-option"><a href="#" onclick="Store.addToCart(${product.id}); updateMiniCart(); return false;">Add to Cart</a></li>
                                    <li class="wishlist"><a href="wishlist.html"><i class="far fa-heart"></i></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    initSlick(element) {
        $(element).slick({
            infinite: true,
            slidesToShow: 4,
            slidesToScroll: 4,
            arrows: true,
            dots: false,
            prevArrow: '<button class="slide-arrow prev-arrow"><i class="fal fa-long-arrow-left"></i></button>',
            nextArrow: '<button class="slide-arrow next-arrow"><i class="fal fa-long-arrow-right"></i></button>',
            responsive: [{
                breakpoint: 1199,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3
                }
            },
            {
                breakpoint: 991,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2
                }
            },
            {
                breakpoint: 576,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
            ]
        });
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Store is ready if it's async (it's sync currently but good practice)
    setTimeout(() => HomeRenderer.init(), 100);
});
