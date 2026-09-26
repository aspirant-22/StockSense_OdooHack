# 📦 StockSense — Modular Inventory Management System
> **Odoo-Inspired Double-Entry Inventory Ledger & Warehouse Management Engine**

[![MERN Stack](https://img.shields.io/badge/Stack-MERN%20(React%2019%20%2B%20Node%20%2B%20Mongo)-blue?style=for-the-badge)](https://github.com)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-purple?style=for-the-badge)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8?style=for-the-badge)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-green?style=for-the-badge)](LICENSE)

---

## 🌟 Executive Summary

**StockSense** is an enterprise-grade Inventory Management System (IMS) inspired by the core architectural philosophy of **Odoo Inventory**. Rather than simply incrementing or decrementing arbitrary stock numbers, StockSense treats physical and virtual inventory movements as **double-entry transactions**: stock never appears or disappears out of thin air—it only moves from a **Source Location** to a **Destination Location**.

Whether receiving raw materials from vendors, routing components between internal production racks, dispatching delivery orders to customers, or reconciling physical count discrepancies, StockSense guarantees **total auditability**, **zero stock loss**, and **real-time quant synchronization**.

---

## 📐 Core Architecture & Odoo-Style Mechanics

```
                  ┌──────────────────────────────────────────────┐
                  │             StockSense Engine                │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │     Source Location       │                   │   Destination Location    │
   │  (Supplier/Internal/Loss) │                   │  (Internal/Customer/Loss) │
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
                 │   [ - Quantity if Internal ]                  │   [ + Quantity if Internal ]
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                      ┌─────────────────────────────────────┐
                      │  Immutable Stock Move Audit Ledger  │
                      │  (Product, SKU, Qty, Ref, User, Ts) │
                      └─────────────────────────────────────┘
```

### 1. Double-Entry Stock Movement Ledger
Every stock event generates an immutable `StockMove` record tracking:
* **Source Location (`srcLocationId`)**
* **Destination Location (`destLocationId`)**
* **Product & SKU**
* **Quantity & Unit of Measure (UOM)**
* **User Attribution & Timestamps**

### 2. Location Types & Quant Resolution
* **Physical / Internal Locations (`internal`)**: Actual storage points (e.g., `WH/Stock`, `WH/Production-A`). Stock quantities (`StockQuant`) are tracked with unique indexes `(productId, locationId)`.
* **Virtual Partner Locations (`supplier`, `customer`)**: Conceptual origins for vendor receipts and final destinations for customer shipments.
* **Virtual Inventory Loss Locations (`inventory_loss`)**: Reconciles physical stock adjustments (spoilage, damage, physical audit differences).

| Operation Type | Source Location | Destination Location | Physical Quant Impact |
| :--- | :--- | :--- | :--- |
| **Incoming Receipt** | `Partner Locations/Vendors` | `WH/Stock` | + Increases destination quant |
| **Delivery Order** | `WH/Stock` | `Partner Locations/Customers` | - Decreases source quant (validated) |
| **Internal Transfer** | `WH/Stock` | `WH/Production-A` | - Decreases source / + Increases destination |
| **Adjustment (Gain)** | `Virtual Locations/Loss` | `WH/Stock` | + Increases destination quant |
| **Adjustment (Loss)** | `WH/Stock` | `Virtual Locations/Loss` | - Decreases source quant |

---

## ✨ Key Features & Capabilities

### 📊 1. Real-Time Operational Dashboard
* **Dynamic KPI Cards**: Total tracked SKUs, Low Stock warnings, Pending Receipts, Pending Delivery Orders, and Internal Transfers.
* **Warehouse Filtering**: Instantly isolate metrics by individual warehouse facility or across the entire company.
* **Quick-Launch Operations**: 1-click shortcuts to initiate Receipts, Deliveries, Transfers, or Stock Adjustments.

### 📥 2. Incoming Receipts (Procurement & Inward Logistics)
* Manage purchase deliveries from external vendors into internal warehouse storage.
* Automated sequential reference generation (e.g., `IN/2026/0001`).
* Step-by-step lifecycle management (`Draft` ➔ `Ready` ➔ `Done`).
* Validation checks ensure products and quantities are accurately received and quants updated.

### 📤 3. Delivery Orders (Outward Dispatch & Fulfillment)
* Fulfill customer orders directly from specified warehouse storage locations.
* **Stock Availability Checks**: Real-time validation prevents dispatching items when quantities are insufficient.
* Generates dispatch references (e.g., `OUT/2026/0001`).

### 🔄 4. Internal Warehouse Transfers
* Shift inventory between racks, zones, or distinct warehouse branches (e.g., `WH/Stock` ➔ `WH/Production Rack A`).
* Full traceability for internal logistics and manufacturing workflows.

### ⚖️ 5. Inventory Adjustments & Count Reconciliation
* Audit physical stock counts against theoretical system ledger quantities.
* Calculate variance deltas and automatically post compensating stock moves to the virtual inventory loss location.

### 📜 6. Immutable Stock Move Ledger
* Comprehensive audit trail for every single item transfer.
* Searchable and filterable by SKU, reference number, operation type, or date.
* Complete traceability of who moved what, when, and between which exact locations.

### 🏷️ 7. Product Catalog & Automated Reordering Alerts
* SKU categorization, barcode tagging, unit of measure (Units, Kg, Box, Liters).
* Configurable **Minimum Stock Thresholds** triggering warning badges and replenishment suggestions.

### 🏢 8. Multi-Warehouse & Location Management
* Configure multiple physical warehouses with unique codes and addresses.
* Subdivide warehouses into granular storage nodes and racks.

### 🔐 9. Role-Based Access Control & Security
* Dual-tier authentication: **Warehouse Manager** and **Warehouse Operator (Staff)**.
* JSON Web Token (JWT) based session management with protected Express middlewares.
* Zod schema validation on incoming payloads.
* Password reset flow with integrated OTP support.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React, Axios, Clsx, Tailwind Merge |
| **Backend** | Node.js, Express.js 4, Mongoose 8 (MongoDB ODM), Zod 3, JWT, Bcrypt.js, Nodemailer |
| **Database** | MongoDB (NoSQL document store with compound indexing for Quants & Movements) |
| **Architecture Pattern** | Modular Double-Entry Stock Ledger, Service Layer Pattern, RESTful API |

---

## 📂 Project Structure

```
StockSense/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── auth.controller.js       # User auth, login, OTP recovery
│   │   ├── dashboard.controller.js  # Aggregated metrics & operational counts
│   │   ├── operation.controller.js  # Receipts, Deliveries, Transfers, Adjustments
│   │   ├── product.controller.js    # SKU management & reorder levels
│   │   └── warehouse.controller.js  # Multi-warehouse and location nodes
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT extraction & role validation
│   │   ├── error.middleware.js      # Global error handling middleware
│   │   └── validate.middleware.js   # Zod request schema validation
│   ├── models/
│   │   ├── Location.js              # Physical (internal) & Virtual locations
│   │   ├── Product.js               # SKU catalog, UOM, reorder thresholds
│   │   ├── ProductCategory.js       # Taxonomy / product grouping
│   │   ├── StockMove.js             # Immutable movement ledger
│   │   ├── StockOperation.js        # High-level operations header & lines
│   │   ├── StockQuant.js            # Real-time location stock balances
│   │   ├── User.js                  # System users & access roles
│   │   └── Warehouse.js             # Physical facilities
│   ├── routes/                      # Express route definitions
│   ├── services/
│   │   ├── email.service.js         # Nodemailer OTP email transporter
│   │   └── stock.service.js         # Core double-entry stock execution engine
│   ├── validators/                  # Zod validation schemas
│   ├── seeder.js                    # Database seeder with sample data
│   ├── server.js                    # Express application entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/                      # Static assets & favicon
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.js       # Pre-configured Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   ├── forms/               # Modal dialogs & operation entry forms
│   │   │   └── layout/              # Sidebar, Topbar, navigation shells
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global user auth & session provider
│   │   ├── pages/
│   │   │   ├── auth/                # Sign In, Sign Up, Password Recovery
│   │   │   ├── dashboard/           # Metrics cards, warehouse filter, quick actions
│   │   │   ├── ledger/              # Stock move audit trail table
│   │   │   ├── operations/          # Receipts, Deliveries, Transfers, Adjustments
│   │   │   ├── products/            # SKU catalog, low-stock alerts, reorder rules
│   │   │   └── settings/            # Warehouses & location tree management
│   │   ├── App.jsx                  # Root view router & layout orchestrator
│   │   ├── index.css                # Tailwind CSS root imports
│   │   └── main.jsx                 # React DOM mount point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── package.json                     # Root monorepo script runner
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **MongoDB**: Local instance running at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

---

### Step 1: Installation

Clone the repository and install all dependencies for both backend and frontend using the root helper script:

```bash
# Clone the repository
git clone https://github.com/aspirant-22/StockSense_OdooHack.git
cd StockSense

# Install root, backend, and frontend dependencies in one command
npm run install:all
```

Alternatively, install dependencies manually:
```bash
# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

---

### Step 2: Environment Configuration

Create a `.env` file in the `backend/` directory based on `.env.example`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stocksense
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173

# Optional: Real SMTP credentials for password reset emails
# SMTP_SERVICE=gmail
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_16_char_google_app_password
```

---

### Step 3: Seed Default Demonstration Data

Populate the database with sample warehouses, locations, categories, SKUs, initial stock quants, and test user accounts:

```bash
cd backend
node seeder.js
```

#### 🔑 Pre-Configured Demo Accounts:
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Inventory Lead (Manager)** | `admin@stocksense.io` | `password123` | Full access (Warehouses, SKUs, Operations, Adjustments) |
| **Warehouse Operator (Staff)** | `staff@stocksense.io` | `password123` | Operational access (Receipts, Deliveries, Transfers) |

---

### Step 4: Run the Application

You can launch both services concurrently from the root directory or in separate terminals:

#### Option A: Root Monorepo Scripts
```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend Client (runs on http://localhost:5173)
npm run dev:frontend
```

#### Option B: Individual Folders
```bash
# Run Backend
cd backend
npm run dev

# Run Frontend (in a separate terminal)
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser and log in with the demo credentials.

---

## 📡 API Reference Overview

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new user account
* `POST /api/auth/login` — Authenticate and retrieve JWT Bearer token
* `POST /api/auth/forgot-password` — Generate and email OTP password recovery code
* `POST /api/auth/reset-password` — Verify OTP and set a new password
* `GET /api/auth/me` — Retrieve current authenticated session info *(Protected)*

### Operations & Stock Moves (`/api/operations`)
* `GET /api/operations` — List stock operations (filtered by `type`, `status`, `warehouseId`)
* `POST /api/operations` — Create a new operation (Receipt, Delivery, Transfer)
* `GET /api/operations/:id` — Retrieve full operation details with item lines
* `POST /api/operations/:id/validate` — Validate and execute operation stock moves
* `POST /api/operations/:id/cancel` — Cancel a pending or draft operation
* `GET /api/operations/ledger/moves` — Retrieve immutable double-entry stock move audit log
* `POST /api/operations/adjust` — Direct physical count adjustment execution

### Products & Categories (`/api/products`)
* `GET /api/products` — List all products with current on-hand quantities & stock alerts
* `POST /api/products` — Create a new product SKU
* `GET /api/products/:id` — Retrieve product details with location quant breakdown
* `PUT /api/products/:id` — Update product metadata & reorder threshold rules
* `DELETE /api/products/:id` — Remove a product record
* `GET /api/products/categories` — List all product categories

### Warehouses & Locations (`/api/warehouses`)
* `GET /api/warehouses` — List all warehouses with attached storage locations
* `POST /api/warehouses` — Create a new warehouse facility
* `GET /api/warehouses/locations` — Retrieve all storage location nodes (Internal & Virtual)
* `POST /api/warehouses/locations` — Create a new internal location / shelf

### Dashboard (`/api/dashboard`)
* `GET /api/dashboard/metrics` — Aggregate operational counters, low-stock warnings, and recent activity

---

## 🛡️ Validation & Reliability

* **Transactional Integrity**: Location stock deduction only occurs upon stock availability confirmation; negative balances are prevented on internal storage locations.
* **Compound Database Indexing**: `StockQuant` uses `{ productId: 1, locationId: 1 }` unique compound index to ensure one authoritative record per location per product.
* **Strict Payload Validation**: All inbound JSON requests are verified using **Zod** schemas before reaching controller logic.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.
