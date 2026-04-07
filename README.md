![Logo](./public/FFFFFF-1.png)

# Slooze Fullstack Challenge

Role-based food ordering application with country-scoped access control.

## Overview

This project implements the Slooze assignment using:

- Backend: NestJS, GraphQL, Prisma, PostgreSQL
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Apollo Client
- Access model: RBAC (Admin, Manager, Member) + country-scoped ReBAC (India, America)

## Feature Access Matrix

| Feature | Admin | Manager | Member |
| --- | --- | --- | --- |
| View restaurants and menu items | Yes | Yes | Yes |
| Create order and add food items | Yes | Yes | Yes |
| Checkout and pay | Yes | Yes | No |
| Cancel order | Yes | Yes | No |
| Add or modify payment methods | Yes | No | No |

## Country-Scoped Rules

- Admin can access all countries.
- Manager can view and act only within their assigned country.
- Member can view and act only within their assigned country.
- Member can access only their own orders.

## Project Structure

- backend: GraphQL API, Prisma schema, migrations, and seed data
- frontend: Role-based UI connected to GraphQL via Apollo Client

## Workflow

### End-to-End Request Flow

1. User selects a seeded account in the frontend.
2. Frontend sends GraphQL requests with `x-user-id` header.
3. Backend resolves current user from `x-user-id`.
4. Resolver forwards request to service layer.
5. Service layer applies role and country checks.
6. Prisma executes database operations only when authorization passes.
7. GraphQL returns filtered data to the frontend.
8. Frontend refreshes restaurants, orders, and payment methods.

### Authorization Workflow

1. Identity is resolved from `x-user-id`.
2. RBAC check validates the action for the role.
3. Country check restricts non-admin users to their country.
4. Member ownership check restricts members to their own orders.
5. Failed checks return a `Forbidden` error.

### Order Lifecycle Workflow

1. Create Order: user creates a draft order for an allowed restaurant.
2. Add Items: user adds menu items from the same restaurant.
3. Checkout (Admin/Manager only): draft order with items is placed.
4. Cancel (Admin/Manager only): order status is changed to canceled.

### Payment Method Workflow

1. Admin can add, update, and delete payment methods.
2. Manager can view and use their own methods for checkout.
3. Member cannot access payment methods.

## Seeded Users

1. Nick Fury - Admin
2. Captain Marvel - Manager (India)
3. Captain America - Manager (America)
4. Thanos - Member (India)
5. Thor - Member (India)
6. Travis - Member (America)

The frontend includes a seeded-user selector for quick role testing.

## Local Setup

### 1. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Initialize Database and Seed Data

```bash
cd backend
npm run prisma:migrate -- --name init
npm run db:seed
```

### 3. Run Backend

```bash
cd backend
npm run start:dev
```

Backend GraphQL endpoint:

- http://localhost:4000/graphql

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

- http://localhost:3000

## Request Context

Backend reads the acting user from request header:

- `x-user-id: <seeded-user-id>`

The frontend sets this automatically based on selected seeded user.

## Useful Commands

Backend:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
npm run build
npm run start:dev
```

Frontend:

```bash
npm run dev
npm run build
```

