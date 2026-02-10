# Azure Deployment Guide - Poker Expense Tracker

## Prerequisites
- Azure account with active subscription (employee credits)
- Azure CLI installed (optional but recommended)
- Git repository (GitHub recommended for CI/CD)

## Step-by-Step Deployment

### Step 1: Create Azure SQL Database

#### Via Azure Portal (Recommended)

1. **Navigate to Azure Portal**
   - Go to https://portal.azure.com
   - Sign in with your Microsoft account

2. **Create SQL Database**
   - Click "Create a resource"
   - Search for "SQL Database"
   - Click "Create"

3. **Configure Database**
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or use existing (e.g., `poker-app-rg`)
   - **Database name**: `poker_app`
   - **Server**: Click "Create new"
     - Server name: `poker-app-server-[unique-id]` (must be globally unique)
     - Location: Choose closest region (e.g., East US)
     - Authentication: SQL authentication
     - Admin login: `sqladmin`
     - Password: Create a strong password (save it!)
   - **Compute + storage**: Click "Configure database"
     - Choose "Basic" (5 DTUs, 2GB) - $4.99/month
     - Or "Standard S0" (10 DTUs) - $15/month for better performance
   - Click "Review + Create" → "Create"

4. **Configure Firewall Rules**
   - Go to your SQL Server (not database)
   - Left menu → Security → Networking
   - Under "Firewall rules":
     - ✅ Enable "Allow Azure services and resources to access this server"
     - Click "+ Add your client IPv4 address" (adds your current IP)
   - Click "Save"

5. **Get Connection String**
   - Go to your database (not server)
   - Left menu → Settings → Connection strings
   - Copy the "ADO.NET (SQL authentication)" string
   - It looks like:
   ```
   Server=tcp:poker-app-server-xyz.database.windows.net,1433;Initial Catalog=poker_app;Persist Security Info=False;User ID=sqladmin;Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

6. **Convert to Prisma Format**
   - Prisma needs a slightly different format:
   ```
   sqlserver://sqladmin:YOUR_PASSWORD@poker-app-server-xyz.database.windows.net:1433;database=poker_app;encrypt=true;trustServerCertificate=false;loginTimeout=30
   ```
   - **Important**: Replace `YOUR_PASSWORD` with your actual password
   - **Important**: No curly braces around the password

---

### Step 2: Create Azure App Service

#### Via Azure Portal

1. **Create App Service**
   - Azure Portal → "Create a resource"
   - Search for "Web App"
   - Click "Create"

2. **Configure Web App**
   - **Resource Group**: Use same as database (e.g., `poker-app-rg`)
   - **Name**: `poker-app-[unique-id]` (becomes poker-app-xyz.azurewebsites.net)
   - **Publish**: Code
   - **Runtime stack**: Node 20 LTS
   - **Operating System**: Linux
   - **Region**: Same as your database (e.g., East US)

3. **Configure Pricing Plan**
   - Click "Explore pricing plans"
   - **Development/Test**: B1 Basic (~$13/month)
     - 1.75 GB RAM
     - Good for small apps
   - **Production**: S1 Standard (~$70/month)
     - 1.75 GB RAM
     - Auto-scaling
     - Custom domains
     - SSL certificates
   - **Recommendation**: Start with B1, upgrade later if needed

4. **Review + Create**
   - Click "Review + Create"
   - Click "Create"
   - Wait for deployment (2-3 minutes)

---

### Step 3: Configure App Service Settings

1. **Go to Your App Service**
   - Azure Portal → Your App Service

2. **Configure Environment Variables**
   - Left menu → Settings → Environment variables
   - Click "+ Add" for each variable:

   ```
   Name: DATABASE_URL
   Value: sqlserver://sqladmin:YOUR_PASSWORD@poker-app-server-xyz.database.windows.net:1433;database=poker_app;encrypt=true;trustServerCertificate=false;loginTimeout=30

   Name: NEXTAUTH_URL
   Value: https://poker-app-xyz.azurewebsites.net

   Name: NEXTAUTH_SECRET
   Value: [Generate with: openssl rand -base64 32]

   Name: NODE_ENV
   Value: production
   ```

   - Click "Apply" at the bottom
   - Click "Confirm" when prompted

3. **Configure Deployment Settings**
   - Left menu → Deployment → Deployment Center
   - Choose your deployment method (see Step 4)

---

### Step 4: Deploy Your Application

You have **3 deployment options**. Choose one:

#### Option A: GitHub Actions (Recommended - Automatic)

**Best for**: Continuous deployment, automatic updates on git push

1. **Push Code to GitHub**
   ```bash
   # Initialize git if not already done
   git init
   git add .
   git commit -m "Initial commit"

   # Create GitHub repo and push
   gh repo create poker-app --private --source=. --push
   # Or manually: create repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/poker-app.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect GitHub to Azure**
   - Azure Portal → Your App Service
   - Deployment → Deployment Center
   - Source: GitHub
   - Sign in to GitHub
   - Organization: Your username
   - Repository: poker-app
   - Branch: main
   - Click "Save"

3. **Azure Creates GitHub Action Workflow**
   - Azure automatically creates `.github/workflows/azure-webapps-node.yml`
   - This will build and deploy on every push to main

4. **Add Build Steps to Workflow**
   - Edit the workflow file in your repo
   - Add these steps before the deploy step:

   ```yaml
   - name: Install dependencies
     run: npm ci

   - name: Generate Prisma Client
     run: npx prisma generate

   - name: Build Next.js
     run: npm run build
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL }}
       NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
       NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
   ```

5. **Add GitHub Secrets**
   - GitHub repo → Settings → Secrets and variables → Actions
   - Add secrets:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`

6. **Deploy**
   - Push to main branch → automatic deployment!
   ```bash
   git push
   ```

---

#### Option B: VS Code Extension (Easy, Manual)

**Best for**: Quick deployments, less setup

1. **Install Azure Extension**
   - Install "Azure App Service" extension in VS Code
   - Sign in to Azure

2. **Deploy**
   - Right-click on `package.json`
   - Select "Deploy to Web App"
   - Choose your App Service
   - Confirm deployment

3. **Build Before Deploy**
   ```bash
   npm run build
   ```

---

#### Option C: Azure CLI (For Power Users)

**Best for**: Automation, CI/CD pipelines

1. **Install Azure CLI**
   ```bash
   # Windows (PowerShell)
   winget install Microsoft.AzureCLI

   # Or download from: https://aka.ms/installazurecliwindows
   ```

2. **Login to Azure**
   ```bash
   az login
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Create Deployment Package**
   ```bash
   # Create a zip of your app
   npm install --production
   npx prisma generate
   zip -r deploy.zip . -x "node_modules/*" ".git/*"
   ```

5. **Deploy**
   ```bash
   az webapp deployment source config-zip \
     --resource-group poker-app-rg \
     --name poker-app-xyz \
     --src deploy.zip
   ```

---

### Step 5: Run Database Migrations

After deploying, you need to run migrations on the production database.

#### Method 1: Azure Cloud Shell (Easiest)

1. **Open Cloud Shell**
   - Azure Portal → Click cloud shell icon (top right)
   - Choose Bash

2. **Clone Your Repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/poker-app.git
   cd poker-app
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Environment Variable**
   ```bash
   export DATABASE_URL="sqlserver://sqladmin:YOUR_PASSWORD@poker-app-server-xyz.database.windows.net:1433;database=poker_app;encrypt=true;trustServerCertificate=false"
   ```

5. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

6. **Seed Database (Optional)**
   ```bash
   npm run db:seed
   ```

#### Method 2: Local Machine

If you have your local machine's IP whitelisted in Azure SQL:

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="sqlserver://sqladmin:PASSWORD@poker-app-server-xyz.database.windows.net:1433;database=poker_app;encrypt=true;trustServerCertificate=false"

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

---

### Step 6: Verify Deployment

1. **Check App Service Status**
   - Azure Portal → Your App Service
   - Overview tab should show "Running"

2. **View Logs**
   - Left menu → Monitoring → Log stream
   - Watch for errors

3. **Test Your App**
   - Visit: `https://poker-app-xyz.azurewebsites.net`
   - Try logging in with test credentials:
     - Username: `admin`, Password: `admin123`

4. **Common Issues**
   - **500 Error**: Check logs, likely environment variables
   - **Database Error**: Check DATABASE_URL format, firewall rules
   - **Login Fails**: Check NEXTAUTH_SECRET is set

---

### Step 7: Configure Custom Domain (Optional)

1. **Purchase Domain** (if you don't have one)
   - Namecheap, GoDaddy, or Azure Domains

2. **Add Custom Domain**
   - App Service → Settings → Custom domains
   - Click "+ Add custom domain"
   - Follow wizard to add DNS records

3. **Enable HTTPS**
   - Azure provides free SSL certificates
   - Custom domains → Click on your domain
   - Enable "HTTPS Only"

---

## Production Checklist

Before going live, ensure:

- [ ] Database is created and accessible
- [ ] Firewall rules allow Azure services
- [ ] All environment variables set in App Service
- [ ] Database migrations ran successfully
- [ ] Admin user created (via seed or manually)
- [ ] NEXTAUTH_SECRET is a strong, unique value
- [ ] NEXTAUTH_URL points to production URL
- [ ] App Service is running
- [ ] Can login with test credentials
- [ ] HTTPS is enforced
- [ ] Monitoring/alerts configured (optional)

---

## Cost Breakdown

### Development Setup
- **Azure SQL Database (Basic)**: ~$5/month
- **App Service (B1 Basic)**: ~$13/month
- **Total**: ~$18/month

### Production Setup (Recommended)
- **Azure SQL Database (Standard S0)**: ~$15/month
- **App Service (S1 Standard)**: ~$70/month
- **Total**: ~$85/month

**All covered by your employee credits!** 🎉

---

## Monitoring & Maintenance

### Enable Application Insights (Recommended)

1. **Create Application Insights**
   - Azure Portal → Create resource
   - Search "Application Insights"
   - Same resource group as your app
   - Click Create

2. **Connect to App Service**
   - App Service → Settings → Application Insights
   - Turn on Application Insights
   - Select your Application Insights resource
   - Click Apply

3. **View Metrics**
   - Application Insights → Monitoring → Metrics
   - Track: Response times, errors, requests

### Set Up Alerts

1. **Create Alert Rule**
   - App Service → Monitoring → Alerts
   - "+ Create" → Alert rule
   - Configure conditions (e.g., HTTP 5xx > 10)
   - Add action group (email notification)

### Backup Database

1. **Configure Automated Backups**
   - SQL Database → Data management → Backups
   - Azure automatically backs up (7-35 days retention)
   - Can restore to any point in time

---

## Scaling

### Vertical Scaling (More Power)
- App Service → Settings → Scale up
- Choose higher tier (more RAM/CPU)

### Horizontal Scaling (More Instances)
- App Service → Settings → Scale out
- Increase instance count (S1 and above)
- Configure auto-scaling rules

---

## Troubleshooting

### Issue: Cannot connect to database
**Solution**:
- Check firewall rules in SQL Server
- Verify connection string format
- Test connection in Azure Data Studio

### Issue: 500 Internal Server Error
**Solution**:
- Check App Service logs
- Verify all environment variables are set
- Check if Prisma Client is generated

### Issue: Page won't load / timeout
**Solution**:
- Check if App Service is running
- Verify build completed successfully
- Check Application Insights for errors

### Issue: Login fails
**Solution**:
- Verify database has users (check if seed ran)
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches production URL

---

## Next Steps After Deployment

1. **Change Default Passwords**
   - Login as admin
   - Create new admin user with strong password
   - Delete default test users

2. **Create Real Users**
   - Use admin account to create player accounts
   - Send credentials to your poker group

3. **Test All Features**
   - Create a session
   - Request buy-ins
   - Test approvals
   - Check settlements

4. **Share with Friends**
   - Send them the URL
   - Provide login credentials
   - Gather feedback

5. **Continue Development**
   - Implement Phase 2 features
   - Add more functionality
   - Improve UI/UX

---

## Support & Resources

- [Azure App Service Documentation](https://learn.microsoft.com/azure/app-service/)
- [Azure SQL Database Documentation](https://learn.microsoft.com/azure/azure-sql/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment/production)

---

**You're all set! 🚀 Your poker app is now live on Azure!**
