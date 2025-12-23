# Universal Awning Cost Sheet Calculator - Development Guide

## Overview
This is a prototype cost sheet calculator application for Universal Awning Company. It helps estimators create cost sheets, track pricing history, and analyze average pricing with weighted averages based on won/lost jobs.

## What's Been Built ✅

### 1. Database Schema (Prisma + SQLite)
- **CostSheet** model with all fields from the Excel sheet
- **MaterialLine**, **FabricLine**, **LaborLine**, **RecapLine** models for line items
- **User** model for authentication (basic placeholder)
- Supports tracking job outcomes (Won/Lost/Unknown) for weighted averages

### 2. API Routes
- `GET /api/costsheets` - Fetch all cost sheets with search/filter
- `POST /api/costsheets` - Create new cost sheet
- `GET /api/costsheets/[id]` - Fetch single cost sheet
- `PUT /api/costsheets/[id]` - Update cost sheet
- `DELETE /api/costsheets/[id]` - Delete cost sheet
- `GET /api/analytics` - Get pricing analytics with weighted averages

### 3. Dashboard (Homepage)
- **Cost Sheet History Table** - Shows all cost sheets, sortable and filterable
- **Search Functionality** - Search by customer, project, or category
- **Category Filter** - Filter by product type
- **Job Outcome Dropdown** - Mark jobs as Won/Lost/Unknown (for weighted averages)
- **Average Pricing Cards** - Shows weighted average pricing by product category

### 4. Cost Sheet Form (Simplified Prototype)
- Header information (dates, category, customer, etc.)
- Dimensions section
- Simplified materials section
- Labor section (Survey example)
- Markup calculation
- Other Requirements (Drive Time, Mileage) - excluded from pre-delivery pricing
- Real-time calculation of all totals
- Calculates $/sq ft and $/lin ft (pre-delivery)

### 5. Calculation Logic
- All Excel formulas implemented in TypeScript
- Sales tax calculation
- Labor cost calculation
- Markup application
- Drive time/mileage (site-specific costs)
- Price per sq ft / lin ft (both pre and post delivery)

### 6. Key Features Implemented
- **Weighted Averages** - Won jobs are weighted 3x more than lost/unknown jobs
- **Pre-Delivery Pricing** - Excludes site-specific costs for accurate averages
- **Product Categories** - All 39 product types from your list
- **Labor Rates** - Aggressive ($85), Regular ($95), Prevailing Wage ($160)

## What Needs to Be Completed 🚧

### 1. Expand Cost Sheet Form to Match Excel Exactly
The current form is simplified. It needs:
- **Multiple Material Line Items** - Add/remove rows dynamically
- **Multiple Fabric Line Items** - Fabric 1, Fabric 2, Graphics
- **All Labor Types** - Survey, Shop Drawings, Sewing, Graphics, Assembly, Welding, Paint, Installation 1, Installation 2
- **All Other Requirements** - Permits, Engineering, Equipment, Hotel, Food
- **Recap Section** - 10 awning/canopy lines with width, length, fabric yards, sq ft, lin ft
- **Discount/Increase** - Final adjustment field

### 2. Real-Time Pricing Guardrails
- **Show indicator on form** while user is filling it out
- **Color coding**:
  - Green: Within average range
  - Red: Too high (above average)
  - Blue: Too low (below average)
- Fetch averages from analytics API for current product category
- Display in sidebar or banner on cost sheet form

### 3. Edit Existing Cost Sheets
- Create `/costsheet/[id]/page.tsx` (copy from `/costsheet/new/page.tsx`)
- Pre-populate form with existing data
- Update instead of create

### 4. Google OAuth Authentication
- Replace temporary user ID with real authentication
- Use NextAuth.js or similar
- Restrict to @universalawning.com emails only
- Update API routes to use authenticated user

### 5. OCR for Old Cost Sheets
- Optional feature for importing legacy Excel cost sheets
- Can use Tesseract.js or cloud OCR service
- Auto-categorize and import data

### 6. Quick Calculator for Salespeople
- Simple form: Product type + Square footage
- Shows estimated price based on weighted averages
- Quick ballpark for customers

### 7. Advanced Analytics Dashboard
- More detailed metrics
- Charts and graphs (Chart.js or Recharts)
- Win rate by product category
- Pricing trends over time
- Compare individual cost sheet to averages

### 8. UI/UX Polish
- Make form look more like the Excel sheet (colors, layout)
- Better mobile responsiveness
- Loading states and error handling
- Toast notifications for success/error
- Form validation

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite (can easily switch to PostgreSQL)
- **Authentication**: Not yet implemented (needs NextAuth.js or similar)

## Getting Started

### Install Dependencies
```bash
npm install
```

### Set Up Database
```bash
npx prisma generate
npx prisma migrate dev
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Create a migration after schema changes
npx prisma migrate dev --name description_of_changes

# Reset database (careful!)
npx prisma migrate reset
```

## File Structure
```
awning-calculator/
├── app/
│   ├── api/
│   │   ├── costsheets/        # Cost sheet CRUD endpoints
│   │   └── analytics/          # Analytics endpoint
│   ├── costsheet/
│   │   └── new/                # New cost sheet form
│   └── page.tsx                # Dashboard homepage
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── constants.ts            # Product categories, labor rates, etc.
│   └── calculations.ts         # Calculation utilities
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
└── package.json
```

## Key Formulas (from Excel)
1. **Material Total** = (Qty × Unit Price) + (Qty × Unit Price × Tax%) + Freight
2. **Labor Total** = Hours × People × Rate
3. **Subtotal** = Total Materials + Total Fabric + Total Labor
4. **Total with Markup** = Subtotal + (Subtotal × Markup)
5. **Drive Time Total** = Trips × Hours × People × Rate
6. **Mileage Total** = Miles × Trips × Rate/Mile
7. **$/sq ft (Pre-Delivery)** = Total with Markup ÷ Canopy Sq Ft
8. **$/lin ft (Pre-Delivery)** = Total with Markup ÷ Awning Lin Ft

## Weighted Average Formula
```
Weighted Average = (Σ Won Jobs × 3 + Σ Other Jobs) / (Won Count × 3 + Other Count)
```
This ensures winning bids influence the average more heavily.

## Next Steps for Developer
1. **Expand the cost sheet form** to match Excel layout exactly
2. **Add real-time pricing guardrails** (green/red/blue indicators)
3. **Implement edit functionality** for existing cost sheets
4. **Add Google OAuth** for authentication
5. **Polish UI** to match company branding
6. **Deploy** to Vercel or similar platform

## Deployment
This app is ready to deploy to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS**
- **Google Cloud**

For production, switch from SQLite to PostgreSQL:
1. Update `prisma/schema.prisma` datasource to `postgresql`
2. Set `DATABASE_URL` in environment variables
3. Run `npx prisma migrate deploy`

## Notes
- The prototype focuses on core functionality
- Form is simplified but calculation logic is complete
- All 39 product categories are included
- Database schema supports all Excel fields
- Weighted averages are implemented
- Pre-delivery pricing correctly excludes site-specific costs

## Questions?
Contact: jacob@universalawning.com
