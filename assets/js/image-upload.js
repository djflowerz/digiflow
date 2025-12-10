/**
 * image-upload.js
 * Image upload to Supabase Storage with compression
 */

const ImageUpload = {
    bucketName: 'products',
    maxSizeKB: 2048, // 2MB
    maxWidth: 1200,
    maxHeight: 1200,

    // Compress image before upload
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > this.maxWidth || height > this.maxHeight) {
                        if (width > height) {
                            height = (height / width) * this.maxWidth;
                            width = this.maxWidth;
                        } else {
                            width = (width / height) * this.maxHeight;
                            height = this.maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, file.type, 0.85); // 85% quality
                };

                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Validate file
    validateFile(file) {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload JPG, PNG, or WebP images.');
        }

        // Check file size
        const sizeKB = file.size / 1024;
        if (sizeKB > this.maxSizeKB) {
            throw new Error(`File too large. Maximum size is ${this.maxSizeKB}KB.`);
        }

        return true;
    },

    // Upload image to Supabase Storage
    async uploadImage(file, folder = '') {
        try {
            // Validate file
            this.validateFile(file);

            // Compress image
            UIHelpers.showLoading('Compressing image...');
            const compressedBlob = await this.compressImage(file);

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            // Upload to Supabase Storage
            UIHelpers.showLoading('Uploading image...');
            const { data, error } = await supabaseClient.storage
                .from(this.bucketName)
                .upload(fileName, compressedBlob, {
                    contentType: file.type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from(this.bucketName)
                .getPublicUrl(fileName);

            UIHelpers.hideLoading();
            UIHelpers.showSuccess('Image uploaded successfully!');

            return {
                path: data.path,
                url: publicUrl
            };
        } catch (error) {
            UIHelpers.hideLoading();
            UIHelpers.showError(error.message);
            throw error;
        }
    },

    // Delete image from Supabase Storage
    async deleteImage(path) {
        try {
            const { error } = await supabaseClient.storage
                .from(this.bucketName)
                .remove([path]);

            if (error) throw error;

            UIHelpers.showSuccess('Image deleted successfully!');
            return true;
        } catch (error) {
            UIHelpers.showError('Failed to delete image');
            console.error('Delete error:', error);
            return false;
        }
    },

    // Create file input with preview
    createFileInput(containerId, onUploadCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const inputHTML = `
            <div class="image-upload-container">
                <input type="file" id="imageFileInput" accept="image/*" class="d-none">
                <div id="imagePreview" class="mb-3" style="display: none;">
                    <img id="previewImg" src="" alt="Preview" class="img-thumbnail" style="max-width: 200px; max-height: 200px;">
                    <button type="button" class="btn btn-sm btn-danger ms-2" id="removeImageBtn">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
                <button type="button" class="btn btn-primary" id="selectImageBtn">
                    <i class="fas fa-upload"></i> Select Image
                </button>
                <small class="form-text text-muted d-block mt-2">
                    Max size: ${this.maxSizeKB}KB. Formats: JPG, PNG, WebP
                </small>
            </div>
        `;

        container.innerHTML = inputHTML;

        // Event listeners
        const fileInput = document.getElementById('imageFileInput');
        const selectBtn = document.getElementById('selectImageBtn');
        const removeBtn = document.getElementById('removeImageBtn');
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        selectBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);

                // Upload image
                const result = await this.uploadImage(file);

                // Callback with URL
                if (onUploadCallback) {
                    onUploadCallback(result.url, result.path);
                }
            } catch (error) {
                console.error('Upload error:', error);
            }
        });

        removeBtn.addEventListener('click', () => {
            fileInput.value = '';
            preview.style.display = 'none';
            previewImg.src = '';

            if (onUploadCallback) {
                onUploadCallback(null, null);
            }
        });
    },

    // Set preview image
    setPreview(imageUrl) {
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        if (preview && previewImg && imageUrl) {
            previewImg.src = imageUrl;
            preview.style.display = 'block';
        }
    }
};

// Make available globally
window.ImageUpload = ImageUpload;
