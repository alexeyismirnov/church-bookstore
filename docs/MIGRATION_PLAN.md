# MIGRATION_PLAN.md

# Django-Oscar to Next.js Migration Plan

## Overview

This document outlines the phased migration strategy from a Django-Oscar monolith to a Next.js frontend with Django backend (hybrid architecture).

**Current State:** Django-Oscar monolith (10+ years in production)
**Target State:** Next.js frontend + Django-Oscar API backend

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Customer Traffic                                                      │
│         │                                                               │
│         ▼                                                               │
│   ┌───────────┐      ┌──────────────────────────────────────────────┐  │
│   │   CDN     │      │              NEXT.JS APP                     │  │
│   │ (Vercel/  │─────►│  • App Router (SSG + ISR)                    │  │
│   │ CloudFront)      │  • /api/oscar/[...path] → Proxy to Django    │  │
│   └───────────┘      │  • /api/stripe/* → Payment handling          │  │
│                      └──────────────────┬───────────────────────────┘  │
│                                         │                               │
│                                         ▼                               │
│                      ┌──────────────────────────────────────────────┐  │
│                      │           DJANGO OSCAR                       │  │
│                      │  • django-oscar-api (REST endpoints)         │  │
│                      │  • Oscar Dashboard (admin.yourstore.com)     │  │
│                      │  • PostgreSQL Database                       │  │
│                      └──────────────────────────────────────────────┘  │
│                                                                         │
│   Staff Traffic ────► admin.yourstore.com ────► Django Admin/Dashboard │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: API-First Foundation (Months 1-2)

### Goals
- Establish oscar-api as the single source of truth
- Set up Next.js project structure
- Implement API proxy layer

### Tasks

#### 1.1 Audit oscar-api Coverage
- [ ] Document all frontend features currently in use
- [ ] Map features to oscar-api endpoints
- [ ] Identify gaps requiring custom endpoints
- [ ] Review 10 years of Oscar customizations

#### 1.2 Django Backend Preparation
- [ ] Install/update `django-oscar-api` package
- [ ] Enable `HeaderSessionMiddleware` for decoupled session management
- [ ] Configure CORS settings for Next.js origins
- [ ] Extend oscar-api with custom endpoints where needed

#### 1.3 Next.js Project Setup
- [ ] Initialize Next.js 14+ project with App Router
- [ ] Set up TypeScript configuration
- [ ] Implement catch-all API proxy route (`/api/oscar/[...path]`)
- [ ] Configure environment variables for Django API URL

### Session Management Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser                                                    │
│     │  Cookie: oscar-session-id=abc123                      │
│     ▼                                                       │
│  Next.js Proxy (/api/oscar/*)                               │
│     │  Header: Session-Id: abc123                           │
│     ▼                                                       │
│  Django Oscar API                                           │
│     │  Response + Session-Id header                         │
│     ▼                                                       │
│  Next.js Proxy                                              │
│     │  Set-Cookie: oscar-session-id=abc123; HttpOnly        │
│     ▼                                                       │
│  Browser                                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why this approach:**
- Single session for anonymous and authenticated users
- HttpOnly cookies prevent XSS attacks
- Django URL hidden from public (security)
- No CORS issues (same-origin from browser perspective)

### Deliverables
- [ ] Working API proxy forwarding all requests to Django
- [ ] Session-Id management via httpOnly cookies
- [ ] Documentation of API gaps and custom endpoints needed

---

## Phase 2: Customer-Facing Frontend (Months 2-5)

### Goals
- Build all customer-facing pages in Next.js
- Implement cart, checkout, and user authentication
- Achieve feature parity with current Django templates

### Tasks

#### 2.1 Core Pages
- [ ] Product listing page (SSG with ISR)
- [ ] Product detail page (SSG with ISR)
- [ ] Category navigation
- [ ] Search functionality
- [ ] Product reviews display

#### 2.2 Shopping Cart
- [ ] Cart context/provider using oscar-api session
- [ ] Add to cart functionality
- [ ] Cart sidebar/dropdown
- [ ] Cart page with line item management
- [ ] Quantity updates and item removal

#### 2.3 User Authentication

**Authentication Flow:**
```
Login:
  User credentials → /api/oscar/login/ → Django authenticates
  → Session associated with user → Basket merged → Same Session-Id

Registration:
  User data → /api/oscar/register/ → Django creates account
  → Session associated → Basket preserved

Logout:
  POST /api/oscar/logout/ → Django clears auth → New anonymous session
```

**Tasks:**
- [ ] Login page (`/account/login`)
- [ ] Registration page (`/account/register`)
- [ ] Password reset flow
- [ ] User profile page
- [ ] Order history
- [ ] Address book management
- [ ] Auth state context (React Context)

#### 2.4 Checkout Flow
- [ ] Multi-step checkout component
- [ ] Shipping address selection/entry
- [ ] Shipping method selection
- [ ] Order review step
- [ ] Order confirmation page

#### 2.5 Stripe Payment Integration

**Decision:** Use **Stripe Payment Element** (embedded, modern approach)

| Factor | Payment Element | Stripe Checkout (Redirect) |
|--------|-----------------|----------------------------|
| User stays on site | ✅ Yes | ❌ No |
| Design control | High | Limited |
| Payment methods | Auto (cards, Apple Pay, Google Pay) | Auto |
| 3D Secure | Automatic | Automatic |
| Future-proof | ✅ New methods auto-added | ✅ |

**Payment Flow (Payment First, Then Order):**

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SHIPPING                                                │
│     └─► User enters shipping address                        │
│                                                             │
│  2. CREATE PAYMENT INTENT                                   │
│     └─► Next.js API → Stripe API                            │
│     └─► Returns client_secret                               │
│                                                             │
│  3. PAYMENT                                                 │
│     └─► User enters payment via Payment Element             │
│     └─► Supports cards, Apple Pay, Google Pay               │
│     └─► 3D Secure handled automatically                     │
│                                                             │
│  4. CONFIRM PAYMENT                                         │
│     └─► stripe.confirmPayment()                             │
│     └─► Wait for success                                    │
│                                                             │
│  5. CREATE OSCAR ORDER                                      │
│     └─► POST /api/oscar/checkout/                           │
│     └─► Include PaymentIntent ID in metadata                │
│     └─► Oscar freezes basket, creates order                 │
│                                                             │
│  6. CONFIRMATION                                            │
│     └─► Redirect to confirmation page                       │
│                                                             │
│  7. WEBHOOK (Background)                                    │
│     └─► Stripe → Next.js webhook endpoint                   │
│     └─► Update order payment status in Oscar                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why Payment First:**
- No orphan orders if payment fails
- No frozen baskets from abandoned checkouts
- Webhook provides backup confirmation
- Matches Stripe's recommended flow

**Tasks:**
- [ ] Install Stripe packages (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`)
- [ ] Create `/api/stripe/create-payment-intent` route
- [ ] Create `/api/stripe/webhook` route
- [ ] Build CheckoutForm with PaymentElement
- [ ] Build ShippingForm component
- [ ] Build OrderSummary component
- [ ] Add custom Django endpoint for payment status updates (webhook receiver)
- [ ] Configure Stripe webhook in Stripe Dashboard
- [ ] Test: successful payment, failed payment, 3D Secure flow

### Deliverables
- [ ] Fully functional customer-facing storefront
- [ ] Cart with session persistence
- [ ] User authentication (login/register/logout)
- [ ] Complete checkout with Stripe payments
- [ ] Feature parity with Django templates

---

## Phase 3: Admin Interfaces (Months 5-8)

### Goals
- Determine admin strategy
- Maintain operational capability during transition

### Strategy: Keep Django Admin & Oscar Dashboard

**Rationale:**
- Django Admin and Oscar Dashboard are battle-tested
- Rebuilding admin is high effort, low customer value
- Staff can use separate subdomain during transition

### Tasks
- [ ] Configure `admin.yourstore.com` → Django Admin
- [ ] Configure `dashboard.yourstore.com` → Oscar Dashboard
- [ ] Ensure admin routes excluded from Next.js proxy
- [ ] Set up authentication for admin subdomains
- [ ] Documentation for staff on new URLs

### Future Admin Options (Evaluate at Month 8+)
- Keep Django admin (recommended if working well)
- Build custom React admin with Refine/React-Admin
- Migrate to dedicated PIM/OMS systems

### Deliverables
- [ ] Working admin access on separate subdomain(s)
- [ ] Staff documentation and training
- [ ] Decision document for future admin strategy

---

## Phase 4: Traffic Migration & Cutover (Months 6-9)

### Goals
- Gradually shift traffic to Next.js frontend
- Maintain rollback capability
- Validate production stability

### Traffic Migration Schedule

| Week | Next.js | Django | Notes |
|------|---------|--------|-------|
| 1-2 | 5% | 95% | Canary - monitor errors, performance |
| 3-4 | 25% | 75% | Expand if metrics stable |
| 5-6 | 50% | 50% | A/B comparison |
| 7-8 | 90% | 10% | Django as fallback only |
| 9+ | 100% | 0%* | Full cutover (*API + admin only) |

### Tasks

#### 4.1 Infrastructure
- [ ] Set up load balancer rules for traffic splitting
- [ ] Configure feature flags if needed (LaunchDarkly/Unleash)
- [ ] Set up monitoring dashboards (errors, latency, conversions)
- [ ] Prepare and test rollback procedures

#### 4.2 Validation Checklist
- [ ] All pages render correctly
- [ ] Cart functionality works end-to-end
- [ ] Checkout completes successfully
- [ ] Payments process correctly
- [ ] User accounts work (login, register, profile)
- [ ] SEO tags present (meta, OpenGraph, structured data)
- [ ] Performance acceptable (Core Web Vitals)

#### 4.3 Cutover
- [ ] Update DNS to point to Next.js
- [ ] Keep Django running for API backend
- [ ] Monitor for 2 weeks post-cutover
- [ ] Document any issues and resolutions

### Deliverables
- [ ] Next.js serving 100% of customer traffic
- [ ] Django serving API + admin only
- [ ] Rollback procedure documented and tested

---

## Phase 5: Optimization & Future Decisions (Month 10+)

### Goals
- Optimize performance
- Evaluate long-term architecture
- Decide on Django backend future

### Tasks

#### 5.1 Performance Optimization
- [ ] Implement ISR for product pages
- [ ] Add CDN caching layer
- [ ] Optimize images (Next.js Image component)
- [ ] Review and optimize API calls

#### 5.2 Architecture Evaluation

**Decision Point: Keep or Replace Django Backend?**

Evaluate based on:
- Is oscar-api meeting all needs?
- What is Django maintenance burden?
- Do we have resources to rebuild backend logic?
- Is there business value in full Node.js stack?

**Options if replacing Django:**
1. Node.js backend (Express/NestJS) + Prisma + PostgreSQL
2. Medusa.js (Node.js headless commerce)
3. Saleor (Python/GraphQL)

**Recommendation:** Only replace Django if clear business value exists.

### Deliverables
- [ ] Performance benchmarks and optimizations
- [ ] Architecture decision document
- [ ] Roadmap for next 12 months

---

## Technical Reference

### Key Files Structure

```
nextjs-frontend/
├── app/
│   ├── api/
│   │   ├── oscar/[...path]/route.ts    # Catch-all proxy
│   │   └── stripe/
│   │       ├── create-payment-intent/route.ts
│   │       └── webhook/route.ts
│   ├── (shop)/
│   │   ├── page.tsx                    # Homepage
│   │   ├── products/[slug]/page.tsx    # Product detail
│   │   ├── cart/page.tsx
│   │   └── checkout/page.tsx
│   └── account/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       └── profile/page.tsx
├── components/
│   ├── cart/
│   ├── checkout/
│   └── products/
├── contexts/
│   ├── CartContext.tsx
│   └── AuthContext.tsx
└── lib/
    └── oscar-api.ts
```

### Environment Variables

**Next.js (.env.local):**
```
OSCAR_API_URL=http://django-server:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Django:**
```
CORS_ALLOWED_ORIGINS=https://yourstore.com,http://localhost:3000
OSCAR_WEBHOOK_SECRET=your-secure-secret
```

### Oscar API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/basket/` | GET | Get current basket |
| `/api/basket/add-product/` | POST | Add product to basket |
| `/api/basket/lines/<id>/` | PATCH/DELETE | Update/remove line |
| `/api/products/` | GET | List products |
| `/api/products/<id>/` | GET | Product detail |
| `/api/checkout/` | POST | Submit order (freezes basket) |
| `/api/login/` | POST | User login |
| `/api/register/` | POST | User registration |
| `/api/user/` | GET | Current user info |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| oscar-api missing features | Medium | High | Audit before starting; budget for custom endpoints |
| Session management issues | Medium | High | Thorough testing; keep Django fallback |
| Payment integration bugs | Low | Critical | Extensive QA; staged rollout |
| SEO regression | Medium | Medium | Implement proper meta tags; test with tools |
| Performance degradation | Low | Medium | Monitor Core Web Vitals; optimize as needed |
| Staff unfamiliar with admin URLs | Low | Low | Documentation and training |

---

## Success Criteria

### Phase 2 Complete When:
- [ ] All customer-facing pages functional in Next.js
- [ ] Cart works for anonymous and authenticated users
- [ ] Checkout completes with payment
- [ ] No critical bugs in staging environment

### Phase 4 Complete When:
- [ ] 100% traffic on Next.js for 2 weeks
- [ ] Error rate ≤ previous Django baseline
- [ ] Conversion rate ≥ previous Django baseline
- [ ] Core Web Vitals in "Good" range

### Migration Complete When:
- [ ] Django serves only API and admin
- [ ] Team comfortable maintaining Next.js codebase
- [ ] Documentation complete
- [ ] Monitoring and alerting in place
