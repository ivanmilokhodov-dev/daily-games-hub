# Deployment Guide

This guide covers how to deploy Daily Games Hub to make it available to everyone.

## Option 1: Railway (Recommended - Easy & Free Tier)

Railway offers a simple deployment process with a generous free tier.

### Prerequisites
- GitHub account
- Railway account (https://railway.app)

### Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/daily-games-hub.git
   git push -u origin main
   ```

2. **Deploy Backend on Railway**
   - Go to https://railway.app and sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the backend (or select the `backend` folder)
   - Add a PostgreSQL database: Click "New" → "Database" → "PostgreSQL"
   - Set environment variables in the backend service:
     ```
     SPRING_PROFILES_ACTIVE=prod
     JWT_SECRET=your-super-secret-key-at-least-256-bits-long
     CORS_ALLOWED_ORIGINS=https://your-frontend-url.railway.app
     ```
   - Railway automatically connects the database

3. **Deploy Frontend on Railway**
   - In the same project, click "New" → "GitHub Repo"
   - Configure to use the `frontend` folder
   - Set build command: `npm run build`
   - Set start command: `npx serve dist -s`
   - Add environment variable for API URL if needed

4. **Update CORS**
   - Once frontend is deployed, copy its URL
   - Update `CORS_ALLOWED_ORIGINS` in backend to include the frontend URL

---

## Option 2: Render (Free Tier Available)

### Steps

1. **Deploy PostgreSQL Database**
   - Go to https://render.com
   - Create a new PostgreSQL database
   - Note the connection string

2. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Set root directory to `backend`
   - Build command: `./mvnw clean package -DskipTests`
   - Start command: `java -jar target/*.jar`
   - Add environment variables:
     ```
     SPRING_PROFILES_ACTIVE=prod
     SPRING_DATASOURCE_URL=your-postgres-connection-string
     JWT_SECRET=your-secret-key
     CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
     ```

3. **Deploy Frontend**
   - Click "New" → "Static Site"
   - Connect repository, set root to `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Add rewrite rule: `/*` → `/index.html` (for React Router)

---

## Option 3: Docker Compose (VPS/Self-hosted)

For deployment on a VPS (DigitalOcean, Linode, AWS EC2, etc.)

### Prerequisites
- A VPS with Docker and Docker Compose installed
- A domain name (optional but recommended)

### Steps

1. **Clone the repository on your server**
   ```bash
   git clone https://github.com/yourusername/daily-games-hub.git
   cd daily-games-hub
   ```

2. **Create environment file**
   ```bash
   cat > .env << EOF
   DB_PASSWORD=your-secure-database-password
   JWT_SECRET=your-super-secret-key-at-least-256-bits-long
   CORS_ORIGINS=https://yourdomain.com
   EOF
   ```

3. **Build and run**
   ```bash
   docker-compose up -d --build
   ```

4. **Set up HTTPS (recommended)**

   Install Certbot and Nginx on host:
   ```bash
   sudo apt install certbot python3-certbot-nginx nginx
   ```

   Create Nginx config (`/etc/nginx/sites-available/dailygames`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   Enable and get SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/dailygames /etc/nginx/sites-enabled/
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Option 4: Vercel (Frontend) + Railway (Backend)

This hybrid approach uses Vercel's excellent frontend hosting.

### Frontend on Vercel

1. Go to https://vercel.com
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Vercel auto-detects Vite configuration
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

6. Update `frontend/src/services/api.js`:
   ```javascript
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || '',
     // ...
   })
   ```

### Backend on Railway
Follow Option 1 instructions for backend deployment.

---

## Environment Variables Reference

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `prod` |
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | `jdbc:postgresql://host:5432/db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `secretpassword` |
| `JWT_SECRET` | JWT signing key (min 256 bits) | `your-very-long-secret-key...` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `https://example.com` |

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL (if not proxied) | `https://api.example.com` |

---

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Test score submission
- [ ] Test group creation and joining
- [ ] Verify HTTPS is working
- [ ] Check that CORS is properly configured
- [ ] Monitor logs for errors
- [ ] Set up database backups (if self-hosted)

## Troubleshooting

### CORS Errors
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL (with protocol)
- Don't include trailing slashes in the URL

### Database Connection Issues
- Verify the connection string format
- Check that the database is accessible from your backend service
- Ensure credentials are correct

### JWT Errors
- Make sure `JWT_SECRET` is at least 256 bits (32+ characters)
- Use the same secret across all backend instances

### Frontend Not Loading
- Check browser console for errors
- Verify the API URL is correct
- Ensure React Router fallback is configured (index.html for all routes)
