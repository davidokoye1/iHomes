// src/pages/PropertyUpload.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  X, 
  Image, 
  Camera, 
  MapPin, 
  DollarSign, 
  Home, 
  Bed, 
  Bath, 
  Square, 
  Loader2,
  Star,
  AlertCircle,
  Plus
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { PropertiesService } from '../services/properties';
import type { PropertyFormData, Amenity, PropertyType } from '../types/database';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';

// Form Field Wrapper Component
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  required = false, 
  error, 
  hint,
  className = '',
  children 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
};

// Smart Price Input Component
interface SmartPriceInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  listingType?: 'sale' | 'rent';
}

const SmartPriceInput: React.FC<SmartPriceInputProps> = ({
  value,
  onChange,
  label = "Price (D)",
  required = true,
  error,
  hint,
  listingType = 'sale'
}) => {
  const [inputValue, setInputValue] = useState<string>(value > 0 ? value.toString() : '');
  
  useEffect(() => {
    if (value > 0) {
      setInputValue(value.toString());
    } else {
      setInputValue('');
    }
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(rawValue);
    
    if (rawValue === '') {
      onChange(0);
    } else {
      onChange(parseInt(rawValue));
    }
  };
  
  const formatDisplayValue = () => {
    if (inputValue === '') return '';
    const numValue = parseInt(inputValue);
    if (isNaN(numValue)) return '';
    
    // Format based on listing type
    if (listingType === 'rent') {
      return numValue.toLocaleString() + ' D/month';
    }
    return 'D ' + numValue.toLocaleString();
  };
  
  return (
    <FormField 
      label={label} 
      required={required} 
      error={error}
      hint={hint}
    >
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={formatDisplayValue()}
          onChange={handleChange}
          placeholder={listingType === 'rent' ? "e.g. 25000" : "e.g. 1500000"}
          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </div>
    </FormField>
  );
};

// Smart Validation Component
interface SmartValidationProps {
  field: keyof PropertyFormData;
  value: any;
  errors: Record<string, string>;
}

const SmartValidation: React.FC<SmartValidationProps> = ({ field, value, errors }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  
  useEffect(() => {
    setIsValid(!errors[field]);
    
    // Generate suggestions based on field
    if (field === 'title') {
      if (value && value.length < 10) {
        setSuggestion('Make it more descriptive (aim for 10+ characters)');
      } else if (value && value.length >= 10 && value.length < 30) {
        setSuggestion('Good title! Consider adding location or key features');
      } else if (value && value.length >= 30) {
        setSuggestion('Excellent title length!');
      }
    } else if (field === 'description') {
      if (value && value.length < 50) {
        setSuggestion('Description is too short (aim for 50+ characters)');
      } else if (value && value.length >= 50 && value.length < 150) {
        setSuggestion('Description could be more detailed');
      } else if (value && value.length >= 150) {
        setSuggestion('Great description length!');
      }
    }
  }, [field, value, errors]);
  
  if (!value || isValid === null) return null;
  
  return (
    <div className={`mt-2 flex items-center gap-2 text-sm ${
      isValid ? 'text-green-600' : 'text-yellow-600'
    }`}>
      {isValid ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{suggestion || (isValid ? 'Looks good!' : 'Needs improvement')}</span>
    </div>
  );
};

const PropertyUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(7);
  const [completedSteps, setCompletedSteps] = useState(new Set<number>());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: 0,
    property_type: 'apartment',
    listing_type: 'sale',
    address: '',
    city: '',
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 0,
    year_built: new Date().getFullYear(),
    parking_spaces: 0,
    is_furnished: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const lastSavedRef = useRef<Date | null>(null);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Error revoking object URL:', e);
        }
      });
    };
  }, []);

  // Fetch locations and amenities from database
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load amenities
        const amenitiesData = await PropertiesService.getAmenities();
        setAmenities(amenitiesData);
        
        // Load draft if exists
        loadDraft();
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading ', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Auto-save draft functionality
  useEffect(() => {
    const saveDraft = async () => {
      if (currentStep === 7) return; // Don't save when on final step
      
      const draft = {
        formData,
        selectedImages,
        previewUrls,
        primaryImageIndex,
        currentStep,
        timestamp: new Date().toISOString()
      };
      
      try {
        localStorage.setItem('propertyDraft', JSON.stringify(draft));
        lastSavedRef.current = new Date();
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    };

    // Save draft every 30 seconds
    const interval = setInterval(saveDraft, 30000);
    
    // Save draft on component unmount
    return () => {
      saveDraft();
      clearInterval(interval);
    };
  }, [formData, selectedImages, previewUrls, primaryImageIndex, currentStep]);

  // Load draft functionality
  const loadDraft = useCallback(() => {
    try {
      const draftData = localStorage.getItem('propertyDraft');
      if (!draftData) return;
      
      const draft = JSON.parse(draftData);
      const timestamp = new Date(draft.timestamp).getTime();
      const now = new Date().getTime();
      
      // Check if draft is less than 24 hours old
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        setFormData(draft.formData);
        setSelectedImages(draft.selectedImages);
        setPreviewUrls(draft.previewUrls);
        setPrimaryImageIndex(draft.primaryImageIndex);
        
        // Restore object URLs
        objectUrlsRef.current = [...draft.previewUrls];
        
        // Only restore step if not on final step
        if (draft.currentStep < 7) {
          setCurrentStep(draft.currentStep);
        }
        
        // Mark steps as completed
        const completed = new Set<number>();
        for (let i = 1; i < draft.currentStep; i++) {
          completed.add(i);
        }
        setCompletedSteps(completed);
        
        lastSavedRef.current = new Date(draft.timestamp);
        toast.info('Draft loaded successfully');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }, []);

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check if we're already at the maximum
    if (selectedImages.length >= 10) {
        toast.warning("You can only upload a maximum of 10 images");
      return;
    }
    
    // Enhanced validation
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Not an image file`);
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 5MB)`);
        return;
      }
      
      // Check file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        errors.push(`${file.name}: Unsupported format (use JPG, PNG, or WEBP)`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Show errors if any
    if (errors.length > 0) {
      toast.error(`Some files were rejected:\n${errors.join('\n')}`);
    }
    
    if (validFiles.length === 0) return;
    
    // Check total limit
    const totalFiles = selectedImages.length + validFiles.length;
    if (totalFiles > 10) {
      const allowedCount = 10 - selectedImages.length;
      const filesToUse = validFiles.slice(0, allowedCount);
      
      toast.info(`You can only upload ${allowedCount} more image${allowedCount === 1 ? '' : 's'}`);
      
      if (filesToUse.length === 0) {
        return;
      }
      
      // Use only the allowed number of files
      const newImages = [...selectedImages, ...filesToUse];
      setSelectedImages(newImages);
      
      // Generate preview URLs with proper error handling
      const newPreviewUrls: string[] = [];
      const newObjectUrls: string[] = [];
      
      for (const file of filesToUse) {
        try {
          const url = URL.createObjectURL(file);
          newPreviewUrls.push(url);
          newObjectUrls.push(url);
        } catch (error) {
          console.error("Error creating object URL:", error);
        }
      }
      
      // Update state and reference
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      objectUrlsRef.current = [...objectUrlsRef.current, ...newObjectUrls];
      
      // Set primary image if needed
      if (selectedImages.length === 0 && newPreviewUrls.length > 0) {
        setPrimaryImageIndex(0);
      }
    } else {
      // Normal case - adding within limits
      const newImages = [...selectedImages, ...validFiles];
      setSelectedImages(newImages);
      
      // Generate preview URLs with proper error handling
      const newPreviewUrls: string[] = [];
      const newObjectUrls: string[] = [];
      
      for (const file of validFiles) {
        try {
          const url = URL.createObjectURL(file);
          newPreviewUrls.push(url);
          newObjectUrls.push(url);
        } catch (error) {
          console.error("Error creating object URL:", error);
        }
      }
      
      // Update state and reference
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      objectUrlsRef.current = [...objectUrlsRef.current, ...newObjectUrls];
      
      // Set primary image if needed
      if (selectedImages.length === 0 && newPreviewUrls.length > 0) {
        setPrimaryImageIndex(0);
      }
    }
    
    // Clear file input to allow re-uploading the same files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedImages]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    if (index < 0 || index >= selectedImages.length) return;
    
    // Revoke the object URL
    if (index < objectUrlsRef.current.length && objectUrlsRef.current[index]) {
      try {
        URL.revokeObjectURL(objectUrlsRef.current[index]);
      } catch (e) {
        console.error('Error revoking object URL:', e);
      }
      objectUrlsRef.current = objectUrlsRef.current.filter((_, i) => i !== index);
    }
    
    const newImages = [...selectedImages];
    const newPreviewUrls = [...previewUrls];
    
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    
    setSelectedImages(newImages);
    setPreviewUrls(newPreviewUrls);
    
    // Adjust primary image index if needed
    if (index === primaryImageIndex) {
      setPrimaryImageIndex(Math.max(0, primaryImageIndex - 1));
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
    
    // Ensure primary image index is valid
    if (primaryImageIndex >= newPreviewUrls.length && newPreviewUrls.length > 0) {
      setPrimaryImageIndex(newPreviewUrls.length - 1);
    }
  }, [selectedImages, previewUrls, primaryImageIndex]);

  // Set primary image
  const setPrimaryImage = useCallback((index: number) => {
    if (index >= 0 && index < previewUrls.length) {
      setPrimaryImageIndex(index);
    }
  }, [previewUrls]);

  // Handle form input changes
  const handleInputChange = useCallback(<K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate current step
  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = 'Property title is required';
        }
        if (formData.title.length < 5) {
          newErrors.title = 'Title must be at least 5 characters';
        }
        if (!formData.description?.trim()) {
          newErrors.description = 'Description is required';
        }
        if (formData.description && formData.description.length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        }
        break;
        
      case 2:
        if (!formData.property_type) {
          newErrors.property_type = 'Property type is required';
        }
        if (!formData.listing_type) {
          newErrors.listing_type = 'Listing type is required';
        }
        if (formData.bedrooms && formData.bedrooms < 0) {
          newErrors.bedrooms = 'Bedrooms cannot be negative';
        }
        if (formData.bathrooms && formData.bathrooms < 0) {
          newErrors.bathrooms = 'Bathrooms cannot be negative';
        }
        if (formData.square_feet && formData.square_feet < 0) {
          newErrors.square_feet = 'Square feet cannot be negative';
        }
        break;
        
      case 3:
        if (!formData.address.trim()) {
          newErrors.address = 'Address is required';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
        }
        break;
        
      case 4:
        // No required fields, just amenities
        break;
        
      case 5:
        if (selectedImages.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;
        
      case 6:
        if (formData.price <= 0) {
          newErrors.price = 'Price must be greater than 0';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData, selectedImages]);

  // Next step
  const goToNextStep = useCallback(() => {
    if (validateStep()) {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(currentStep);
        return newSet;
      });
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  }, [validateStep, currentStep, totalSteps]);

  // Previous step
  const goToPreviousStep = useCallback(() => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentStep);
      return newSet;
    });
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, [currentStep]);

  // Submit property
  // 1. FIX: Replace the toast import
// Remove: import { useToast } from '../hooks/useToast';

// 2. FIX: Update handleSubmit function
// FIXED handleSubmit function - Addressing your specific issues
// FIXED handleSubmit function - Addressing your specific issues
// FIXED handleSubmit function - Addressing your specific issues
const handleSubmit = useCallback(async () => {
  // Prevent multiple submissions
  if (submitting) {
    console.log("Already submitting, skipping...");
    return;
  }
  
  try {
    setSubmitting(true);
    setErrors({}); // Clear any previous errors
    
    console.log("=== STARTING PROPERTY SUBMISSION ===");
    console.log("Form data:", formData);
    console.log("Selected images:", selectedImages?.length || 0);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!user) {
      console.error("No user data returned");
      throw new Error('User not authenticated. Please log in and try again.');
    }
    
    console.log("✓ User authenticated:", user.id);
    
    // CRITICAL: Validate form BEFORE proceeding
    console.log("Validating form...");
    const validationResult = validateStep();
    console.log("Validation result:", validationResult);
    
    if (!validationResult) {
      console.error("Form validation failed");
      const missingFields = [];
      if (!formData.title?.trim()) missingFields.push('title');
      if (!formData.description?.trim()) missingFields.push('description');
      if (!formData.price || Number(formData.price) <= 0) missingFields.push('price');
      if (!formData.property_type) missingFields.push('property type');
      if (!formData.listing_type) missingFields.push('listing type');
      
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      toast.error(errorMsg);
      console.error(errorMsg);
      return; // IMPORTANT: Don't continue if validation fails
    }
    
    console.log("✓ Form validation passed");
    
    // CRITICAL: Validate required fields explicitly (in case validateStep is not working)
    const requiredFields = [
      { field: 'title', value: formData.title?.trim(), message: 'Property title is required' },
      { field: 'description', value: formData.description?.trim(), message: 'Property description is required' },
      { field: 'price', value: formData.price && Number(formData.price) > 0, message: 'Valid property price is required' },
      { field: 'property_type', value: formData.property_type, message: 'Property type is required' },
      { field: 'listing_type', value: formData.listing_type, message: 'Listing type is required' },
    ];
    
    for (const { field, value, message } of requiredFields) {
      if (!value) {
        console.error(`Missing required field: ${field}`);
        throw new Error(message);
      }
    }
    
    console.log("✓ Required fields validation passed");
    
    // Prepare amenities data
    const selectedAmenityIds: string[] = amenities
      .filter(amenity => formData[amenity.id as keyof PropertyFormData] === true)
      .map(amenity => amenity.id);
    console.log("✓ Selected amenities:", selectedAmenityIds);
    
    // Validate images with detailed logging
    const validImages = [];
    if (selectedImages && selectedImages.length > 0) {
      console.log(`Validating ${selectedImages.length} images...`);
      
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        console.log(`Image ${i}:`, {
          name: image?.name,
          size: image?.size,
          type: image?.type
        });
        
        if (!image || image.size === 0) {
          throw new Error(`Invalid image file at position ${i + 1}`);
        }
        if (image.size > 5 * 1024 * 1024) {
          throw new Error(`Image ${i + 1} (${image.name}) is too large (max 5MB)`);
        }
        validImages.push(image);
      }
      console.log("✓ All images validated");
    } else {
      console.log("⚠ No images selected");
    }
    
    // Prepare property data
    const propertyData: PropertyFormData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      price: formData.price,
      property_type: formData.property_type,
      listing_type: formData.listing_type,
      address: formData.address.trim(),
      city: formData.city.trim(),
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      square_feet: formData.square_feet,
      year_built: formData.year_built,
      parking_spaces: formData.parking_spaces,
      is_furnished: formData.is_furnished
    };
    
    console.log("✓ Property data prepared:", {
      ...propertyData,
      amenityCount: selectedAmenityIds.length,
      imageCount: validImages.length
    });
    
    // Call the service to create property
    console.log("=== CALLING PROPERTIES SERVICE ===");
    const result = await PropertiesService.createProperty({
      ...propertyData,
      amenities: selectedAmenityIds,
      images: validImages
    }, user.id);
    
    console.log("Service call completed, result:", result);
    
    if (!result) {
      console.error("Service returned null/undefined result");
      throw new Error('Property creation failed - no data returned from service');
    }
    
    if (!result.id) {
      console.error("Service returned result without ID:", result);
      throw new Error('Property creation failed - no ID returned');
    }
    
    console.log("✓ Property created successfully with ID:", result.id);
    console.log("=== PROPERTY CREATION SUCCESS ===");
    
    // Clean up object URLs safely
    if (objectUrlsRef.current && Array.isArray(objectUrlsRef.current)) {
      objectUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Error revoking object URL:', e);
        }
      });
      objectUrlsRef.current = [];
    }
    
    // Clear draft from localStorage safely
    try {
      localStorage.removeItem('propertyDraft');
      console.log("✓ Draft cleared from localStorage");
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
    
    // Show success notification
    toast.success('Property published successfully!', {
      description: 'Your property is now live and visible to potential buyers/renters'
    });
    
    // Navigate after a short delay
    setTimeout(() => {
      console.log("Navigating to dashboard...");
      navigate('/dashboard', { 
        state: { 
          newPropertyId: result.id,
          message: 'Property created successfully'
        },
        replace: true
      });
    }, 1500);
    
  } catch (error: unknown) {
    console.error('=== PROPERTY CREATION ERROR ===');
    const errorMessage = error instanceof Error ? error.message : 'Failed to create property';
    console.error('Error details:', errorMessage);
    
    setErrors({ submit: errorMessage });
    toast.error(errorMessage);
    setSubmitting(false);
  }
}, [
  submitting, 
  formData, 
  amenities, 
  selectedImages, 
  navigate, 
  validateStep, 
  location.pathname,
  setErrors,
  setSubmitting,
  objectUrlsRef]);

  // Step 1: Property Name & Description
  const renderStep1 = useCallback(() => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Home className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">What's the name of your property?</h1>
        <p className="text-gray-600">Let's start with the basics. Give your property a clear, descriptive title.</p>
      </div>
      
      <div className="space-y-6">
        <FormField
          label="Property Title"
          required={true}
          error={errors.title}
          hint="Make it descriptive and include key features"
        >
          <input
            type="text"
            value={formData.title}
            onChange={e => handleInputChange('title', e.target.value)}
            placeholder="e.g. Modern 2-Bedroom Apartment in Downtown"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={100}
          />
          <p className="mt-1 text-sm text-gray-500">{formData.title.length}/100 characters</p>
        </FormField>
        
        <FormField
          label="Property Description"
          required={true}
          error={errors.description}
          hint="Describe key features, neighborhood, and what makes it special"
        >
          <textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Describe your property in detail. Include key features, neighborhood information, and what makes it special..."
            rows={6}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={1000}
          />
          <p className="mt-1 text-sm text-gray-500">{(formData.description?.length || 0)}/1000 characters</p>
          
          {/* Enhanced Tips Component */}
          <div className="mt-6 p-4 bg-green-50 rounded-xl text-left">
            <h4 className="font-semibold text-green-900 mb-2">✨ Description Tips</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Highlight unique features and recent upgrades</li>
              <li>• Mention the neighborhood and nearby amenities</li>
              <li>• Describe the lifestyle this property offers</li>
              <li>• Be honest and accurate in your descriptions</li>
            </ul>
          </div>
          
          {/* Smart Validation */}
          <SmartValidation 
            field="description" 
            value={formData.description} 
            errors={errors} 
          />
        </FormField>
      </div>
    </div>
  ), [formData, errors, handleInputChange]);

  // Step 2: Property Type & Basic Details
  const renderStep2 = useCallback(() => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Home className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Details</h1>
        <p className="text-gray-600">Tell us about the property's basic characteristics</p>
      </div>
      
      <div className="space-y-6">
        <FormField
          label="Property Type"
          required={true}
          error={errors.property_type}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { value: 'apartment', label: 'Apartment', icon: Home },
              { value: 'house', label: 'House', icon: Home },
              { value: 'condo', label: 'Condo', icon: Home },
              { value: 'townhouse', label: 'Townhouse', icon: Home },
              { value: 'villa', label: 'Villa', icon: Home },
              { value: 'land', label: 'Land', icon: Square },
              { value: 'commercial', label: 'Commercial', icon: Home }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => handleInputChange('property_type', type.value as PropertyType)}
                className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                  formData.property_type === type.value
                    ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <type.icon className="h-6 w-6 mb-2" />
                <span className="text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </FormField>
        
        <FormField
          label="Listing Type"
          required={true}
          error={errors.listing_type}
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleInputChange('listing_type', 'sale')}
              className={`p-4 rounded-xl border transition-all ${
                formData.listing_type === 'sale'
                  ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center">
                <DollarSign className="h-5 w-5 mr-2" />
                <span>For Sale</span>
              </div>
            </button>
            <button
              onClick={() => handleInputChange('listing_type', 'rent')}
              className={`p-4 rounded-xl border transition-all ${
                formData.listing_type === 'rent'
                  ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center">
                <Home className="h-5 w-5 mr-2" />
                <span>For Rent</span>
              </div>
            </button>
          </div>
        </FormField>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="Bedrooms"
            required={true}
            error={errors.bedrooms}
          >
            <div className="relative">
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={e => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.bedrooms ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </FormField>
          
          <FormField
            label="Bathrooms"
            required={true}
            error={errors.bathrooms}
          >
            <div className="relative">
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                value={formData.bathrooms}
                onChange={e => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.bathrooms ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </FormField>
          
          <FormField
            label="Square Feet"
            required={true}
            error={errors.square_feet}
          >
            <div className="relative">
              <Square className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                value={formData.square_feet}
                onChange={e => handleInputChange('square_feet', parseInt(e.target.value) || 0)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.square_feet ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </FormField>
        </div>
      </div>
    </div>
  ), [formData, errors, handleInputChange]);

  // Step 3: Location Information
  const renderStep3 = useCallback(() => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Location Details</h1>
        <p className="text-gray-600">Where is your property located?</p>
      </div>
      
      <div className="space-y-6">
        <FormField
          label="Full Address"
          required={true}
          error={errors.address}
          hint="Be as specific as possible"
        >
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.address}
              onChange={e => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </FormField>
        
        <FormField
          label="City"
          required={true}
          error={errors.city}
          hint="Enter the city name"
        >
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.city}
              onChange={e => handleInputChange('city', e.target.value)}
              placeholder="e.g. Banjul"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </FormField>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Year Built"
            hint="When was the property constructed?"
          >
            <input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.year_built}
              onChange={e => handleInputChange('year_built', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </FormField>
          
          <FormField
            label="Parking Spaces"
            hint="How many parking spots are available?"
          >
            <div className="relative">
              <Square className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                value={formData.parking_spaces}
                onChange={e => handleInputChange('parking_spaces', parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </FormField>
        </div>
      </div>
    </div>
  ), [formData, errors, handleInputChange]);

  // Step 4: Property Features
  const renderStep4 = useCallback(() => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Star className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Features</h1>
        <p className="text-gray-600">Select the amenities and features your property offers</p>
      </div>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interior Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {amenities
              .filter(amenity => amenity.category === 'interior')
              .map(amenity => (
                <label key={amenity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData[amenity.id as keyof PropertyFormData] as boolean || false}
                    onChange={e => handleInputChange(amenity.id as keyof PropertyFormData, e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm">{amenity.name}</span>
                </label>
              ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exterior Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {amenities
              .filter(amenity => amenity.category === 'exterior')
              .map(amenity => (
                <label key={amenity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData[amenity.id as keyof PropertyFormData] as boolean || false}
                    onChange={e => handleInputChange(amenity.id as keyof PropertyFormData, e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm">{amenity.name}</span>
                </label>
              ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Features</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {amenities
              .filter(amenity => amenity.category === 'other')
              .map(amenity => (
                <label key={amenity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData[amenity.id as keyof PropertyFormData] as boolean || false}
                    onChange={e => handleInputChange(amenity.id as keyof PropertyFormData, e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm">{amenity.name}</span>
                </label>
              ))}
          </div>
        </div>
      </div>
    </div>
  ), [formData, amenities, handleInputChange]);

  // Step 5: Image Upload
  const renderStep5 = useCallback(() => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Image className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Images</h1>
        <p className="text-gray-600">Upload high-quality images of your property (max 10 images)</p>
      </div>
      
      <div className="space-y-6">
        {errors.images && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <span className="h-5 w-5 text-red-500">
              <X className="h-5 w-5" />
            </span>
            <p className="text-red-700">{errors.images}</p>
          </div>
        )}
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Property Images</h3>
            <p className="text-gray-600 mb-4">Drag & drop or click to browse (JPG, PNG, WEBP - max 5MB each)</p>
            <Button
              variant="white"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 border border-green-600 text-green-600 hover:bg-green-50"
            >
              Browse Files
            </Button>
            <p className="mt-2 text-sm text-gray-500">Maximum 10 images (5MB each)</p>
          </div>
        </div>
        
        {previewUrls.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Uploaded Images ({previewUrls.length}/10)</h3>
              <Button
                variant="white"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-green-600 hover:bg-green-50"
              >
                <Plus className="h-4 w-4" />
                Add More
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div 
                  key={index} 
                  className={`relative rounded-xl overflow-hidden aspect-square ${
                    primaryImageIndex === index ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  {/* FIX: Proper image preview with error handling */}
                  <img
                    src={url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log(`Image loaded successfully: ${url}`);
                    }}
                    onError={(e) => {
                      console.error("Error loading image:", url);
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.style.display = "none";
                      
                      // Create fallback content
                      const container = imgElement.parentElement;
                      if (container && !container.querySelector('.image-error')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'image-error absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-xs';
                        errorDiv.textContent = 'Image Error';
                        container.appendChild(errorDiv);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setPrimaryImage(index)}
                      className={`p-2 rounded-full ${
                        primaryImageIndex === index
                          ? 'bg-white text-green-600'
                          : 'bg-white bg-opacity-90 text-gray-700'
                      }`}
                    >
                      {primaryImageIndex === index ? (
                        <Star className="h-5 w-5 fill-current" />
                      ) : (
                        <Star className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="h-5 w-5 text-blue-500 mt-0.5">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Primary Image Selection</h4>
                  <p className="text-blue-800 text-sm">
                    The primary image will be used as the main thumbnail for your listing. 
                    Click the star icon on any image to set it as the primary image.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ), [previewUrls, primaryImageIndex, errors, removeImage, setPrimaryImage, handleImageSelect]);

  // Step 6: Price & Listing Details
  const renderStep6 = useCallback(() => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pricing Information</h1>
        <p className="text-gray-600">Set your property's price and listing details</p>
      </div>
      
      <div className="space-y-6">
        <SmartPriceInput
          value={formData.price}
          onChange={value => handleInputChange('price', value)}
          label="Price (D)"
          required={true}
          error={errors.price}
          listingType={formData.listing_type}
          hint={formData.listing_type === 'sale' 
            ? 'Enter the full sale price of the property' 
            : 'Enter the monthly rent amount'}
        />
        
        <FormField
          label="Furnished"
          hint="Is the property fully or partially furnished?"
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleInputChange('is_furnished', true)}
              className={`p-3 rounded-xl border transition-all ${
                formData.is_furnished === true
                  ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => handleInputChange('is_furnished', false)}
              className={`p-3 rounded-xl border transition-all ${
                formData.is_furnished === false
                  ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              No
            </button>
          </div>
        </FormField>
        
        {/* Price Validation Hints */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Price Guidelines:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• For sale: Typical range is D500,000 - D10,000,000</li>
            <li>• For rent: Typical range is D10,000 - D100,000/month</li>
            <li>• Research similar properties in your area</li>
          </ul>
        </div>
      </div>
    </div>
  ), [formData, errors, handleInputChange]);

  // Step 7: Final Review & Publish
  const renderStep7 = useCallback(() => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Your Listing</h1>
        <p className="text-gray-600">Double-check everything before publishing</p>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Property Preview */}
        <div className="relative h-64">
          {previewUrls.length > 0 ? (
            <img
              src={previewUrls[primaryImageIndex]}
              alt="Primary property image"
              className="w-full h-full object-cover"
              onLoad={() => console.log("Primary image loaded successfully")}
              onError={(e) => {
                console.error("Error loading primary image:", previewUrls[primaryImageIndex]);
                (e.target as HTMLImageElement).style.display = "none";
                
                // Create fallback content
                const container = (e.target as HTMLImageElement).parentElement;
                if (container && !container.querySelector('.image-error')) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'image-error absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500';
                  errorDiv.textContent = 'Primary Image Error';
                  container.appendChild(errorDiv);
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Image className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h2 className="text-xl font-bold text-white mb-1">{formData.title || 'Your Property Title'}</h2>
            <p className="text-green-300 font-semibold">
              {formData.listing_type === 'sale' ? 'D' : 'D/month'} {formData.price > 0 ? formData.price.toLocaleString() : 'Price'}
            </p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-medium capitalize">{formData.property_type || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Bedrooms</div>
                <div className="font-medium">{formData.bedrooms} {formData.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Bathrooms</div>
                <div className="font-medium">{formData.bathrooms} {formData.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Size</div>
                <div className="font-medium">{formData.square_feet} sqft</div>
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="h-5 w-5 mt-1 flex-shrink-0" />
              <div>
                <div>{formData.address || 'Address'}</div>
                <div>{formData.city || 'City'}</div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {formData.description || 'Your property description will appear here.'}
            </p>
          </div>
          
          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {amenities
                .filter(amenity => formData[amenity.id as keyof PropertyFormData] === true)
                .map(amenity => (
                  <span
                    key={amenity.id}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                  >
                    {amenity.name}
                  </span>
                ))}
              {amenities.filter(amenity => formData[amenity.id as keyof PropertyFormData] === true).length === 0 && (
                <p className="text-gray-500 italic">No amenities selected</p>
              )}
            </div>
          </div>
          
          {/* Images Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Images</h3>
            <div className="flex items-center gap-2 text-gray-700">
              <Image className="h-5 w-5" />
              <span>
                {previewUrls.length} {previewUrls.length === 1 ? 'image' : 'images'} uploaded | 
                Primary image #{primaryImageIndex + 1}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <span className="h-5 w-5 text-blue-500 mt-0.5">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Final Check Before Publishing</h4>
            <ul className="text-blue-800 text-sm list-disc list-inside space-y-1">
              <li>Ensure all property details are accurate and complete</li>
              <li>Verify that your images are high quality and properly selected</li>
              <li>Double-check your pricing information</li>
              <li>Confirm your description is clear and compelling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ), [previewUrls, primaryImageIndex, formData, amenities]);

  // Render the current step
  const renderCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      default:
        return renderStep1();
    }
  }, [currentStep, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7]);

  // Progress bar component
  const renderProgressBar = useCallback(() => (
    <div className="max-w-2xl mx-auto mb-10">
      <div className="flex items-center justify-between mb-2">
        {['Name & Description', 'Property Details', 'Location', 'Features', 'Images', 'Pricing', 'Review'].map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.has(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isPast = stepNumber < currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center relative">
              {/* Connector line */}
              {index < 6 && (
                <div 
                  className={`absolute top-4 left-8 w-full h-0.5 ${isPast ? 'bg-green-500' : 'bg-gray-200'} z-0`} 
                  style={{ width: 'calc(100% + 2rem)' }} 
                />
              )}
              
              {/* Step circle */}
              <div 
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                  isCompleted || isPast
                    ? 'bg-green-600 text-white shadow-lg'
                    : isCurrent
                      ? 'bg-green-600 text-white ring-4 ring-green-200 shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted || isPast ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  stepNumber
                )}
              </div>
              
              {/* Step label */}
              <div 
                className={`text-xs text-center max-w-16 ${
                  isCurrent 
                    ? 'text-green-700 font-semibold' 
                    : isPast 
                      ? 'text-gray-700 font-medium' 
                      : 'text-gray-500'
                }`}
              >
                {label}
              </div>
              
              {/* Validation indicator */}
              {isCompleted && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-600 transition-all duration-300" 
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
      </div>
      
      {/* Draft saved indicator */}
      {lastSavedRef.current && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Draft saved {new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }).format(lastSavedRef.current)}
        </div>
      )}
    </div>
  ), [currentStep, completedSteps, totalSteps]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="text-gray-600">Setting up property upload</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Property</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create a compelling listing in 7 simple steps. Your property will be visible to thousands of potential buyers or renters.
          </p>
        </div>
        
        {renderProgressBar()}
        
        {renderCurrentStep()}
        
        <div className="max-w-2xl mx-auto mt-10 flex justify-between">
          {currentStep > 1 ? (
            <Button
              variant="white"
              onClick={goToPreviousStep}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}
          
          {currentStep < totalSteps ? (
            <Button
              variant="colored"
              onClick={goToNextStep}
              className="flex items-center gap-2 px-6 py-3"
            >
              <span>Next</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="colored"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Publish Listing
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyUpload;