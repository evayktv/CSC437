# Ridefolio

A single-page application for car enthusiasts to view car models and their history, plus manage your personal garage inventory with service logs and notes.

## Features

- **Browse Models** - View all cars and models with detailed specifications and history
- **My Garage** - Manage your car inventory with service logs and notes to easily keep track of all information for your vehicles
- **Service Logs** - Track maintenance, repairs, and service history for each vehicle
- **Notes** - Add and manage notes for each car in your garage
- **Authentication** - Secure user accounts with JWT-based authentication
- **Responsive Design** - Modern UI with dark mode support

## Tech Stack

- **Frontend**: Lit, TypeScript, Vite, Mustang Framework
- **Backend**: Express, MongoDB, Mongoose
- **Styling**: CSS Custom Properties, Racing-themed fonts

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas connection (configured in `.env`)

### Development

1. **Start the backend server:**

   ```bash
   cd packages/server
   npm run start:app
   ```

2. **Start the frontend dev server (in a separate terminal):**

   ```bash
   cd packages/app
   npm run dev
   ```

3. **Access the app:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

## Production

The production version is available at [https://evcao.csse.dev/](https://evcao.csse.dev/)

### How to deploy change

```
ssh evcao@evcao-host.csse.dev
cd /home/evcao/CSC437
git pull --rebase
cd packages/app
npm install  # This will now install vite and typescript
npm run build
cd ../..
cd packages/server
npm run build
pkill -f "node.*dist/index.js"
nohup npm run start:app > ../../nohup.out 2>&1 &
```
