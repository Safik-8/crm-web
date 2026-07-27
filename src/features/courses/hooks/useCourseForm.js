// src/features/courses/hooks/useCourseForm.js

import { useState, useEffect, useCallback } from 'react';
import { useCreateCourseMutation, useUpdateCourseMutation } from './useCourses';

const initialFormState = {
  name: '',
  code: '',
  description: '',
  category: '',
  customCategory: '',
  parentCategory: '',
  price: '',
  duration: '',
  status: 'ACTIVE',
  companyId: ''
};

/**
 * Custom hook to manage form state and validation logic for Course onboarding/updating.
 * Separates UI logic from form validation and backend mutation calls.
 *
 * @param {function} onSuccess - Callback trigger on successful form submission
 * @param {object|null} initialValues - Course data if editing, or null if creating
 * @returns {object} Form state fields, errors, loading flags, and handlers
 */
export const useCourseForm = (onSuccess, initialValues = null, isOpen = false) => {
  const [values, setValues] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const createCourseMutation = useCreateCourseMutation();
  const updateCourseMutation = useUpdateCourseMutation();

  const isEditMode = !!initialValues && !!initialValues.id;
  const isLoading = createCourseMutation.isPending || updateCourseMutation.isPending;

  // Sync initial values when editing or when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialValues) {
      setValues({
        name: initialValues.name || '',
        code: initialValues.code || '',
        description: initialValues.description || '',
        category: initialValues.category || '',
        customCategory: '',
        parentCategory: initialValues.parentCategory || '',
        price: initialValues.price !== undefined ? String(initialValues.price) : '',
        duration: initialValues.duration ? (initialValues.duration.match(/\d+/) ? initialValues.duration.match(/\d+/)[0] : '') : '',
        status: initialValues.status || 'ACTIVE',
        companyId: initialValues.companyId || ''
      });
    } else {
      setValues(initialFormState);
    }
    setErrors({});
  }, [initialValues, isOpen]);

  /**
   * Field update change handler
   */
  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: null };
      }
      return prev;
    });
  }, []);

  /**
   * Performs form field validation
   *
   * @returns {boolean} Whether the form fields are valid
   */
  const validate = () => {
    const tempErrors = {};

    if (!values.name?.trim()) tempErrors.name = 'Course name is required';
    
    // Validate companyId is selected (creation only)
    if (!isEditMode && !values.companyId) {
      tempErrors.companyId = 'Company assignment is required';
    }

    // Category validation
    if (!values.category?.trim()) {
      tempErrors.category = 'Category is required';
    } else if (values.category === 'OTHER' && !values.customCategory?.trim()) {
      tempErrors.customCategory = 'Custom category name is required';
    }

    if (values.price === undefined || values.price === '') {
      tempErrors.price = 'Price is required';
    } else {
      const priceNum = Number(values.price);
      if (isNaN(priceNum)) {
        tempErrors.price = 'Price must be a valid number';
      } else if (priceNum < 0) {
        tempErrors.price = 'Price cannot be negative';
      }
    }

    if (values.duration !== undefined && values.duration !== null && values.duration !== '') {
      const durNum = Number(values.duration);
      if (isNaN(durNum) || !Number.isInteger(durNum) || durNum <= 0) {
        tempErrors.duration = 'Duration must be a positive integer';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  /**
   * Submits form payload to backend mutations
   */
  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (!validate()) return;

    // Resolve category name (use custom input if "Other" was selected)
    const finalCategory = values.category === 'OTHER' 
      ? values.customCategory.trim() 
      : values.category.trim();

    // Build standard payload
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      category: finalCategory,
      parentCategory: values.parentCategory?.trim() || null,
      price: Number(values.price),
      duration: values.duration ? `${values.duration} months` : null,
      status: values.status,
      companyId: Number(values.companyId)
    };

    if (isEditMode) {
      // Edit mode excludes code (immutable)
      updateCourseMutation.mutate(
        { id: initialValues.id, data: payload },
        {
          onSuccess: () => {
            setValues(initialFormState);
            setErrors({});
            onSuccess();
          },
          onError: (error) => {
            // Map validation errors from API into local form error state
            if (error?.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
              const apiErrors = {};
              error.details.forEach(detail => {
                apiErrors[detail.field] = detail.message;
              });
              setErrors(apiErrors);
            }
          }
        }
      );
    } else {
      // Create mode code is auto-generated by the backend server
      createCourseMutation.mutate(payload, {
        onSuccess: () => {
          setValues(initialFormState);
          setErrors({});
          onSuccess();
        },
        onError: (error) => {
          // Map validation errors or conflicts from API
          if (error?.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
            const apiErrors = {};
            error.details.forEach(detail => {
              apiErrors[detail.field] = detail.message;
            });
            setErrors(apiErrors);
          } else if (error?.code === 'CONFLICT' && error?.details?.field === 'code') {
            setErrors({ code: error.message });
          }
        }
      });
    }
  };

  return {
    values,
    errors,
    isLoading,
    isEditMode,
    handleChange,
    handleSubmit
  };
};
