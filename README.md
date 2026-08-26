# Mavi MES

Advanced Manufacturing Execution System (MES) - No-code platform for building shop floor applications.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## 📦 Features

- **No-Code App Builder** - Visual drag-and-drop app builder for shop floor applications
- **Production Tracking** - Work orders, cycles, completions tracking
- **Quality Control** - Inspection checklists, pass/fail recording
- **Andon System** - Real-time alert and escalation system
- **Inventory Management** - Stock tracking, low-stock alerts
- **AI Assistant** - Natural language app building with AI
- **Offline-First** - Works without internet, syncs when connected
- **n8n Integration** - Webhook automation with n8n workflow engine

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **State**: Zustand, Dexie (IndexedDB)
- **Database**: Supabase (PostgreSQL)
- **Desktop**: Tauri (Windows, macOS, Linux)
- **PWA**: Service Worker, offline support

## 📁 Project Structure

```
mavi-mes/
├── src/
│   ├── components/      # React components
│   ├── contexts/         # React contexts (Auth, Language)
│   ├── hooks/            # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── store/           # Zustand stores
│   └── test/            # Test files
├── public/              # Static assets
├── supabase/            # Database migrations
│   └── migrations/      # SQL migration files
├── docs/                # Documentation
└── scripts/             # Build/deploy scripts
```

## 🔧 Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint          # Run ESLint
npm run test          # Run tests
npm run test:coverage # Run tests with coverage
npm run tauri:dev     # Start Tauri desktop app
npm run tauri:build    # Build Tauri desktop app
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
VITE_SUPABASE_URL=           # Supabase project URL
VITE_SUPABASE_ANON_KEY=      # Supabase anon key
VITE_SENTRY_DSN=             # Sentry DSN (optional)
VITE_APP_ENV=development      # development | staging | production
```

## 🚢 Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

```bash
# Vercel (recommended)
npm install -g vercel
vercel --prod

# Database migration
supabase db push
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📚 Documentation

- [Getting Started Guide](./GUIDE_PEMULA_MAVI.md)
- [API Reference](./API_REFERENCE.js)
- [n8n Integration](./n8n_integration_guide.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Public SaaS Roadmap](./docs/PUBLIC_SAAS_ROADMAP.md)

## 🔐 Security

For production deployment, ensure:

1. Row Level Security (RLS) is enabled on all tables
2. Environment variables are set securely
3. CORS is configured for your domain
4. Rate limiting is enabled
5. HTTPS is enforced

## 📄 License

Private - All rights reserved

## 🤝 Support

For issues or questions, open a GitHub issue.
