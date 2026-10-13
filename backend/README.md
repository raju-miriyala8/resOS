# RESOS backend

The backend is the API and data layer for RESOS. It receives requests from the frontend, checks access where needed, reads or updates restaurant data, and returns responses to the browser.

## Technologies

The server runs on Node.js and Express.js. MongoDB stores the application data and Mongoose is used to work with it. JSON Web Tokens provide authentication, bcryptjs hashes passwords, and dotenv loads configuration from the local environment.

## Main responsibilities

- Authenticate restaurant accounts and verify Owner, Manager, and Kitchen access.
- Manage restaurant menus and tables, including table QR identifiers.
- Create customer table sessions and orders.
- Provide order status updates to kitchen staff and customers.
- Serve dashboard and staff information to authorized restaurant users.

The code is grouped into routes, controllers, models, middleware, services, and utilities. The backend is currently a single modular application, not a set of microservices.

## Request flow

The frontend sends HTTP requests to the Express routes. Routes direct each request to its controller; the controller uses the relevant model or service to access MongoDB and sends a response back to the frontend. Protected routes verify the user's token and role before allowing staff operations.

Customer orders are associated with their table session. Kitchen staff update an order's status, and the frontend retrieves those updates by polling the API.

Online customer payment processing, platform-admin APIs, and revenue or attendance reporting are not currently implemented.
