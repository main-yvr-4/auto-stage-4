// Error handling utility for API responses
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    return {
      status,
      message: data?.detail || data?.message || `Server error (${status})`,
      data
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error - please check your connection',
      data: null
    };
  } else {
    // Something else happened
    return {
      status: -1,
      message: error.message || 'An unexpected error occurred',
      data: null
    };
  }
};

export const getErrorMessage = (error) => {
  const errorInfo = handleAPIError(error);
  return errorInfo.message;
};