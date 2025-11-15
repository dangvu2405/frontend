/**
 * Image utility functions for handling image URLs
 * Supports both local images and CDN/external image hosting
 */

// CDN Base URL - Set this to your image hosting service
// Examples:
// - Cloudinary: https://res.cloudinary.com/your-cloud-name/image/upload
// - ImgBB: https://i.ibb.co
// - AWS S3: https://your-bucket.s3.amazonaws.com
// - Or leave empty to use local images
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || '';

/**
 * Get optimized image URL
 * If CDN is configured, returns CDN URL with optimization params
 * Otherwise returns local path
 */
export const getImageUrl = (
  imagePath: string | undefined | null,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }
): string => {
  if (!imagePath) {
    return 'https://placehold.co/300x300/E5E5EA/000?text=No+Image';
  }

  // If already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If CDN is configured, use CDN with optimization
  if (CDN_BASE_URL) {
    const params: string[] = [];
    
    if (options?.width) params.push(`w_${options.width}`);
    if (options?.height) params.push(`h_${options.height}`);
    if (options?.quality) params.push(`q_${options.quality}`);
    if (options?.format) params.push(`f_${options.format}`);
    
    // Remove leading slash from imagePath if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Build CDN URL
    const cdnUrl = `${CDN_BASE_URL}/${cleanPath}`;
    const paramString = params.length > 0 ? `/${params.join(',')}` : '';
    
    return `${cdnUrl}${paramString}`;
  }

  // Local image - ensure leading slash
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
};

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
  });
};

/**
 * Get optimized product image URL (medium size for product cards)
 */
export const getProductImageUrl = (imagePath: string | undefined | null): string => {
  return getImageUrl(imagePath, {
    width: 600,
    height: 600,
    quality: 85,
    format: 'auto',
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
  });
};

