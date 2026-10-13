# RESOS

RESOS is a restaurant operations and QR-ordering application. Restaurant staff manage the menu and tables, customers order from their table using a QR code, and kitchen staff update each order as it is prepared.

## How it works

1. A restaurant owner creates a restaurant account and sets up access for the Owner, Manager, and Kitchen roles.
2. The Owner or Manager manages menu items and restaurant tables. Each table has its own QR code.
3. A customer scans the table's QR code and opens that restaurant's menu in a browser. The QR code identifies the table, so the order is associated with the correct table.
4. The customer chooses menu items and sends an order to the restaurant.
5. Kitchen staff see incoming orders and move them through the preparation stages. The customer can follow the order status from the menu page.

## Technology

- **Frontend:** React, JavaScript, Vite, Tailwind CSS, React Router, Redux Toolkit, and Axios.
- **Backend:** Node.js and Express.js REST API.
- **Database:** MongoDB, accessed through Mongoose.
- **Authentication:** JSON Web Tokens (JWT), role-based access, and bcryptjs password hashing.
- **QR codes:** `qrcode.react` creates a unique table link for customers to scan.

The frontend and backend are separate applications. The React app sends HTTP requests to the Express API, which handles authentication and restaurant data in MongoDB.

## Project structure

- `frontend/` — Customer menu, sign-in pages, and Owner, Manager, and Kitchen screens.
- `backend/` — Express server, routes, controllers, models, middleware, and services.

## Current scope

RESOS supports the main menu, table, QR-ordering, and kitchen workflow. Online payments are not implemented; customers settle the bill with restaurant staff. Platform-admin screens are placeholders, and sales-revenue and attendance reporting depend on backend APIs that are not currently available.

Redis, background job queues, load balancing, and microservices are possible future improvements; they are not part of the current application.
