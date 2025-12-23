# Universal Awning Cost Sheet Calculator

A self-learning cost estimation app for Universal Awning Company. Track cost sheets, analyze pricing trends, and get real-time feedback with weighted averages based on won/lost jobs.

## Features

- 📊 **Cost Sheet Creation** - Digital version of your Excel cost sheet with real-time calculations
- 📈 **Weighted Analytics** - Won jobs are weighted 3x more to show winning pricing
- 🔍 **Search & Filter** - Find past cost sheets instantly
- 💰 **Pre-Delivery Pricing** - Separates fabrication costs from site-specific delivery costs
- ✅ **Job Outcome Tracking** - Mark jobs as Won/Lost/Unknown to improve estimates over time
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy to Vercel

**See [DEPLOY.md](./DEPLOY.md) for complete step-by-step deployment guide.**

Quick steps:
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project" → Import your repository
3. Set **Root Directory** to `awning-calculator`
4. Click **Deploy**
5. Get your live URL!

## Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Full developer guide, features, and next steps
- **[DEPLOY.md](./DEPLOY.md)** - Step-by-step Vercel deployment instructions

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Prisma + SQLite (upgrade to PostgreSQL for production)
- **Deployment:** Vercel

## What's Included

✅ Dashboard with cost sheet history
✅ Simplified cost sheet form
✅ Real-time calculation engine
✅ Weighted average analytics
✅ Search and filter
✅ Job outcome tracking

## What Needs to Be Added

🚧 Full cost sheet form (all line items from Excel)
🚧 Real-time pricing guardrails (green/red/blue zones)
🚧 Edit existing cost sheets
🚧 Google OAuth authentication
🚧 Quick calculator for salespeople
🚧 Advanced analytics dashboard

## Project Structure

```
awning-calculator/
├── app/
│   ├── api/              # API routes (CRUD, analytics)
│   ├── costsheet/        # Cost sheet pages
│   └── page.tsx          # Dashboard
├── lib/
│   ├── prisma.ts         # Database client
│   ├── constants.ts      # Product categories, rates
│   └── calculations.ts   # Pricing formulas
├── prisma/
│   └── schema.prisma     # Database schema
└── DEVELOPMENT.md        # Developer documentation
```

## Database

Currently using SQLite for development. For production deployment, switch to PostgreSQL:

```bash
# Vercel Postgres (recommended)
# Or use Supabase, PlanetScale, etc.
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for database upgrade instructions.

## Support

For questions about the prototype or development, contact: jacob@universalawning.com
