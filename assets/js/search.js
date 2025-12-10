/**
 * search.js
 * Product Search Functionality
 */

const SearchModule = {
    init() {
        this.setupSearchModal();
        this.setupSearchHandlers();
    },

    setupSearchModal() {
        // Check if modal already exists
        if (document.getElementById('searchModal')) return;

        const modalHTML = `
            <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <div class="w-100">
                                <input type="text" id="searchInput" class="form-control form-control-lg" 
                                    placeholder="Search for products..." autofocus>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                            <div id="searchResults"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    setupSearchHandlers() {
        // Open search modal when search icon is clicked
        document.addEventListener('click', (e) => {
            if (e.target.closest('.header-search-icon')) {
                e.preventDefault();
                const searchModal = new bootstrap.Modal(document.getElementById('searchModal'));
                searchModal.show();
                setTimeout(() => {
                    document.getElementById('searchInput').focus();
                }, 300);
            }
        });

        // Handle search input
        document.addEventListener('input', (e) => {
            if (e.target.id === 'searchInput') {
                this.performSearch(e.target.value);
            }
        });

        // Clear search when modal is hidden
        document.getElementById('searchModal')?.addEventListener('hidden.bs.modal', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResults').innerHTML = '';
        });
    },

    async performSearch(query) {
        const resultsContainer = document.getElementById('searchResults'); // Changed from 'psearch-results' to 'searchResults' to match existing HTML
        if (!resultsContainer) return;

        if (!query || query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        // Search using Supabase
        const results = await SupabaseDB.searchProducts(query);

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted">No products found for "${query}"</p>
                </div>
            `;
            return;
        }

        // Assuming createSearchResultCard is a new method or createProductCard is renamed/modified
        // For now, using createProductCard as it exists, but the instruction implies a new method name.
        // If createSearchResultCard is intended to be different, it needs to be defined.
        resultsContainer.innerHTML = results.slice(0, 6).map(product => this.createProductCard(product)).join('');
    },

    createProductCard(product) {
        const price = parseFloat(product.price);
        const oldPrice = product.oldPrice ? parseFloat(product.oldPrice) : null;
        const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm">
                    <div class="position-relative">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}" 
                            style="height: 200px; object-fit: cover;">
                        ${discount > 0 ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2">${discount}% OFF</span>` : ''}
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="text-muted small mb-2">${product.category || ''}</p>
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                ${oldPrice ? `<span class="text-muted text-decoration-line-through small me-2">KES ${oldPrice}</span>` : ''}
                                <span class="fw-bold text-primary">KES ${price}</span>
                            </div>
                            <a href="single-product.html?id=${product.id}" class="btn btn-sm btn-outline-primary">View</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SearchModule.init());
} else {
    SearchModule.init();
}
