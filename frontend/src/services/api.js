/**
 * API service for connecting frontend to backend
 * Centralized API calls with error handling
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:12000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
};

// ==================== MODELS API ====================

export const modelsAPI = {
  // Get all models
  getModels: async () => {
    const response = await api.get('/api/v1/models/');
    return response.data;
  },

  // Get specific model
  getModel: async (modelId) => {
    const response = await api.get(`/api/v1/models/${modelId}`);
    return response.data;
  },

  // Import custom model
  importModel: async (formData) => {
    const response = await api.post('/api/v1/models/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete model
  deleteModel: async (modelId) => {
    const response = await api.delete(`/api/v1/models/${modelId}`);
    return response.data;
  },

  // Get supported model types
  getSupportedTypes: async () => {
    const response = await api.get('/api/v1/models/types/supported');
    return response.data;
  },
};

// ==================== PROJECTS API ====================

export const projectsAPI = {
  // Get all projects
  getProjects: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/v1/projects/', {
      params: { skip, limit }
    });
    return response.data;
  },

  // Create new project
  createProject: async (projectData) => {
    const response = await api.post('/api/v1/projects/', projectData);
    return response.data;
  },

  // Get specific project
  getProject: async (projectId) => {
    const response = await api.get(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  // Update project
  updateProject: async (projectId, updateData) => {
    const response = await api.put(`/api/v1/projects/${projectId}`, updateData);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await api.delete(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  // Get project datasets
  getProjectDatasets: async (projectId) => {
    const response = await api.get(`/api/v1/projects/${projectId}/datasets`);
    return response.data;
  },

  // Get project statistics
  getProjectStats: async (projectId) => {
    const response = await api.get(`/api/v1/projects/${projectId}/stats`);
    return response.data;
  },

  // Duplicate project with all datasets, images, and annotations
  duplicateProject: async (projectId) => {
    const response = await api.post(`/api/v1/projects/${projectId}/duplicate`);
    return response.data;
  },

  // Get project management data (datasets organized by status)
  getProjectManagementData: async (projectId) => {
    const response = await api.get(`/api/v1/projects/${projectId}/management`);
    return response.data;
  },

  // Assign dataset to annotating
  assignDatasetToAnnotating: async (projectId, datasetId) => {
    const response = await api.put(`/api/v1/projects/${projectId}/datasets/${datasetId}/assign`);
    return response.data;
  },

  // Rename dataset
  renameDataset: async (projectId, datasetId, newName) => {
    const response = await api.put(`/api/v1/projects/${projectId}/datasets/${datasetId}/rename`, {
      new_name: newName
    });
    return response.data;
  },

  // Delete dataset
  deleteProjectDataset: async (projectId, datasetId) => {
    const response = await api.delete(`/api/v1/projects/${projectId}/datasets/${datasetId}`);
    return response.data;
  },

  // Move dataset to unassigned
  moveDatasetToUnassigned: async (projectId, datasetId) => {
    const response = await api.put(`/api/v1/projects/${projectId}/datasets/${datasetId}/move-to-unassigned`);
    return response.data;
  },

  // Move dataset to completed/dataset section
  moveDatasetToCompleted: async (projectId, datasetId) => {
    const response = await api.put(`/api/v1/projects/${projectId}/datasets/${datasetId}/move-to-completed`);
    return response.data;
  },
};

// ==================== DATASETS API ====================

export const datasetsAPI = {
  // Get all datasets
  getDatasets: async (projectId = null, skip = 0, limit = 100) => {
    const params = { skip, limit };
    if (projectId) params.project_id = projectId;
    
    const response = await api.get('/api/v1/datasets/', { params });
    return response.data;
  },

  // Create new dataset
  createDataset: async (datasetData) => {
    const response = await api.post('/api/v1/datasets/', datasetData);
    return response.data;
  },

  // Upload dataset with files (create dataset + upload files)
  uploadDataset: async (formData) => {
    const response = await api.post('/api/v1/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get specific dataset
  getDataset: async (datasetId) => {
    const response = await api.get(`/api/v1/datasets/${datasetId}`);
    return response.data;
  },

  // Upload images to dataset
  uploadImages: async (datasetId, files, autoLabel = true) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('auto_label', autoLabel);

    const response = await api.post(`/api/v1/datasets/${datasetId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Start auto-labeling
  startAutoLabeling: async (datasetId, autoLabelData) => {
    const response = await api.post(`/api/v1/datasets/${datasetId}/auto-label`, autoLabelData);
    return response.data;
  },

  // Get dataset images
  getDatasetImages: async (datasetId, skip = 0, limit = 50, labeledOnly = null) => {
    const params = { skip, limit };
    if (labeledOnly !== null) params.labeled_only = labeledOnly;

    const response = await api.get(`/api/v1/datasets/${datasetId}/images`, { params });
    return response.data;
  },



  // Delete dataset
  deleteDataset: async (datasetId) => {
    const response = await api.delete(`/api/v1/datasets/${datasetId}`);
    return response.data;
  },

  // Update dataset
  updateDataset: async (datasetId, updateData) => {
    const response = await api.put(`/api/v1/datasets/${datasetId}`, updateData);
    return response.data;
  },

  // Get dataset statistics
  getDatasetStats: async (datasetId) => {
    const response = await api.get(`/api/v1/datasets/${datasetId}/stats`);
    return response.data;
  },
};

// ==================== SMART SEGMENTATION API ====================

export const segmentationAPI = {
  // AI-powered segmentation
  segment: async (imageData, point, modelType = 'hybrid') => {
    const response = await api.post('/api/segment', {
      image_data: imageData,
      point: point,
      model_type: modelType
    });
    return response.data;
  },

  // Batch segmentation
  batchSegment: async (imageData, points, modelType = 'hybrid') => {
    const response = await api.post('/api/segment/batch', {
      image_data: imageData,
      points: points,
      model_type: modelType
    });
    return response.data;
  },

  // Get available models
  getModels: async () => {
    const response = await api.get('/api/segment/models');
    return response.data;
  },
};

// ==================== ANNOTATIONS API ====================

export const annotationsAPI = {
  // Get annotations for an image
  getAnnotations: async (imageId) => {
    const response = await api.get(`/api/v1/images/${imageId}/annotations`);
    return response.data;
  },

  // Save annotations for an image
  saveAnnotations: async (imageId, annotations) => {
    const response = await api.post(`/api/v1/images/${imageId}/annotations`, {
      annotations: annotations
    });
    return response.data;
  },

  // Update specific annotation
  updateAnnotation: async (imageId, annotationId, annotationData) => {
    const response = await api.put(`/api/v1/images/${imageId}/annotations/${annotationId}`, annotationData);
    return response.data;
  },

  // Delete annotation
  deleteAnnotation: async (imageId, annotationId) => {
    const response = await api.delete(`/api/v1/images/${imageId}/annotations/${annotationId}`);
    return response.data;
  },

  // Export annotations
  exportAnnotations: async (datasetId, format = 'json') => {
    const response = await api.get(`/api/v1/datasets/${datasetId}/export`, {
      params: { format }
    });
    return response.data;
  },
};

// Error handler for API calls
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || 'Server error';
    return {
      type: 'server_error',
      message,
      status: error.response.status,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      type: 'network_error',
      message: 'Network error - please check your connection',
    };
  } else {
    // Something else happened
    return {
      type: 'unknown_error',
      message: error.message || 'An unknown error occurred',
    };
  }
};

// Check if backend is available
export const checkBackendHealth = async () => {
  try {
    await healthCheck();
    return { available: true };
  } catch (error) {
    return { 
      available: false, 
      error: handleAPIError(error) 
    };
  }
};

export default api;