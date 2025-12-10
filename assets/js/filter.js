document.addEventListener("DOMContentLoaded", function () {
    // Get the category from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        // Find all product items with data-category
        const products = document.querySelectorAll('.col-xl-3[data-category]'); // Targeting the columns we tagged

        let found = 0;
        products.forEach(product => {
            const productCategory = product.getAttribute('data-category');

            // Check if matches or if it's "All" (optional logic, not currently linked)
            if (productCategory === category) {
                product.style.display = 'block';
                found++;
            } else {
                product.style.display = 'none';
            }
        });

        // Optional: Update title or show message if none found
        console.log(`Filtered by ${category}: Found ${found} items.`);
    }
});
