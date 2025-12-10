/**
 * reviews.js
 * Product reviews and ratings system
 */

const ReviewsModule = {
    // Add a review
    async addReview(productId, customerName, customerEmail, rating, title, comment) {
        try {
            const { data, error } = await supabaseClient
                .from('reviews')
                .insert({
                    product_id: productId,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    rating: rating,
                    title: title,
                    comment: comment,
                    approved: false
                })
                .select()
                .single();

            if (error) throw error;

            UIHelpers.showSuccess('Review submitted! It will appear after approval.');
            return data;
        } catch (error) {
            UIHelpers.showError('Failed to submit review');
            throw error;
        }
    },

    // Get product reviews
    async getProductReviews(productId) {
        try {
            const { data, error } = await supabaseClient
                .from('reviews')
                .select('*')
                .eq('product_id', productId)
                .eq('approved', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    },

    // Get average rating
    async getAverageRating(productId) {
        const reviews = await this.getProductReviews(productId);
        if (reviews.length === 0) return { average: 0, count: 0 };

        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return {
            average: (sum / reviews.length).toFixed(1),
            count: reviews.length
        };
    },

    // Display reviews on product page
    async displayReviews(productId, containerId = 'reviewsContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const reviews = await this.getProductReviews(productId);
        const rating = await this.getAverageRating(productId);

        let html = `
            <div class="reviews-summary mb-4">
                <h4>Customer Reviews</h4>
                <div class="d-flex align-items-center mb-3">
                    <div class="rating-stars me-3">
                        ${this.renderStars(rating.average)}
                    </div>
                    <span class="text-muted">${rating.average} out of 5 (${rating.count} reviews)</span>
                </div>
            </div>
        `;

        if (reviews.length === 0) {
            html += `<p class="text-muted">No reviews yet. Be the first to review!</p>`;
        } else {
            html += `<div class="reviews-list">`;
            reviews.forEach(review => {
                html += `
                    <div class="review-item border-bottom pb-3 mb-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <strong>${review.customer_name}</strong>
                                <div class="rating-stars-sm">
                                    ${this.renderStars(review.rating, 'sm')}
                                </div>
                            </div>
                            <small class="text-muted">${UIHelpers.formatDate(review.created_at)}</small>
                        </div>
                        ${review.title ? `<h6>${review.title}</h6>` : ''}
                        <p class="mb-0">${review.comment}</p>
                        ${review.helpful_count > 0 ? `<small class="text-muted">${review.helpful_count} people found this helpful</small>` : ''}
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;
    },

    // Render star rating
    renderStars(rating, size = '') {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let html = '';
        for (let i = 0; i < fullStars; i++) {
            html += `<i class="fas fa-star text-warning ${size}"></i>`;
        }
        if (hasHalfStar) {
            html += `<i class="fas fa-star-half-alt text-warning ${size}"></i>`;
        }
        for (let i = 0; i < emptyStars; i++) {
            html += `<i class="far fa-star text-warning ${size}"></i>`;
        }
        return html;
    },

    // Display review form
    displayReviewForm(productId, containerId = 'reviewFormContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="review-form card p-4 mt-4">
                <h5 class="mb-3">Write a Review</h5>
                <form id="reviewForm">
                    <div class="mb-3">
                        <label class="form-label">Your Name *</label>
                        <input type="text" class="form-control" id="reviewName" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-control" id="reviewEmail" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Rating *</label>
                        <div class="rating-input" id="ratingInput">
                            ${[5, 4, 3, 2, 1].map(i => `
                                <input type="radio" name="rating" id="star${i}" value="${i}" ${i === 5 ? 'checked' : ''}>
                                <label for="star${i}"><i class="fas fa-star"></i></label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Review Title</label>
                        <input type="text" class="form-control" id="reviewTitle" placeholder="Sum up your review">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Your Review *</label>
                        <textarea class="form-control" id="reviewComment" rows="4" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Review</button>
                </form>
            </div>
            <style>
                .rating-input {
                    display: flex;
                    flex-direction: row-reverse;
                    justify-content: flex-end;
                    gap: 5px;
                }
                .rating-input input {
                    display: none;
                }
                .rating-input label {
                    cursor: pointer;
                    font-size: 24px;
                    color: #ddd;
                }
                .rating-input input:checked ~ label,
                .rating-input label:hover,
                .rating-input label:hover ~ label {
                    color: #ffc107;
                }
            </style>
        `;

        // Add form handler
        document.getElementById('reviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('reviewName').value;
            const email = document.getElementById('reviewEmail').value;
            const rating = document.querySelector('input[name="rating"]:checked').value;
            const title = document.getElementById('reviewTitle').value;
            const comment = document.getElementById('reviewComment').value;

            try {
                await this.addReview(productId, name, email, parseInt(rating), title, comment);
                document.getElementById('reviewForm').reset();
            } catch (error) {
                console.error('Error submitting review:', error);
            }
        });
    },

    // Admin: Get pending reviews
    async getPendingReviews() {
        try {
            const { data, error } = await supabaseClient
                .from('reviews')
                .select(`
                    *,
                    products (name, image)
                `)
                .eq('approved', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching pending reviews:', error);
            return [];
        }
    },

    // Admin: Approve review
    async approveReview(reviewId) {
        try {
            const { error } = await supabaseClient
                .from('reviews')
                .update({ approved: true })
                .eq('id', reviewId);

            if (error) throw error;
            UIHelpers.showSuccess('Review approved!');
            return true;
        } catch (error) {
            UIHelpers.showError('Failed to approve review');
            return false;
        }
    },

    // Admin: Delete review
    async deleteReview(reviewId) {
        try {
            const { error } = await supabaseClient
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;
            UIHelpers.showSuccess('Review deleted!');
            return true;
        } catch (error) {
            UIHelpers.showError('Failed to delete review');
            return false;
        }
    }
};

window.ReviewsModule = ReviewsModule;
