import { createTheme } from '@mui/material/styles';

/**
 * ─── CMS Brand Palette ────────────────────────────────────────────────────────
 *
 * Primary  → Orange   (#F86F03)   — brand signature colour
 * Secondary → Black   (#000000)   — high-contrast accent
 * Tertiary  → Amber   (#B96A01)   — warm dark-orange support
 * Neutral   → Warm White (#FFF5EB) — brand background tint
 *
 * These tokens mirror the Tailwind @theme in src/shared/styles/index.css
 * so MUI components blend seamlessly with the existing Tailwind UI.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Raw brand tokens (single source of truth) ────────────────────────────────
export const brand = {
  /** Primary orange */
  orange: {
    50:  '#FFF5EB',
    100: '#FFE4C4',
    200: '#FFC999',
    300: '#FFAA66',
    400: '#FF8C33',
    500: '#F86F03',   // ← primary.main
    600: '#E05E00',
    700: '#C45200',
    800: '#B96A01',   // ← tertiary / dark variant
    900: '#8A3D00',
  },

  /** Neutral greys */
  grey: {
    50:  '#F8F9FA',
    100: '#F4F4F4',   // ← grey-light (input backgrounds)
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },

  white: '#FFFFFF',
  black: '#000000',
  warmWhite: '#FFF5EB',   // ← neutral brand bg
};

// ─── MUI Theme ────────────────────────────────────────────────────────────────
const muiTheme = createTheme({
  // ── Colour palette ──────────────────────────────────────────────────────────
  palette: {
    mode: 'light',

    primary: {
      lightest:    brand.orange[50],
      lighter:     brand.orange[100],
      light:       brand.orange[300],
      main:        brand.orange[500],   // #F86F03
      dark:        brand.orange[600],   // #E05E00
      darker:      brand.orange[800],   // #B96A01
      contrastText: brand.white,
    },

    secondary: {
      main:        brand.black,
      light:       brand.grey[800],
      dark:        '#000000',
      contrastText: brand.white,
    },

    /** Warm-white neutral — use as surface/background variant */
    neutral: {
      main:        brand.warmWhite,
      light:       brand.orange[50],
      dark:        brand.orange[100],
      contrastText: brand.orange[500],
    },

    background: {
      default: '#F8F9FA',         // page background (near-white)
      paper:   brand.white,       // card / surface
      warm:    brand.warmWhite,   // brand warm white
    },

    text: {
      primary:   '#1E293B',       // slate-800 — readable on white
      secondary: '#64748B',       // slate-500 — softer label text
      disabled:  '#94A3B8',       // slate-400
    },

    divider: '#E2E8F0',

    // Semantic colours — kept consistent with the existing Tailwind palette
    error: {
      main:        '#EF4444',
      light:       '#FCA5A5',
      dark:        '#B91C1C',
      contrastText: brand.white,
    },
    warning: {
      main:        '#F59E0B',
      light:       '#FDE68A',
      dark:        '#B45309',
      contrastText: brand.white,
    },
    success: {
      main:        '#10B981',
      light:       '#6EE7B7',
      dark:        '#047857',
      contrastText: brand.white,
    },
    info: {
      main:        '#3B82F6',
      light:       '#93C5FD',
      dark:        '#1D4ED8',
      contrastText: brand.white,
    },
  },

  // ── Typography ──────────────────────────────────────────────────────────────
  // Mirror the Tailwind font-family tokens: DM Sans (body) + Sora (headings)
  typography: {
    fontFamily: '"DM Sans", "Inter", "Helvetica Neue", Arial, sans-serif',

    // Heading override — Sora for display / section titles
    h1: { fontFamily: '"Sora", "DM Sans", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Sora", "DM Sans", sans-serif', fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontFamily: '"Sora", "DM Sans", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Sora", "DM Sans", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Sora", "DM Sans", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Sora", "DM Sans", sans-serif', fontWeight: 600 },

    // Body text — DM Sans
    body1: { fontSize: '0.875rem',  lineHeight: 1.6, fontWeight: 400 },  // 14px
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, fontWeight: 400 },  // 13px

    // Labels / captions
    caption:   { fontSize: '0.75rem',  fontWeight: 500, letterSpacing: '0.01em' },  // 12px
    overline:  { fontSize: '0.6875rem',fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' },
    subtitle1: { fontSize: '0.875rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8125rem',fontWeight: 600 },
    button:    { fontWeight: 700, textTransform: 'none', letterSpacing: '0.01em' },
  },

  // ── Shape ───────────────────────────────────────────────────────────────────
  shape: {
    borderRadius: 12,   // matches rounded-xl (12px) used throughout the app
  },

  // ── Spacing ─────────────────────────────────────────────────────────────────
  spacing: 4,   // 1 unit = 4 px — consistent with Tailwind's default 4px grid

  // ── Shadows ─────────────────────────────────────────────────────────────────
  shadows: [
    'none',
    '0 1px 3px rgba(25,28,30,0.06)',                                    // 1 — soft card
    '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',         // 2 — metric card
    '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',         // 3 — chart card
    '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',         // 4 — hover card
    '0px 20px 40px rgba(25,28,30,0.06)',                                 // 5 — soft elevation
    '0 4px 12px rgba(248,111,3,0.25), 0 8px 24px rgba(200,80,0,0.22)', // 6 — primary glow
    '0 2px 8px rgba(248,111,3,0.25)',                                    // 7 — subtle primary
    '0 8px 24px rgba(248,111,3,0.35), 0 14px 36px rgba(200,80,0,0.30)',// 8 — strong primary
    '0 1px 3px rgba(0,0,0,0.08)',                                        // 9
    '0 4px 16px rgba(0,0,0,0.08)',                                       // 10
    '0 8px 32px rgba(0,0,0,0.10)',                                       // 11
    '0 12px 40px rgba(0,0,0,0.12)',                                      // 12
    '0 16px 48px rgba(0,0,0,0.14)',                                      // 13
    '0 20px 60px rgba(0,0,0,0.16)',                                      // 14
    '0 24px 72px rgba(0,0,0,0.18)',                                      // 15
    '0 28px 80px rgba(0,0,0,0.20)',                                      // 16
    '0 32px 88px rgba(0,0,0,0.22)',                                      // 17
    '0 36px 96px rgba(0,0,0,0.24)',                                      // 18
    '0 40px 104px rgba(0,0,0,0.26)',                                     // 19
    '0 44px 112px rgba(0,0,0,0.28)',                                     // 20
    '0 48px 120px rgba(0,0,0,0.30)',                                     // 21
    '0 52px 128px rgba(0,0,0,0.32)',                                     // 22
    '0 56px 136px rgba(0,0,0,0.34)',                                     // 23
    '0 60px 144px rgba(0,0,0,0.36)',                                     // 24
  ],

  // ── Component overrides ─────────────────────────────────────────────────────
  components: {
    // ── Button ────────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontSize: '0.8125rem',
          fontWeight: 700,
          transition: 'all 0.18s ease',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brand.orange[400]} 0%, ${brand.orange[500]} 50%, ${brand.orange[600]} 100%)`,
          boxShadow: `0 2px 8px rgba(248,111,3, 0.28)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${brand.orange[500]} 0%, ${brand.orange[600]} 50%, ${brand.orange[700]} 100%)`,
            boxShadow: `0 4px 16px rgba(248,111,3, 0.40)`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: `0 2px 6px rgba(248,111,3, 0.22)`,
          },
        },
        outlinedPrimary: {
          borderColor: brand.orange[500],
          color: brand.orange[500],
          '&:hover': {
            backgroundColor: brand.orange[50],
            borderColor: brand.orange[600],
          },
        },
        textPrimary: {
          '&:hover': {
            backgroundColor: brand.orange[50],
          },
        },
        sizeSmall: {
          padding: '5px 14px',
          fontSize: '0.75rem',
          borderRadius: 8,
        },
        sizeLarge: {
          padding: '11px 28px',
          fontSize: '0.9375rem',
          borderRadius: 12,
        },
      },
    },

    // ── IconButton ────────────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.16s ease',
          '&:hover': {
            backgroundColor: brand.orange[50],
            color: brand.orange[500],
          },
        },
      },
    },

    // ── Card ──────────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
          },
        },
      },
    },

    // ── CardContent ───────────────────────────────────────────────────────────
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },

    // ── Paper ─────────────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: '#E2E8F0',
        },
      },
    },

    // ── TextField / Input ─────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: brand.grey[100],
          fontSize: '0.875rem',
          transition: 'box-shadow 0.16s ease',
          '& fieldset': {
            borderColor: '#E2E8F0',
          },
          '&:hover fieldset': {
            borderColor: brand.orange[300],
          },
          '&.Mui-focused': {
            backgroundColor: brand.white,
            boxShadow: `0 0 0 3px rgba(248,111,3,0.12)`,
          },
          '&.Mui-focused fieldset': {
            borderColor: brand.orange[500],
            borderWidth: '1.5px',
          },
        },
      },
    },

    // ── Select ────────────────────────────────────────────────────────────────
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },

    // ── Chip ──────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        colorPrimary: {
          backgroundColor: brand.orange[50],
          color: brand.orange[600],
          border: `1px solid ${brand.orange[100]}`,
        },
        filledPrimary: {
          backgroundColor: brand.orange[500],
          color: brand.white,
        },
      },
    },

    // ── Avatar ────────────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 800,
          fontSize: '0.6875rem',
        },
        colorDefault: {
          backgroundColor: brand.orange[100],
          color: brand.orange[600],
        },
      },
    },

    // ── LinearProgress ────────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 100,
          backgroundColor: '#E2E8F0',
          height: 6,
        },
        barColorPrimary: {
          background: `linear-gradient(90deg, ${brand.orange[400]}, ${brand.orange[500]})`,
          borderRadius: 100,
        },
      },
    },

    // ── CircularProgress ──────────────────────────────────────────────────────
    MuiCircularProgress: {
      defaultProps: {
        color: 'primary',
      },
    },

    // ── Tooltip ───────────────────────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E293B',
          color: brand.white,
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
          padding: '6px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
        },
        arrow: {
          color: '#1E293B',
        },
      },
    },

    // ── Badge ─────────────────────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 700,
          fontSize: '0.625rem',
        },
      },
    },

    // ── Divider ───────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E2E8F0',
        },
      },
    },

    // ── List / ListItem ───────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            backgroundColor: brand.orange[50],
            color: brand.orange[600],
            '&:hover': {
              backgroundColor: brand.orange[100],
            },
          },
          '&:hover': {
            backgroundColor: '#F8F9FA',
          },
        },
      },
    },

    // ── Tab ───────────────────────────────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          textTransform: 'none',
          minHeight: 40,
          '&.Mui-selected': {
            color: brand.orange[500],
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: brand.orange[500],
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    // ── Switch ────────────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: brand.orange[500],
            '& + .MuiSwitch-track': {
              backgroundColor: brand.orange[400],
              opacity: 1,
            },
          },
        },
        track: {
          borderRadius: 100,
          backgroundColor: '#CBD5E1',
          opacity: 1,
        },
        thumb: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
        },
      },
    },

    // ── Checkbox ──────────────────────────────────────────────────────────────
    MuiCheckbox: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: {
          color: '#CBD5E1',
          '&.Mui-checked': {
            color: brand.orange[500],
          },
        },
      },
    },

    // ── Radio ─────────────────────────────────────────────────────────────────
    MuiRadio: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: {
          color: '#CBD5E1',
          '&.Mui-checked': {
            color: brand.orange[500],
          },
        },
      },
    },

    // ── Snackbar / Alert ──────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        standardSuccess: {
          backgroundColor: '#ECFDF5',
          color: '#065F46',
          border: '1px solid #A7F3D0',
        },
        standardError: {
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA',
        },
        standardWarning: {
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          border: '1px solid #FDE68A',
        },
        standardInfo: {
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #BFDBFE',
        },
      },
    },

    // ── Dialog ────────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Sora", "DM Sans", sans-serif',
          fontWeight: 700,
          fontSize: '1.0625rem',
          padding: '20px 24px 12px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '12px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 20px',
          gap: 8,
        },
      },
    },

    // ── Table ─────────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#64748B',
            backgroundColor: '#F8F9FA',
            borderBottom: '2px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: brand.orange[50],
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          padding: '12px 16px',
          borderColor: '#F1F5F9',
        },
      },
    },

    // ── Breadcrumbs ───────────────────────────────────────────────────────────
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          fontWeight: 500,
        },
      },
    },

    // ── Autocomplete ──────────────────────────────────────────────────────────
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        },
        option: {
          fontSize: '0.8125rem',
          fontWeight: 500,
          '&[aria-selected="true"]': {
            backgroundColor: `${brand.orange[50]} !important`,
            color: brand.orange[600],
          },
          '&:hover': {
            backgroundColor: brand.orange[50],
          },
        },
      },
    },

    // ── Menu ──────────────────────────────────────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 6px',
          fontSize: '0.8125rem',
          fontWeight: 500,
          transition: 'all 0.14s ease',
          '&:hover': {
            backgroundColor: brand.orange[50],
            color: brand.orange[600],
          },
          '&.Mui-selected': {
            backgroundColor: brand.orange[50],
            color: brand.orange[600],
            fontWeight: 700,
            '&:hover': {
              backgroundColor: brand.orange[100],
            },
          },
        },
      },
    },

    // ── Skeleton ──────────────────────────────────────────────────────────────
    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        wave: {
          '&::after': {
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)`,
          },
        },
      },
    },

    // ── Accordion ─────────────────────────────────────────────────────────────
    MuiAccordion: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: '12px !important',
          border: '1px solid #E2E8F0',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.875rem',
          '&.Mui-expanded': {
            minHeight: 48,
            borderBottom: '1px solid #F1F5F9',
          },
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            color: brand.orange[500],
          },
        },
      },
    },

    // ── Pagination ────────────────────────────────────────────────────────────
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.8125rem',
          '&.Mui-selected': {
            backgroundColor: brand.orange[500],
            color: brand.white,
            '&:hover': {
              backgroundColor: brand.orange[600],
            },
          },
        },
      },
    },

    // ── Stepper ───────────────────────────────────────────────────────────────
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: brand.orange[500],
          },
          '&.Mui-completed': {
            color: brand.orange[600],
          },
        },
      },
    },
  },
});

export default muiTheme;
