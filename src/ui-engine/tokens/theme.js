/**
 * MaviCore Design System Tokens
 * Industrial MES theme specification for Gluestack UI Engine
 */

export const maviDesignTokens = {
  name: 'MaviCore Industrial Design System',
  version: '2.0.0',
  colors: {
    // Brand & Identity (Odoo / MaviCore Heritage)
    primary: {
      50: '#fbf7fa',
      100: '#f5edf3',
      200: '#ebdbe6',
      300: '#dcbfd3',
      400: '#b88aa9',
      500: '#714b67', // Odoo Purple primary brand
      600: '#643f5b',
      700: '#53344b',
      800: '#452c3e',
      900: '#3a2735',
      DEFAULT: '#714b67'
    },
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#008784', // Odoo Teal / Industrial Action
      600: '#007572',
      700: '#0f5b59',
      800: '#114948',
      900: '#133e3d',
      DEFAULT: '#008784'
    },
    // Status & Industrial Indicators
    success: {
      light: '#dcfce7',
      DEFAULT: '#10b981',
      dark: '#047857',
      text: '#065f46'
    },
    warning: {
      light: '#fef3c7',
      DEFAULT: '#f59e0b',
      dark: '#b45309',
      text: '#92400e'
    },
    danger: {
      light: '#fee2e2',
      DEFAULT: '#ef4444',
      dark: '#b91c1c',
      text: '#991b1b'
    },
    info: {
      light: '#e0f2fe',
      DEFAULT: '#0284c7',
      dark: '#0369a1',
      text: '#075985'
    },
    // Shop Floor Specific
    industrial: {
      andonGreen: '#22c55e',
      andonYellow: '#eab308',
      andonRed: '#ef4444',
      machineSteel: '#334155',
      oilDark: '#0f172a',
      sensorCyan: '#06b6d4',
      hazardOrange: '#f97316'
    },
    // Workspace Surface & Backgrounds
    surface: {
      light: {
        canvas: '#edf1f5',
        card: '#ffffff',
        subtle: '#f8fafc',
        border: '#e2e8f0',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8'
      },
      dark: {
        canvas: '#0f111a',
        card: '#1e1e2d',
        subtle: '#2a2a3b',
        border: '#334155',
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        textMuted: '#64748b'
      }
    }
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px'
  },
  radius: {
    none: '0px',
    xs: '4px',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px'
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, Menlo, Monaco, Consolas, "Courier New", monospace'
    },
    fontSize: {
      xs: '0.72rem',
      sm: '0.82rem',
      md: '0.92rem',
      lg: '1.05rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
  },
  breakpoints: {
    mobileSmall: '320px',
    mobileRegular: '375px',
    mobileLarge: '425px',
    tablet: '768px',
    desktop: '1024px'
  }
};
