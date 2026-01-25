# Backend Implementation Plan

## Overview
All data stored in Supabase PostgreSQL, accessed via Prisma ORM.
Each user's data is scoped by their `userId` from Supabase Auth.

---

## Database Models

| Model | Description |
|-------|-------------|
| `Profile` | User profile linked to Supabase Auth |
| `Deal` | Products available for commitment |
| `Commitment` | User's commitment to a deal |
| `Tracking` | Shipping tracking info |
| `LabelRequest` | Request for shipping label |
| `Invoice` | Skynova invoice link |
| `Warehouse` | Drop-off locations (admin configurable) |

---

## API Routes

### Deals
```
GET    /api/deals              - List all active deals
GET    /api/deals/[id]         - Get single deal
POST   /api/deals              - Create deal (admin)
PUT    /api/deals/[id]         - Update deal (admin)
DELETE /api/deals/[id]         - Delete deal (admin)
```

### Commitments
```
GET    /api/commitments                - List user's commitments
POST   /api/commitments                - Create commitment
GET    /api/commitments/[id]           - Get single commitment
DELETE /api/commitments/[id]           - Cancel commitment (if pending)

# Admin
GET    /api/admin/commitments          - List all commitments
PUT    /api/admin/commitments/[id]     - Update status, attach invoice
```

### Tracking
```
GET    /api/tracking                   - List user's tracking
POST   /api/tracking                   - Submit tracking number
DELETE /api/tracking/[id]              - Remove tracking
```

### Label Requests
```
GET    /api/labels                     - List user's label requests
POST   /api/labels                     - Request label for commitment
DELETE /api/labels/[id]                - Cancel request (if pending)

# Admin
GET    /api/admin/labels               - List all label requests
PUT    /api/admin/labels/[id]          - Approve/reject, attach label URL
```

### Invoices
```
GET    /api/invoices                   - List user's invoices
```

### Warehouses (Admin)
```
GET    /api/warehouses                 - List warehouses
PUT    /api/admin/warehouses/[id]      - Update warehouse address
```

### Profile
```
GET    /api/profile                    - Get current user profile
PUT    /api/profile                    - Update profile
```

---

## Data Flow

### 1. User Commits to Deal
```
User → POST /api/commitments
       { dealId, quantity, warehouse, deliveryMethod }
     → Creates Commitment (status: PENDING)
```

### 2. User Requests Label (if shipping)
```
User → POST /api/labels
       { commitmentId }
     → Creates LabelRequest (status: PENDING)
     → Links to Commitment
```

### 3. Admin Approves Label
```
Admin → PUT /api/admin/labels/[id]
        { status: APPROVED, labelUrl: "..." }
      → Updates LabelRequest
      → User can download label
```

### 4. User Submits Tracking
```
User → POST /api/tracking
       { commitmentId, trackingNumber, carrier }
     → Creates Tracking
     → Updates Commitment (status: IN_TRANSIT)
```

### 5. Package Delivered / Drop-off Received
```
Admin → PUT /api/admin/commitments/[id]
        { status: DELIVERED } or { status: RECEIVED }
```

### 6. Admin Fulfills with Invoice
```
Admin → PUT /api/admin/commitments/[id]
        { status: FULFILLED, invoiceUrl: "https://skynova.com/..." }
      → Creates Invoice
      → User sees invoice in their dashboard
```

---

## Setup Steps

### 1. Get Supabase Database URL
In Supabase Dashboard:
- Go to Settings → Database
- Copy the "Connection string" (URI format)
- Add to `.env`:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### 2. Push Schema to Database
```bash
npx prisma db push
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Seed Initial Data (optional)
```bash
npx prisma db seed
```

---

## Auth Flow

All API routes check for authenticated user:

```typescript
// In API route
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Get profile from DB
  const profile = await db.profile.findUnique({
    where: { authId: user.id }
  });
  
  // Fetch user's data
  const commitments = await db.commitment.findMany({
    where: { userId: profile.id }
  });
  
  return Response.json(commitments);
}
```

---

## Next Steps

1. [ ] Add `DATABASE_URL` to `.env`
2. [ ] Run `npx prisma db push`
3. [ ] Run `npx prisma generate`
4. [ ] Create API routes
5. [ ] Connect frontend to API routes
6. [ ] Remove mock data
