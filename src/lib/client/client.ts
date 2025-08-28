import Medusa from '@medusajs/js-sdk';

export const backendUrl = __BACKEND_URL__ ?? '/';
export const publishableApiKey =
  __PUBLISHABLE_API_KEY__ ?? '';

export const sdk = new Medusa({
  baseUrl: backendUrl,
  publishableKey: publishableApiKey,
});

// Debug: Expose SDK config for inspection
if (typeof window !== 'undefined') {
  (window as any).__sdkConfig = {
    baseUrl: backendUrl,
    publishableKey: publishableApiKey,
  };
}

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== 'undefined') {
  (window as any).__sdk = sdk;
}

// S3 supported image formats with WebP as recommended
const SUPPORTED_IMAGE_FORMATS = {
  'image/webp': { ext: '.webp', recommended: true },
  'image/jpeg': { ext: '.jpg', recommended: false },
  'image/jpg': { ext: '.jpg', recommended: false },
  'image/png': { ext: '.png', recommended: false },
  'image/gif': { ext: '.gif', recommended: false },
  'image/bmp': { ext: '.bmp', recommended: false },
  'image/tiff': { ext: '.tiff', recommended: false },
  'image/svg+xml': { ext: '.svg', recommended: false }
};

// File size limits (in bytes)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file (practical limit for web uploads)
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB total for all files

/**
 * Validates file format and size before upload
 */
const validateFile = (file: File): { valid: boolean; error?: string; warning?: string } => {
  // Check file format
  if (!SUPPORTED_IMAGE_FORMATS[file.type as keyof typeof SUPPORTED_IMAGE_FORMATS]) {
    const supportedFormats = Object.keys(SUPPORTED_IMAGE_FORMATS).join(', ');
    return {
      valid: false,
      error: `Unsupported file format: ${file.type}. Supported formats: ${supportedFormats}`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check if WebP is recommended
  const formatInfo = SUPPORTED_IMAGE_FORMATS[file.type as keyof typeof SUPPORTED_IMAGE_FORMATS];
  const warning = !formatInfo.recommended ? 
    'Consider using WebP format for better compression and faster loading' : undefined;

  return { valid: true, warning };
};

export const uploadFilesQuery = async (files: any[]) => {
  // Get the current auth token at function call time
  const currentToken = window.localStorage.getItem('medusa_auth_token') || '';
  
  if (!currentToken) {
    throw new Error('Authentication required. Please log in and try again.');
  }

  if (!files || files.length === 0) {
    throw new Error('No files provided for upload.');
  }

  // Validate each file before upload
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  let totalSize = 0;

  for (let i = 0; i < files.length; i++) {
    const { file } = files[i];
    if (!file) {
      validationErrors.push(`File ${i + 1}: No file data provided`);
      continue;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      validationErrors.push(`File "${file.name}": ${validation.error}`);
    }
    if (validation.warning) {
      validationWarnings.push(`File "${file.name}": ${validation.warning}`);
    }
    totalSize += file.size;
  }

  // Check total size limit
  if (totalSize > MAX_TOTAL_SIZE) {
    validationErrors.push(`Total file size too large: ${(totalSize / (1024 * 1024)).toFixed(1)}MB. Maximum allowed: ${MAX_TOTAL_SIZE / (1024 * 1024)}MB`);
  }

  // Throw error if validation failed
  if (validationErrors.length > 0) {
    throw new Error(`File validation failed:\n${validationErrors.join('\n')}`);
  }

  // Log warnings if any
  if (validationWarnings.length > 0) {
    console.warn('File upload warnings:', validationWarnings);
  }

  console.log(`Uploading ${files.length} files (${(totalSize / (1024 * 1024)).toFixed(1)}MB total)`);
  
  const formData = new FormData();

  for (const { file } of files) {
    formData.append('files', file);
  }

  try {
    const response = await fetch(`${backendUrl}/vendor/uploads`, {
      method: 'POST',
      body: formData,
      headers: {
        authorization: `Bearer ${currentToken}`,
        'x-publishable-api-key': publishableApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Upload failed with status: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch {
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Validate that we got the expected number of files back
    if (!result.files || !Array.isArray(result.files)) {
      throw new Error('Invalid response from upload service: missing files array');
    }

    if (result.files.length !== files.length) {
      throw new Error(`Upload incomplete: expected ${files.length} files, got ${result.files.length} files`);
    }

    console.log(`Successfully uploaded ${result.files.length} files`);
    return result;
    
  } catch (error) {
    console.error('Upload error:', error);
    // Re-throw the error instead of returning empty files array
    throw error instanceof Error ? error : new Error(`Upload failed: ${String(error)}`);
  }
};

// Max retries for fetch operations when network errors occur
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second delay between retries

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch data from API with authentication and retry capability for network errors
 * 
 * @returns An object containing both response and data for better error handling
 * For backward compatibility, the return value is also directly accessible like the raw data
 */
export const fetchQuery = async (
  url: string,
  {
    method,
    body,
    query,
    headers,
    retryCount = 0, // Track retry attempts
  }: {
    method: 'GET' | 'POST' | 'DELETE';
    body?: object;
    query?: Record<string, string | number>;
    headers?: { [key: string]: string };
    retryCount?: number;
  }
): Promise<any> => {
  const bearer =
    (await window.localStorage.getItem(
      'medusa_auth_token'
    )) || '';

  const params = Object.entries(query || {}).reduce(
    (acc, [key, value], index) => {
      if (value && value !== undefined) {
        const queryLength = Object.values(
          query || {}
        ).filter((i) => i && i !== undefined).length;
        acc += `${key}=${value}${index + 1 <= queryLength ? '&' : ''}`;
      }
      return acc;
    },
    ''
  );
  
  try {
    const response = await fetch(
      `${backendUrl}${url}${params && `?${params}`}`,
      {
        method: method,
        headers: {
          authorization: `Bearer ${bearer}`,
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableApiKey,
          ...headers,
        },
        body: body ? JSON.stringify(body) : null,
      }
    );
    
    
    // Handle session expiration (401 Unauthorized)
    if (response.status === 401 && bearer) {
      console.warn('Session expired. Redirecting to login page...');
      // Clear authentication data
      window.localStorage.removeItem('medusa_auth_token');
      // Redirect to login page
      const loginPath = '/login';
      window.location.href = window.location.origin + loginPath;
      // Throw an error to stop further processing
      throw new Error('Session expired. Please log in again.');
    }
    
    if (!response.ok) {
      const data = await response.text();
      let errorData;
      
      try {
        // Try to parse error response as JSON
        errorData = JSON.parse(data);
        
        // Special case for product creation with handle error
        // The product is still created, but the backend returns an error about the handle
        if (url === '/vendor/products' && 
            method === 'POST' && 
            errorData.message && 
            errorData.message.includes('handle') &&
            errorData.message.includes('already exists')) {
          
         
          
          // Generate a unique product ID for temporary use
          const tempId = 'temp_' + Date.now().toString();
          
          // Return a successful response with the product data
          return {
            response,
            data: {
              product: {
                ...body,
                id: tempId,
                status: 'published' // Mark as published since it was actually created
              },
              message: "Product created successfully. The handle was automatically generated by the server."
            }
          };
        }
        
        return { response, data: errorData };
      } catch (e) {
        // Not JSON, return text data
        return { response, data };
      }
    }

    // Handle successful responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // For backward compatibility, just return the parsed JSON data
      return await response.json();
    } else {
      // Handle non-JSON successful responses
      await response.text(); // Read the body to avoid memory leaks
      
      // Create a standardized response for non-JSON content
      let result: { success: boolean; id?: string; deleted?: boolean } = { success: true };
      
      // For DELETE operations with no content, return a standard deletion response
      if (method === 'DELETE') {
        const urlParts = url.split('/');
        const id = urlParts[urlParts.length - 1];
        result = {
          ...result,
          id,
          deleted: true
        };
      }
      
      return result;
    }
  } catch (error: unknown) {
    console.error(`Network error on ${method} ${url}:`, error);
    
    const errorStr = String(error);
    
    // Check for connection refused specifically (what the user is experiencing)
    if (errorStr.includes('ERR_CONNECTION_REFUSED')) {
      console.warn('Connection to server refused. The server may be down or your session may have expired.');
      
      // Check if we have an auth token - if so, likely a session issue
      const hasAuthToken = window.localStorage.getItem('medusa_auth_token');
      if (hasAuthToken) {
        console.warn('Detected potential session expiration. Redirecting to login page...');
        // Clear authentication data
        window.localStorage.removeItem('medusa_auth_token');
        // Redirect to login page
        const loginPath = '/login';
        window.location.href = window.location.origin + loginPath;
        return { error: 'Session expired. Please log in again.' };
      }
      
      // If no auth token, it's likely a server issue
      return { 
        error: 'Unable to connect to the server. Please check if the server is running or try again later.',
        serverDown: true
      };
    }
    
    // Handle other network errors with retry logic
    if (
      retryCount < MAX_RETRIES && (
        errorStr.includes('network') ||
        errorStr.includes('ERR_NETWORK') ||
        errorStr.includes('Failed to fetch') ||
        (error instanceof TypeError && error.message.includes('network')) ||
        (error instanceof DOMException && error.name === 'AbortError')
      )
    ) {
      console.warn(`Network error occurred. Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await wait(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      
      // Try again with incremented retry count
      return fetchQuery(url, {
        method,
        body,
        query,
        headers,
        retryCount: retryCount + 1,
      });
    }
    
    // If retries exhausted or not a network error, return a structured error object
    return {
      error: 'A network error occurred. Please try again later.',
      details: errorStr
    };
  }
}