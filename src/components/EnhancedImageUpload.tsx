import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Image, Camera, Plus, X, Star, AlertCircle, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

// Type definitions
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'white' | 'secondary';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface ImageModalProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSetPrimary: (index: number) => void;
  primaryIndex: number;
}

interface EnhancedImageUploadProps {
  onImagesChange?: (images: string[]) => void;
  onPrimaryImageChange?: (index: number) => void;
  maxImages?: number;
  maxFileSize?: number;
  initialImages?: string[];
  initialPrimaryIndex?: number;
}

interface ValidationError {
  images?: string;
}

// Button component
const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'default', 
  onClick, 
  className = '', 
  disabled = false 
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    default: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    white: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-green-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Image Modal Component
const ImageModal: React.FC<ImageModalProps> = ({ 
  isOpen, 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev, 
  onSetPrimary, 
  primaryIndex 
}) => {
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-full w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium">
              Image {currentIndex + 1} of {images.length}
            </h3>
            {primaryIndex === currentIndex && (
              <span className="px-2 py-1 bg-green-600 rounded-full text-xs flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Primary
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center relative">
          <img
            src={currentImage}
            alt={`Property image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={onNext}
                className="absolute right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4">
          <Button
            variant="secondary"
            onClick={() => onSetPrimary(currentIndex)}
            className="flex items-center gap-2 bg-white bg-opacity-20 text-white hover:bg-opacity-30 border-white border-opacity-30"
          >
            <Star className={`h-4 w-4 ${primaryIndex === currentIndex ? 'fill-current' : ''}`} />
            {primaryIndex === currentIndex ? 'Primary Image' : 'Set as Primary'}
          </Button>
          
          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="flex gap-2 max-w-md overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => {/* Navigate to this image if needed */}}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Enhanced Image Upload Component
const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({ 
  onImagesChange, 
  onPrimaryImageChange, 
  maxImages = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  initialImages = [],
  initialPrimaryIndex = 0
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialImages);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(initialPrimaryIndex);
  const [errors, setErrors] = useState<ValidationError>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentModalIndex, setCurrentModalIndex] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadingImages, setUploadingImages] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, or WEBP images.';
    }
    
    if (file.size > maxFileSize) {
      return 'File size too large. Please keep images under 5MB.';
    }
    
    return null;
  };

  const processImages = (files: FileList): void => {
    const newImages: File[] = [];
    const newErrors: string[] = [];
    
    Array.from(files).forEach((file, index) => {
      if (previewUrls.length + newImages.length >= maxImages) {
        newErrors.push(`Maximum ${maxImages} images allowed`);
        return;
      }
      
      const error = validateImage(file);
      if (error) {
        newErrors.push(error);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          setPreviewUrls(prev => {
            const updated = [...prev, e.target!.result as string];
            // Set first image as primary if no primary image exists
            if (prev.length === 0) {
              setPrimaryImageIndex(0);
            }
            return updated;
          });
          setUploadingImages(prev => prev.filter((_, i) => i !== index));
        }
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });
    
    if (newErrors.length > 0) {
      setErrors({ images: newErrors.join(', ') });
    } else {
      setErrors({});
    }
    
    setUploadingImages(newImages.map((_, index) => index));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImages(files);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImages(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (): void => {
    setIsDragOver(false);
  };

  const removeImage = (index: number): void => {
    setPreviewUrls(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Adjust primary image index if needed
      if (primaryImageIndex === index) {
        setPrimaryImageIndex(0);
      } else if (primaryImageIndex > index) {
        setPrimaryImageIndex(primaryImageIndex - 1);
      }
      return updated;
    });
  };

  const setPrimaryImage = (index: number): void => {
    setPrimaryImageIndex(index);
  };

  const openModal = (index: number): void => {
    setCurrentModalIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
  };

  const nextImage = (): void => {
    setCurrentModalIndex((prev) => (prev + 1) % previewUrls.length);
  };

  const prevImage = (): void => {
    setCurrentModalIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length);
  };

  // Notify parent component of changes
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(previewUrls);
    }
  }, [previewUrls, onImagesChange]);

  useEffect(() => {
    if (onPrimaryImageChange) {
      onPrimaryImageChange(primaryImageIndex);
    }
  }, [primaryImageIndex, onPrimaryImageChange]);

  const renderStep5 = useCallback(() => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Image className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Images</h1>
        <p className="text-gray-600">Upload high-quality images of your property (max {maxImages} images)</p>
      </div>
      
      <div className="space-y-6">
        {errors.images && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <X className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{errors.images}</p>
          </div>
        )}
        
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragOver 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
              isDragOver ? 'bg-green-200' : 'bg-green-100'
            }`}>
              <Camera className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragOver ? 'Drop images here' : 'Upload Property Images'}
            </h3>
            <p className="text-gray-600 mb-4">Drag & drop or click to browse (JPG, PNG, WEBP - max 5MB each)</p>
            <Button
              variant="white"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 border border-green-600 text-green-600 hover:bg-green-50"
            >
              Browse Files
            </Button>
            <p className="mt-2 text-sm text-gray-500">Maximum {maxImages} images (5MB each)</p>
          </div>
        </div>
        
        {previewUrls.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Uploaded Images ({previewUrls.length}/{maxImages})
              </h3>
              {previewUrls.length < maxImages && (
                <Button
                  variant="white"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-green-600 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4" />
                  Add More
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div 
                  key={index} 
                  className={`relative rounded-xl overflow-hidden aspect-square group cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    primaryImageIndex === index ? 'ring-2 ring-green-500 ring-offset-2' : ''
                  }`}
                  onClick={() => openModal(index)}
                >
                  <img
                    src={url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Overlay with controls */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(index);
                        }}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                      >
                        <ZoomIn className="h-4 w-4 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimaryImage(index);
                        }}
                        className={`p-2 rounded-full transition-all ${
                          primaryImageIndex === index
                            ? 'bg-green-600 text-white'
                            : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${primaryImageIndex === index ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Primary badge */}
                  {primaryImageIndex === index && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Primary
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-90 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                  >
                    <X className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              ))}
              
              {/* Loading placeholders */}
              {uploadingImages.map((_, index) => (
                <div 
                  key={`loading-${index}`}
                  className="relative rounded-xl overflow-hidden aspect-square bg-gray-100 flex items-center justify-center"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Image Tips</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Click any image to view it in full size</li>
                    <li>• The primary image will be used as the main thumbnail for your listing</li>
                    <li>• Use the star icon to set any image as primary</li>
                    <li>• Drag and drop multiple images at once for faster uploading</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Image Modal */}
        <ImageModal
          isOpen={isModalOpen}
          images={previewUrls}
          currentIndex={currentModalIndex}
          onClose={closeModal}
          onNext={nextImage}
          onPrev={prevImage}
          onSetPrimary={setPrimaryImage}
          primaryIndex={primaryImageIndex}
        />
      </div>
    </div>
  ), [
    previewUrls, 
    primaryImageIndex, 
    errors, 
    isDragOver, 
    uploadingImages, 
    isModalOpen, 
    currentModalIndex,
    maxImages,
    maxFileSize
  ]);

  return renderStep5();
};

export default EnhancedImageUpload;