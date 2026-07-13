import { toast as sonnerToast } from 'sonner';

/**
 * Enhanced Toast Utility
 * Provides industry-level toast notifications with consistent styling and animations
 */

const defaultOptions = {
  duration: 5000,
  position: 'top-right',
  dismissible: true,
  closeButton: true,
};

export const toast = {
  /**
   * Success Toast
   * @param {string} message - The success message
   * @param {object} options - Additional options
   */
  success: (message, options = {}) => {
    return sonnerToast.success(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-success',
      description: options.description,
      action: options.action,
    });
  },

  /**
   * Error Toast
   * @param {string} message - The error message
   * @param {object} options - Additional options
   */
  error: (message, options = {}) => {
    return sonnerToast.error(message, {
      ...defaultOptions,
      duration: 7000, // Longer duration for errors
      ...options,
      className: 'toast-error',
      description: options.description,
      action: options.action,
    });
  },

  /**
   * Warning Toast
   * @param {string} message - The warning message
   * @param {object} options - Additional options
   */
  warning: (message, options = {}) => {
    return sonnerToast.warning(message, {
      ...defaultOptions,
      duration: 6000,
      ...options,
      className: 'toast-warning',
      description: options.description,
      action: options.action,
    });
  },

  /**
   * Info Toast
   * @param {string} message - The info message
   * @param {object} options - Additional options
   */
  info: (message, options = {}) => {
    return sonnerToast.info(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-info',
      description: options.description,
      action: options.action,
    });
  },

  /**
   * Loading Toast
   * @param {string} message - The loading message
   * @param {object} options - Additional options
   */
  loading: (message, options = {}) => {
    return sonnerToast.loading(message, {
      ...defaultOptions,
      duration: Infinity, // Loading toasts don't auto-dismiss
      ...options,
      className: 'toast-loading',
      description: options.description,
    });
  },

  /**
   * Custom Toast
   * @param {string} message - The message
   * @param {object} options - Additional options
   */
  custom: (message, options = {}) => {
    return sonnerToast(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-custom',
    });
  },

  /**
   * Promise Toast
   * Shows loading, then success/error based on promise result
   * @param {Promise} promise - The promise to track
   * @param {object} messages - Messages for different states
   */
  promise: (promise, messages = {}) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
      ...defaultOptions,
    });
  },

  /**
   * Dismiss a specific toast
   * @param {string} toastId - The toast ID to dismiss
   */
  dismiss: (toastId) => {
    return sonnerToast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    return sonnerToast.dismiss();
  },
};

// Enhanced toast methods with better UX
export const enhancedToast = {
  /**
   * Operation Success Toast
   * @param {string} operation - The operation that succeeded
   * @param {string} entity - The entity that was affected
   */
  operationSuccess: (operation, entity) => {
    return toast.success(`${entity} ${operation} successfully`, {
      description: `The ${entity.toLowerCase()} has been ${operation.toLowerCase()} and is now available.`,
    });
  },

  /**
   * Operation Error Toast
   * @param {string} operation - The operation that failed
   * @param {string} entity - The entity that was affected
   * @param {string} reason - The reason for failure
   */
  operationError: (operation, entity, reason) => {
    return toast.error(`Failed to ${operation.toLowerCase()} ${entity.toLowerCase()}`, {
      description: reason || 'Please try again or contact support if the problem persists.',
    });
  },

  /**
   * Validation Error Toast
   * @param {string} message - The validation error message
   */
  validationError: (message) => {
    return toast.warning('Validation Error', {
      description: message,
    });
  },

  /**
   * Network Error Toast
   */
  networkError: () => {
    return toast.error('Connection Error', {
      description: 'Unable to connect to the server. Please check your internet connection.',
      action: {
        label: 'Retry',
        onClick: () => window.location.reload(),
      },
    });
  },

  /**
   * Permission Denied Toast
   * @param {string} customReason - Optional custom reason text to display
   */
  permissionDenied: (customReason) => {
    return toast.warning('Access Denied', {
      description: customReason || 'You do not have permission to perform this action.',
    });
  },

  /**
   * Save Progress Toast
   * @param {string} entity - The entity being saved
   */
  saveProgress: (entity) => {
    return toast.loading(`Saving ${entity.toLowerCase()}...`, {
      description: 'Please wait while we process your request.',
    });
  },

  /**
   * Delete Confirmation Toast
   * @param {string} entity - The entity to delete
   * @param {function} onConfirm - Callback when confirmed
   */
  deleteConfirmation: (entity, onConfirm) => {
    return toast.warning(`Delete ${entity}?`, {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: onConfirm,
      },
      duration: 10000,
    });
  },
};

export default toast;