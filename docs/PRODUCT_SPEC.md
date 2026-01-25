# Queens Buying Group — Product Specification

> *"Design is not just what it looks like and feels like. Design is how it works."* — Steve Jobs

---

## Vision Statement

Queens Buying Group is a frictionless marketplace where sellers commit inventory to curated deals with absolute clarity and confidence. Every interaction should feel inevitable—as if there was no other way it could have been designed.

---

## Core Principles

1. **Ruthless Simplicity** — Every screen serves one purpose. No cognitive load.
2. **Trust Through Transparency** — Sellers always know exactly where they stand.
3. **Velocity** — From login to commitment in under 30 seconds.
4. **Expandability** — Architecture anticipates growth without premature complexity.

---

## User Personas

### 1. Seller (Primary User)
**Who:** Individuals looking to sell items through Queens Buying Group deals.

**Goals:**
- Discover profitable deals quickly
- Commit inventory with confidence
- Track shipments and fulfillment status
- Request shipping labels when needed

**Pain Points to Eliminate:**
- Confusion about deal terms
- Uncertainty about commitment status
- Difficult shipping logistics

---

### 2. Admin (Platform Operator)
**Who:** Cash Out Queens team members managing the marketplace.

**Goals:**
- Post compelling deals efficiently
- Monitor seller activity and commitments
- Manage label requests
- Maintain platform health

**Capabilities:**
- Full CRUD on deals
- User search and management
- Label queue management
- Analytics dashboard (Phase 2)

---

### 3. Worker (Future: Fulfillment Staff)
**Who:** Warehouse/store staff receiving and processing inventory.

**Goals:**
- Process incoming shipments
- Mark commitments as received/fulfilled
- Adjust quantities when discrepancies arise

**Note:** Architecture supports this role from day one, but UI deferred to Phase 2.

---

## User Flows

### Seller Journey

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SIGNUP → EMAIL VERIFICATION → LOGIN → DASHBOARD            │
│                                                             │
│  DASHBOARD                                                  │
│    ├── View Active Deals                                    │
│    │     └── Click Deal → Deal Detail → COMMIT              │
│    │                                                        │
│    ├── My Commitments                                       │
│    │     ├── Pending (awaiting shipment/dropoff)            │
│    │     ├── Shipped (tracking entered)                     │
│    │     └── Fulfilled (received & processed)               │
│    │                                                        │
│    ├── Request Label                                        │
│    │     └── Submit Request → Await Admin Approval          │
│    │                                                        │
│    └── Profile Settings                                     │
│          └── Update info, change password                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Admin Journey

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  LOGIN → ADMIN DASHBOARD                                    │
│                                                             │
│  ADMIN DASHBOARD                                            │
│    ├── Deals Management                                     │
│    │     ├── Create New Deal                                │
│    │     ├── Edit Existing Deal                             │
│    │     ├── Delete/Archive Deal                            │
│    │     └── View Deal Commitments                          │
│    │                                                        │
│    ├── User Management                                      │
│    │     ├── Search Users                                   │
│    │     ├── View User Profile & History                    │
│    │     └── Manage User Status                             │
│    │                                                        │
│    ├── Label Queue                                          │
│    │     ├── View Pending Requests                          │
│    │     ├── Approve/Reject Requests                        │
│    │     └── Upload Label for User                          │
│    │                                                        │
│    └── (Future) Analytics                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Users
```
User
├── id (UUID)
├── email (unique)
├── passwordHash
├── firstName
├── lastName
├── phone (optional)
├── role (SELLER | ADMIN | WORKER)
├── status (ACTIVE | SUSPENDED | PENDING_VERIFICATION)
├── emailVerified (boolean)
├── createdAt
├── updatedAt
└── lastLoginAt
```

### Deals
```
Deal
├── id (UUID)
├── title
├── description
├── imageUrl
├── pricePerUnit (what Queens pays)
├── dropoffAddress (optional)
├── status (DRAFT | ACTIVE | PAUSED | CLOSED)
├── maxQuantity (optional cap)
├── currentCommitted (computed)
├── startsAt
├── endsAt (optional)
├── createdBy (Admin ID)
├── createdAt
└── updatedAt
```

### Commitments
```
Commitment
├── id (UUID)
├── dealId (FK)
├── userId (FK)
├── quantity
├── status (PENDING | SHIPPED | RECEIVED | FULFILLED | CANCELLED)
├── trackingNumber (optional)
├── trackingCarrier (optional)
├── shippedAt (optional)
├── receivedAt (optional)
├── fulfilledAt (optional)
├── notes (optional, for adjustments)
├── createdAt
└── updatedAt
```

### Label Requests
```
LabelRequest
├── id (UUID)
├── userId (FK)
├── dealId (FK, optional)
├── status (PENDING | APPROVED | REJECTED | FULFILLED)
├── labelUrl (uploaded by admin)
├── requestedAt
├── processedAt
├── processedBy (Admin ID)
└── notes
```

### Refresh Tokens (Auth)
```
RefreshToken
├── id (UUID)
├── userId (FK)
├── token (hashed)
├── expiresAt
├── createdAt
└── revokedAt (optional)
```

---

## Screen Specifications

### 1. Login Screen
**Purpose:** Single-minded focus on getting users in.

**Elements:**
- Logo (prominent, centered)
- Email input
- Password input
- "Sign In" button (primary action)
- "Forgot Password?" link
- "Don't have an account? Contact us" text

**Behavior:**
- Email validation on blur
- Password field shows/hides toggle
- Loading state on submit
- Clear error messaging

---

### 2. Seller Dashboard
**Purpose:** Immediate clarity on active deals and user's commitments.

**Layout:**
```
┌────────────────────────────────────────────────┐
│  [Logo]                    [Profile] [Logout]  │
├────────────────────────────────────────────────┤
│                                                │
│  Welcome back, {firstName}                     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  YOUR COMMITMENTS (Quick Stats)          │  │
│  │  [3 Pending] [2 Shipped] [12 Fulfilled]  │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  ACTIVE DEALS                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Deal   │ │  Deal   │ │  Deal   │          │
│  │  Card   │ │  Card   │ │  Card   │          │
│  │         │ │         │ │         │          │
│  │ [View]  │ │ [View]  │ │ [View]  │          │
│  └─────────┘ └─────────┘ └─────────┘          │
│                                                │
└────────────────────────────────────────────────┘
```

---

### 3. Deal Detail (Seller View)
**Purpose:** Everything needed to make a commitment decision.

**Elements:**
- Large product image
- Deal title
- Price per unit (prominent)
- Description
- Dropoff address (if applicable)
- Deal deadline (if applicable)
- Current commitment count (social proof)
- Quantity input
- "COMMIT" button

---

### 4. My Commitments
**Purpose:** Track all commitments with clear status.

**Table View:**
| Deal | Qty | Status | Tracking | Actions |
|------|-----|--------|----------|---------|
| iPhone 15 | 5 | Pending | — | [Add Tracking] |
| AirPods | 10 | Shipped | 1Z999... | [View] |

---

### 5. Admin: Deals Management
**Purpose:** Efficient deal lifecycle management.

**Elements:**
- "Create Deal" button (prominent)
- Deals table with filters (Active, Draft, Closed)
- Quick actions (Edit, Pause, Delete)
- Click-through to commitment details

---

### 6. Admin: User Search
**Purpose:** Find any user instantly.

**Elements:**
- Search bar (email, name, phone)
- Results list with key info
- Click-through to user detail

---

### 7. Admin: Label Queue
**Purpose:** Process label requests efficiently.

**Elements:**
- Pending requests count
- Request cards with user info & deal
- Approve/Reject actions
- Upload label functionality

---

## Technical Architecture

### Stack Selection

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | Server components, optimal UX |
| Styling | Tailwind CSS | Rapid iteration, consistency |
| Components | shadcn/ui | Accessible, customizable |
| Backend | Next.js API Routes | Unified codebase |
| ORM | Prisma | Type safety, migrations |
| Database | PostgreSQL | Reliability, scalability |
| Auth | Custom JWT + Refresh Tokens | Full control, easy password reset |
| Email | Resend | Reliable transactional email |
| Storage | Cloudflare R2 or S3 | Deal images, labels |
| Hosting | Vercel | Zero-config deployment |

### Authentication Flow

```
1. Login → Validate credentials → Issue Access Token (15min) + Refresh Token (7d)
2. Access Token in memory, Refresh Token in httpOnly cookie
3. On 401 → Auto-refresh using Refresh Token
4. Logout → Revoke Refresh Token server-side
5. Password Reset → Email magic link → Set new password → Revoke all tokens
```

### API Structure

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   ├── POST /forgot-password
│   └── POST /reset-password
│
├── /users
│   ├── GET /me
│   ├── PATCH /me
│   ├── GET / (admin only)
│   └── GET /:id (admin only)
│
├── /deals
│   ├── GET / (filtered by role)
│   ├── GET /:id
│   ├── POST / (admin only)
│   ├── PATCH /:id (admin only)
│   └── DELETE /:id (admin only)
│
├── /commitments
│   ├── GET /mine
│   ├── POST /
│   ├── PATCH /:id
│   └── GET /deal/:dealId (admin only)
│
└── /labels
    ├── GET /requests (admin)
    ├── POST /request
    ├── PATCH /requests/:id (admin)
    └── POST /requests/:id/upload (admin)
```

---

## Phase Roadmap

### Phase 1: Foundation (Current)
- [x] Product specification
- [ ] Project setup & architecture
- [ ] Database schema & migrations
- [ ] Authentication system (login, logout, refresh, reset)
- [ ] Seller: Dashboard, deal viewing, commitments
- [ ] Admin: Deal CRUD, basic user search

### Phase 2: Full Feature Set
- [ ] Label request system
- [ ] Worker role & receiving workflow
- [ ] Email notifications
- [ ] Deal images upload
- [ ] Enhanced search & filters

### Phase 3: Scale & Polish
- [ ] Analytics dashboard
- [ ] Bulk operations
- [ ] Mobile optimization
- [ ] Performance tuning
- [ ] Audit logging

---

## Success Metrics

1. **Time to First Commitment** — Under 60 seconds from login
2. **Commitment Completion Rate** — >80% of commitments fulfilled
3. **Support Tickets** — <5% of users need help
4. **Page Load Time** — <2 seconds on 3G

---

*This specification is a living document. Every decision serves the user.*
