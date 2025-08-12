// Suruli Greens Product Data
// This script fetches product data from a Google Sheet

// Import configuration from config.js
let SHEET_ID = '17OUHOS-Xhqmto_67ZbLMbWNnI7LgoDXswb3VwOvbkCU'; // Corrected ID without the extra "E"
let API_KEY = ''; // Optional: Only needed if sheet is not public

// Try to get config from global config object if available
if (typeof config !== 'undefined') {
    SHEET_ID = config.SHEET_ID || SHEET_ID;
    API_KEY = config.API_KEY || API_KEY;
}

// Initialize product data structure
let productData = {};
// Local fallback images for known categories (used only if sheet doesn't supply one)
const localImageMap = {
    'fresh microgreens': 'assets/images/categories/Microgreens.jpeg',
    'microgreens': 'assets/images/categories/Microgreens.jpeg',
    'hydroponic greens': 'assets/images/categories/Microgreens.jpeg',
    'fresh herbs': 'assets/images/categories/Microgreens.jpeg',
    'weekly box': 'assets/images/categories/Microgreens.jpeg',
    'weekly basket': 'assets/images/categories/Microgreens.jpeg'
};

// Fetch product data from Google Sheet
async function fetchProductData() {
    console.log('Fetching product data...');
    
    // Prefer JSONP first to avoid GViz JSON parsing issues
    try {
        await fetchJSONPMethod();
        return;
    } catch (jsonpError) {
        console.error('JSONP method failed:', jsonpError);
    }

    // Last resort: attempt direct method (skip naive CSV to avoid comma parsing issues)
    try {
        await fetchDirectMethod();
    } catch (error) {
        console.error('Direct method failed:', error);
        loadSampleData();
    }
}

// Direct fetch method (may have CORS issues)
async function fetchDirectMethod() {
    console.log('Trying direct fetch method...');
    
    // For a public sheet, we can use this simpler URL
    const sheetURL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    
    const response = await fetch(sheetURL);
    const text = await response.text();
    
    // Google's response is not pure JSON, it has a prefix we need to remove
    const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonText);
    
    // Process the data into our structure
    processSheetData(data.table);
    
    // Merge category metadata and then populate UI
    await finalizeProductsLoad();
    console.log('Product data loaded successfully using direct method:', productData);
    return true;
}

// JSONP method (avoids CORS issues)
function fetchGVizSheetJSONP(sheetName) {
    return new Promise((resolve, reject) => {
        const sheetURL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tq=SELECT%20*`;
        const script = document.createElement('script');
        script.src = sheetURL;
        const prevGoogle = window.google;
        const timeout = setTimeout(() => {
            reject(new Error(`JSONP request timed out for ${sheetName}`));
            cleanup();
        }, 10000);
        function cleanup() {
            try { document.body.removeChild(script); } catch (_) {}
            clearTimeout(timeout);
            // Restore previous google if any
            if (prevGoogle) {
                window.google = prevGoogle;
            } else {
                try { delete window.google; } catch (_) { window.google = undefined; }
            }
        }
        window.google = {
            visualization: {
                Query: {
                    setResponse: function(response) {
                        try {
                            if (!response || !response.table) {
                                throw new Error('Invalid GViz response');
                            }
                            resolve(response.table);
                        } catch (err) {
                            reject(err);
                        } finally {
                            cleanup();
                        }
                    }
                }
            }
        };
        script.onerror = function() {
            reject(new Error(`Error loading GViz JSONP for ${sheetName}`));
            cleanup();
        };
        document.body.appendChild(script);
    });
}

function fetchJSONPMethod() {
    console.log('Trying JSONP method...');
    // Try common sheet names in order
    const candidates = ['Products', 'Sheet1', 'Sheet'];
    let lastError = null;
    const tryNext = (idx) => {
        if (idx >= candidates.length) {
            if (lastError) throw lastError; else throw new Error('No suitable sheet found');
        }
        const name = candidates[idx];
        return fetchGVizSheetJSONP(name)
            .then(table => {
                processSheetData(table);
                return finalizeProductsLoad().then(() => true);
            })
            .catch(err => {
                lastError = err;
                console.warn(`GViz JSONP failed for ${name}:`, err && err.message ? err.message : err);
                return tryNext(idx + 1);
            });
    };
    return tryNext(0);
}

// CSV method (another approach to avoid CORS issues)
async function fetchCSVMethod() {
    console.log('Trying CSV method...');
    
    const csvURL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const response = await fetch(csvURL);
    const text = await response.text();
    
    // Process CSV data
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    // Map header indices for flexibility in column order
    const headerMap = {
        id: headers.findIndex(h => h.toLowerCase().includes('product id')),
        name: headers.findIndex(h => h.toLowerCase().includes('product name')),
        category: headers.findIndex(h => h.toLowerCase().includes('category')),
        description: headers.findIndex(h => h.toLowerCase().includes('description')),
        price: headers.findIndex(h => h.toLowerCase().includes('price')),
        availability: headers.findIndex(h => h.toLowerCase().includes('availability')),
        imageUrl: headers.findIndex(h => h.toLowerCase().includes('image'))
    };
    
    // Clear existing data
    productData = {};
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        
        const productId = headerMap.id >= 0 ? values[headerMap.id] || '' : '';
        const name = headerMap.name >= 0 ? values[headerMap.name] || '' : '';
        const category = headerMap.category >= 0 ? values[headerMap.category] || 'Uncategorized' : 'Uncategorized';
        const description = headerMap.description >= 0 ? values[headerMap.description] || '' : '';
        const price = headerMap.price >= 0 ? parseFloat(values[headerMap.price]) || 0 : 0;
        const availability = headerMap.availability >= 0 ? values[headerMap.availability] || 'In Stock' : 'In Stock';
        const imageUrl = headerMap.imageUrl >= 0 ? values[headerMap.imageUrl] || '' : '';
        
        // Create category if it doesn't exist
        if (!productData[category]) {
            // Prefer local category image when available
            const defaultImage = `https://source.unsplash.com/300x200/?${encodeURIComponent(category.toLowerCase())}`;
            const localImageMap = {
                'fresh microgreens': 'assets/images/categories/Microgreens.jpeg',
                'microgreens': 'assets/images/categories/Microgreens.jpeg'
            };
            const key = String(category || '').trim().toLowerCase();
            productData[category] = {
                description: `${category} from Suruli Greens`,
                image: localImageMap[key] ? toAbsoluteUrl(localImageMap[key]) : defaultImage,
                products: []
            };
        }
        
        // Add product to category
        productData[category].products.push({
            id: productId,
            name: name,
            description: description,
            price: price,
            availability: availability,
            imageUrl: imageUrl || `https://source.unsplash.com/300x200/?${encodeURIComponent(name.toLowerCase())}`
        });
    }
    
    console.log('Product data loaded successfully using CSV method:', productData);
    
    // Merge category metadata and then populate the UI
    await finalizeProductsLoad();
    return true;
}

// Process the sheet data into our structure
function processSheetData(tableData) {
    // Clear existing data
    productData = {};
    
    // Get headers from table column labels (GViz puts headers in cols)
    const headers = (tableData.cols || []).map(col => {
        const label = (col && (col.label != null)) ? col.label : '';
        return String(label);
    });
    
    // Map header indices for flexibility in column order
    const headerMap = {
        id: headers.findIndex(h => h.toLowerCase().includes('product id')),
        name: headers.findIndex(h => h.toLowerCase().includes('product name')),
        category: headers.findIndex(h => h.toLowerCase().includes('category')),
        description: headers.findIndex(h => h.toLowerCase().includes('description')),
        price: headers.findIndex(h => h.toLowerCase().includes('price')),
        availability: headers.findIndex(h => h.toLowerCase().includes('availability')),
        imageUrl: headers.findIndex(h => h.toLowerCase().includes('image'))
    };
    
    // Helper: validate category
    function isValidCategory(cat) {
        const s = String(cat || '').trim();
        if (!s) return false;
        if (/^\d/.test(s)) return false; // skip numeric-like categories such as '100'
        if (/^(quantity|price|availability)$/i.test(s)) return false;
        return true;
    }

    // Iterate all data rows
    for (let i = 0; i < tableData.rows.length; i++) {
        const row = tableData.rows[i].c;
        if (!row) continue;
        
        // Extract data from each row using the header map
        const productId = headerMap.id >= 0 ? (row[headerMap.id] && row[headerMap.id].v != null ? row[headerMap.id].v : '') : '';
        const name = headerMap.name >= 0 ? String(row[headerMap.name] && row[headerMap.name].v != null ? row[headerMap.name].v : '').trim() : '';
        let category = headerMap.category >= 0 ? (row[headerMap.category] && row[headerMap.category].v != null ? row[headerMap.category].v : 'Uncategorized') : 'Uncategorized';
        category = String(category === null || category === undefined ? 'Uncategorized' : category).trim();
        if (!isValidCategory(category)) {
            // Skip malformed rows (e.g., CSV-shifted or header artifacts)
            continue;
        }
        const description = headerMap.description >= 0 ? String(row[headerMap.description] && row[headerMap.description].v != null ? row[headerMap.description].v : '').trim() : '';
        // Ensure price is numeric; ignore header rows or stray text rows
        const rawPrice = headerMap.price >= 0 ? (row[headerMap.price] && row[headerMap.price].v != null ? row[headerMap.price].v : 0) : 0;
        const price = (typeof rawPrice === 'number') ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
        const availability = headerMap.availability >= 0 ? String(row[headerMap.availability] && row[headerMap.availability].v != null ? row[headerMap.availability].v : 'In Stock') : 'In Stock';
        const imageUrl = headerMap.imageUrl >= 0 ? String(row[headerMap.imageUrl] && row[headerMap.imageUrl].v != null ? row[headerMap.imageUrl].v : '').trim() : '';
        
        // Create category if it doesn't exist
        if (!productData[category]) {
            const defaultImage2 = `https://source.unsplash.com/300x200/?${encodeURIComponent(category.toLowerCase())}`;
            const key2 = String(category || '').trim().toLowerCase();
            productData[category] = {
                description: `${category} from Suruli Greens`,
                image: localImageMap[key2] ? toAbsoluteUrl(localImageMap[key2]) : defaultImage2,
                products: []
            };
        }
        
        // Add product to category
        productData[category].products.push({
            id: productId,
            name: name,
            description: description,
            price: price,
            availability: availability,
            imageUrl: imageUrl || `https://source.unsplash.com/300x200/?${encodeURIComponent(name.toLowerCase())}`
        });
    }
    
    console.log('Sheet data processed successfully:', productData);
}

// Fetch optional Categories sheet metadata and merge into productData
async function fetchCategoriesMeta() {
    // Use JSONP to load the Categories sheet
    const table = await fetchGVizSheetJSONP('Categories');
    if (!table || !table.rows || table.rows.length === 0) return {};
    // Headers from column labels
    const headers = (table.cols || []).map(col => String((col && col.label != null) ? col.label : ''));
    const headerMap = {
        category: headers.findIndex(h => h.toLowerCase().includes('category')),
        description: headers.findIndex(h => h.toLowerCase().includes('description')),
        imageUrl: headers.findIndex(h => h.toLowerCase().includes('image'))
    };
    const meta = {};
    for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i].c;
        if (!row) continue;
        const name = headerMap.category >= 0 ? String(row[headerMap.category] && row[headerMap.category].v != null ? row[headerMap.category].v : '').trim() : '';
        if (!name) continue;
        const description = headerMap.description >= 0 ? String(row[headerMap.description] && row[headerMap.description].v != null ? row[headerMap.description].v : '').trim() : '';
        const imageUrl = headerMap.imageUrl >= 0 ? String(row[headerMap.imageUrl] && row[headerMap.imageUrl].v != null ? row[headerMap.imageUrl].v : '').trim() : '';
        meta[normalizeName(name)] = { description, image: imageUrl };
    }
    return meta;
}

async function finalizeProductsLoad() {
    try {
        const categoriesMeta = await fetchCategoriesMeta();
        // Merge (case-insensitive, trimmed)
        for (const categoryName in productData) {
            const key = normalizeName(categoryName);
            if (categoriesMeta[key]) {
                const meta = categoriesMeta[key];
                if (meta.description) {
                    productData[categoryName].description = meta.description;
                }
                if (meta.image) {
                    productData[categoryName].image = toAbsoluteUrl(meta.image);
                }
            }
        }
    } catch (_) {
        // Ignore metadata failures; proceed with defaults
    }
    populateProductCategories();
    setupProductCategoryEvents();
}

function normalizeName(name) {
    return String(name || '').trim().toLowerCase();
}

function toAbsoluteUrl(url) {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    // Use config.SITE_URL if available, else derive from current location
    let base = '';
    try {
        if (typeof config !== 'undefined' && config.SITE_URL) {
            base = String(config.SITE_URL).replace(/\/?$/,'');
        } else if (typeof window !== 'undefined') {
            const loc = window.location;
            // Strip filename from pathname
            const pathBase = loc.pathname.replace(/\/[^/]*$/, '');
            base = `${loc.origin}${pathBase}`.replace(/\/?$/,'');
        }
    } catch (_) {}
    return `${base}/${String(url).replace(/^\/+/, '')}`;
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
                <img src="${category.image}" alt="${categoryName}" onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(categoryName)}'">
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
    
    // Check if we have products in this category
    if (!category.products || category.products.length === 0) {
        productList.innerHTML = '<div class="no-products">No products available in this category</div>';
    } else {
        // Add each product
        category.products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            
            // Add availability badge
            const availabilityClass = product.availability === 'In Stock' ? 'in-stock' : 'out-of-stock';
            
            // Use product image if available, otherwise generate one
            const imageUrl = (product.imageUrl ? toAbsoluteUrl(product.imageUrl) : '') || `https://source.unsplash.com/300x200/?${encodeURIComponent((product.name||'').toLowerCase())}`;
            
            productItem.innerHTML = `
                <div class="product-item-image">
                    <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/100x100?text=${encodeURIComponent(product.name)}'">
                </div>
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
    }
    
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
    console.log('Loading sample data...');
    
    productData = {
        "Fresh Microgreens": {
            description: "Nutrient-dense microgreens grown hydroponically",
            image: "https://source.unsplash.com/300x200/?microgreens",
            products: [
                { id: "MG001", name: "Sunflower Microgreens", description: "Nutty flavor crunchy texture 30g pack", price: 120, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?microgreens" },
                { id: "MG002", name: "Pea Shoot Microgreens", description: "Sweet pea flavor tender shoots 30g pack", price: 140, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?microgreens" },
                { id: "MG003", name: "Radish Microgreens", description: "Spicy kick vibrant color 30g pack", price: 120, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?microgreens" },
                { id: "MG004", name: "Broccoli Microgreens", description: "Mild broccoli flavor nutrient-dense 30g pack", price: 150, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?microgreens" },
                { id: "MG005", name: "Mustard Microgreens", description: "Spicy mustard flavor 30g pack", price: 130, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?microgreens" }
            ]
        },
        "Hydroponic Greens": {
            description: "Fresh leafy greens grown in our hydroponic system",
            image: "https://source.unsplash.com/300x200/?hydroponic",
            products: [
                { id: "HG001", name: "Lettuce - Romaine", description: "Crisp sweet lettuce 100g pack", price: 80, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?lettuce" },
                { id: "HG002", name: "Lettuce - Butterhead", description: "Soft buttery texture 100g pack", price: 90, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?lettuce" },
                { id: "HG003", name: "Baby Spinach", description: "Tender spinach leaves 100g pack", price: 100, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?spinach" },
                { id: "HG004", name: "Kale Mix", description: "Assorted kale varieties 100g pack", price: 120, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?kale" },
                { id: "HG005", name: "Swiss Chard", description: "Colorful stems earthy flavor 100g pack", price: 110, availability: "Out of Stock", imageUrl: "https://source.unsplash.com/300x200/?chard" }
            ]
        },
        "Fresh Herbs": {
            description: "Aromatic culinary herbs for cooking",
            image: "https://source.unsplash.com/300x200/?herbs",
            products: [
                { id: "FH001", name: "Basil", description: "Fragrant Italian basil 30g bunch", price: 100, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?basil" },
                { id: "FH002", name: "Mint", description: "Fresh cooling mint 30g bunch", price: 90, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?mint" },
                { id: "FH003", name: "Coriander/Cilantro", description: "Aromatic herb 30g bunch", price: 80, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?coriander" },
                { id: "FH004", name: "Rosemary", description: "Woody aromatic sprigs 20g pack", price: 110, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?rosemary" },
                { id: "FH005", name: "Thyme", description: "Delicate earthy herb 20g pack", price: 100, availability: "Out of Stock", imageUrl: "https://source.unsplash.com/300x200/?thyme" }
            ]
        },
        "Weekly Box": {
            description: "Curated boxes of fresh produce delivered weekly",
            image: "https://source.unsplash.com/300x200/?vegetable+box",
            products: [
                { id: "WB001", name: "Small Weekly Box", description: "2 microgreens 2 leafy greens 1 herb", price: 450, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?vegetable+box" },
                { id: "WB002", name: "Medium Weekly Box", description: "3 microgreens 3 leafy greens 2 herbs", price: 650, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?vegetable+box" },
                { id: "WB003", name: "Large Weekly Box", description: "4 microgreens 4 leafy greens 3 herbs", price: 950, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?vegetable+box" },
                { id: "WB004", name: "Family Box", description: "Double quantities of Medium box", price: 1200, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?vegetable+box" },
                { id: "WB005", name: "Chef's Box", description: "Premium selection for restaurants", price: 1500, availability: "In Stock", imageUrl: "https://source.unsplash.com/300x200/?vegetable+box" }
            ]
        }
    };
    
    // Populate UI with sample data
    populateProductCategories();
    setupProductCategoryEvents();
    
    console.log('Sample data loaded successfully');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing product data...');
    
    // Try to fetch from Google Sheet
    fetchProductData().catch(error => {
        console.error('All fetch methods failed:', error);
        loadSampleData();
    });
    
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