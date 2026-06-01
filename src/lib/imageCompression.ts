/**
 * Utility to compress images in the browser using the Canvas API.
 * This reduces the image dimensions and quality to save database/storage space.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // between 0.0 and 1.0
  outputType?: 'base64' | 'blob' | 'file';
}

export function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string | Blob | File> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    outputType = 'base64',
  } = options;

  return new Promise((resolve, reject) => {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas 2d context'));
        }

        // Draw image on canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Export according to desired output type
        if (outputType === 'base64') {
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        } else {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Canvas to Blob conversion failed'));
              }
              if (outputType === 'file') {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            quality
          );
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
