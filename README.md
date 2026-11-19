# CampusCart – University Multi-Vendor E-Commerce Marketplace

**CampusCart** is a full-stack, multi-vendor university marketplace web application built with **React (Vite + Tailwind CSS)** and **Django REST Framework + SQLite**. Students and university staff can browse verified campus shops, inspect live inventory, add products from multiple shops into a single cart, place a unified checkout that automatically splits into independent shop-specific orders, and collect orders directly from campus shop pickup counters.

---

## Key Features

### 1. Customer Experience (Students & University Staff)
- **Home Page**: Hero showcase with live marketplace stats, category quick-filters, popular products, special discounted offers, featured university shops, and recently added products.
- **All Shops & Shop Details**: Browse approved campus shops with Open/Closed status based on configured opening hours, campus locations, contact details, and within-shop product search.
- **Product Discovery & Filtering**: Search products, shops, and categories; filter by category, shop, min/max ₹ price, in-stock availability, and discounted deals; sort by newest, popularity, or price.
- **Multi-Shop Shopping Cart & Atomic Checkout**: Add products from multiple campus shops into one cart. At checkout, the Django backend atomically creates **1 parent `OrderGroup`** and **N independent shop-specific `Order` records** (one per shop) inside a database transaction (`transaction.atomic()` + `select_for_update()`).
- **Pickup Slots & Honest Payment Tracking**: Choose a campus pickup slot (global or per-shop) and select **Cash on Pickup** or **UPI (Pay at Pickup / Gateway Integration Ready)**. Payment status (`Pending`, `Paid`, `Failed`, `Refunded`) is tracked separately and never faked as paid without a real gateway.
- **Live Order Tracking & Cancellation**: Track every shop order independently with visual status badges and a 5-stage progress timeline (`Pending → Accepted → Preparing → Ready for Pickup → Completed`). Cancel eligible orders (`Pending` / `Accepted`) to automatically restore inventory.
- **Reviews, Ratings & Profile Management**: Rate and review products, manage profile & password, receive real-time in-app notifications, and submit new campus shop applications.

### 2. Shop Owner / Shop Manager Dashboard
- Strictly scoped to the manager's own shop (backend prevents viewing or modifying another shop's products or orders).
- Overview metrics: total products, total/pending/completed orders, total sales, and **low-stock alerts** with 1-click restock.
- Complete Product & Inventory CRUD with image upload validation, discount pricing, stock controls, and availability toggles.
- Order fulfillment workflow enforcing strict backend state transitions (`PENDING → ACCEPTED/REJECTED`, `ACCEPTED → PREPARING`, `PREPARING → READY_FOR_PICKUP`, `READY_FOR_PICKUP → COMPLETED`) and payment status updates.
- Sales Analytics: best-selling products, last 7 days daily stats, and monthly revenue breakdown.

### 3. Administrator Dashboard
- Platform-wide KPIs: registered customers, shops, pending approval queue, products, orders, and total platform sales.
- **Shop Governance**: Approve, reject, suspend, add, or remove campus shops. Only `APPROVED` & active shops appear publicly.
- **User & Category Management**: Create shop owner/user accounts, suspend/reactivate accounts, and manage product categories.
- **Moderation & Monitoring**: Monitor all orders/payments across shops and moderate reported products & reviews.

---

## Project Structure

```text
CampusCart/
├── README.md
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── campuscart.sqlite3
│   ├── media/                  # Uploaded & seeded shop logos, banners, and product images
│   ├── config/                 # Settings, URLs, WSGI/ASGI, RBAC permissions
│   ├── accounts/               # Custom User model, JWT Auth, Profile, Reset Password, Admin Users
│   ├── shops/                  # Shop model, approval workflow, seed_campuscart management command
│   ├── products/               # Category, Product, stock constraints, search/filter APIs
│   ├── cart/                   # Cart & CartItem with stock checks & multi-shop grouping
│   ├── orders/                 # OrderGroup, Order, OrderItem, atomic checkout, analytics, tests
│   ├── reviews/                # Product ratings/reviews & moderation
│   └── notifications/          # User notifications on orders & shop approvals
└── frontend/
    ├── package.json
    ├── vite.config.js          # Tailwind v4 + /api & /media proxy to Django (127.0.0.1:8000)
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── services/api.js     # Axios client with JWT auto-refresh & API helpers
        ├── context/            # AuthContext, CartContext, ToastContext
        ├── hooks/              # useDebounce
        ├── layouts/            # CustomerLayout, DashboardLayout
        ├── components/         # Navbar, Footer, ProductCard, ShopCard, OrderTimeline, etc.
        └── pages/              # All 9 customer pages + ShopOwnerDashboard + AdminDashboard
```

---

## Installation & Running Locally

Run the **Django Backend** and **React Frontend** in two separate terminals.

### 1. Start the Backend (Django REST Framework)

```powershell
cd d:\CampusCart\backend

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# (Optional) Install dependencies if setting up fresh
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Seed demo shops, 48 products, sample orders, reviews & images
python manage.py seed_campuscart

# Start Django development server on http://127.0.0.1:8000
python manage.py runserver
```

> **Note:** To reset and re-seed demo data cleanly at any time, run:
> `python manage.py seed_campuscart --reset`

### 2. Start the Frontend (React + Vite)

Open a second terminal:

```powershell
cd d:\CampusCart\frontend

# (Optional) Install dependencies if setting up fresh
npm install

# Start Vite development server on http://localhost:5173
npm run dev
```

Visit **http://localhost:5173** in your browser. Vite automatically proxies `/api` and `/media` requests to `http://127.0.0.1:8000`.

---

## Demo Login Credentials (Local Development Only)

| Role | Username | Email | Password | Assigned Shop / Notes |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin@campuscart.edu` | `admin123` | Full platform control |
| **Customer (Student)** | `student1` | `aarav.sharma@campuscart.edu` | `student123` | Has sample multi-shop order history |
| **Customer (Student)** | `student2` | `priya.patel@campuscart.edu` | `student123` | Has active pickup orders |
| **Shop Owner** | `owner_stationery` | `stationery@campuscart.edu` | `shop123` | University Stationery Shop |
| **Shop Owner** | `owner_canteen` | `canteen@campuscart.edu` | `shop123` | Campus Canteen |
| **Shop Owner** | `owner_grocery` | `grocery@campuscart.edu` | `shop123` | University Grocery Store |
| **Shop Owner** | `owner_electronics` | `electronics@campuscart.edu` | `shop123` | Campus Electronics Shop |
| **Shop Owner** | `owner_printing` | `printing@campuscart.edu` | `shop123` | Printing and Photocopy Center |
| **Shop Owner** | `owner_bakery` | `bakery@campuscart.edu` | `shop123` | University Bakery |
| **Shop Owner** | `owner_clothing` | `clothing@campuscart.edu` | `shop123` | Campus Clothing Store |
| **Shop Owner (Pending)** | `owner_sports` | `sports@campuscart.edu` | `shop123` | Campus Cycle & Sports Gear *(Pending Admin Approval)* |

---

## REST API Documentation

Base URL: `http://127.0.0.1:8000/api/`

### Authentication & Profile
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register/` | Public | Register a new Customer account (returns JWT tokens) |
| `POST` | `/auth/login/` | Public | Login with username or email + password |
| `POST` | `/auth/token/refresh/` | Public | Refresh JWT access token |
| `GET / PATCH` | `/auth/profile/` | Auth | View or update authenticated user profile |
| `POST` | `/auth/change-password/` | Auth | Update account password |
| `POST` | `/auth/forgot-password/` | Public | Request password reset code |
| `POST` | `/auth/reset-password/` | Public | Complete password reset with code |

### Public Marketplace (Shops, Products, Reviews)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/summary/` | Public | Marketplace counts (active products, approved shops, members) |
| `GET` | `/categories/` | Public | List product categories with active product counts |
| `GET` | `/shops/` | Public | List approved shops (`?search=`, `?category=`) |
| `GET` | `/shops/<id>/` | Public | Shop details |
| `POST` | `/shops/register/` | Auth | Apply to register a new campus shop (`PENDING` approval) |
| `GET` | `/products/` | Public | Filterable product catalog (`?search=`, `?shop=`, `?category=`, `?min_price=`, `?max_price=`, `?available_only=true`, `?on_sale=true`, `?sort=newest\|popular\|price_asc\|price_desc`) |
| `GET` | `/products/<id>/` | Public | Product details + related products |
| `POST` | `/products/<id>/report/` | Auth | Report a product listing for admin review |
| `GET / POST` | `/products/<id>/reviews/` | Public / Auth | View or submit product ratings & reviews |
| `POST` | `/reviews/<id>/report/` | Auth | Report an inappropriate review |
| `DELETE` | `/reviews/<id>/` | Author / Admin | Delete a review |

### Shopping Cart & Multi-Shop Orders
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/cart/` | Auth | Get cart items + automatic `shop_groups` breakdown |
| `POST` | `/cart/items/` | Auth | Add item to cart (`product_id`, `quantity`) with stock validation |
| `PATCH / DELETE` | `/cart/items/<id>/` | Auth | Update quantity or remove cart item |
| `DELETE` | `/cart/clear/` | Auth | Empty cart |
| `GET` | `/orders/pickup-slots/` | Public | Available campus pickup slots |
| `POST` | `/orders/checkout/` | Auth | Atomic multi-shop checkout (creates 1 `OrderGroup` + N shop `Order`s & reserves stock) |
| `GET` | `/orders/my-orders/` | Auth | Customer's shop-specific orders (`?status=`) |
| `GET` | `/orders/my-groups/` | Auth | Customer's parent checkout groups |
| `GET` | `/orders/<id>/` | Owner/Customer/Admin | Order detail (RBAC enforced) |
| `POST` | `/orders/<id>/cancel/` | Customer | Cancel eligible order (`PENDING`/`ACCEPTED`) and restore stock |

### Shop Owner Dashboard APIs (`SHOP_OWNER` role only)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/shop/dashboard/` | Shop metrics, low-stock items, best sellers, daily & monthly sales |
| `GET / PATCH` | `/shop/my-shop/` | View/edit own shop profile, hours, logo & banner |
| `GET / POST` | `/shop/products/` | List own products (`?search=`, `?stock_filter=low\|out`) or create product |
| `GET / PATCH / DELETE` | `/shop/products/<id>/` | Manage own shop's product only |
| `GET` | `/shop/orders/` | List incoming orders for own shop only (`?status=`) |
| `PATCH` | `/shop/orders/<id>/status/` | Transition order status (state-machine enforced) & update payment status |

### Administrator APIs (`ADMIN` role only)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/dashboard/` | Platform KPIs, pending shops, popular shops/products, recent orders |
| `GET / POST` | `/admin/shops/` | List or create shops |
| `PATCH / DELETE` | `/admin/shops/<id>/` | Update or remove a shop |
| `POST` | `/admin/shops/<id>/status/` | Approve, reject, or suspend a shop |
| `GET / POST` | `/admin/users/` | List or create users / shop owners |
| `PATCH / DELETE` | `/admin/users/<id>/` | Suspend, edit, or delete users |
| `GET / POST / DELETE` | `/admin/categories/` & `/<id>/` | Manage product categories |
| `GET / PATCH / DELETE` | `/admin/products/` & `/<id>/` | Manage all products & reported listings |
| `GET / PATCH` | `/admin/orders/` & `/<id>/status/` | Monitor & manage all platform orders |
| `GET / PATCH / DELETE` | `/admin/reviews/` & `/<id>/` | Moderate reported reviews |

### Notifications
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/notifications/` | Auth | List recent notifications & unread count |
| `PATCH` | `/notifications/<id>/read/` | Auth | Mark single notification read |
| `POST` | `/notifications/mark-all-read/` | Auth | Mark all notifications read |

---

## Automated Tests

Run the Django backend test suite covering registration/login, shop approvals, search/filtering, multi-shop cart splitting, atomic inventory deduction, order cancellation/rejection stock restoration, status transitions, and strict role-based access control:

```powershell
cd d:\CampusCart\backend
.\venv\Scripts\python.exe manage.py test -v 2
```
