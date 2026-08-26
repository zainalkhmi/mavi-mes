/**
 * deployment.js
 * =====================================================
 * Deployment utilities and scripts
 * Run with: node scripts/deployment.js <command>
 * =====================================================
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const commands = {
  // Check environment setup
  check: () => {
    console.log('🔍 Checking deployment environment...\n');

    const checks = [
      { name: 'Node.js', cmd: 'node --version' },
      { name: 'npm', cmd: 'npm --version' },
      { name: 'Git', cmd: 'git --version' },
    ];

    checks.forEach(({ name, cmd }) => {
      try {
        const version = execSync(cmd).toString().trim();
        console.log(`✅ ${name}: ${version}`);
      } catch {
        console.log(`❌ ${name}: Not installed`);
      }
    });

    // Check env file
    console.log('\n📁 Environment Files:');
    const envFiles = ['.env', '.env.local', '.env.production'];
    envFiles.forEach(file => {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      console.log(`  ${exists ? '✅' : '⚠️ '} ${file}${exists ? '' : ' (not created)'}`);
    });

    console.log('\n✨ Check complete');
  },

  // Validate environment variables
  validate: () => {
    console.log('🔍 Validating environment variables...\n');

    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ];

    const optional = [
      'VITE_SENTRY_DSN',
      'VITE_GEMINI_API_KEY',
      'VITE_OPENAI_API_KEY',
    ];

    let hasErrors = false;

    required.forEach(key => {
      const value = process.env[key];
      if (!value) {
        console.log(`❌ ${key}: Required but not set`);
        hasErrors = true;
      } else {
        console.log(`✅ ${key}: Set`);
      }
    });

    optional.forEach(key => {
      const value = process.env[key];
      if (!value) {
        console.log(`⚠️  ${key}: Optional - not set`);
      } else {
        console.log(`✅ ${key}: Set`);
      }
    });

    if (hasErrors) {
      console.log('\n❌ Validation failed. Please set required environment variables.');
      process.exit(1);
    }

    console.log('\n✨ Validation complete');
  },

  // Generate production build
  build: () => {
    console.log('🔨 Building for production...\n');

    try {
      console.log('📦 Installing dependencies...');
      execSync('npm ci', { stdio: 'inherit' });

      console.log('\n🏗️  Building...');
      execSync('npm run build', { stdio: 'inherit' });

      console.log('\n✅ Build complete!');
      console.log('📁 Output in ./dist');
    } catch (err) {
      console.error('\n❌ Build failed');
      process.exit(1);
    }
  },

  // Deploy to Vercel
  deploy: async () => {
    console.log('🚀 Deploying to Vercel...\n');

    try {
      // Check for Vercel CLI
      let vercelInstalled = false;
      try {
        execSync('vercel --version', { stdio: 'pipe' });
        vercelInstalled = true;
      } catch {}

      if (!vercelInstalled) {
        console.log('📦 Installing Vercel CLI...');
        execSync('npm install -g vercel', { stdio: 'inherit' });
      }

      // Deploy
      console.log('\n🔗 Deploying...');
      const output = execSync('vercel --prod', { encoding: 'utf-8' });
      console.log(output);

      console.log('\n✅ Deployment complete!');
    } catch (err) {
      console.error('\n❌ Deployment failed');
      process.exit(1);
    }
  },

  // Run database migration
  migrate: async () => {
    console.log('🗄️  Running database migration...\n');

    try {
      // Check for Supabase CLI
      let supabaseInstalled = false;
      try {
        execSync('supabase --version', { stdio: 'pipe' });
        supabaseInstalled = true;
      } catch {}

      if (!supabaseInstalled) {
        console.log('📦 Installing Supabase CLI...');
        execSync('npm install -g supabase', { stdio: 'inherit' });
      }

      // Run migration
      console.log('⬆️  Applying migrations...');
      execSync('supabase db push', { stdio: 'inherit' });

      console.log('\n✅ Migration complete!');
    } catch (err) {
      console.error('\n❌ Migration failed');
      process.exit(1);
    }
  },

  // Full deployment pipeline
  pipeline: async () => {
    console.log('🚀 Running full deployment pipeline...\n');

    commands.validate();

    console.log('\n' + '='.repeat(50) + '\n');

    commands.build();

    console.log('\n' + '='.repeat(50) + '\n');

    await commands.deploy();

    console.log('\n' + '='.repeat(50) + '\n');

    await commands.migrate();

    console.log('\n✨ Full pipeline complete!');
  },

  // Help
  help: () => {
    console.log(`
Mavi MES Deployment Scripts
===========================

Usage: node scripts/deployment.js <command>

Commands:
  check       Check environment setup
  validate    Validate environment variables
  build       Build for production
  deploy      Deploy to Vercel
  migrate     Run database migration
  pipeline    Run full deployment pipeline
  help        Show this help

Environment Variables:
  VITE_SUPABASE_URL       Supabase project URL (required)
  VITE_SUPABASE_ANON_KEY Supabase anon key (required)
  VITE_SENTRY_DSN        Sentry DSN (optional)
  VITE_GEMINI_API_KEY    Gemini API key (optional)
    `);
  },
};

// Main
const command = process.argv[2] || 'help';

if (commands[command]) {
  commands[command]();
} else {
  console.error(`Unknown command: ${command}`);
  commands.help();
  process.exit(1);
}
