# RESOS frontend

The frontend is the part of RESOS that restaurant staff and customers use in their browsers.

## What it does

- Signs restaurant users in and directs them to the Owner, Manager, or Kitchen workspace.
- Lets the Owner and Manager manage restaurant menu items and tables.
- Opens a table-specific customer menu when someone scans its QR code.
- Sends customer orders to the backend and shows order progress.
- Shows the Kitchen incoming orders and lets kitchen staff update their status.

## Technologies

The interface uses React and JavaScript, with Vite for development and builds. Tailwind CSS styles the pages, React Router handles navigation, Redux Toolkit keeps the current sign-in state, and Axios communicates with the backend API. Table QR codes are displayed with `qrcode.react`.

## Request flow

The public customer menu loads the menu for the QR code and sends orders without requiring a customer account. Staff pages use the signed-in user's role token for protected API requests. The customer and kitchen screens periodically request order updates from the backend.

The frontend can display a cash or online payment preference, but that choice is not saved or processed as a payment. Online payments are not implemented.
