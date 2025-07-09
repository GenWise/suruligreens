// Product categories and their individual products
const productData = {
    // Microgreens category
    "Fresh Microgreens": {
        description: "Nutrient-packed microgreens, harvested daily",
        image: "https://images.unsplash.com/photo-1515283736202-cae4a8e5a0d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWljcm9ncmVlbnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
        products: [
            { name: "Sunflower Microgreens", price: 120, description: "Nutty flavor, crunchy texture, 30g pack" },
            { name: "Pea Shoot Microgreens", price: 140, description: "Sweet pea flavor, tender shoots, 30g pack" },
            { name: "Radish Microgreens", price: 120, description: "Spicy kick, vibrant color, 30g pack" },
            { name: "Broccoli Microgreens", price: 150, description: "Mild broccoli flavor, nutrient-dense, 30g pack" },
            { name: "Mustard Microgreens", price: 130, description: "Spicy mustard flavor, 30g pack" }
        ]
    },
    
    // Hydroponic Greens category
    "Hydroponic Greens": {
        description: "Clean, pesticide-free leafy greens",
        image: "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bGVhZnklMjBncmVlbnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
        products: [
            { name: "Lettuce - Romaine", price: 80, description: "Crisp, sweet lettuce, 100g pack" },
            { name: "Lettuce - Butterhead", price: 90, description: "Soft, buttery texture, 100g pack" },
            { name: "Baby Spinach", price: 100, description: "Tender spinach leaves, 100g pack" },
            { name: "Kale Mix", price: 120, description: "Assorted kale varieties, 100g pack" },
            { name: "Swiss Chard", price: 110, description: "Colorful stems, earthy flavor, 100g pack" }
        ]
    },
    
    // Fresh Herbs category
    "Fresh Herbs": {
        description: "Aromatic herbs for your cooking needs",
        image: "https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGVyYnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
        products: [
            { name: "Basil", price: 100, description: "Fragrant Italian basil, 30g bunch" },
            { name: "Mint", price: 90, description: "Fresh cooling mint, 30g bunch" },
            { name: "Coriander/Cilantro", price: 80, description: "Aromatic herb, 30g bunch" },
            { name: "Rosemary", price: 110, description: "Woody, aromatic sprigs, 20g pack" },
            { name: "Thyme", price: 100, description: "Delicate, earthy herb, 20g pack" }
        ]
    },
    
    // Weekly Box category
    "Weekly Box": {
        description: "Curated selection delivered weekly",
        image: "https://images.unsplash.com/photo-1543168256-418811576931?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Z3JlZW4lMjBib3h8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
        products: [
            { name: "Small Weekly Box", price: 450, description: "2 microgreens, 2 leafy greens, 1 herb" },
            { name: "Medium Weekly Box", price: 650, description: "3 microgreens, 3 leafy greens, 2 herbs" },
            { name: "Large Weekly Box", price: 950, description: "4 microgreens, 4 leafy greens, 3 herbs" },
            { name: "Family Box", price: 1200, description: "Double quantities of Medium box" },
            { name: "Chef's Box", price: 1500, description: "Premium selection for restaurants" }
        ]
    }
}; 