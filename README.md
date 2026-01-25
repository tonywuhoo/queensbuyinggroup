# Queens Buying Group

A modern, elegant platform for managing buying group operations. Built with Next.js 14, Supabase, and Prisma.

![Queens Buying Group](https://via.placeholder.com/1200x630/0A0A0A/D4AF37?text=Queens+Buying+Group)

## Features

### For Sellers
- 🏷️ **Browse Deals** — View active deals with competitive prices
- 📦 **Commit to Deals** — Commit your inventory quantities
- 🚚 **Track Shipments** — Add tracking numbers and monitor status
- 📋 **Request Labels** — Request shipping labels from admins

### For Admins
- 📊 **Dashboard Overview** — Monitor all platform activity
- 🏷️ **Manage Deals** — Create, edit, and manage deals
- 👥 **User Management** — Search and manage seller accounts
- 📋 **Label Queue** — Process shipping label requests
- ✅ **Update Commitments** — Mark commitments as received/fulfilled

### Powered by Supabase
- 🔐 **Secure Authentication** — Email/password with automatic sessions
- 📧 **Password Reset** — Built-in email recovery flow
- 🗄️ **PostgreSQL Database** — Hosted, scalable, reliable

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the database to be provisioned (~2 minutes)

### 2. Get Your Credentials

From your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon/public** key
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Database (from Supabase Settings → Database → Connection string)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### 4. Install & Set Up

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to Supabase database
npm run db:push
```

### 5. Create Your Admin Account

1. Go to your Supabase dashboard → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter your admin email and password
4. Copy the user's **UID**

5. Go to **Table Editor** → **Profile** table
6. Click **Insert row** and add:
   - `authId`: paste the UID from step 4
   - `email`: your admin email
   - `firstName`: Admin
   - `lastName`: User
   - `role`: ADMIN

### 6. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin account!

---

## Creating Additional Users

### Via Supabase Dashboard (Recommended for Admins)
1. **Authentication** → **Users** → **Add user**
2. Create Profile row in **Table Editor**

### Via the App (Coming Soon)
Admin user creation will be added to the admin dashboard.

---

## Project Structure

```
queens-buying-group/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login, forgot-password, reset-password
│   │   ├── (dashboard)/   # Seller dashboard
│   │   ├── (admin)/       # Admin dashboard
│   │   ├── api/           # API routes
│   │   └── page.tsx       # Landing page
│   ├── components/        # Reusable UI components
│   ├── lib/
│   │   ├── supabase/      # Supabase client utilities
│   │   ├── auth.ts        # Auth helpers
│   │   ├── db.ts          # Prisma client
│   │   └── utils.ts       # Helper functions
│   └── middleware.ts      # Auth middleware
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| Deployment | Vercel (recommended) |

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-key
DATABASE_URL=your-production-db-url
DIRECT_URL=your-production-direct-url
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## Roadmap

- [x] Core authentication with Supabase
- [x] Seller dashboard
- [x] Admin dashboard
- [x] Deal management
- [x] Commitments & tracking
- [x] Label requests
- [ ] Admin user creation UI
- [ ] Email notifications
- [ ] File uploads for images
- [ ] Analytics dashboard

---

Built with ❤️ by Cash Out Queens
