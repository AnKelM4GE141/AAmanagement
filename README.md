# AA Portal - Property Management Platform

A comprehensive property management platform built with Next.js, Supabase, and TypeScript.

## Features

### Phase 1: Authentication & Foundation (Current)
- ✅ User authentication (login, signup, password reset)
- ✅ Role-based access control (Admin, Tenant, Applicant)
- ✅ Owner account setup (first user becomes admin/owner)
- ✅ User invitation system (admin-controlled)
- ✅ Protected dashboards for each role
- ✅ User management interface

### Coming Soon
- **Phase 2**: Lease Management (document upload, e-signatures)
- **Phase 3**: Payment System (Stripe integration, payment tracking)
- **Phase 4**: Maintenance Requests (ticket system, photo uploads)
- **Phase 5**: Messaging & Notifications

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel + Supabase

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account ([sign up here](https://supabase.com))

### 1. Clone the Repository

```bash
# If not already in the directory
cd "/Users/maximilianochocinski/Sites/AA Portal"
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your database to be set up (takes 1-2 minutes)
3. Go to **Project Settings** → **API** and copy:
   - Project URL
   - `anon` public key

### 3. Create Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL query

This will create:
- User profile tables
- Invitation system
- Properties and tenants tables
- Row Level Security (RLS) policies

### 5. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add these redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

3. Go to **Authentication** → **Email Templates**
   - Customize email templates if desired
   - Ensure confirmation emails are enabled

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First-Time Setup

### Create Owner Account

1. Visit [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
2. Fill out the registration form
3. Your account will automatically become the **Owner/Admin**
4. After signup is complete, the signup page will be disabled
5. You'll be redirected to the admin dashboard

### Invite Users

1. Log in as admin
2. Navigate to **User Management**
3. Use the invite form to send invitations
4. Copy the invitation link and share it with users
5. Invited users can set their password and access their dashboard

## User Roles

### Admin/Owner
- Full access to all features
- User management (invite, assign roles)
- Property management (coming soon)
- Payment tracking (coming soon)
- View all tenants and applicants

### Tenant
- View and pay rent (coming soon)
- Submit maintenance requests (coming soon)
- Access lease documents (coming soon)
- View payment history (coming soon)

### Applicant
- View application status
- Complete application requirements (coming soon)
- Track progress through approval process

## Project Structure

```
/app
  /auth              # Authentication pages (login, signup, invite)
  /dashboard         # Protected dashboard pages
    /admin           # Admin dashboard
    /tenant          # Tenant dashboard
    /applicant       # Applicant dashboard
  /api               # API routes
/components
  /auth              # Auth-related components
  /ui                # Reusable UI components
  /admin             # Admin-specific components
/lib
  /supabase          # Supabase client utilities
  /auth              # Auth helper functions
  /types             # TypeScript type definitions
/supabase            # Database schema and migrations
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Update Supabase Redirect URLs

After deployment, add your production URL to Supabase:
1. Go to **Authentication** → **URL Configuration**
2. Add: `https://your-vercel-domain.vercel.app/auth/callback`

## Security

- All passwords are hashed and managed by Supabase
- Row Level Security (RLS) policies enforce data isolation
- Environment variables are never committed to git
- HTTPS enforced in production

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Support

For issues or questions:
- Check existing GitHub issues
- Create a new issue with details
- Contact the development team

## License

Proprietary - All rights reserved
