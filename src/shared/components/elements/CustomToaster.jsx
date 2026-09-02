import { Toaster } from 'sonner';

/**
 * CustomToaster Component
 * Wraps Sonner Toaster with custom configurations and clean SVG icons.
 * Extracted from App.jsx to keep the entry file organized and readable.
 */
const CustomToaster = () => {
  return (
    <Toaster
      position="top-right"
      mobilePosition="top-center"
      closeButton
      duration={5000}
      gap={8}
      offset={16}
      expand={false}
      visibleToasts={5}
      containerAriaLabel="Notifications"
      style={{ zIndex: 9999 }}
      toastOptions={{
        unstyled: true,
        className: 'toast-root',
      }}
      icons={{
        success: (
          <span className="toast-icon toast-icon--success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </span>
        ),
        error: (
          <span className="toast-icon toast-icon--error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </span>
        ),
        warning: (
          <span className="toast-icon toast-icon--warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </span>
        ),
        info: (
          <span className="toast-icon toast-icon--info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
          </span>
        ),
        loading: (
          <span className="toast-icon toast-icon--loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'toast-spin 0.75s linear infinite'}}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          </span>
        ),
      }}
    />
  );
};

export default CustomToaster;
