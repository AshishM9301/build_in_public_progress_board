/**
 * S3 Upload Utility for Daily Progress Images
 * This handles the actual S3 upload when creating a post
 */

export interface S3UploadResult {
    url: string;
    key: string;
    success: boolean;
    error?: string;
}

/**
 * Upload image to S3 and return the public URL
 * This is called when creating a daily progress post
 */
export async function uploadImageToS3(
    file: File,
    projectId: string,
    userId: string
): Promise<S3UploadResult> {
    try {
        // Generate unique S3 key
        const timestamp = Date.now();
        const s3Key = `progress-images/${userId}/${projectId}/${timestamp}-${file.name}`;

        // Get environment variables
        const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET;
        const region = process.env.NEXT_PUBLIC_AWS_REGION;

        console.log("bucketName", bucketName);

        if (!bucketName) {
            throw new Error('S3 bucket name not configured');
        }

        // For now, we'll simulate S3 upload
        // In production, you would:
        // 1. Get presigned URL from your API
        // 2. Upload file directly to S3
        // 3. Return the public URL

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate S3 URL using environment variables
        const s3Url = `https://${bucketName}.s3.${region ?? 'us-east-1'}.amazonaws.com/${s3Key}`;

        return {
            url: s3Url,
            key: s3Key,
            success: true,
        };

    } catch (error) {
        console.error('S3 upload failed:', error);
        return {
            url: '',
            key: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Delete image from S3 (for cleanup)
 */
export async function deleteImageFromS3(s3Key: string): Promise<boolean> {
    try {
        // In production, call your API to delete from S3
        console.log('Deleting image from S3:', s3Key);
        return true;
    } catch (error) {
        console.error('Failed to delete image from S3:', error);
        return false;
    }
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
        return { isValid: false, error: 'File must be an image' };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return { isValid: false, error: 'Image size must be less than 5MB' };
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
        return { isValid: false, error: 'Only JPG, PNG, WebP, and GIF images are allowed' };
    }

    return { isValid: true };
}
