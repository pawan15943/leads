# Lead Management System

A full-stack **Lead Calling & Management Portal** with **Next.js** frontend (shadcn/ui) and **Laravel** API backend.

## Project Structure

```
leadmanagement1/
├── frontend/     # Next.js 16 + shadcn/ui + Tailwind
└── backend/      # Laravel 12 API + Sanctum
```

## Features

- **Dashboard** – Stats widgets, quick actions
- **Leads** – List, search, filters, bulk actions
- **Bulk Action** – Re-assign, change stage, update tags
- **Tasks** – Task management
- **Reports** – Analytics (Admin)
- **User Management** – Users & roles (Admin)
- **Login** – Email/Mobile + password, role-based redirect

## Prerequisites

- Node.js 18+, npm
- PHP 8.2+, Composer
- MySQL (database: `libraroleads`)

## Quick Start

### 1. Backend

```bash
cd backend
php artisan migrate
php artisan db:seed
php artisan serve
```

API: **http://localhost:8000**

**Demo login:** `superadmin@yopmail.com` / `password`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:3000**

## Environment

### Backend (`backend/.env`)
- `DB_DATABASE=libraroleads`
- `DB_USERNAME`, `DB_PASSWORD` – MySQL credentials

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
