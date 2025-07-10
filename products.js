// Suruli Greens Product Data
// This script fetches product data from a Google Sheet

// Import configuration from config.js
let SHEET_ID = '17OUHOS-Xhqmto_67ZbLMbWNnI7LgoDXswb3VwOvbkCUE';
let API_KEY = ''; // Optional: Only needed if sheet is not public

// Try to get config from global config object if available
if (typeof config !== 'undefined') {
    SHEET_ID = config.SHEET_ID || SHEET_ID;
    API_KEY = config.API_KEY || API_KEY;
}

// Initialize product data structure
let productData = {};

// Fetch product data from Google Sheet
async function fetchProductData() {
    try {
        // For a public sheet, we can use this simpler URL
        const sheetURL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
        
        const response = await fetch(sheetURL);
        const text = await response.text();
        
        // Google's response is not pure JSON, it has a prefix we need to remove
        const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonText);
        
        // Process the data into our structure
        processSheetData(data.table);
        
        // After processing, populate the UI
        populateProductCategories();
        setupProductCategoryEvents();
        
        console.log('Product data loaded successfully:', productData);
    } catch (error) {
        console.error('Error fetching product data:', error);
        
        // Fallback to sample data if fetch fails
        loadSampleData();
    }
}

// Process the sheet data into our structure
function processSheetData(tableData) {
    // Clear existing data
    productData = {};
    
    // Skip the header row (row 0)
    for (let i = 1; i < tableData.rows.length; i++) {
        const row = tableData.rows[i].c;
        
        // Extract data from each row
        // Assuming columns are: Product ID, Name, Category, Description, Price, Availability
        const productId = row[0]?.v || '';
        const name = row[1]?.v || '';
        const category = row[2]?.v || 'Uncategorized';
        const description = row[3]?.v || '';
        const price = parseFloat(row[4]?.v) || 0;
        const availability = row[5]?.v || 'In Stock';
        
        // Create category if it doesn't exist
        if (!productData[category]) {
            productData[category] = {
                description: `${category} from Suruli Greens`,
                image: `https://source.unsplash.com/300x200/?${encodeURIComponent(category.toLowerCase())}`,
                products: []
            };
        }
        
        // Add product to category
        productData[category].products.push({
            id: productId,
            name: name,
            description: description,
            price: price,
            availability: availability
        });
    }
}

// Populate product categories in the grid
function populateProductCategories() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;
    
    // Clear existing content
    productsGrid.innerHTML = '';
    
    // Add each product category
    for (const categoryName in productData) {
        const category = productData[categoryName];
        
        const categoryCard = document.createElement('div');
        categoryCard.classList.add('product-card');
        categoryCard.dataset.category = categoryName;
        
        categoryCard.innerHTML = `
            <div class="product-image">
                <img src="${category.image}" alt="${categoryName}">
            </div>
            <div class="product-info">
                <h3>${categoryName}</h3>
                <p>${category.description}</p>
                <div class="product-price">From ₹${getLowestPrice(category.products)}</div>
                <button class="view-products-btn">View Products</button>
            </div>
        `;
        
        productsGrid.appendChild(categoryCard);
    }
}

// Get the lowest price from a category's products
function getLowestPrice(products) {
    if (!products || products.length === 0) return 0;
    return Math.min(...products.map(product => product.price));
}

// Set up click events for product categories
function setupProductCategoryEvents() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.dataset.category;
            showProductsModal(categoryName);
        });
        
        // Also set up the View Products button
        const viewBtn = card.querySelector('.view-products-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click
                const categoryName = card.dataset.category;
                showProductsModal(categoryName);
            });
        }
    });
}

// Show the products modal for a specific category
function showProductsModal(categoryName) {
    const category = productData[categoryName];
    if (!category) return;
    
    // Set the modal title
    const productCategoryTitle = document.getElementById('productCategoryTitle');
    if (productCategoryTitle) {
        productCategoryTitle.textContent = categoryName;
    }
    
    // Get the modal body
    const productModalBody = document.querySelector('.product-modal-body');
    if (!productModalBody) return;
    
    // Clear and populate the modal body
    productModalBody.innerHTML = '';
    
    // Create product list container
    const productList = document.createElement('div');
    productList.classList.add('product-list');
    
    // Add each product
    category.products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('product-item');
        
        // Add availability badge
        const availabilityClass = product.availability === 'In Stock' ? 'in-stock' : 'out-of-stock';
        
        productItem.innerHTML = `
            <h4>${product.name}</h4>
            <div class="product-item-description">${product.description}</div>
            <div class="product-item-price">₹${product.price}</div>
            <div class="product-item-availability ${availabilityClass}">${product.availability}</div>
            ${product.availability === 'In Stock' ? 
                `<button class="add-to-cart-btn" data-name="${product.name}" data-price="${product.price}">Add to Cart</button>` : 
                `<button class="add-to-cart-btn disabled" disabled>Out of Stock</button>`
            }
        `;
        
        productList.appendChild(productItem);
    });
    
    productModalBody.appendChild(productList);
    
    // Add click events to the Add to Cart buttons
    const addToCartButtons = productModalBody.querySelectorAll('.add-to-cart-btn:not(.disabled)');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.dataset.name;
            const price = parseInt(this.dataset.price);
            
            addToCart(productName, price);
            
            // Show confirmation
            this.textContent = "Added!";
            this.style.backgroundColor = "#4a7c59";
            
            setTimeout(() => {
                this.textContent = "Add to Cart";
                this.style.backgroundColor = "";
            }, 1000);
        });
    });
    
    // Show the modal
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.style.display = 'flex';
    }
}

// Load sample data in case the Google Sheet fetch fails
function loadSampleData() {
    productData = {
        "Fresh Microgreens": {
            description: "Nutrient-dense microgreens grown hydroponically",
            image: "https://source.unsplash.com/300x200/?microgreens",
            products: [
                { id: "MG001", name: "Sunflower Microgreens", description: "Nutty flavor crunchy texture 30g pack", price: 120, availability: "In Stock" },
                { id: "MG002", name: "Pea Shoot Microgreens", description: "Sweet pea flavor tender shoots 30g pack", price: 140, availability: "In Stock" },
                { id: "MG003", name: "Radish Microgreens", description: "Spicy kick vibrant color 30g pack", price: 120, availability: "In Stock" },
                { id: "MG004", name: "Broccoli Microgreens", description: "Mild broccoli flavor nutrient-dense 30g pack", price: 150, availability: "In Stock" },
                { id: "MG005", name: "Mustard Microgreens", description: "Spicy mustard flavor 30g pack", price: 130, availability: "In Stock" }
            ]
        },
        "Hydroponic Greens": {
            description: "Fresh leafy greens grown in our hydroponic system",
            image: "https://source.unsplash.com/300x200/?hydroponic",
            products: [
                { id: "HG001", name: "Lettuce - Romaine", description: "Crisp sweet lettuce 100g pack", price: 80, availability: "In Stock" },
                { id: "HG002", name: "Lettuce - Butterhead", description: "Soft buttery texture 100g pack", price: 90, availability: "In Stock" },
                { id: "HG003", name: "Baby Spinach", description: "Tender spinach leaves 100g pack", price: 100, availability: "In Stock" },
                { id: "HG004", name: "Kale Mix", description: "Assorted kale varieties 100g pack", price: 120, availability: "In Stock" },
                { id: "HG005", name: "Swiss Chard", description: "Colorful stems earthy flavor 100g pack", price: 110, availability: "Out of Stock" }
            ]
        },
        "Fresh Herbs": {
            description: "Aromatic culinary herbs for cooking",
            image: "https://source.unsplash.com/300x200/?herbs",
            products: [
                { id: "FH001", name: "Basil", description: "Fragrant Italian basil 30g bunch", price: 100, availability: "In Stock" },
                { id: "FH002", name: "Mint", description: "Fresh cooling mint 30g bunch", price: 90, availability: "In Stock" },
                { id: "FH003", name: "Coriander/Cilantro", description: "Aromatic herb 30g bunch", price: 80, availability: "In Stock" },
                { id: "FH004", name: "Rosemary", description: "Woody aromatic sprigs 20g pack", price: 110, availability: "In Stock" },
                { id: "FH005", name: "Thyme", description: "Delicate earthy herb 20g pack", price: 100, availability: "Out of Stock" }
            ]
        },
        "Weekly Box": {
            description: "Curated boxes of fresh produce delivered weekly",
            image: "https://source.unsplash.com/300x200/?vegetable+box",
            products: [
                { id: "WB001", name: "Small Weekly Box", description: "2 microgreens 2 leafy greens 1 herb", price: 450, availability: "In Stock" },
                { id: "WB002", name: "Medium Weekly Box", description: "3 microgreens 3 leafy greens 2 herbs", price: 650, availability: "In Stock" },
                { id: "WB003", name: "Large Weekly Box", description: "4 microgreens 4 leafy greens 3 herbs", price: 950, availability: "In Stock" },
                { id: "WB004", name: "Family Box", description: "Double quantities of Medium box", price: 1200, availability: "In Stock" },
                { id: "WB005", name: "Chef's Box", description: "Premium selection for restaurants", price: 1500, availability: "In Stock" }
            ]
        }
    };
    
    // Populate UI with sample data
    populateProductCategories();
    setupProductCategoryEvents();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Try to fetch from Google Sheet
    fetchProductData();
    
    // Set up product modal events
    setupProductModalEvents();
});

// Set up product modal events
function setupProductModalEvents() {
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.querySelector('.close-product-modal');
    
    // Close modal when clicking X
    if (closeProductModal) {
        closeProductModal.addEventListener('click', function() {
            productModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });
} 