# MyShop Backend - Provisional Store Management System

## Overview
Spring Boot 3+ backend application for managing a provisional (grocery) store with product sales, stock management, customer data, and credit tracking.

## Technology Stack
- Spring Boot 3.2.0
- Spring Security with JWT
- Spring Data JPA
- MariaDB/MySQL
- Java 17
- Maven

## Features
- ✅ JWT-based authentication
- ✅ Role-based access control (ADMIN, STAFF)
- ✅ Product & Stock Management
- ✅ Sales Management (POS-style)
- ✅ Customer Management
- ✅ Credit Book (Udhaar) Management
- ✅ Reports (Daily/Monthly sales, Outstanding credits)
- ✅ Global exception handling
- ✅ Input validation

## Database Setup
1. Install MariaDB or MySQL
2. Update `application.yml` with your database credentials
3. The application will auto-create the database schema on startup

## Default Users
- **Admin**: username=`admin`, password=`admin123`
- **Staff**: username=`staff`, password=`staff123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Products
- `GET /api/products` - Get all products
- `GET /api/products/active` - Get active products
- `GET /api/products/low-stock` - Get low stock products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product (ADMIN only)
- `PUT /api/products/{id}` - Update product (ADMIN only)
- `DELETE /api/products/{id}` - Delete product (ADMIN only)

### Stock
- `POST /api/stock/{productId}/in` - Add stock
- `POST /api/stock/{productId}/out` - Remove stock
- `GET /api/stock/{productId}/history` - Get stock history
- `GET /api/stock/{productId}/current` - Get current stock

### Sales
- `POST /api/sales` - Create a sale
- `GET /api/sales` - Get all sales
- `GET /api/sales/{id}` - Get sale by ID
- `GET /api/sales/date-range` - Get sales by date range

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/active` - Get active customers
- `GET /api/customers/{id}` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Credits
- `POST /api/credits/{customerId}/pay` - Record credit payment
- `GET /api/credits/{customerId}/history` - Get credit history
- `GET /api/credits/{customerId}/balance` - Get outstanding balance
- `GET /api/credits/outstanding` - Get all outstanding balances

### Reports
- `GET /api/reports/daily` - Get daily sales report
- `GET /api/reports/monthly` - Get monthly sales report

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID
- `POST /api/categories` - Create category (ADMIN only)
- `PUT /api/categories/{id}` - Update category (ADMIN only)
- `DELETE /api/categories/{id}` - Delete category (ADMIN only)

## Running the Application
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080/api`

## API Usage Example
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use the token in subsequent requests
curl -X GET http://localhost:8080/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```









