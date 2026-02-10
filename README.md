# Poker Expense Tracker

A modern web application for managing poker sessions, buy-ins, settlements, and performance tracking. Built with Next.js, TypeScript, Azure SQL Database, and deployed on Azure.

## Features

### Player Features
- 🎮 Join poker sessions
- 💰 Request buy-ins during sessions
- 📊 View real-time buy-in approval status
- 💳 Settle pending amounts
- 📈 View current balance (P/L since last settlement)
- 📅 Monthly profit/loss reports
- 🏆 Session history and performance tracking

### Admin Features
- 👥 Create and manage player accounts
- 🎲 Create and end poker sessions
- ✅ Approve/reject buy-in requests
- 💸 Record settlements
- 📊 View all player data and reports
- 🎭 Perform all player actions on their behalf

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Azure SQL Database
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **UI Components**: shadcn/ui + Tailwind CSS
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Deployment**: Azure App Service

## Prerequisites

- Node.js 20+ and npm
- Azure SQL Database (or SQL Server for local development)
- Azure account (for deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ThePokerApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the `.env.example` file to `.env` and update with your values:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
# Database - Azure SQL Database
DATABASE_URL="sqlserver://your-server.database.windows.net:1433;database=poker_app;user=your-username;password=your-password;encrypt=true;trustServerCertificate=false"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# App Configuration
NODE_ENV="development"
```

**Generate a secure secret for NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Set Up Azure SQL Database

#### Create Database in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **SQL Database**:
   - **Server**: Create new or use existing
   - **Database name**: `poker_app`
   - **Pricing tier**: Basic or Standard S0 (for development)
3. Configure **Firewall rules**:
   - Add your client IP address
   - Enable "Allow Azure services and resources to access this server"
4. Copy the connection string and update your `.env` file

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Generate the Prisma Client

### 6. Seed the Database

```bash
npm run db:seed
```

This creates test users:
- **Admin**: username: `admin`, password: `admin123`
- **Player 1**: username: `player1`, password: `player123`
- **Player 2**: username: `player2`, password: `player123`
- **Player 3**: username: `player3`, password: `player123`

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ThePokerApp/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed data script
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages (login)
│   │   ├── (dashboard)/       # Protected pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Navbar, etc.
│   │   └── providers/         # React providers
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma client
│   │   ├── utils.ts           # Utility functions
│   │   ├── validations.ts     # Zod schemas
│   │   └── constants.ts       # App constants
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # State management
│   ├── types/                 # TypeScript types
│   └── middleware.ts          # Route protection
├── .env                       # Environment variables (not committed)
├── .env.example               # Environment variables template
├── components.json            # shadcn/ui config
├── next.config.ts             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

## Database Schema

### Core Tables

- **Users** - Player and admin accounts
- **Sessions** - Poker game sessions
- **BuyIns** - Buy-in requests with approval workflow
- **SessionResults** - Final P/L per player per session
- **Settlements** - Payment tracking

### Key Relationships

- Users create Sessions (1:many)
- Sessions have BuyIns (1:many)
- Sessions have SessionResults (1:many)
- Users have Settlements (1:many)

## Deployment to Azure

### Option 1: Azure App Service (Recommended)

#### 1. Create Azure App Service

```bash
# Using Azure CLI
az webapp create \
  --resource-group <your-resource-group> \
  --plan <your-app-service-plan> \
  --name <your-app-name> \
  --runtime "NODE:20-lts"
```

Or create via [Azure Portal](https://portal.azure.com):
- **Runtime stack**: Node 20 LTS
- **Operating System**: Linux
- **Plan**: Basic B1 or Standard S1

#### 2. Configure Environment Variables

In Azure Portal, go to your App Service → Configuration → Application settings:

```
DATABASE_URL="sqlserver://..."
NEXTAUTH_URL="https://your-app.azurewebsites.net"
NEXTAUTH_SECRET="your-production-secret"
NODE_ENV="production"
```

#### 3. Deploy via GitHub Actions

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build application
        run: npm run build
        env:
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: <your-app-name>
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

Add these secrets to GitHub:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AZURE_WEBAPP_PUBLISH_PROFILE` (download from Azure Portal)

### Option 2: Manual Deployment

```bash
# Build the application
npm run build

# Deploy using Azure CLI
az webapp up \
  --name <your-app-name> \
  --resource-group <your-resource-group>
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed the database

## Common Tasks

### Create a New Migration

```bash
npx prisma migrate dev --name <migration-name>
```

### Reset Database (Development)

```bash
npx prisma migrate reset
```

### View Database in Prisma Studio

```bash
npx prisma studio
```

### Generate Prisma Client

```bash
npx prisma generate
```

## Azure Cost Estimates

**Monthly costs (approximate):**
- Azure SQL Database (Basic): $5-15
- Azure App Service (Basic B1): $13-55
- Application Insights (Free tier): $0

**Total**: $18-70/month (covered by employee credits)

## Security Best Practices

- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens in HTTP-only cookies
- ✅ Role-based access control (RBAC)
- ✅ SQL injection protection via Prisma
- ✅ Environment variables for secrets
- ✅ HTTPS enforced in production
- ✅ CSRF protection via NextAuth.js

## Troubleshooting

### Database Connection Issues

**Error**: "Login failed for user"
- Check firewall rules in Azure SQL Database
- Verify connection string format
- Ensure IP address is whitelisted

**Error**: "Cannot connect to database"
- Check if database exists
- Verify credentials
- Test connection using Azure Data Studio

### Prisma Issues

**Error**: "Schema could not be loaded"
- Run `npx prisma generate`
- Check `prisma/schema.prisma` syntax

**Error**: "Migration failed"
- Check database connection
- Run `npx prisma migrate reset` (development only)

### NextAuth Issues

**Error**: "Invalid credentials"
- Check if user exists in database
- Verify password hash
- Check NEXTAUTH_SECRET is set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## Next Steps

Phase 1 (Foundation) is complete! Next phases:
- **Phase 2**: Implement core player features (sessions, buy-ins, reports)
- **Phase 3**: Implement admin features (player management, buy-in approvals)
- **Phase 4**: UI/UX polish and optimization
- **Phase 5**: Production deployment to Azure

---

**Built with ❤️ using Next.js, TypeScript, and Azure**
