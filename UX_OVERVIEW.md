## Suruli Greens – User Experience Overview

### Customer site (`index.html`)
- **Browse products**: Categories load from Google Sheets; click opens a modal with items, prices, and availability.
- **Cart**: Add items; WhatsApp floating button opens a cart modal to adjust quantities and view total.
- **Checkout**: One-tap opens WhatsApp with a prefilled order message. Optionally prompts for phone to use the MCP flow.
- **Alternatives**: Print the order or tap to call directly.
- **Feedback**: In-page notification confirms order receipt.
- **Pickup info**: Footer displays “Pick up at Edina Lobby, 6pm on Tuesdays or Fridays”.

### WhatsApp ordering and payment
- **With MCP configured**: Customer gets an order confirmation with payment options (WhatsApp Pay, QR, Call). A QR code image is sent; after payment, the customer receives a delivery-date message (auto-calculated Tue/Fri).
- **Without MCP**: Falls back to opening a `wa.me` chat with the prefilled order text.

### Admin dashboard (`dashboard.html`)
- **Summary**: Shows unfulfilled orders and total value.
- **Orders by category**: Counts per category.
- **Recent orders**: Tabs for All/Pending/Paid with actions to mark Paid or Fulfilled.
- **Data source**: Fetches from Google Apps Script; uses sample data if offline or misconfigured.

### Product catalog management
- **Google Sheet**: Manage categories, items, prices, and availability via the linked sheet in `catalog_link.html`. Changes reflect on the site.
- **Static view**: `products.html` provides a simple catalog listing.

### Contact and support
- **Visible on site**: WhatsApp number, call link, email; pickup details in footer.

### References
- See `README.md` for features and usage.
- See `implementation_guide.md` for setup and integration steps.


