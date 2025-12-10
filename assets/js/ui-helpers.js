/**
 * ui-helpers.js
 * Global UI utilities for loading states, notifications, and error handling
 */

const UIHelpers = {
    // Show global loading overlay
    showLoading(message = 'Loading...') {
        // Remove existing loader if any
        this.hideLoading();

        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center';
        loader.style.cssText = 'background: rgba(0,0,0,0.7); z-index: 9999; backdrop-filter: blur(4px);';
        loader.innerHTML = `
            <div class="spinner-border text-light mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-light fw-bold">${message}</p>
        `;
        document.body.appendChild(loader);
    },

    // Hide global loading overlay
    hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.remove();
        }
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        // Create toast
        const toastId = 'toast_' + Date.now();
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        const bgMap = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white ${bgMap[type]} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${iconMap[type]} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        container.appendChild(toast);

        // Show toast
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();

        // Remove from DOM after hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },

    // Show success message
    showSuccess(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    },

    // Show error message
    showError(message, duration = 5000) {
        this.showToast(message, 'error', duration);
    },

    // Show warning message
    showWarning(message, duration = 4000) {
        this.showToast(message, 'warning', duration);
    },

    // Show info message
    showInfo(message, duration = 3000) {
        this.showToast(message, 'info', duration);
    },

    // Confirm dialog
    async confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            // Create modal
            const modalId = 'confirmModal_' + Date.now();
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="modal fade" id="${modalId}" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                ${message}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirmBtn">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const modalElement = document.getElementById(modalId);
            const bsModal = new bootstrap.Modal(modalElement);

            // Handle confirm
            modalElement.querySelector('#confirmBtn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });

            // Handle cancel/close
            modalElement.addEventListener('hidden.bs.modal', () => {
                modalElement.remove();
                resolve(false);
            });

            bsModal.show();
        });
    },

    // Format currency
    formatCurrency(amount, currency = 'KES') {
        return `${currency} ${parseFloat(amount).toFixed(2)}`;
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format datetime
    formatDateTime(date) {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone (Kenyan format)
    validatePhone(phone) {
        const re = /^254[0-9]{9}$/;
        return re.test(phone);
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard!');
            return true;
        } catch (err) {
            this.showError('Failed to copy');
            return false;
        }
    },

    // Truncate text
    truncate(text, length = 50) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Generate random ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Make available globally
window.UIHelpers = UIHelpers;
