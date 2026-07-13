// src/features/courses/hooks/useCourses.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { toast } from '../../../shared/utils/toast';

export const COURSE_KEYS = {
  all: ['courses'],
  lists: () => [...COURSE_KEYS.all, 'list'],
  list: (params) => [...COURSE_KEYS.lists(), params],
  details: () => [...COURSE_KEYS.all, 'detail'],
  detail: (id) => [...COURSE_KEYS.details(), id]
};

export const useCoursesQuery = (params) => {
  return useQuery({
    queryKey: COURSE_KEYS.list(params),
    queryFn: async () => {
      const response = await courseService.getCourses(params);
      // Ensure we resolve to standard data structure for hooks consumption
      return response.data || { courses: [], pagination: {} };
    },
    placeholderData: (prev) => prev, // Smooth pagination transition
    staleTime: 5000
  });
};

export const useCourseCategoriesQuery = (companyId) => {
  return useQuery({
    queryKey: ['course-categories', companyId],
    queryFn: async () => {
      const response = await courseService.getCoursesCategories({ companyId });
      return response.data?.categories || [];
    },
    enabled: !!companyId
  });
};


export const useCourseQuery = (id) => {
  return useQuery({
    queryKey: COURSE_KEYS.detail(id),
    queryFn: async () => {
      const response = await courseService.getCourseById(id);
      return response.data?.course || null;
    },
    enabled: !!id
  });
};

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courseService.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.lists() });
      toast.success('Course created successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to create course';
        toast.error(msg);
      }
    }
  });
};

export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => courseService.updateCourse(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.detail(variables.id) });
      toast.success('Course details updated successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to update course details';
        toast.error(msg);
      }
    }
  });
};

export const useToggleCourseStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nextStatus }) => courseService.toggleStatus(id, nextStatus),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.detail(variables.id) });
      toast.success(`Course successfully ${variables.nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to toggle status';
        toast.error(msg);
      }
    }
  });
};

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: courseService.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_KEYS.lists() });
      toast.success('Course deleted successfully');
    },
    onError: (error) => {
      if (error?.statusCode !== 403 && error?.code !== 'FORBIDDEN' && error?.code !== 'PERMISSION_DENIED') {
        const msg = error?.message || 'Failed to delete course';
        toast.error(msg);
      }
    }
  });
};
