/**
 * Image utility functions for handling image URLs
 * Supports both local images and Cloudinary CDN
 */

// Parse Cloudinary connection string và lấy cloud name
const parseCloudinaryConnectionString = (connectionString: string): string => {
  // Format: icloudinary://{api_key}:{api_secret}@{cloud_name}
  const match = connectionString.match(/@([^@]+)$/);
  if (match && match[1]) {
    return match[1];
  }
  return '';
};

// Cloudinary Configuration
// Ưu tiên: VITE_CLOUDINARY_CLOUD_NAME > parse từ VITE_CLOUDINARY_URL > empty
const cloudinaryConnectionString = import.meta.env.VITE_CLOUDINARY_URL || '';
const CLOUDINARY_CLOUD_NAME = 
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 
  (cloudinaryConnectionString ? parseCloudinaryConnectionString(cloudinaryConnectionString) : '') ||
  '';

const CLOUDINARY_BASE_URL = CLOUDINARY_CLOUD_NAME 
  ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : '';

/**
 * Get optimized image URL using Cloudinary
 * If Cloudinary is configured, returns Cloudinary URL with optimization params
 * Otherwise returns local path
 */
export const getImageUrl = (
  imagePath: string | undefined | null,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  }
): string => {
  if (!imagePath) {
    return 'https://placehold.co/300x300/E5E5EA/000?text=No+Image';
  }

  // If already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // If it's already a Cloudinary URL, apply transformations if needed
    if (imagePath.includes('cloudinary.com') && options) {
      return applyCloudinaryTransformations(imagePath, options);
    }
    return imagePath;
  }

  // If Cloudinary is configured, use Cloudinary with optimization
  if (CLOUDINARY_BASE_URL) {
    const transformations: string[] = [];
    
    // Crop mode (default: fill for product images)
    const crop = options?.crop || 'fill';
    transformations.push(crop);
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) transformations.push(`q_${options.quality || 'auto'}`);
    if (options?.format) {
      transformations.push(`f_${options.format === 'auto' ? 'auto' : options.format}`);
    } else {
      // Auto format for better compression
      transformations.push('f_auto');
    }
    
    // Remove leading slash from imagePath if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Build Cloudinary URL: base_url/transformations/image_path
    const transformString = transformations.join(',');
    return `${CLOUDINARY_BASE_URL}/${transformString}/${cleanPath}`;
  }

  // Local image - ensure leading slash
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
};

/**
 * Apply transformations to existing Cloudinary URL
 */
function applyCloudinaryTransformations(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  }
): string {
  // Extract the path after /upload/
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  
  const baseUrl = url.substring(0, uploadIndex + 8); // Include '/upload/'
  const imagePath = url.substring(uploadIndex + 8);
  
  const transformations: string[] = [];
  const crop = options.crop || 'fill';
  transformations.push(crop);
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality || 'auto'}`);
  if (options.format) {
    transformations.push(`f_${options.format === 'auto' ? 'auto' : options.format}`);
  }
  
  const transformString = transformations.join(',');
  return `${baseUrl}${transformString}/${imagePath}`;
}

/**
 * Get responsive image srcset for different screen sizes
 */
export const getResponsiveImageSrcSet = (
  imagePath: string | undefined | null,
  sizes: number[] = [400, 800, 1200, 1600]
): string => {
  if (!imagePath) return '';
  
  return sizes
    .map((size) => {
      const url = getImageUrl(imagePath, { width: size, quality: 80, format: 'auto' });
      return `${url} ${size}w`;
    })
    .join(', ');
};

/**
 * Get optimized thumbnail URL (small image for lists)
 */
export const getThumbnailUrl = (imagePath: string | undefined | null): string => {
  return getImageUrl(imagePath, {
    width: 300,
    height: 300,
    quality: 75,
    format: 'auto',
    crop: 'fill',
  });
};

/**
 * Get simple Cloudinary URL without transformations (for testing)
 * Use this when images return 404 with transformations
 */
export const getSimpleCloudinaryUrl = (imageName: string | undefined | null): string => {
  if (!imageName) {
    return 'https://placehold.co/300x300/E5E5EA/000?text=No+Image';
  }
  
  // If already a full URL, return as is
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    return imageName;
  }
  
  // If Cloudinary is configured, build simple URL
  if (CLOUDINARY_BASE_URL) {
    const cleanImageName = imageName.startsWith('/') ? imageName.slice(1) : imageName;
    return `${CLOUDINARY_BASE_URL}/${cleanImageName}`;
  }
  
  return 'https://placehold.co/300x300/E5E5EA/000?text=No+Image';
};

/**
 * Get optimized product image URL (medium size for product cards)
 * Set useSimpleUrl=true to use simple URL without transformations (for debugging 404 errors)
 */
export const getProductImageUrl = (
  imagePath: string | undefined | null, 
  useSimpleUrl: boolean = false
): string => {
  // Use simple URL if requested (for debugging 404 errors)
  if (useSimpleUrl) {
    return getSimpleCloudinaryUrl(imagePath);
  }
  
  return getImageUrl(imagePath, {
    width: 600,
    height: 600,
    quality: 85,
    format: 'auto',
    crop: 'fill',
  });
};

/**
 * Get optimized detail image URL (large size for product detail pages)
 */
export const getDetailImageUrl = (imagePath: string | undefined | null): string => {
  return getImageUrl(imagePath, {
    width: 1200,
    height: 1200,
    quality: 90,
    format: 'auto',
    crop: 'fit', // Fit to maintain aspect ratio for detail images
  });
};

/**
 * Get Cloudinary video URL
 * @param videoPath - Video public ID or path (e.g., "videos/backgroud" or "videos/backgroud.mp4")
 * @param options - Video transformation options
 * @returns Cloudinary video URL
 */
export const getVideoUrl = (
  videoPath: string | undefined | null,
  options?: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'mp4' | 'webm';
  }
): string => {
  if (!videoPath) {
    return '';
  }

  // If already a full URL (http/https), return as is
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    return videoPath;
  }

  // If Cloudinary is configured, use Cloudinary
  if (CLOUDINARY_CLOUD_NAME) {
    const transformations: string[] = [];
    
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) {
      transformations.push(`q_${options.quality === 'auto' ? 'auto' : options.quality}`);
    }
    if (options?.format) {
      transformations.push(`f_${options.format === 'auto' ? 'auto' : options.format}`);
    }
    
    // Remove leading slash and extension from videoPath
    let cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
    // Remove .mp4 extension if present (Cloudinary handles format automatically)
    cleanPath = cleanPath.replace(/\.(mp4|webm|mov)$/i, '');
    
    // Build Cloudinary video URL
    const transformString = transformations.length > 0 
      ? `/${transformations.join(',')}` 
      : '';
    
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload${transformString}/${cleanPath}`;
  }

  // Local video - ensure leading slash
  return videoPath.startsWith('/') ? videoPath : `/${videoPath}`;
};

