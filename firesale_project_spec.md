# 🔥 FireSale — Real-Time Community Deal Network (PWA)

## Overview

FireSale is a real-time, location-based Progressive Web App (PWA) that enables users to discover, share, and validate short-lived deals happening nearby.

Unlike traditional deal platforms, FireSale focuses on live, community-reported deals with high urgency and short lifespans.

---

## Core Value Proposition

### For Users

- Discover real-time deals nearby
- Save money
- Community-validated deals

### For Businesses

- Promote flash sales instantly
- Reach nearby customers
- Boost visibility with paid promotions

---

## Product Principles

1. Real-Time First
2. Location-Centric
3. Community-Verified
4. Short-Lived Content
5. Low Friction

---

## MVP Features

- Deal Feed (Hot, New, Nearby)
- Map View
- Deal Creation
- Voting System
- Comments
- Expiration System

---

## Basic Page Flows

### 1. Onboarding and Location Access

- User lands on the home page
- App explains the value quickly: live nearby deals, expiring soon
- User allows location access or enters a city / ZIP manually
- App routes the user into the Nearby feed by default

### 2. Deal Feed

- User sees tabs for Hot, New, and Nearby
- Each deal card shows title, store, distance, expiration, price / discount, and vote state
- User can open a deal, upvote / downvote, save for later, or switch to the map
- Infinite scroll or paginated loading keeps the feed fast

### 3. Map View

- User switches from feed to map
- Nearby deals appear as pins with urgency indicators
- Selecting a pin opens a compact preview card
- User can jump from the preview into the full deal detail page

### 4. Deal Detail

- User opens a specific deal from the feed or map
- Page shows images, description, store info, address, time remaining, and community votes
- User can vote, comment, share, or mark the deal as expired
- Related nearby or similar deals appear below the main content

### 5. Create a Deal

- User taps a primary Create Deal CTA
- Form collects title, description, store name, category, location, expiration time, optional image, and price / discount
- App previews the deal before submission
- After submit, the user lands on the newly created deal detail page with a success state

### 6. Comments and Validation

- On the deal detail page, user reads recent comments first
- Users add quick validation comments like "still active" or "sold out"
- High-trust comments and recent confirmations are surfaced near the top
- Repeated negative feedback can help trigger an expired or low-confidence state

### 7. Expiration and Trust Feedback

- Expired deals move out of primary ranking automatically
- Users can still open expired deals for a short archive period
- App clearly labels a deal as Active, Expiring Soon, Low Confidence, or Expired
- Ranking blends freshness, votes, and recency of validation

---

## Data Models

### Deal

```ts
Deal {
  id: string
  title: string
  description: string
  storeName: string
  location: { lat: number; lng: number; address: string }
  category: string
  price?: number
  discount?: number
  imageUrl?: string
  createdBy: string
  createdAt: Date
  expiresAt: Date
  upvotes: number
  downvotes: number
  commentsCount: number
  status: "active" | "expired"
}
```

### User

```ts
User {
  id: string
  username: string
  reputationScore: number
  createdAt: Date
}
```

### Comment

```ts
Comment {
  id: string
  dealId: string
  userId: string
  content: string
  createdAt: Date
}
```

---

## Ranking Algorithm

```ts
score = ((upvotes - downvotes) / (hours_since_post + 2)) ^ 1.5;
```

---

## API Design

### Deals

```
GET    /api/deals
GET    /api/deals/:id
POST   /api/deals
POST   /api/deals/:id/vote
POST   /api/deals/:id/expire
```

### Comments

```
GET    /api/deals/:id/comments
POST   /api/deals/:id/comments
```

---

## Architecture

- Frontend: React + Vite (PWA)
- Backend: Node.js + Express
- Database: PostgreSQL
- Hosting: Railway

### Deployment

- Deploy on Railway for simple, integrated hosting
- Railway handles environment management and auto-deploys from Git

---

## UI Direction

- Mobile-first PWA layout, but clean and usable on desktop web
- Fast scanability matters more than dense detail
- Primary interaction model: card feed + map + lightweight detail views
- Use strong urgency cues for expiring deals without making the UI feel noisy
- Keep posting and validating deals low-friction

### UI Reference Guidance for Codex

- Use Mobbin Web UI Elements as inspiration for high-level layout and component patterns
- Prioritize patterns from cards, badges, banners, buttons, dialogs, avatars, and icons
- Feed screens should feel like modern marketplace or discovery products: image-forward cards, compact metadata, and obvious primary actions
- Detail screens should use clear content hierarchy: headline, merchant/store, urgency, social proof, then comments
- Create flow should use a clean multi-step or progressive disclosure form with strong mobile ergonomics
- Map interactions should use bottom sheets or compact preview cards instead of heavy modal flows
- Empty states, permission prompts, and expired-deal states should feel designed, not generic
- Reference this source for inspiration only: https://mobbin.com/explore/web/ui-elements

---

## Monetization

- Business Boosts
- Paid Deal Posts
- Featured Listings

---

## Go-To-Market

- Launch in one city
- Seed deals manually
- Invite early users
- Expand to businesses

---

## Metrics

- DAU
- Deals per day
- Engagement rate

---

## Future Features

- Notifications
- Reputation system
- AI recommendations
- Gamification

---

## Summary

FireSale answers:
“What deal is happening right now near me?”
