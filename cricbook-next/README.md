# CricBook - Modern Cricket Booking Platform

CricBook is a full-stack Next.js web application designed to be the ultimate hub for cricket enthusiasts. It provides an intuitive, modern "glassmorphism" user interface for booking turfs, hiring coaches, and buying cricket gear.

## 🚀 Features

- **User Authentication:** Secure signup and login with password validation rules.
- **Dynamic Dashboard:** Personalized user dashboard tracking upcoming matches, recent activities, and wallet balance.
- **Turf Bookings:** Browse nearby turfs and book nets by the hour.
- **Coaching Sessions:** Find specialized cricket coaches (batting, bowling, all-rounder) and book training sessions.
- **E-Commerce Shop:** Add cricket gear to your cart and place orders instantly.
- **Match Matchmaking:** Discover local matches and join them based on your role (batsman, bowler, etc.).
- **Admin Portal:** A dedicated, secure admin dashboard to manage users, track revenue, approve products, and monitor all bookings.

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), React, Vanilla CSS (Glassmorphism design)
- **Backend:** Next.js API Routes (Serverless Functions)
- **Database:** PostgreSQL
- **ORM:** Prisma Client with `@prisma/adapter-pg`

---

## 💻 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (running locally, or use a cloud provider like Neon.tech/Supabase)

### 1. Installation
Clone the repository and install the dependencies:
```bash
# Navigate to the project directory
cd cricbook-next

# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env` file in the root of the `cricbook-next` directory and add your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]?schema=public"
```
*(Example local URL: `postgresql://postgres:password@localhost:5432/cricbook?schema=public`)*

### 3. Database Initialization
Push the database schema to your PostgreSQL instance:
```bash
npx prisma db push
```

### 4. Seed the Database (Optional but Recommended)
Populate the database with sample turfs, coaches, shop items, and the default admin account:
```bash
# Seed general application data
npx ts-node prisma/seed.ts

# Seed the admin user account
npx ts-node prisma/seed-admin.ts
```

### 5. Run the Application
Start the Next.js development server:
```bash
npm run dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Admin Dashboard
To access the admin dashboard, navigate to `http://localhost:3000/admin`. 

If you ran the admin seed script (`npx ts-node prisma/seed-admin.ts`), you can log in with:
- **Email:** `admin@cricbook.com`
- **Password:** `Admin@123`

---

## 🧪 Testing
This project uses Jest and React Testing Library for frontend component testing.
To run the test suite:
```bash
npm test
```
