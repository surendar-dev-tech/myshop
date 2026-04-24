# MyShop Frontend - Angular Application

## Overview
Angular 17+ frontend application for the MyShop Provisional Store Management System.

## Technology Stack
- Angular 17+
- Angular Material
- Chart.js / ng2-charts
- RxJS
- TypeScript

## Features
- ✅ JWT-based authentication
- ✅ Role-based routing
- ✅ Dashboard with statistics and charts
- ✅ Product management
- ✅ Point of Sale (POS) interface
- ✅ Customer management
- ✅ Credit (Udhaar) management
- ✅ Sales reports

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update API URL in `src/environments/environment.ts` if needed

3. Start development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

## Default Login Credentials
- **Admin**: username=`admin`, password=`admin123`
- **Staff**: username=`staff`, password=`staff123`

## Project Structure
```
src/
├── app/
│   ├── auth/           # Authentication components
│   ├── dashboard/       # Dashboard component
│   ├── products/       # Product management
│   ├── sales/          # POS and sales
│   ├── customers/      # Customer management
│   ├── credits/        # Credit management
│   ├── reports/        # Reports
│   ├── layout/         # Main layout with navigation
│   └── core/           # Core services, guards, interceptors
├── assets/            # Static assets
└── environments/      # Environment configuration
```

## Build

```bash
npm run build
```

## Notes
- The application uses standalone components (Angular 17+ feature)
- JWT tokens are stored in localStorage
- API calls are intercepted to add authentication headers
- Role-based access control is implemented via guards









