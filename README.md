# CampusCart – University Multi-Vendor E-Commerce Marketplace

[![CampusCart GitHub](https://img.shields.io/badge/GitHub-CampusCart-indigo.svg)](https://github.com/ankityadav281/CampusCart.git)
[![React](https://img.shields.io/badge/Frontend-React_18_+_Vite_+_Tailwind_CSS-blue.svg)](https://vitejs.dev/)
[![Django](https://img.shields.io/badge/Backend-Django_6_+_Django_REST_Framework-green.svg)](https://www.djangoproject.com/)
[![Database](https://img.shields.io/badge/Database-SQLite3-lightgrey.svg)](https://sqlite.org/)

**CampusCart** is a production-ready, multi-vendor university marketplace web application designed specifically for college campuses, faculty, hostel residents, and campus shopkeepers. Built with **React 18 (Vite + Tailwind CSS)** on the frontend and **Django REST Framework + SQLite** on the backend, it unifies campus canteens, stationery stores, photocopy centers, bookstores, grocery marts, and lifestyle kiosks into a single digital platform.

Students and campus members can browse verified stores, check live inventory, place a unified multi-vendor order with smart pickup slot reservations, and collect their items without waiting in chaotic break-time queues. Campus merchants receive a dedicated **Shop Owner Dashboard** for managing inventory, tracking incoming pickup orders, and analyzing daily sales.

---

## Key Features

### 1. Customer & Student Shopping Experience
- **Interactive Marketplace Home**: Showcase featured campus shops, top product categories, discount offers, student favorites, and live campus marketplace metrics.
- **Shop Discovery & Detailed Storefronts**: Explore approved campus stores with live Open/Closed indicators (calculated against configured opening hours), campus locations (e.g. Uni Mall, Canteen Complex, Academic Blocks), contact numbers, and in-shop catalog search.
- **Advanced Search & Multi-Facet Filtering**: Real-time debounce search across products, shops, and categories with filters for category, specific store, price range (₹), in-stock availability, and discounted deals. Sort by newest, popularity, or price.
- **Multi-Shop Unified Cart**: Add items from multiple campus shops into a single cart. The system automatically groups items by vendor.
- **Atomic Multi-Order Checkout**: At checkout, the backend executes inside a database transaction (`transaction.atomic()` + `select_for_update()`) to atomically generate:
  - **1 Parent `OrderGroup`** representing the overall student checkout.
  - **N Independent Shop `Order` records** (one for each vendor), allowing each merchant to independently accept, prepare, and fulfill their portion.
- **Campus Pickup Slot Reservation**: Select scheduled counter pickup slots (e.g., *10:00 AM – 10:15 AM Recess Break*) to eliminate queue congestion between lectures.
- **Honest Payment Tracking**: Supports **Cash on Pickup** and **Pay at Counter / UPI**. Payment statuses (`Pending`, `Paid`, `Failed`, `Refunded`) are tracked explicitly without fake payment gateway confirmations.
- **Live 5-Stage Order Tracking**: Real-time visual timeline tracking each order's progression (`Pending → Accepted → Preparing → Ready for Pickup → Completed`). Customers can cancel eligible (`Pending` / `Accepted`) orders to automatically restore inventory stock.
- **Product Reviews & Ratings**: Verified customer ratings, text reviews, and review moderation reporting.
- **User Profile & Security**: Dedicated user profile settings to manage contact info, student ID, department affiliation, and password updates.

### 2. Dedicated Merchant Portal & Shopkeeper Onboarding
- **CampusCart Seller Hub (`/become-shopkeeper`)**: An informational portal for prospective campus merchants outlining platform benefits (0% commission, scheduled slot pickups, 5,000+ campus community reach, and FAQs).
- **Direct Shopkeeper Registration (`/shopkeeper/register`)**:
  - Dedicated vendor onboarding with an explicit **Shop Name** field.
  - **Real-Time Username Derivation**: Typing the shop name automatically generates a clean, lowercase username handle **without spaces or underscores** (e.g., `Lovely Bake Studio` $\rightarrow$ `lovelybakestudio`).
  - Strict input sanitization strips spaces and underscores on direct edits.
  - Backend automatically provisions the user as a `SHOP_OWNER` and creates an approved `Shop` entity, redirecting the merchant straight into their **Shop Dashboard**.
- **Shopkeeper Sign In (`/shopkeeper/login`)**: Streamlined vendor login portal without distraction.
- **Seamless Logout Flow**: Logging out from the shopkeeper panel (`/shop-dashboard`) or navigation bar gracefully routes the vendor back to the `/become-shopkeeper` Seller Hub.

### 3. Shop Owner / Manager Dashboard (`/shop-dashboard`)
- **Strict Role-Based Multi-Tenancy**: Shop managers can only view and mutate their own shop's catalog and orders (enforced by backend RBAC permissions).
- **Overview Metrics**: Live KPIs for total products, active orders, pending pickup counts, completed orders, total revenue, and **low-stock alerts** with 1-click restock.
- **Product & Inventory Management**: Complete CRUD operations for products with image upload, category assignment, pricing, discount pricing, stock threshold tracking, and availability toggles.
- **Order Fulfillment State Machine**: Strict transition validations ensuring orders move legitimately through `PENDING → ACCEPTED/REJECTED → PREPARING → READY_FOR_PICKUP → COMPLETED`, along with payment status updates.
- **Sales Analytics**: Visual breakdown of 7-day daily turnover, monthly totals, and best-selling menu / catalog items.
- **Shop Profile & Operating Hours**: Configure opening/closing times, building location, contact phone, and store banners.

### 4. Campus Administrator Dashboard (`/admin-dashboard`)
- **Campus-Wide Analytics**: High-level platform KPIs covering total registered students, active shops, pending verification queues, total products, and university-wide sales volume.
- **Shop Verification & Governance**: Review submitted shops, approve or reject store applications, or suspend inactive shops.
- **Catalog & Category Management**: Maintain primary product categories and 55+ specialized campus store sub-types.
- **User Governance**: View registered university users and shop managers, with permissions to activate or suspend accounts.
- **Platform Moderation**: Audit all orders across the campus, inspect reported product listings, and remove inappropriate customer reviews.

---

## Tech Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, Vite 8, Tailwind CSS v4 |
| **Routing & State** | React Router v7, Context API (`AuthContext`, `CartContext`, `ToastContext`) |
| **UI Components & Icons** | Lucide React, Custom Modals, Responsive Drawers |
| **Backend Framework** | Django 6.1, Django REST Framework (DRF) |
| **Authentication** | Django Custom User model, JWT Authentication (`rest_framework_simplejwt`) |
| **Database** | SQLite3 (`backend/campuscart.sqlite3`) with atomic transactions |
| **API Architecture** | RESTful JSON APIs, CORS headers, JWT Bearer Token auto-refresh interceptors |

---

## Project Structure

```text
CampusCart/
├── README.md
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── campuscart.sqlite3       # Active SQLite database
│   ├── media/                  # Seeded & uploaded shop logos, banners, product images
│   ├── config/                 # Django settings, root URLs, WSGI/ASGI, RBAC permissions
│   ├── accounts/               # Custom User (Student/ShopOwner/Admin), JWT auth, serializers, tests
│   ├── shops/                  # Shop models, category hierarchies, seed_campuscart command
│   ├── products/               # Product models, stock checks, filtering, review bindings
│   ├── cart/                   # Multi-shop Cart & CartItem models with inventory reservation
│   ├── orders/                 # OrderGroup, Order, OrderItem, atomic checkout, state machine
│   ├── reviews/                # Customer reviews, ratings, and moderation flags
│   └── notifications/          # In-app notifications for order updates & approvals
└── frontend/
    ├── package.json
    ├── vite.config.js          # Vite config with proxy to Django (127.0.0.1:8000)
    └── src/
        ├── App.jsx             # Route definitions & Role-based ProtectedRoute wrappers
        ├── main.jsx            # React root mount
        ├── index.css           # Tailwind CSS styles
        ├── services/api.js     # Axios client with JWT auto-refresh & API functions
        ├── context/            # AuthContext, CartContext, ToastContext
        ├── layouts/
        │   ├── CustomerLayout.jsx    # Student / customer navbar & footer shell
        │   ├── ShopkeeperLayout.jsx  # Vendor hub navbar & footer shell
        │   └── DashboardLayout.jsx   # Shop Owner & Admin sidebar portal layout
        ├── components/
        │   ├── Navbar.jsx            # Main customer navigation bar
        │   ├── ShopkeeperNavbar.jsx  # Seller Hub navigation bar
        │   ├── ProtectedRoute.jsx    # Role-based route guard with smart redirect
        │   ├── ShopRegistrationWizard.jsx
        │   ├── NotificationBell.jsx
        │   └── ...                   # Reusable UI cards, badges, and modals
        └── pages/
            ├── HomePage.jsx
            ├── ShopsPage.jsx
            ├── ShopDetailPage.jsx
            ├── ProductsPage.jsx
            ├── ProductDetailPage.jsx
            ├── CartPage.jsx
            ├── CheckoutPage.jsx
            ├── OrderHistoryPage.jsx
            ├── OrderDetailPage.jsx
            ├── ProfilePage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── BecomeShopkeeperPage.jsx
            ├── ShopkeeperLoginPage.jsx
            ├── ShopkeeperRegisterPage.jsx
            ├── ShopOwnerDashboardPage.jsx
            └── AdminDashboardPage.jsx
```

---

## Installation & Local Setup

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed
- Git installed

### 1. Clone the Repository
```powershell
git clone https://github.com/ankityadav281/CampusCart.git
cd CampusCart
```

### 2. Start the Django Backend

```powershell
cd backend

# Create and activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed sample campus shops, products, and categories
python manage.py seed_campuscart

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

> **Tip:** You can re-seed or reset sample campus data anytime with:
> ```powershell
> python manage.py seed_campuscart --reset
> ```

### 3. Start the React Frontend

Open a second terminal window:

```powershell
cd frontend

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit **`http://localhost:5173`** in your browser. Vite automatically proxies all `/api` and `/media` requests to the Django backend at `http://127.0.0.1:8000`.

---

## Development Accounts & Credentials

| Role | Username | Email | Password | Assigned Shop / Scope |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin@campuscart.edu` | `admin123` | Full platform control & governance |
| **Customer (Student)** | `student1` | `aarav.sharma@campuscart.edu` | `student123` | Pre-loaded student cart & order history |
| **Customer (Student)** | `student2` | `priya.patel@campuscart.edu` | `student123` | Active pickup orders |
| **Shop Owner** | `owner_stationery` | `stationery@campuscart.edu` | `shop123` | University Stationery Shop |
| **Shop Owner** | `owner_canteen` | `canteen@campuscart.edu` | `shop123` | Campus Central Canteen |
| **Shop Owner** | `owner_grocery` | `grocery@campuscart.edu` | `shop123` | Campus Daily Grocery Mart |
| **Shop Owner** | `owner_electronics`| `electronics@campuscart.edu` | `shop123` | Campus Tech & Electronics Kiosk |
| **Shop Owner** | `owner_printing` | `printing@campuscart.edu` | `shop123` | Academic Printing & Photocopy |
| **Shop Owner** | `owner_bakery` | `bakery@campuscart.edu` | `shop123` | University Bake Studio |

*New shop owners can also register freely at `http://localhost:5173/shopkeeper/register`.*

---

## Core REST API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

### 1. Authentication & Profiles
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register/` | Public | Register a student / customer account |
| `POST` | `/auth/register-shopkeeper/` | Public | Register a shopkeeper (auto-creates approved store & provisions handle) |
| `POST` | `/auth/login/` | Public | Sign in with username/email & password (returns JWT access + refresh) |
| `POST` | `/auth/token/refresh/` | Public | Refresh expired JWT access token |
| `GET / PATCH`| `/auth/profile/` | Auth | View or update user profile details |
| `POST` | `/auth/change-password/` | Auth | Change password for logged-in user |

### 2. Public Marketplace Catalog
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/summary/` | Public | Live count of approved shops, active products, and users |
| `GET` | `/categories/` | Public | List categories with active product counts |
| `GET` | `/shops/` | Public | List approved campus stores (`?search=`, `?category=`) |
| `GET` | `/shops/<id>/` | Public | Shop details, opening hours, and catalog |
| `GET` | `/products/` | Public | Filterable catalog (`?search=`, `?shop=`, `?category=`, `?min_price=`, `?max_price=`, `?available_only=true`, `?sort=`) |
| `GET` | `/products/<id>/` | Public | Product detail view with rating summary |
| `GET / POST`| `/products/<id>/reviews/` | Public / Auth | Read product reviews or post a verified rating |

### 3. Cart & Multi-Vendor Checkout
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/cart/` | Auth | View cart items grouped by vendor (`shop_groups`) |
| `POST` | `/cart/items/` | Auth | Add item to cart with stock validation |
| `PATCH / DELETE`| `/cart/items/<id>/` | Auth | Update item quantity or remove from cart |
| `DELETE` | `/cart/clear/` | Auth | Clear all cart items |
| `GET` | `/orders/pickup-slots/` | Public | List active campus pickup time slots |
| `POST` | `/orders/checkout/` | Auth | Atomic checkout (creates parent `OrderGroup` and child `Order`s) |
| `GET` | `/orders/my-orders/` | Auth | List student's shop-level orders (`?status=`) |
| `GET` | `/orders/<id>/` | Auth | Order timeline and itemized breakdown |
| `POST` | `/orders/<id>/cancel/` | Customer | Cancel eligible order & restore product stock |

### 4. Shop Owner Dashboard (`SHOP_OWNER` Role)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/shop/dashboard/` | KPIs, low stock alerts, top sellers, and revenue charts |
| `GET / PATCH` | `/shop/my-shop/` | View and edit own shop settings, hours, and branding |
| `GET / POST` | `/shop/products/` | List own products (`?search=`, `?stock_filter=`) or create a product |
| `GET / PATCH / DELETE` | `/shop/products/<id>/` | Manage own product pricing, image, and stock |
| `GET` | `/shop/orders/` | List orders placed with this shop only (`?status=`) |
| `PATCH` | `/shop/orders/<id>/status/` | Advance fulfillment status (`PENDING → ACCEPTED → ...`) |

### 5. Platform Admin (`ADMIN` Role)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/dashboard/` | University-wide metrics, sales, and pending approval queues |
| `GET / POST` | `/admin/shops/` | List all shops or create a new store |
| `POST` | `/admin/shops/<id>/status/` | Approve, reject, or suspend a campus store |
| `GET / POST` | `/admin/users/` | List or create platform accounts |
| `PATCH / DELETE` | `/admin/users/<id>/` | Suspend, edit, or delete accounts |
| `GET / PATCH` | `/admin/orders/` | Platform-wide order oversight |

---

## Automated Test Suite

The project includes unit and integration tests covering JWT authentication, shopkeeper registration with auto-derived handles, atomic cart-splitting checkout, inventory deduction, cancellation stock restoration, and RBAC permissions.

To run the automated tests:

```powershell
cd d:\CampusCart\backend
.\venv\Scripts\python.exe manage.py test accounts shops orders products cart -v 2
```

---

## License & Credits

Developed for university campus communities. Built with modern React and Django REST Framework best practices.
