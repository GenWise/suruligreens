// Debug script for Suruli Greens
console.log('Debug script loaded');

// Check if config is loaded
console.log('Config object:', typeof config !== 'undefined' ? 'Loaded' : 'Not loaded');
if (typeof config !== 'undefined') {
    console.log('SHEET_ID:', config.SHEET_ID);
}

// Check if productData is populated
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Check if products.js functions exist
    console.log('fetchProductData exists:', typeof fetchProductData === 'function');
    console.log('populateProductCategories exists:', typeof populateProductCategories === 'function');
    
    // Check if product grid exists
    const productsGrid = document.querySelector('.products-grid');
    console.log('Products grid found:', productsGrid ? true : false);
    
    // Log product data after a delay to ensure it's loaded
    setTimeout(() => {
        console.log('Product data after delay:', productData);
        console.log('Product data keys:', Object.keys(productData));
        console.log('Number of categories:', Object.keys(productData).length);
        
        // Try to manually populate categories if not already done
        if (Object.keys(productData).length > 0 && productsGrid && productsGrid.children.length === 0) {
            console.log('Attempting manual population of categories');
            try {
                populateProductCategories();
                console.log('Manual population completed');
            } catch (e) {
                console.error('Error during manual population:', e);
            }
        }
    }, 3000);
    
    // Check for Google Sheet fetch errors
    window.addEventListener('error', function(e) {
        console.error('Global error caught:', e.message);
        if (e.message.includes('Google') || e.message.includes('CORS')) {
            console.error('Possible Google Sheets API error');
        }
    });
}); 