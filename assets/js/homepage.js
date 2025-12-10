/**
 * homepage.js
 * Dynamic homepage product sections
 */

const HomepageModule = {
    async init() {
        await this.loadHomeSettings();
        this.renderHotThisWeek();
        this.renderNewArrivals();
        this.renderMostSold();
        this.renderExploreProducts();
        this.updateDontMissBanner();
        this.initializeCountdown();

        // Reinitialize slick sliders after content is loaded
        setTimeout(() => this.initSliders(), 500);
    },

    async loadHomeSettings() {
        // Load from Supabase
        this.settings = await SupabaseDB.getHomeSettings();
        this.products = await SupabaseDB.getProducts();
    },

    getProductById(id) {
        return this.products.find(p => p.id == id);
    },

    renderHotThisWeek() {
        const container = document.querySelector('.slider-content-activation-one');
        const thumbContainer = document.querySelector('.slider-thumb-activation-one');

        if (!container || !thumbContainer) return;

        const productIds = this.settings.hotWeek || [];
        const products = productIds.map(id => this.getProductById(id)).filter(p => p && p.visibility !== false);

        if (products.length === 0) return; // Keep default content

        // Update slider content
        container.innerHTML = products.map(product => `
            <div class="single-slide slick-slide">
                <span class="subtitle"><i class="fas fa-fire"></i> Hot Deal In This Week</span>
                <h1 class="title">${product.name}</h1>
                <div class="slide-action">
                    <div class="shop-btn">
                        <a href="single-product.html?id=${product.id}" class="axil-btn btn-bg-white">
                            <i class="fal fa-shopping-cart"></i>Shop Now
                        </a>
                    </div>
                    <div class="item-rating">
                        <div class="thumb">
                            <ul>
                                <li><img src="assets/images/others/author1.png" alt="Author"></li>
                                <li><img src="assets/images/others/author2.png" alt="Author"></li>
                                <li><img src="assets/images/others/author3.png" alt="Author"></li>
                                <li><img src="assets/images/others/author4.png" alt="Author"></li>
                            </ul>
                        </div>
                        <div class="content">
                            <span class="rating-icon">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fal fa-star"></i>
                            </span>
                            <span class="review-text">
                                <span>100+</span> Reviews
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Update thumbnails
        thumbContainer.innerHTML = products.map(product => `
            <div class="single-slide slick-slide">
                <img src="${product.image}" alt="Product">
                <div class="product-price">
                    <span class="text">From</span>
                    <span class="price-amount">KES ${product.price}</span>
                </div>
            </div>
        `).join('');
    },

    renderNewArrivals() {
        const container = document.querySelector('.new-arrivals-product-activation');
        if (!container) return;

        const productIds = this.settings.newArrivals || [];
        const products = productIds.map(id => this.getProductById(id)).filter(p => p && p.visibility !== false);

        if (products.length === 0) return;

        container.innerHTML = products.map(product => this.createProductSlide(product)).join('');
    },

    renderMostSold() {
        const container = document.querySelector('.most-sold-product-activation');
        if (!container) return;

        const productIds = this.settings.mostSold || [];
        const products = productIds.map(id => this.getProductById(id)).filter(p => p && p.visibility !== false);

        if (products.length === 0) return;

        container.innerHTML = products.map(product => this.createProductSlide(product)).join('');
    },

    renderExploreProducts() {
        const container = document.querySelector('.explore-product-activation');
        if (!container) return;

        const productIds = this.settings.exploreProducts || [];
        const products = productIds.map(id => this.getProductById(id)).filter(p => p && p.visibility !== false);

        if (products.length === 0) return;

        // Explore products are in a different layout (grid)
        container.innerHTML = products.map((product, index) => {
            if (index % 4 === 0) {
                return `
                    <div class="slick-single-layout">
                        <div class="row row--15">
                            ${this.createExploreProductCards(products.slice(index, index + 4))}
                        </div>
                    </div>
                `;
            }
            return '';
        }).filter(html => html).join('');
    },

    createExploreProductCards(products) {
        return products.map(product => `
            <div class="col-xl-3 col-lg-4 col-sm-6 col-12 mb--30">
                <div class="axil-product product-style-one">
                    <div class="thumbnail">
                        <a href="single-product.html?id=${product.id}">
                            <img src="${product.image}" alt="${product.name}">
                        </a>
                        ${this.getDiscountBadge(product)}
                    </div>
                    <div class="product-content">
                        <div class="inner">
                            <h5 class="title"><a href="single-product.html?id=${product.id}">${product.name}</a></h5>
                            <div class="product-price-variant">
                                ${product.oldPrice ? `<span class="price old-price">KES ${product.oldPrice}</span>` : ''}
                                <span class="price current-price">KES ${product.price}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    createProductSlide(product) {
        const discount = this.getDiscountBadge(product);

        return `
            <div class="slick-single-layout">
                <div class="axil-product product-style-two">
                    <div class="thumbnail">
                        <a href="single-product.html?id=${product.id}">
                            <img src="${product.image}" alt="${product.name}">
                        </a>
                        ${discount}
                    </div>
                    <div class="product-content">
                        <div class="inner">
                            <div class="color-variant-wrapper">
                                <ul class="color-variant">
                                    <li class="color-extra-01 active"><span><span class="color"></span></span></li>
                                    <li class="color-extra-02"><span><span class="color"></span></span></li>
                                    <li class="color-extra-03"><span><span class="color"></span></span></li>
                                </ul>
                            </div>
                            <h5 class="title"><a href="single-product.html?id=${product.id}">${product.name}</a></h5>
                            <div class="product-price-variant">
                                ${product.oldPrice ? `<span class="price old-price">KES ${product.oldPrice}</span>` : ''}
                                <span class="price current-price">KES ${product.price}</span>
                            </div>
                            <div class="product-hover-action">
                                <ul class="cart-action">
                                    <li class="quickview"><a href="#" data-bs-toggle="modal" data-bs-target="#quick-view-modal"><i class="far fa-eye"></i></a></li>
                                    <li class="select-option"><a href="single-product.html?id=${product.id}">View Details</a></li>
                                    <li class="wishlist"><a href="wishlist.html"><i class="far fa-heart"></i></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getDiscountBadge(product) {
        if (!product.oldPrice) return '';
        const discount = Math.round(((parseFloat(product.oldPrice) - parseFloat(product.price)) / parseFloat(product.oldPrice)) * 100);
        return `
            <div class="label-block label-right">
                <div class="product-badget">${discount}% OFF</div>
            </div>
        `;
    },

    updateDontMissBanner() {
        const dm = this.settings.dontMiss || {};

        // Update title
        const titleEl = document.querySelector('.poster-countdown-content .title');
        if (titleEl && dm.title) {
            titleEl.textContent = dm.title;
        }

        // Update subtitle
        const subtitleEl = document.querySelector('.poster-countdown-content .title-highlighter');
        if (subtitleEl && dm.subtitle) {
            subtitleEl.innerHTML = `<i class="fal fa-headphones-alt"></i> ${dm.subtitle}`;
        }

        // Update link
        const linkEl = document.querySelector('.poster-countdown-content .axil-btn');
        if (linkEl && dm.link) {
            linkEl.href = dm.link;
        }

        // Update background image
        const imageEl = document.querySelector('.poster-countdown-thumbnail img');
        if (imageEl && dm.bgImage) {
            imageEl.src = dm.bgImage;
        }
    },

    initializeCountdown() {
        const countdownEl = document.querySelector('.poster-countdown.countdown');
        if (!countdownEl) return;

        // Set countdown to 7 days from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7);

        this.updateCountdown(countdownEl, targetDate);
        setInterval(() => this.updateCountdown(countdownEl, targetDate), 1000);
    },

    updateCountdown(element, targetDate) {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            element.innerHTML = '<span class="countdown-section"><span class="countdown-amount">EXPIRED</span></span>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        element.innerHTML = `
            <div class="countdown-section">
                <span class="countdown-amount hover-up">${days}</span>
                <span class="countdown-period">Days</span>
            </div>
            <div class="countdown-section">
                <span class="countdown-amount hover-up">${hours}</span>
                <span class="countdown-period">Hours</span>
            </div>
            <div class="countdown-section">
                <span class="countdown-amount hover-up">${minutes}</span>
                <span class="countdown-period">Mins</span>
            </div>
            <div class="countdown-section">
                <span class="countdown-amount hover-up">${seconds}</span>
                <span class="countdown-period">Secs</span>
            </div>
        `;
    },

    initSliders() {
        // Reinitialize slick sliders if they exist
        if (typeof jQuery !== 'undefined' && jQuery.fn.slick) {
            $('.slider-content-activation-one').slick('unslick').slick({
                infinite: true,
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: true,
                asNavFor: '.slider-thumb-activation-one'
            });

            $('.slider-thumb-activation-one').slick('unslick').slick({
                infinite: true,
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                dots: true,
                focusOnSelect: false,
                asNavFor: '.slider-content-activation-one'
            });

            $('.new-arrivals-product-activation').slick('unslick').slick({
                infinite: true,
                slidesToShow: 4,
                slidesToScroll: 1,
                arrows: true,
                responsive: [
                    { breakpoint: 1200, settings: { slidesToShow: 3 } },
                    { breakpoint: 992, settings: { slidesToShow: 2 } },
                    { breakpoint: 576, settings: { slidesToShow: 1 } }
                ]
            });
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HomepageModule.init());
} else {
    HomepageModule.init();
}
