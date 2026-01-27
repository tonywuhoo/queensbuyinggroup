# Queens Buying Group

A wholesale vendor management platform for coordinating deals, commitments, tracking, and payouts across multiple warehouse locations.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Next.js 14 (App Router) + React 18 + Tailwind CSS             │
│  - Server Components for fast page loads                        │
│  - Client Components for interactivity                          │
│  - Responsive design (mobile-first)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                  │
│  Next.js API Routes (/api/*)                                    │
│  - RESTful endpoints                                            │
│  - Role-based access control                                    │
│  - JWT validation via Supabase                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Supabase      │    Prisma       │    Supabase Storage         │
│   Auth          │    ORM          │    (Labels/Files)           │
│   - Email/Pass  │    - PostgreSQL │    - Private bucket         │
│   - JWT tokens  │    - Migrations │    - Signed URLs            │
│   - Sessions    │    - Type-safe  │    - Auth-protected         │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase PostgreSQL)               │
│  - Profiles, Deals, Commitments, Tracking, Labels, Invoices    │
│  - Auto-incrementing IDs (U-XXXXX, D-XXXXX, C-XXXXX)           │
│  - Connection pooling for serverless                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### Supabase Auth Integration

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│ Supabase │────▶│  JWT     │────▶│ Dashboard│
│  Page    │     │  Auth    │     │  Cookie  │     │  Access  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                   │
     │           Email Confirmation Flow                 │
     │    ┌──────────────────────────────────┐          │
     └───▶│ /auth/callback (PKCE exchange)   │──────────┘
          └──────────────────────────────────┘
```

### Auth Features
- **Email/Password authentication**
- **Email confirmation** (optional, configurable)
- **Password reset** via email
- **Session management** with HTTP-only cookies
- **Role-based access control** (SELLER, ADMIN, WORKER)
- **Auto-redirect** based on user role

### Middleware Protection
```typescript
// Middleware refreshes session on every request
// Protects /dashboard/* and /admin/* routes
// Redirects unauthenticated users to /login
```

---

## 👥 User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **SELLER** | `/dashboard/*` | View deals, make commitments, request labels, submit tracking |
| **ADMIN** | `/admin/*` | Manage deals, users, fulfill commitments, process labels, invoicing |
| **WORKER** | `/admin/*` (limited) | Process commitments, handle drop-offs |

---

## 📦 Features

### For Sellers (Vendors)

| Feature | Description |
|---------|-------------|
| **Browse Deals** | View active deals with pricing, limits, deadlines |
| **Make Commitments** | Commit to deals (quantity only, delivery method later) |
| **My Commitments** | Manage commitments, set delivery method (Ship/Drop-off), select warehouse |
| **Request Labels** | Request shipping labels for commitments |
| **Submit Tracking** | Enter tracking numbers for shipped items |
| **Tracking History** | View shipment status (FedEx, UPS, USPS integration ready) |
| **Invoices** | View payout invoices from admin |

### For Admins

| Feature | Description |
|---------|-------------|
| **Deal Management** | Create, edit, activate/pause/close deals |
| **User Management** | View all vendors, see their commitments |
| **Commitment Overview** | See all commitments, filter by warehouse/status |
| **Process Labels** | Upload label files, approve/reject requests |
| **Drop-off Management** | Handle in-person warehouse drop-offs |
| **Invoicing** | Attach Skynova invoice links, mark paid/pending |
| **Warehouse Settings** | Configure warehouses, drop-off vs ship-only |

---

## 🗄️ Database Schema

### Core Models

```prisma
Profile          # User profiles (linked to Supabase Auth)
├── vendorNumber # Auto-increment, displayed as U-XXXXX
├── role         # SELLER | ADMIN | WORKER
└── authId       # Links to Supabase user

Deal             # Product deals from admin
├── dealNumber   # Auto-increment, displayed as D-XXXXX
├── retailPrice  # Original retail price
├── payout       # What vendor gets paid
├── limitPerVendor
├── freeLabelMin # Min qty for free label
└── deadline

Commitment       # Vendor commitments to deals
├── commitmentNumber  # Auto-increment, displayed as C-XXXXX
├── quantity
├── deliveryMethod    # SHIP | DROP_OFF
├── warehouse         # MA | NJ | CT | NY | DE
└── status           # PENDING | IN_TRANSIT | DELIVERED | FULFILLED | CANCELLED

LabelRequest     # Label requests for commitments
├── status       # PENDING | APPROVED | REJECTED
└── labelFiles   # JSON array of uploaded file URLs

Tracking         # Shipment tracking
├── carrier      # FEDEX | UPS | USPS
├── trackingNumber
└── lastStatus

Invoice          # Payout invoices
├── skynovaUrl   # Link to Skynova invoice
├── amount
└── status       # PENDING | PAID

Warehouse        # Warehouse configurations
├── code         # MA, NJ, CT, NY, DE
├── canDropOff   # Boolean
└── canShip      # Boolean
```

---

## 🚀 Deployment

### Prerequisites
- Node.js 20+
- Supabase project (free tier works)
- Railway account (or similar)

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (use Session Pooler for serverless)
DATABASE_URL=postgresql://postgres.xxx:password@aws-x-region.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Deploy to Railway

1. Push to GitHub
2. Connect repo to Railway
3. Add environment variables
4. Railway auto-deploys

### Post-Deploy: Supabase Settings

1. **Authentication → URL Configuration**
   - Site URL: `https://your-app.up.railway.app`
   - Redirect URLs: `https://your-app.up.railway.app/**`

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run development server
npm run dev
```

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB
npm run db:studio    # Open Prisma Studio
npm run create-admin # Create admin user (CLI)
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, forgot-password, reset-password
│   ├── (dashboard)/      # Seller dashboard pages
│   ├── (admin)/          # Admin dashboard pages
│   ├── api/              # API routes
│   │   ├── deals/
│   │   ├── commitments/
│   │   ├── labels/
│   │   ├── tracking/
│   │   ├── invoices/
│   │   ├── warehouses/
│   │   ├── admin/        # Admin-only endpoints
│   │   └── files/        # Secure file proxy
│   └── auth/             # Auth callbacks
├── components/
│   └── ui/               # Reusable UI components
├── lib/
│   ├── supabase/         # Supabase client config
│   ├── api-utils.ts      # Auth helpers, response helpers
│   ├── db.ts             # Prisma client
│   └── validations.ts    # Zod schemas
└── middleware.ts         # Session refresh, route protection
```

---

## 🔒 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control in API routes
- **Database**: Row-level security via application layer
- **File Storage**: Private Supabase bucket with signed URLs
- **API Protection**: All endpoints check authentication
- **CORS**: Handled by Next.js

---

## 📱 Mobile Responsive

- Hamburger menu on mobile
- Touch-friendly UI elements
- Responsive tables and cards
- Mobile-optimized forms

---

## 🎨 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI + custom |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Railway |
| Icons | Lucide React |

---

## 📄 License

Private - Queens Buying Group

---

## 🤝 Support

For issues or feature requests, contact the development team.
