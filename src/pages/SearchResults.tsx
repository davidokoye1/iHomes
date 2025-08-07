// src/pages/SearchResults.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Grid,
  List,
  X,
  MapPin,
  Home,
  Bed,
  Bath,
  DollarSign,
  Loader2,
  AlertCircle,
  Star,
  Filter,
  ChevronDown,
  SortAsc,
  Building2,
  ChevronLeft,
  Sparkles,
  Zap,
  Brain,
  Wand2,
  ArrowUpRight,
  Cpu,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import Button from '../components/Button';
import { PropertiesService } from '../services/properties';
import type {
  PropertyListing,
  SearchParams,
  Amenity,
  SearchResult
} from '../types/database';

// Types for better type safety
interface FilterState extends SearchParams {
  amenity_ids: string[];
}

interface SearchState {
  properties: SearchResult[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  page: number;
}

interface UIState {
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  showSortMenu: boolean;
  showMobileSearch: boolean;
}

interface ParsedQuery {
  searchParams: Partial<SearchParams>;
  confidence: number;
  interpretedAs: string;
  suggestions: string[];
}

interface PriceParseResult {
  min?: number;
  max?: number;
  confidence: number;
  type: 'range' | 'minimum' | 'maximum' | 'exact' | 'budget';
  currency?: string;
  originalText: string;
}

interface NumberMatch {
  value: number;
  index: number;
  raw: string;
  currency?: string;
}



// Constants
const ITEMS_PER_PAGE = 12;
const DEFAULT_SORT = { sort_by: 'created_at', sort_order: 'DESC' } as const;

// Filter configuration
const PROPERTY_TYPES = [
  { value: '', label: 'All Types', icon: Home },
  { value: 'apartment', label: 'Apartment', icon: Building2 },
  { value: 'house', label: 'House', icon: Home },
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'townhouse', label: 'Townhouse', icon: Home },
  { value: 'villa', label: 'Villa', icon: Home },
  { value: 'land', label: 'Land', icon: Building2 },
  { value: 'commercial', label: 'Commercial', icon: Building2 }
] as const;

const PRICE_RANGES = [
  { label: 'Any Price', min: undefined, max: undefined },
  { label: 'Under D50,000', min: undefined, max: 50000 },
  { label: 'D50,000 - D100,000', min: 50000, max: 100000 },
  { label: 'D100,000 - D200,000', min: 100000, max: 200000 },
  { label: 'D200,000 - D500,000', min: 200000, max: 500000 },
  { label: 'D500,000 - D1,000,000', min: 500000, max: 1000000 },
  { label: 'Above D1,000,000', min: 1000000, max: undefined },
] as const;

const ROOM_OPTIONS = [
  { label: 'Any', value: undefined },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
] as const;

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at', order: 'DESC' },
  { label: 'Oldest First', value: 'created_at', order: 'ASC' },
  { label: 'Price: Low to High', value: 'price', order: 'ASC' },
  { label: 'Price: High to Low', value: 'price', order: 'DESC' },
  { label: 'Most Viewed', value: 'views_count', order: 'DESC' },
  { label: 'Featured First', value: 'featured', order: 'DESC' },
] as const;

// Enhanced Natural Language Search Parser
class SmartSearchParser {
  // Enhanced location database with aliases and fuzzy matching
  private static readonly LOCATIONS = [
    'banjul', 'serekunda', 'bakau', 'sukuta', 'kololi', 'kairaba', 'kanifing',
    'fajara', 'bijilo', 'brufut', 'sanyang', 'gunjur', 'tanji', 'tanje',
    'kotu', 'serrekunda', 'bundung', 'dippa kunda', 'latrikunda', 'churchill town',
    // Add aliases for better matching
    'serrekunda', 'sere kunda', 'london corner', 'pipeline', 'westfield',
    'kairaba avenue', 'senegambia', 'palma rima', 'kerr serign', 'manjai',
    'new jeshwang', 'old jeshwang', 'bakoteh', 'tallinding', 'wellingara'
  ];

  private static readonly LOCATION_ALIASES = {
    'serrekunda': ['serekunda', 'sere kunda', 'sk'],
    'banjul': ['capital', 'city center', 'downtown'],
    'kololi': ['senegambia', 'tourist area'],
    'bijilo': ['monkey park area'],
    'brufut': ['golf course area'],
    'fajara': ['embassy area'],
    'bakau': ['cape point']
  };

  private static readonly PROPERTY_TYPES_MAP = {
    'apartment': ['apartment', 'apt', 'flat', 'unit', 'studio', 'bedsitter', 'one bedroom', 'two bedroom'],
    'house': ['house', 'home', 'detached', 'single family', 'family home', 'bungalow', 'compound house'],
    'villa': ['villa', 'mansion', 'estate', 'luxury home', 'executive home', 'palatial'],
    'condo': ['condo', 'condominium', 'townhome', 'duplex'],
    'townhouse': ['townhouse', 'town house', 'row house', 'terrace house'],
    'land': ['land', 'plot', 'lot', 'acre', 'hectare', 'site', 'ground', 'terrain'],
    'commercial': ['commercial', 'office', 'retail', 'business', 'shop', 'store', 'warehouse', 'factory']
  };

  private static readonly LISTING_TYPES_MAP = {
    'sale': ['sale', 'buy', 'purchase', 'buying', 'for sale', 'to buy', 'sell', 'selling', 'acquisition'],
    'rent': ['rent', 'rental', 'lease', 'renting', 'for rent', 'to rent', 'hire', 'letting', 'tenant']
  };

  private static readonly AMENITY_KEYWORDS = [
    'pool', 'swimming pool', 'parking', 'garage', 'garden', 'yard', 
    'balcony', 'terrace', 'gym', 'fitness', 'security', 'gated',
    'furnished', 'unfurnished', 'air conditioning', 'ac', 'wifi',
    'generator', 'solar', 'borehole', 'water', 'electricity', 'fence',
    'servant quarters', 'boys quarters', 'guest room', 'study room',
    'dining room', 'kitchen', 'pantry', 'store room', 'laundry'
  ];

  // Dalasi currency patterns - enhanced for local currency
  private static readonly CURRENCY_PATTERNS = {
    'D': /D\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    'GMD': /(?:GMD|gmd)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    'dalasi': /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dalasi/gi,
    '$': /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    '€': /€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    '£': /£\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    'USD': /(?:USD|usd)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    'generic': /(\d+(?:,\d{3})*(?:\.\d{2})?)/g
  };

  // Enhanced price parsing patterns
  private static readonly PRICE_PATTERNS = {
    maximum: [
      /(?:under|below|up\s+to|max(?:imum)?|no\s+more\s+than|not\s+exceeding|ceiling|budget\s+of|can\s+afford)\s+(?:is\s+)?(?:around\s+)?[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:budget|afford|max|under|below|up\s+to|not\s+over|cap\s+at)\s+[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:or\s+)?(?:less|max|maximum|tops?|ceiling)/gi
    ],
    minimum: [
      /(?:above|over|more\s+than|min(?:imum)?|at\s+least|starting\s+(?:from|at)|from|no\s+less\s+than|floor)\s+(?:is\s+)?(?:around\s+)?[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:minimum|min|starting|from|above|over|at\s+least)\s+[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:or\s+)?(?:more|plus|minimum|min|and\s+up|upwards?)/gi
    ],
    range: [
      /(?:between|from)\s+[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:and|to|through|\-)\s+[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:\-|to|through)\s*[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:range|span)\s+(?:of\s+)?[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s+to\s+[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    exact: [
      /(?:exactly|precisely|around|about|approximately|roughly|near|close\s+to)\s+[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:target|looking\s+for|want|need)\s+(?:around\s+)?[D\$€£]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ]
  };

  // Noise words that should be filtered out
  private static readonly NOISE_WORDS = new Set([
    'year', 'years', 'month', 'months', 'week', 'weeks', 'day', 'days',
    'hour', 'hours', 'minute', 'minutes', 'second', 'seconds',
    'percent', 'percentage', '%', 'degree', 'degrees', 'miles', 'km',
    'feet', 'inches', 'pounds', 'kg', 'grams', 'ounces', 'sq', 'square'
  ]);

  private static normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s\$€£D,.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static extractNumbersWithContext(text: string): NumberMatch[] {
    const matches: NumberMatch[] = [];
    
    // Try currency-specific patterns first (prioritize Dalasi)
    for (const [currency, pattern] of Object.entries(this.CURRENCY_PATTERNS)) {
      if (currency === 'generic') continue;
      
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(text)) !== null) {
        const value = this.parseNumber(match[1]);
        if (value !== null && this.isReasonablePrice(value)) {
          matches.push({
            value,
            index: match.index,
            raw: match[0],
            currency: currency === 'dalasi' ? 'D' : currency
          });
        }
      }
    }

    // If no currency-specific matches, try generic numbers
    if (matches.length === 0) {
      const genericPattern = this.CURRENCY_PATTERNS.generic;
      let match;
      genericPattern.lastIndex = 0;
      while ((match = genericPattern.exec(text)) !== null) {
        const value = this.parseNumber(match[1]);
        if (value !== null && this.isReasonablePrice(value) && this.isLikelyPrice(text, match.index)) {
          matches.push({
            value,
            index: match.index,
            raw: match[0],
            currency: 'D' // Default to Dalasi
          });
        }
      }
    }

    return matches.sort((a, b) => a.index - b.index);
  }

  private static parseNumber(numStr: string): number | null {
    if (!numStr) return null;
    
    const cleaned = numStr.replace(/[,D\$€£]/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? null : num;
  }

  private static isReasonablePrice(value: number): boolean {
    // For Gambian market - reasonable price range
    if (value < 0 || value > 50000000) return false; // Up to 50M Dalasi
    
    // Filter out likely years (1900-2100)
    if (value >= 1900 && value <= 2100) return false;
    
    // Filter out unreasonably small amounts (likely not property prices)
    if (value < 1000) return false;
    
    return true;
  }

  private static isLikelyPrice(text: string, index: number): boolean {
    const contextWindow = 50;
    const start = Math.max(0, index - contextWindow);
    const end = Math.min(text.length, index + contextWindow);
    const context = text.slice(start, end);
    
    // Check for price-related keywords
    const priceKeywords = /(?:price|cost|budget|afford|pay|spend|dalasi|money|fee|charge|rate)/i;
    if (priceKeywords.test(context)) return true;
    
    // Check for currency symbols nearby
    if (/[D\$€£]/.test(context)) return true;
    
    // Check for property context
    const propertyKeywords = /(?:property|house|apartment|rent|sale|buy|sell)/i;
    if (propertyKeywords.test(context)) return true;
    
    // Check for noise words that suggest it's not a price
    const words = context.split(/\s+/);
    for (const word of words) {
      if (this.NOISE_WORDS.has(word.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  }

  // private static extractNumbers(text: string): number[] {
  //   const matches = text.match(/\d+(?:k|,?\d{3})*(?:\.\d+)?/g) || [];
  //   return matches.map(match => {
  //     const cleaned = match.replace(/,/g, '');
  //     if (cleaned.endsWith('k') || cleaned.endsWith('K')) {
  //       return parseFloat(cleaned.slice(0, -1)) * 1000;
  //     }
  //     return parseFloat(cleaned);
  //   }).filter(num => !isNaN(num));
  // }

  private static extractBedrooms(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*(?:bed|bedroom|br|bedrooms)/i,
      /(\d+)\s*b(?:\s|$)/i,
      /(?:bed|bedroom|br|bedrooms)\s*(\d+)/i,
      /(\d+)\s*(?:bed\s*room|bed-room)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const beds = parseInt(match[1]);
        if (beds >= 1 && beds <= 15) return beds; // Extended range for larger properties
      }
    }
    return undefined;
  }

  private static extractBathrooms(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*(?:bath|bathroom|ba|bathrooms)/i,
      /(\d+)\s*ba\b/i,
      /(?:bath|bathroom|ba|bathrooms)\s*(\d+)/i,
      /(\d+)\s*(?:bath\s*room|bath-room)/i,
      /(\d+)\s*(?:toilet|wc)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const baths = parseInt(match[1]);
        if (baths >= 1 && baths <= 10) return baths;
      }
    }
    return undefined;
  }

  private static extractPropertyType(text: string): string | undefined {
    const normalized = this.normalizeText(text);
    
    // Use fuzzy matching for better results
    for (const [type, keywords] of Object.entries(this.PROPERTY_TYPES_MAP)) {
      for (const keyword of keywords) {
        // Exact match
        if (normalized.includes(keyword)) {
          return type;
        }
        // Fuzzy match for typos
        if (this.fuzzyMatch(normalized, keyword, 0.8)) {
          return type;
        }
      }
    }
    return undefined;
  }

  private static extractListingType(text: string): 'sale' | 'rent' | undefined {
    const normalized = this.normalizeText(text);
    
    for (const [type, keywords] of Object.entries(this.LISTING_TYPES_MAP)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          return type as 'sale' | 'rent';
        }
      }
    }
    return undefined;
  }

  private static extractLocation(text: string): string | undefined {
    const normalized = this.normalizeText(text);
    
    // Look for location patterns with prepositions
    const locationPatterns = [
      /(?:in|at|near|around|from|to)\s+([a-z\s]+?)(?:\s|$|,|\.|;)/i,
      /([a-z\s]+?)\s+area/i,
      /([a-z\s]+?)\s+region/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        const location = this.normalizeText(match[1]);
        const found = this.findBestLocationMatch(location);
        if (found) return found;
      }
    }

    // Direct location match with fuzzy matching
    const found = this.findBestLocationMatch(normalized);
    if (found) return found;

    return undefined;
  }

  private static findBestLocationMatch(input: string): string | undefined {
    // Exact match first
    let bestMatch = this.LOCATIONS.find(loc => input.includes(loc) || loc.includes(input));
    if (bestMatch) return bestMatch;

    // Check aliases
    for (const [location, aliases] of Object.entries(this.LOCATION_ALIASES)) {
      if (aliases.some(alias => input.includes(alias) || alias.includes(input))) {
        return location;
      }
    }

    // Fuzzy matching for typos
    for (const location of this.LOCATIONS) {
      if (this.fuzzyMatch(input, location, 0.7)) {
        return location;
      }
    }

    return undefined;
  }

  private static fuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return true;
    
    const similarity = (longer.length - this.levenshteinDistance(longer, shorter)) / longer.length;
    return similarity >= threshold;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private static extractPriceRange(text: string): PriceParseResult {
    if (!text || typeof text !== 'string') {
      return {
        confidence: 0,
        type: 'range',
        originalText: text || ''
      };
    }

    const normalizedText = this.normalizeText(text);
    const numbers = this.extractNumbersWithContext(normalizedText);
    
    if (numbers.length === 0) {
      return {
        confidence: 0,
        type: 'range',
        originalText: text
      };
    }

    // Try to match specific patterns first
    const patternResult = this.matchPricePatterns(normalizedText, numbers);
    if (patternResult.confidence > 0.7) {
      return patternResult;
    }

    // Fallback to contextual analysis
    return this.analyzePriceContext(normalizedText, numbers);
  }

  private static matchPricePatterns(text: string, numbers: NumberMatch[]): PriceParseResult {
    // Try range patterns first
    for (const pattern of this.PRICE_PATTERNS.range) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const min = this.parseNumber(match[1]);
        const max = this.parseNumber(match[2]);
        if (min !== null && max !== null) {
          return {
            min: Math.min(min, max),
            max: Math.max(min, max),
            confidence: 0.95,
            type: 'range',
            currency: numbers[0]?.currency || 'D',
            originalText: text
          };
        }
      }
    }

    // Try maximum patterns
    for (const pattern of this.PRICE_PATTERNS.maximum) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const max = this.parseNumber(match[1]);
        if (max !== null) {
          return {
            max,
            confidence: 0.9,
            type: 'maximum',
            currency: numbers[0]?.currency || 'D',
            originalText: text
          };
        }
      }
    }

    // Try minimum patterns
    for (const pattern of this.PRICE_PATTERNS.minimum) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const min = this.parseNumber(match[1]);
        if (min !== null) {
          return {
            min,
            confidence: 0.9,
            type: 'minimum',
            currency: numbers[0]?.currency || 'D',
            originalText: text
          };
        }
      }
    }

    // Try exact patterns
    for (const pattern of this.PRICE_PATTERNS.exact) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        const exact = this.parseNumber(match[1]);
        if (exact !== null) {
          return {
            min: exact,
            max: exact,
            confidence: 0.85,
            type: 'exact',
            currency: numbers[0]?.currency || 'D',
            originalText: text
          };
        }
      }
    }

    return {
      confidence: 0,
      type: 'range',
      originalText: text
    };
  }

  private static analyzePriceContext(text: string, numbers: NumberMatch[]): PriceParseResult {
    if (numbers.length === 0) {
      return {
        confidence: 0,
        type: 'range',
        originalText: text
      };
    }

    if (numbers.length === 1) {
      return this.analyzeSinglePriceNumber(text, numbers[0]);
    }

    if (numbers.length === 2) {
      return this.analyzeTwoPriceNumbers(text, numbers);
    }

    // Multiple numbers - find most relevant
    const relevantNumbers = this.findRelevantPriceNumbers(text, numbers);
    if (relevantNumbers.length >= 2) {
      return this.analyzeTwoPriceNumbers(text, relevantNumbers.slice(0, 2));
    }

    return this.analyzeSinglePriceNumber(text, relevantNumbers[0] || numbers[0]);
  }

  private static analyzeSinglePriceNumber(text: string, number: NumberMatch): PriceParseResult {
    const numberIndex = text.indexOf(number.raw);
    
    // Get context around the number
    const beforeContext = text.slice(Math.max(0, numberIndex - 30), numberIndex);
    const afterContext = text.slice(numberIndex + number.raw.length, numberIndex + number.raw.length + 30);
    const fullContext = beforeContext + afterContext;
    
    // Check for maximum indicators
    if (/(?:under|below|max|budget|afford|up\s+to|ceiling|cap)/i.test(fullContext)) {
      return {
        max: number.value,
        confidence: 0.85,
        type: 'maximum',
        currency: number.currency || 'D',
        originalText: text
      };
    }
    
    // Check for minimum indicators
    if (/(?:above|over|min|from|starting|at\s+least|floor)/i.test(fullContext)) {
      return {
        min: number.value,
        confidence: 0.85,
        type: 'minimum',
        currency: number.currency || 'D',
        originalText: text
      };
    }
    
    // Check for exact indicators
    if (/(?:exactly|precisely|around|about|approximately)/i.test(fullContext)) {
      return {
        min: number.value,
        max: number.value,
        confidence: 0.8,
        type: 'exact',
        currency: number.currency || 'D',
        originalText: text
      };
    }

    // Default context analysis - budget-related terms suggest maximum
    if (/(?:budget|afford|spend|cost|price|looking)/i.test(text)) {
      return {
        max: number.value,
        confidence: 0.7,
        type: 'budget',
        currency: number.currency || 'D',
        originalText: text
      };
    }

    // Default fallback - treat as maximum (conservative approach)
    return {
      max: number.value,
      confidence: 0.5,
      type: 'maximum',
      currency: number.currency || 'D',
      originalText: text
    };
  }

  private static analyzeTwoPriceNumbers(text: string, numbers: NumberMatch[]): PriceParseResult {
    const [first, second] = numbers;
    const between = text.slice(first.index + first.raw.length, second.index);
    
    // Check for range indicators
    if (/(?:to|through|\-|and|between)/i.test(between)) {
      return {
        min: Math.min(first.value, second.value),
        max: Math.max(first.value, second.value),
        confidence: 0.9,
        type: 'range',
        currency: first.currency || second.currency || 'D',
        originalText: text
      };
    }

    // If no clear range indicator, analyze each separately and return higher confidence
    const firstResult = this.analyzeSinglePriceNumber(text, first);
    const secondResult = this.analyzeSinglePriceNumber(text, second);
    
    return firstResult.confidence >= secondResult.confidence ? firstResult : secondResult;
  }

  private static findRelevantPriceNumbers(text: string, numbers: NumberMatch[]): NumberMatch[] {
    return numbers
      .map(num => {
        let score = 0;
        const contextStart = Math.max(0, num.index - 30);
        const contextEnd = Math.min(text.length, num.index + num.raw.length + 30);
        const context = text.slice(contextStart, contextEnd);
        
        // Higher score for currency symbols
        if (num.currency && num.currency !== 'generic') score += 10;
        
        // Higher score for price-related context
        if (/(?:price|cost|budget|afford|pay|spend|dalasi)/i.test(context)) score += 5;
        
        // Lower score for time/measurement context
        if (/(?:year|month|day|hour|time|sq|square|feet)/i.test(context)) score -= 5;
        
        return { ...num, score };
      })
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, 3);
  }

  private static extractFeatures(text: string): boolean {
    const featuredWords = ['featured', 'premium', 'luxury', 'exclusive', 'special', 'vip', 'executive', 'high-end'];
    const normalized = this.normalizeText(text);
    return featuredWords.some(word => normalized.includes(word));
  }

  private static extractAmenities(text: string): string[] {
    const normalized = this.normalizeText(text);
    const foundAmenities: string[] = [];
    
    for (const amenity of this.AMENITY_KEYWORDS) {
      if (normalized.includes(amenity)) {
        foundAmenities.push(amenity);
      }
    }
    
    // Group related amenities
    const amenityGroups = {
      'parking': ['parking', 'garage'],
      'pool': ['pool', 'swimming pool'],
      'security': ['security', 'gated'],
      'furnished': ['furnished'],
      'air_conditioning': ['air conditioning', 'ac']
    };
    
    const groupedAmenities: string[] = [];
    for (const [group, keywords] of Object.entries(amenityGroups)) {
      if (keywords.some(keyword => foundAmenities.includes(keyword))) {
        groupedAmenities.push(group);
      }
    }
    
    return groupedAmenities.length > 0 ? groupedAmenities : foundAmenities.slice(0, 5); // Limit to 5 amenities
  }

  private static calculateConfidence(text: string, parsedData: any): number {
    let confidence = 50; // Base confidence
    const normalized = this.normalizeText(text);
    
    // Boost for recognized patterns
    if (parsedData.bedrooms) confidence += 15;
    if (parsedData.bathrooms) confidence += 10;
    if (parsedData.property_type) confidence += 15;
    if (parsedData.listing_type) confidence += 15;
    if (parsedData.city) confidence += 20;
    if (parsedData.min_price || parsedData.max_price) confidence += 15;
    if (parsedData.featured_only) confidence += 5;
    
    // Penalize for very short queries
    if (text.length < 5) confidence -= 20;
    
    // Boost for complete queries
    if (text.length > 20) confidence += 10;
    
    // Check for structured vs unstructured content
    const structuredElements = [
      parsedData.bedrooms,
      parsedData.bathrooms,
      parsedData.property_type,
      parsedData.listing_type,
      parsedData.city,
      parsedData.min_price,
      parsedData.max_price
    ].filter(Boolean).length;
    
    if (structuredElements >= 3) confidence += 15;
    
    // Check for typos and unclear terms using fuzzy matching
    const words = normalized.split(' ');
    let recognizedWords = 0;
    
    for (const word of words) {
      // Skip very short words
      if (word.length <= 2) continue;
      
      const isRecognized = 
        this.LOCATIONS.some(loc => this.fuzzyMatch(word, loc, 0.7)) ||
        Object.values(this.PROPERTY_TYPES_MAP).flat().some(type => this.fuzzyMatch(word, type, 0.7)) ||
        Object.values(this.LISTING_TYPES_MAP).flat().some(type => this.fuzzyMatch(word, type, 0.7)) ||
        this.AMENITY_KEYWORDS.some(amenity => this.fuzzyMatch(word, amenity, 0.7)) ||
        /\d+/.test(word) ||
        ['bed', 'bath', 'room', 'price', 'under', 'over', 'in', 'at', 'near', 'with', 'has'].includes(word);
        
      if (isRecognized) recognizedWords++;
    }
    
    const recognitionRatio = recognizedWords / Math.max(words.length, 1);
    confidence += (recognitionRatio * 20);
    
    // Boost for price parsing confidence
    if (parsedData.priceConfidence) {
      confidence += (parsedData.priceConfidence * 10);
    }
    
    return Math.min(95, Math.max(10, Math.round(confidence)));
  }

  private static generateInterpretation(params: Partial<SearchParams>): string {
    const parts: string[] = [];
    
    if (params.property_type) {
      const typeLabel = PROPERTY_TYPES.find(pt => pt.value === params.property_type)?.label || params.property_type;
      parts.push(`${typeLabel.toLowerCase()}s`);
    }
    
    if (params.listing_type) parts.push(`for ${params.listing_type}`);
    
    if (params.min_bedrooms) parts.push(`${params.min_bedrooms}+ bedroom${params.min_bedrooms > 1 ? 's' : ''}`);
    
    if (params.min_bathrooms) parts.push(`${params.min_bathrooms}+ bathroom${params.min_bathrooms > 1 ? 's' : ''}`);
    
    if (params.min_price || params.max_price) {
      if (params.min_price && params.max_price) {
        parts.push(`D${params.min_price.toLocaleString()} - D${params.max_price.toLocaleString()}`);
      } else if (params.max_price) {
        parts.push(`under D${params.max_price.toLocaleString()}`);
      } else if (params.min_price) {
        parts.push(`over D${params.min_price.toLocaleString()}`);
      }
    }
    
    if (params.city) {
      const cityName = params.city.charAt(0).toUpperCase() + params.city.slice(1);
      parts.push(`in ${cityName}`);
    }
    
    if (params.featured_only) parts.push('featured properties');
    
    if (params.search_text && !parts.some(part => part.includes('properties'))) {
      parts.push('matching your criteria');
    }
    
    return parts.length > 0 ? parts.join(', ') : 'all properties';
  }

  private static generateSuggestions(query: string, parsedParams: Partial<SearchParams>): string[] {
    const suggestions: string[] = [];
    const normalized = this.normalizeText(query);
    
    // Location suggestions if no location found
    if (!parsedParams.city) {
      const nearbyLocations = this.LOCATIONS.filter(loc => 
        this.fuzzyMatch(normalized, loc, 0.5) || normalized.includes(loc.substring(0, 3))
      );
      if (nearbyLocations.length > 0) {
        suggestions.push(`Did you mean "${nearbyLocations[0]}"?`);
      }
    }
    
    // Property type suggestions
    if (!parsedParams.property_type) {
      for (const [type, keywords] of Object.entries(this.PROPERTY_TYPES_MAP)) {
        if (keywords.some(keyword => this.fuzzyMatch(normalized, keyword, 0.6))) {
          const label = PROPERTY_TYPES.find(pt => pt.value === type)?.label || type;
          suggestions.push(`Try "${label.toLowerCase()}" instead`);
          break;
        }
      }
    }
    
    // Price range suggestions
    if (!parsedParams.min_price && !parsedParams.max_price) {
      const hasNumbers = /\d+/.test(query);
      if (hasNumbers) {
        suggestions.push('Specify "under", "over", or "between" for price ranges');
      }
    }
    
    // Room suggestions
    if (!parsedParams.min_bedrooms && /room|space/.test(normalized)) {
      suggestions.push('Specify number of bedrooms (e.g., "3 bedroom")');
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private static validateAndNormalizePriceRange(priceResult: PriceParseResult): { min?: number; max?: number } {
    const result: { min?: number; max?: number } = {};
    
    if (priceResult.min !== undefined) {
      result.min = Math.round(priceResult.min);
    }
    
    if (priceResult.max !== undefined) {
      result.max = Math.round(priceResult.max);
    }
    
    // Ensure min <= max
    if (result.min !== undefined && result.max !== undefined && result.min > result.max) {
      [result.min, result.max] = [result.max, result.min];
    }
    
    // Apply reasonable bounds for Gambian market
    if (result.min !== undefined && result.min < 1000) result.min = 1000;
    if (result.max !== undefined && result.max > 50000000) result.max = 50000000;
    
    return result;
  }

  static parseQuery(query: string): ParsedQuery {
    if (!query?.trim()) {
      return {
        searchParams: {},
        confidence: 0,
        interpretedAs: 'all properties',
        suggestions: ['Try searching for "2 bedroom apartment in Serekunda"', 'Search "house for sale under D500,000"', 'Look for "furnished villa in Kololi"']
      };
    }

    const searchParams: Partial<SearchParams> = {};
    let priceConfidence = 0;
    
    try {
      // Extract structured data with enhanced parsing
      const bedrooms = this.extractBedrooms(query);
      if (bedrooms) searchParams.min_bedrooms = bedrooms;
      
      const bathrooms = this.extractBathrooms(query);
      if (bathrooms) searchParams.min_bathrooms = bathrooms;
      
      const propertyType = this.extractPropertyType(query);
      if (propertyType) searchParams.property_type = propertyType as PropertyListing['property_type'];
      
      const listingType = this.extractListingType(query);
      if (listingType) searchParams.listing_type = listingType;
      
      const location = this.extractLocation(query);
      if (location) searchParams.city = location;
      
      // Enhanced price parsing using the new enterprise parser
      const priceResult = this.extractPriceRange(query);
      if (priceResult.confidence > 0.3) {
        const normalizedPrice = this.validateAndNormalizePriceRange(priceResult);
        if (normalizedPrice.min) searchParams.min_price = normalizedPrice.min;
        if (normalizedPrice.max) searchParams.max_price = normalizedPrice.max;
        priceConfidence = priceResult.confidence;
      }
      
      const featured = this.extractFeatures(query);
      if (featured) searchParams.featured_only = true;
      
      const amenities = this.extractAmenities(query);
      if (amenities.length > 0) {
        // You can extend this to map amenities to your amenity_ids system
        // For now, we'll add them to search_text for full-text search
      }
      
      // Enhanced descriptive terms detection
      const descriptiveTerms = /\b(modern|new|spacious|furnished|unfurnished|renovated|updated|beautiful|stunning|cozy|bright|quiet|secure|gated|pool|garden|parking|balcony|terrace|view|ocean|sea|beach|compound|bungalow|duplex|penthouse|studio|executive|luxury|affordable|cheap|expensive|prime|central|suburban|waterfront|beachfront)\b/gi;
      
      const descriptiveMatches = query.match(descriptiveTerms);
      if (descriptiveMatches && descriptiveMatches.length > 0) {
        // Combine original query with extracted structured data for better search
        const structuredTerms = [
          bedrooms && `${bedrooms} bedroom`,
          bathrooms && `${bathrooms} bathroom`,
          propertyType,
          listingType,
          location
        ].filter(Boolean);
        
        const remainingText = query.toLowerCase();
        const hasUnstructuredContent = descriptiveMatches.length > 0 ||
          remainingText.split(' ').some(word =>
            word.length > 3 &&
            !structuredTerms.some(term => term && String(term).toLowerCase().includes(word))
          );
          
        if (hasUnstructuredContent) {
          searchParams.search_text = query;
        }
      }
      
      // Calculate confidence with price parsing confidence
      const tempParams = { ...searchParams, priceConfidence };
      const confidence = this.calculateConfidence(query, tempParams);
      const interpretedAs = this.generateInterpretation(searchParams);
      const suggestions = this.generateSuggestions(query, searchParams);
      
      return {
        searchParams,
        confidence,
        interpretedAs,
        suggestions
      };
      
    } catch (error) {
      console.warn('Error parsing search query:', error);
      
      // Fallback to basic text search
      return {
        searchParams: { search_text: query },
        confidence: 20,
        interpretedAs: 'text search for: ' + query,
        suggestions: ['Try using specific terms like "3 bedroom house"', 'Include location like "in Serekunda"', 'Specify price range like "under D200,000"']
      };
    }
  }

  // Utility method for testing and debugging
  static testParser(queries: string[]): void {
    console.log('=== Smart Search Parser Test Results ===\n');
    
    queries.forEach((query, index) => {
      console.log(`Test ${index + 1}: "${query}"`);
      const result = this.parseQuery(query);
      console.log('Parsed Parameters:', result.searchParams);
      console.log('Confidence:', result.confidence + '%');
      console.log('Interpreted As:', result.interpretedAs);
      if (result.suggestions.length > 0) {
        console.log('Suggestions:', result.suggestions);
      }
      console.log('---\n');
    });
  }

  // Method to get available options for UI components
  static getAvailableOptions() {
    return {
      locations: this.LOCATIONS,
      propertyTypes: Object.keys(this.PROPERTY_TYPES_MAP),
      amenities: this.AMENITY_KEYWORDS,
      currencies: ['D', 'USD', 'EUR', 'GBP']
    };
  }

  // Method to validate search parameters
  static validateSearchParams(params: Partial<SearchParams>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (params.min_price && params.max_price && params.min_price > params.max_price) {
      errors.push('Minimum price cannot be greater than maximum price');
    }
    
    if (params.min_bedrooms && params.min_bedrooms < 0) {
      errors.push('Number of bedrooms must be positive');
    }
    
    if (params.min_bathrooms && params.min_bathrooms < 0) {
      errors.push('Number of bathrooms must be positive');
    }
    
    if (params.property_type && !Object.keys(this.PROPERTY_TYPES_MAP).includes(params.property_type)) {
      errors.push('Invalid property type');
    }
    
    if (params.listing_type && !['sale', 'rent'].includes(params.listing_type)) {
      errors.push('Invalid listing type');
    }
    
    if (params.city && !this.LOCATIONS.includes(params.city.toLowerCase())) {
      // Check if it's a reasonable location name
      const isValidLocation = this.LOCATIONS.some(loc => 
        this.fuzzyMatch(params.city!.toLowerCase(), loc, 0.7)
      );
      if (!isValidLocation) {
        errors.push('Location not recognized');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Enhanced SearchResults Component with AI-Powered Search
 */
const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State management
  const [searchState, setSearchState] = useState<SearchState>({
    properties: [],
    totalCount: 0,
    hasMore: false,
    loading: true,
    error: null,
    page: 1
  });

  const [uiState, setUIState] = useState<UIState>({
    viewMode: 'grid',
    showFilters: false,
    showSortMenu: false,
    showMobileSearch: false
  });

  const [filters, setFilters] = useState<FilterState>({ amenity_ids: [] });
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  
  // Enhanced search state
  const [searchQuery, setSearchQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoized values
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'amenity_ids') return Array.isArray(value) && value.length > 0;
      return value !== undefined && value !== null && value !== '' && value !== false;
    }).length;
  }, [filters]);

  const currentSortLabel = useMemo(() => {
    const option = SORT_OPTIONS.find(
      opt => opt.value === filters.sort_by && opt.order === filters.sort_order
    );
    return option?.label || 'Newest First';
  }, [filters.sort_by, filters.sort_order]);

  // Utility functions
  const buildUrlParams = useCallback((filterState: FilterState) => {
    const params = new URLSearchParams();
    
    Object.entries(filterState).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === false) return;
      
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v.toString()));
      } else {
        params.set(key, String(value));
      }
    });
    
    return params;
  }, []);

  const parseUrlFilters = useCallback((): FilterState => {
    return {
      search_text: searchParams.get('search_text') || undefined,
      property_type: searchParams.get('property_type') as PropertyListing['property_type'] || undefined,
      listing_type: searchParams.get('listing_type') as PropertyListing['listing_type'] || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      min_bedrooms: searchParams.get('min_bedrooms') ? Number(searchParams.get('min_bedrooms')) : undefined,
      max_bedrooms: searchParams.get('max_bedrooms') ? Number(searchParams.get('max_bedrooms')) : undefined,
      min_bathrooms: searchParams.get('min_bathrooms') ? Number(searchParams.get('min_bathrooms')) : undefined,
      max_bathrooms: searchParams.get('max_bathrooms') ? Number(searchParams.get('max_bathrooms')) : undefined,
      city: searchParams.get('city') || undefined,
      location_id: searchParams.get('location_id') || undefined,
      amenity_ids: searchParams.getAll('amenity_ids'),
      featured_only: searchParams.get('featured') === 'true',
      sort_by: searchParams.get('sort_by') || DEFAULT_SORT.sort_by,
      sort_order: searchParams.get('sort_order') || DEFAULT_SORT.sort_order
    };
  }, [searchParams]);

  // Enhanced search functions
  const generateSearchSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions: string[] = [];
    const normalized = query.toLowerCase();

    // Common search patterns
    const patterns = [
      '2 bedroom apartment in Banjul',
      '3 bed house for sale',
      'villa for rent in Serekunda', 
      'apartment under D100,000',
      'luxury house with pool',
      'furnished apartment in Kololi',
      '1 bed flat for rent',
      'commercial property in Banjul',
      'land for sale in Sukuta',
      'townhouse with parking'
    ];

    // Add relevant suggestions based on current input
    patterns.forEach(pattern => {
      if (pattern.toLowerCase().includes(normalized) || 
          normalized.split(' ').some(word => pattern.toLowerCase().includes(word))) {
        suggestions.push(pattern);
      }
    });

    // Add location-specific suggestions
    const locations = ['Banjul', 'Serekunda', 'Bakau', 'Sukuta', 'Kololi'];
    locations.forEach(location => {
      if (location.toLowerCase().includes(normalized)) {
        suggestions.push(`Properties in ${location}`);
        suggestions.push(`2 bed apartment in ${location}`);
      }
    });

    setSearchSuggestions(suggestions.slice(0, 5));
  }, []);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce parsing and suggestions
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        const parsed = SmartSearchParser.parseQuery(value);
        setParsedQuery(parsed);
        generateSearchSuggestions(value);
      } else {
        setParsedQuery(null);
        setSearchSuggestions([]);
      }
    }, 300);
  }, [generateSearchSuggestions]);

  const executeSmartSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Empty search - show all properties
      const emptyFilters: FilterState = { ...DEFAULT_SORT, amenity_ids: [] };
      setFilters(emptyFilters);
      setSearchParams(new URLSearchParams());
      performSearch(emptyFilters, 1);
      return;
    }

    setIsProcessing(true);
    setShowSuggestions(false);

    try {
      // Parse the natural language query
      const parsed = SmartSearchParser.parseQuery(query);
      setParsedQuery(parsed);

      // Convert parsed params to filter state
      const newFilters: FilterState = {
        ...DEFAULT_SORT,
        ...parsed.searchParams,
        amenity_ids: []
      };

      setFilters(newFilters);
      const params = buildUrlParams(newFilters);
      setSearchParams(params);
      
      // Show feedback for high confidence parses
      if (parsed.confidence > 70) {
        toast.success('Smart search activated', {
          description: `Searching for ${parsed.interpretedAs} (${parsed.confidence}% confidence)`
        });
      }

      await performSearch(newFilters, 1);

    } catch (error) {
      console.error('Smart search error:', error);
      // Fallback to simple text search
      const fallbackFilters: FilterState = {
        ...DEFAULT_SORT,
        search_text: query,
        amenity_ids: []
      };
      
      setFilters(fallbackFilters);
      setSearchParams(buildUrlParams(fallbackFilters));
      await performSearch(fallbackFilters, 1);
      
      toast.error('Search parsing failed', {
        description: 'Using basic text search instead'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [buildUrlParams, setSearchParams]);

  // API calls
  const loadAmenities = useCallback(async () => {
    try {
      const data = await PropertiesService.getAmenities();
      setAmenities(data);
    } catch (error) {
      console.error('Failed to load amenities:', error);
      toast.error('Failed to load search filters');
    }
  }, []);

  const performSearch = useCallback(async (
    searchFilters: FilterState, 
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      setSearchState(prev => ({ ...prev, loading: true, error: null }));

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const searchParams: SearchParams = {
        ...searchFilters,
        limit: ITEMS_PER_PAGE,
        offset
      };

      const result = await PropertiesService.searchProperties(searchParams);
      
      const processedProperties = result.properties.map(property => ({
        ...property,
        price: typeof property.price === 'string' ? parseFloat(property.price) : property.price,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        square_feet: property.square_feet || 0
      }));

      setSearchState(prev => ({
        ...prev,
        properties: append ? [...prev.properties, ...processedProperties] : processedProperties,
        totalCount: result.total_count,
        hasMore: result.has_more,
        page,
        loading: false
      }));

    } catch (error) {
      console.error('Search failed:', error);
      const errorMessage = 'Failed to load properties. Please try again.';
      
      setSearchState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      
      toast.error('Search failed', { description: errorMessage });
    }
  }, []);

  // Event handlers
  const handleFilterChange = useCallback(<K extends keyof FilterState>(
    key: K, 
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAmenityToggle = useCallback((amenityId: string) => {
    setFilters(prev => {
      const currentIds = prev.amenity_ids || [];
      const newIds = currentIds.includes(amenityId)
        ? currentIds.filter(id => id !== amenityId)
        : [...currentIds, amenityId];
      
      return { ...prev, amenity_ids: newIds };
    });
  }, []);

  const handleQuickFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { 
      ...filters, 
      [key]: filters[key] === value ? undefined : value 
    };
    
    setFilters(newFilters);
    setSearchParams(buildUrlParams(newFilters));
    performSearch(newFilters, 1);
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  const applyFilters = useCallback(() => {
    const params = buildUrlParams(filters);
    setSearchParams(params);
    performSearch(filters, 1);
    setUIState(prev => ({ ...prev, showFilters: false, showMobileSearch: false }));
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = { 
      ...DEFAULT_SORT,
      amenity_ids: [] 
    };
    
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams());
    setSearchQuery('');
    setParsedQuery(null);
    performSearch(clearedFilters, 1);
  }, [setSearchParams, performSearch]);

  const handleSort = useCallback((sortBy: string, sortOrder: string = 'DESC') => {
    const newFilters = { ...filters, sort_by: sortBy, sort_order: sortOrder };
    setFilters(newFilters);
    setSearchParams(buildUrlParams(newFilters));
    performSearch(newFilters, 1);
    setUIState(prev => ({ ...prev, showSortMenu: false }));
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  const handleLoadMore = useCallback(() => {
    const nextPage = searchState.page + 1;
    performSearch(filters, nextPage, true);
  }, [searchState.page, filters, performSearch]);

  const removeFilter = useCallback((key: keyof FilterState | 'price') => {
    const newFilters = { ...filters };
    if (key === 'price') {
      delete newFilters.min_price;
      delete newFilters.max_price;
    } else {
      delete newFilters[key];
    }
    
    setFilters(newFilters);
    setSearchParams(buildUrlParams(newFilters));
    performSearch(newFilters, 1);
  }, [filters, buildUrlParams, setSearchParams, performSearch]);

  // Effects
  useEffect(() => {
    loadAmenities();
  }, [loadAmenities]);

  useEffect(() => {
    const urlFilters = parseUrlFilters();
    setFilters(urlFilters);
    performSearch(urlFilters, 1);
    
    // Set search query from URL if present
    const searchText = searchParams.get('search_text');
    if (searchText) {
      setSearchQuery(searchText);
    }
  }, [searchParams, parseUrlFilters, performSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      
      if (uiState.showSortMenu) {
        setUIState(prev => ({ ...prev, showSortMenu: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [uiState.showSortMenu]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Render helpers
  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3 px-4 sm:px-0">
        {filters.property_type && (
          <FilterTag
            label={PROPERTY_TYPES.find(t => t.value === filters.property_type)?.label || filters.property_type}
            onRemove={() => removeFilter('property_type')}
          />
        )}
        {filters.listing_type && (
          <FilterTag
            label={filters.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
            onRemove={() => removeFilter('listing_type')}
          />
        )}
        {filters.min_bedrooms && (
          <FilterTag
            label={`${filters.min_bedrooms}+ bedrooms`}
            onRemove={() => removeFilter('min_bedrooms')}
          />
        )}
        {(filters.min_price || filters.max_price) && (
          <FilterTag
            label={`Price: ${filters.min_price ? `D${filters.min_price.toLocaleString()}` : '0'} - ${filters.max_price ? `D${filters.max_price.toLocaleString()}` : '∞'}`}
            onRemove={() => removeFilter('price')}
          />
        )}
        {filters.city && (
          <FilterTag
            label={filters.city}
            onRemove={() => removeFilter('city')}
          />
        )}
        {filters.featured_only && (
          <FilterTag
            label="Featured"
            onRemove={() => removeFilter('featured_only')}
          />
        )}
      </div>
    );
  };

const renderEnhancedSearchInput = () => (
  <div className="relative">
    {/* Search Input and Button Container */}
    <div className="flex items-center gap-3 ">
      {/* AI-Powered Search Input */}
      <div className="relative flex-1 group">
        {/* Subtle gradient border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7fd783]/20 via-blue-500/20 to-purple-600/20 rounded-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
        
        {/* Subtle AI-Powered Animated Gradient Border */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7fd783]/60 via-blue-500/60 to-purple-600/60 via-[#7fd783]/60 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 animate-gradient-x bg-[length:200%_200%]"></div>
        
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 group-focus-within:border-[#7fd783]/30 group-focus-within:shadow-lg transition-all duration-300">
          {/* Subtle inner gradient for active state */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-3 transition-opacity duration-300 bg-gradient-to-r from-[#7fd783]/10 via-blue-500/10 to-purple-600/10"></div>
          
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            {isProcessing ? (
              <Loader2 className="h-5 w-5 text-[#7fd783] animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#7fd783] transition-all duration-300" />
            )}
          </div>
          
          {/* Main Input */}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Try: '2 bed apartment in Banjul under 50k' or 'luxury villa for sale'"
            className="w-full pl-12 pr-16 py-4 rounded-2xl border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 focus:placeholder-gray-300 text-base bg-transparent relative z-5 transition-all duration-300"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                executeSmartSearch(searchQuery);
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              if (searchQuery.length > 1 && searchSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          
          {/* Right Side Actions - Only Clear and Confidence */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
            {/* AI Confidence Indicator */}
            {parsedQuery && parsedQuery.confidence > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs rounded-full border border-green-200/50 backdrop-blur-sm">
                <Brain className="h-3 w-3" />
                <span className="font-semibold">{parsedQuery.confidence}%</span>
              </div>
            )}
            
            {/* Clear Button */}
            {searchQuery && !isProcessing && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setParsedQuery(null);
                  setShowSuggestions(false);
                  searchInputRef.current?.focus();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                type="button"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Separate AI Search Button */}
      <div className="flex-shrink-0 relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#7fd783] to-[#5dd27c] rounded-full blur-lg opacity-30 hover:opacity-50 transition-opacity duration-300 -z-10"></div>
        
        <Button
          variant="colored"
          onClick={() => executeSmartSearch(searchQuery)}
          disabled={isProcessing || !searchQuery.trim()}
          className="px-6 py-4 font-semibold shadow-lg hover:shadow-xl disabled:shadow-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Analyzing...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2.5">
              <div className="relative">
                <Sparkles className="h-5 w-5 hover:animate-pulse" />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-sm animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium">AI Search</span>
            </span>
          )}
        </Button>
      </div>
    </div>

    {/* Smart Suggestions Dropdown */}
    {showSuggestions && searchSuggestions.length > 0 && (
      <div
        ref={suggestionsRef}
        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200/50 rounded-2xl shadow-2xl backdrop-blur-sm z-30 max-h-80 overflow-y-auto"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
              <div className="w-7 h-7 bg-gradient-to-br from-[#7fd783] to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              AI Suggestions
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#7fd783] font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-200/50">
              <Wand2 className="h-3 w-3" />
              Powered by AI
            </div>
          </div>
          
          {/* Suggestions List */}
          <div className="space-y-2">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(suggestion);
                  executeSmartSearch(suggestion);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-3.5 hover:bg-gradient-to-r hover:from-green-50/80 hover:to-blue-50/80 rounded-xl transition-all duration-200 group border border-transparent hover:border-green-200/50 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-[#7fd783] transition-colors mb-1">
                      {suggestion}
                    </div>
                    <div className="text-xs text-gray-500">
                      Smart search suggestion
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110">
                      <Sparkles className="h-4 w-4 text-[#7fd783]" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* Enhanced AI Parsing Feedback */}
    {parsedQuery && parsedQuery.confidence > 60 && (
      <div className="mt-4 p-4 bg-gradient-to-br from-green-50/80 via-blue-50/60 to-purple-50/40 rounded-2xl border border-green-200/50 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7fd783] to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-900">AI Understanding</h3>
              <div className="flex items-center gap-1 text-xs bg-white/70 px-2 py-0.5 rounded-full border border-green-200/50 text-green-700 font-medium">
                <CheckCircle className="h-3 w-3" />
                Verified
              </div>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed">
              Searching for{' '}
              <span className="font-semibold text-[#7fd783] bg-green-100/50 px-1.5 py-0.5 rounded-md">
                {parsedQuery.interpretedAs}
              </span>{' '}
              with{' '}
              <span className="font-semibold text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded-md">
                {parsedQuery.confidence}%
              </span>{' '}
              confidence
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-1 text-xs bg-white/80 px-3 py-1.5 rounded-full border border-green-200/50 text-green-700 font-medium shadow-sm">
              <Cpu className="h-3 w-3" />
              AI Powered
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* Required CSS Animation Styles */}
    <style>{`
      @keyframes gradient-x {
        0%, 100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }
      
      .animate-gradient-x {
        animation: gradient-x 1s ease infinite;
      }
      
      .bg-[length:200%_200%] {
        background-size: 200% 200%;
      }
    `}</style>
  </div>
);
  const renderSearchResults = () => {
    if (searchState.loading && searchState.properties.length === 0) {
      return <LoadingState />;
    }

    if (searchState.properties.length === 0) {
      return <EmptyState onClearFilters={clearAllFilters} onGoHome={() => navigate('/')} />;
    }

    return (
      <div className="px-4 sm:px-0">
        <div className={`grid ${
          uiState.viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        } gap-4 sm:gap-6 mb-8`}>
          {searchState.properties.map((property) => (
            <ListingCard
              key={property.id}
              id={property.id}
              imageUrl={property.primary_image || '/placeholder-property.jpg'}
              price={property.price}
              bedrooms={property.bedrooms || 0}
              bathrooms={property.bathrooms || 0}
              addressLine1={property.address}
              addressLine2={property.city}
              propertyType={property.property_type}
              listingType={property.listing_type}
              featured={property.featured}
            />
          ))}
        </div>

        {searchState.hasMore && (
          <div className="flex justify-center">
            <Button
              variant="colored"
              onClick={handleLoadMore}
              disabled={searchState.loading}
              className="px-6 sm:px-8 py-3 w-full sm:w-auto"
            >
              {searchState.loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                `Load More (${Math.min(ITEMS_PER_PAGE, searchState.totalCount - searchState.properties.length)} remaining)`
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto pb-6">
        {/* Mobile Search Header */}
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setUIState(prev => ({ ...prev, showMobileSearch: true }))}
                className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl text-left text-gray-500"
              >
                <Search className="h-5 w-5" />
                <span className="truncate">
                  {searchQuery || 'Try: 2 bed apartment in Banjul...'}
                </span>
                {parsedQuery && parsedQuery.confidence > 70 && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Brain className="h-4 w-4 text-[#7fd783]" />
                    <span className="text-xs text-[#7fd783] font-medium">{parsedQuery.confidence}%</span>
                  </div>
                )}
              </button>
              <button
                onClick={() => setUIState(prev => ({ ...prev, showFilters: true }))}
                className="ml-3 p-3 bg-[#7fd783] text-white rounded-xl relative"
              >
                <Filter className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Mobile Quick Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <MobileFilterButton
                active={filters.listing_type === 'sale'}
                onClick={() => handleQuickFilter('listing_type', 'sale')}
              >
                For Sale
              </MobileFilterButton>
              <MobileFilterButton
                active={filters.listing_type === 'rent'}
                onClick={() => handleQuickFilter('listing_type', 'rent')}
              >
                For Rent
              </MobileFilterButton>
              <MobileFilterButton
                active={!!filters.featured_only}
                onClick={() => handleQuickFilter('featured_only', true)}
              >
                <Star className="h-4 w-4 mr-1" />
                Featured
              </MobileFilterButton>
            </div>
          </div>
        </div>

        {/* Desktop Enhanced Search Header */}
        <div className="hidden lg:block px-4 pt-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col gap-4">
              {/* Enhanced AI Search Input */}
              {renderEnhancedSearchInput()}

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <QuickFilterButton
                  active={filters.listing_type === 'sale'}
                  onClick={() => handleQuickFilter('listing_type', 'sale')}
                >
                  For Sale
                </QuickFilterButton>
                <QuickFilterButton
                  active={filters.listing_type === 'rent'}
                  onClick={() => handleQuickFilter('listing_type', 'rent')}
                >
                  For Rent
                </QuickFilterButton>
                <QuickFilterButton
                  active={!!filters.featured_only}
                  onClick={() => handleQuickFilter('featured_only', true)}
                >
                  <Star className="h-4 w-4 inline mr-1" />
                  Featured
                </QuickFilterButton>
                <button
                  onClick={() => setUIState(prev => ({ ...prev, showFilters: true }))}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative"
                >
                  <Filter className="h-4 w-4" />
                  More Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#7fd783] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {searchState.error && (
          <div className="mx-4 sm:mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{searchState.error}</p>
          </div>
        )}

        {/* Results Header */}
        <div className="mt-4 lg:mt-6">
          <ResultsHeader
            totalCount={searchState.totalCount}
            city={filters.city}
            currentSort={currentSortLabel}
            viewMode={uiState.viewMode}
            showSortMenu={uiState.showSortMenu}
            onViewModeChange={(mode) => setUIState(prev => ({ ...prev, viewMode: mode }))}
            onSortMenuToggle={() => setUIState(prev => ({ ...prev, showSortMenu: !prev.showSortMenu }))}
            onSort={handleSort}
            sortOptions={SORT_OPTIONS}
            activeFilters={renderActiveFilters()}
          />
        </div>

        {/* Search Results */}
        <div className="mt-4 lg:mt-6">
          {renderSearchResults()}
        </div>
      </div>

      {/* Mobile Search Modal */}
      {uiState.showMobileSearch && (
        <MobileSearchModal
          searchQuery={searchQuery}
          parsedQuery={parsedQuery}
          onSearchQueryChange={handleSearchInputChange}
          onExecuteSearch={executeSmartSearch}
          onClose={() => setUIState(prev => ({ ...prev, showMobileSearch: false }))}
          onQuickFilter={handleQuickFilter}
          loading={searchState.loading}
          isProcessing={isProcessing}
          filters={filters}
        />
      )}

      {/* Filters Modal */}
      {uiState.showFilters && (
        <FiltersModal
          filters={filters}
          amenities={amenities}
          onFilterChange={handleFilterChange}
          onAmenityToggle={handleAmenityToggle}
          onApplyFilters={applyFilters}
          onClearFilters={clearAllFilters}
          onClose={() => setUIState(prev => ({ ...prev, showFilters: false }))}
          activeFilterCount={activeFilterCount}
          loading={searchState.loading}
          propertyTypes={PROPERTY_TYPES}
          priceRanges={PRICE_RANGES}
          roomOptions={ROOM_OPTIONS}
        />
      )}
    </div>
  );
};

// Mobile Filter Button Component
const MobileFilterButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-1 px-4 py-2 rounded-full border transition-colors whitespace-nowrap text-sm font-medium ${
      active
        ? 'bg-[#7fd783] border-[#7fd783] text-white'
        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
    }`}
  >
    {children}
  </button>
);

// Sub-components for better organization
const FilterTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-[#7fd783] text-sm rounded-full border border-green-200">
    <span className="truncate max-w-[120px] sm:max-w-none">{label}</span>
    <button 
      onClick={onRemove} 
      className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-64 sm:h-96 px-4">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-[#7fd783] mb-4 sm:mb-6"></div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#7fd783] to-blue-500 opacity-20 blur-sm animate-pulse"></div>
    </div>
    <h3 className="text-lg sm:text-xl font-medium text-gray-700 text-center">AI is finding properties...</h3>
    <p className="text-gray-500 mt-2 text-center text-sm sm:text-base">Processing your search with smart algorithms</p>
  </div>
);

const EmptyState = ({ onClearFilters, onGoHome }: { 
  onClearFilters: () => void; 
  onGoHome: () => void; 
}) => (
  <div className="text-center py-12 sm:py-16 bg-white rounded-2xl mx-4 sm:mx-0">
    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
      <Search className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
    </div>
    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">No properties found</h3>
    <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
      Try adjusting your search criteria or clearing some filters. Our AI search understands natural language too!
    </p>
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
      <Button variant="colored" onClick={onClearFilters} className="px-6 py-3">
        Clear All Filters
      </Button>
      <Button variant="white" onClick={onGoHome} className="px-6 py-3 border-gray-300">
        Back to Home
      </Button>
    </div>
  </div>
);

// Enhanced Mobile Search Modal
const MobileSearchModal = ({
  searchQuery,
  parsedQuery,
  onSearchQueryChange,
  onExecuteSearch,
  onClose,
  onQuickFilter,
  loading,
  isProcessing,
  filters
}: {
  searchQuery: string;
  parsedQuery: ParsedQuery | null;
  onSearchQueryChange: (value: string) => void;
  onExecuteSearch: (query: string) => void;
  onClose: () => void;
  onQuickFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  loading: boolean;
  isProcessing: boolean;
  filters: FilterState;
}) => (
  <div className="fixed inset-0 bg-white z-50 lg:hidden">
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#7fd783]" />
          <h2 className="text-lg font-semibold text-gray-900">AI Search</h2>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Enhanced Search Input */}
        <div className="relative mb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7fd783] to-blue-500 rounded-xl opacity-60 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative bg-white rounded-xl">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 text-[#7fd783] animate-spin" />
                ) : (
                  <Search className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                placeholder="Try: '2 bed apartment in Banjul under 50k'"
                className="w-full pl-12 pr-4 py-4 border-0 rounded-xl focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 text-lg bg-transparent"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onExecuteSearch(searchQuery);
                  }
                }}
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* AI Feedback */}
        {parsedQuery && parsedQuery.confidence > 60 && (
          <div className="mb-6 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#7fd783] to-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">AI Understanding</div>
                <div className="text-sm text-gray-600">
                  {parsedQuery.interpretedAs} ({parsedQuery.confidence}% confidence)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#7fd783]" />
            Quick Filters
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickFilterButton
              active={filters.listing_type === 'sale'}
              onClick={() => onQuickFilter('listing_type', 'sale')}
            >
              For Sale
            </QuickFilterButton>
            <QuickFilterButton
              active={filters.listing_type === 'rent'}
              onClick={() => onQuickFilter('listing_type', 'rent')}
            >
              For Rent
            </QuickFilterButton>
            <QuickFilterButton
              active={!!filters.featured_only}
              onClick={() => onQuickFilter('featured_only', true)}
              className="col-span-2"
            >
              <Star className="h-4 w-4 inline mr-2" />
              Featured Properties
            </QuickFilterButton>
          </div>
        </div>

        {/* Example Searches */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-[#7fd783]" />
            Try These Searches
          </h3>
          <div className="space-y-2">
            {[
              '2 bed apartment in Banjul under 100k',
              'luxury villa for sale with pool',
              '3 bedroom house for rent in Serekunda',
              'commercial property in city center'
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  onSearchQueryChange(example);
                  onExecuteSearch(example);
                }}
                className="w-full text-left p-3 bg-gray-50 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 rounded-lg transition-all duration-200 border border-transparent hover:border-green-200"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-[#7fd783] flex-shrink-0" />
                  <span className="text-sm text-gray-700">{example}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white space-y-3">
        <Button
          variant="colored"
          onClick={() => onExecuteSearch(searchQuery)}
          className="w-full py-4 text-lg font-medium"
          disabled={loading || isProcessing}
        >
          {loading || isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              AI Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Search
            </span>
          )}
        </Button>
        <button
          onClick={onClose}
          className="w-full py-3 text-gray-600 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

const QuickFilterButton = ({ 
  active, 
  onClick, 
  children,
  className = ""
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg border transition-colors ${
      active
        ? 'bg-green-100 border-green-300 text-[#7fd783]'
        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
    } ${className}`}
  >
    {children}
  </button>
);

const ResultsHeader = ({
  totalCount,
  city,
  currentSort,
  viewMode,
  showSortMenu,
  onViewModeChange,
  onSortMenuToggle,
  onSort,
  sortOptions,
  activeFilters
}: {
  totalCount: number;
  city?: string;
  currentSort: string;
  viewMode: 'grid' | 'list';
  showSortMenu: boolean;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortMenuToggle: () => void;
  onSort: (sortBy: string, sortOrder: string) => void;
  sortOptions: readonly { label: string; value: string; order: string; }[];
  activeFilters: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
    <div className="flex flex-col space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
            {totalCount > 0 ? (
              <>
                {totalCount.toLocaleString()} {totalCount === 1 ? 'Property' : 'Properties'} Found
              </>
            ) : (
              'No Properties Found'
            )}
          </h1>
          {city && (
            <p className="text-gray-600 mt-1 flex items-center gap-1 text-sm sm:text-base">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">in {city}</span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={onSortMenuToggle}
              className="flex items-center justify-between w-full sm:w-auto gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{currentSort}</span>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {sortOptions.map((option) => (
                  <button
                    key={`${option.value}-${option.order}`}
                    onClick={() => onSort(option.value, option.order)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors text-sm sm:text-base"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#7fd783] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-[#7fd783] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters}
    </div>
  </div>
);

const FiltersModal = ({
  filters,
  amenities,
  onFilterChange,
  onAmenityToggle,
  onApplyFilters,
  onClearFilters,
  onClose,
  activeFilterCount,
  loading,
  propertyTypes,
  priceRanges,
  roomOptions
}: {
  filters: FilterState;
  amenities: Amenity[];
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onAmenityToggle: (amenityId: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onClose: () => void;
  activeFilterCount: number;
  loading: boolean;
  propertyTypes: readonly { value: string; label: string; icon: any; }[];
  priceRanges: readonly { label: string; min?: number; max?: number; }[];
  roomOptions: readonly { label: string; value?: number; }[];
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gray-50">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Property Filters</h3>
          <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
            Narrow down your search to find the perfect property
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-4"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Property Type */}
          <FilterSection
            title="Property Type"
            icon={<Home className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {propertyTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <FilterButton
                    key={type.value}
                    active={filters.property_type === type.value}
                    onClick={() => onFilterChange('property_type', type.value as PropertyListing['property_type'] || undefined)}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs sm:text-sm truncate">{type.label}</span>
                  </FilterButton>
                );
              })}
            </div>
          </FilterSection>

          {/* Listing Type */}
          <FilterSection
            title="Listing Type"
            icon={<DollarSign className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <FilterButton
                active={!filters.listing_type}
                onClick={() => onFilterChange('listing_type', undefined)}
              >
                <span className="text-xs sm:text-sm">All</span>
              </FilterButton>
              <FilterButton
                active={filters.listing_type === 'sale'}
                onClick={() => onFilterChange('listing_type', 'sale')}
              >
                <span className="text-xs sm:text-sm">For Sale</span>
              </FilterButton>
              <FilterButton
                active={filters.listing_type === 'rent'}
                onClick={() => onFilterChange('listing_type', 'rent')}
              >
                <span className="text-xs sm:text-sm">For Rent</span>
              </FilterButton>
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection
            title="Price Range"
            icon={<DollarSign className="h-5 w-5 text-[#7fd783]" />}
          >
            <select
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fd783] focus:border-[#7fd783] transition-all duration-200 text-gray-900 text-sm sm:text-base"
              value={priceRanges.findIndex(range =>
                range.min === filters.min_price && range.max === filters.max_price
              )}
              onChange={(e) => {
                const range = priceRanges[Number(e.target.value)];
                onFilterChange('min_price', range.min);
                onFilterChange('max_price', range.max);
              }}
            >
              {priceRanges.map((range, idx) => (
                <option key={idx} value={idx}>{range.label}</option>
              ))}
            </select>
          </FilterSection>

          {/* Bedrooms */}
          <FilterSection
            title="Bedrooms"
            icon={<Bed className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {roomOptions.map((option) => (
                <FilterButton
                  key={option.label}
                  active={filters.min_bedrooms === option.value}
                  onClick={() => onFilterChange('min_bedrooms', option.value)}
                >
                  <span className="text-xs sm:text-sm">{option.label}</span>
                </FilterButton>
              ))}
            </div>
          </FilterSection>

          {/* Bathrooms */}
          <FilterSection
            title="Bathrooms"
            icon={<Bath className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {roomOptions.map((option) => (
                <FilterButton
                  key={option.label}
                  active={filters.min_bathrooms === option.value}
                  onClick={() => onFilterChange('min_bathrooms', option.value)}
                >
                  <span className="text-xs sm:text-sm">{option.label}</span>
                </FilterButton>
              ))}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection
            title="Location"
            icon={<MapPin className="h-5 w-5 text-[#7fd783]" />}
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter city or area..."
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fd783] focus:border-[#7fd783] transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                value={filters.city || ''}
                onChange={(e) => onFilterChange('city', e.target.value)}
              />
            </div>
          </FilterSection>
        </div>

        {/* Amenities Section - Full Width */}
        <div className="mt-6 sm:mt-8 space-y-4">
          <h4 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
            <Star className="h-5 w-5 text-[#7fd783]" />
            Amenities
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {amenities.map((amenity) => (
              <label
                key={amenity.id}
                className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:border-gray-300"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#7fd783] border-gray-300 rounded focus:ring-[#7fd783] focus:ring-2"
                  checked={filters.amenity_ids?.includes(amenity.id) || false}
                  onChange={() => onAmenityToggle(amenity.id)}
                />
                <span className="text-xs sm:text-sm text-gray-700 flex-1">{amenity.name}</span>
              </label>
            ))}
          </div>
          {amenities.length === 0 && (
            <p className="text-gray-500 text-center py-4 text-sm sm:text-base">No amenities available</p>
          )}
        </div>

        {/* Featured Properties Toggle */}
        <div className="mt-6 sm:mt-8">
          <label className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl cursor-pointer hover:from-green-100 hover:to-blue-100 transition-colors border border-green-200">
            <input
              type="checkbox"
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#7fd783] border-gray-300 rounded focus:ring-[#7fd783] focus:ring-2"
              checked={filters.featured_only || false}
              onChange={(e) => onFilterChange('featured_only', e.target.checked)}
            />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-[#7fd783] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h5 className="font-semibold text-gray-900 text-sm sm:text-base">Featured Properties Only</h5>
                <p className="text-xs sm:text-sm text-gray-600">Show only our premium featured properties</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
        <Button
          variant="white"
          onClick={onClearFilters}
          className="flex-1 py-3 text-sm sm:text-base font-medium border-gray-300"
        >
          Clear All Filters
        </Button>
        <Button
          variant="colored"
          onClick={onApplyFilters}
          className="flex-1 py-3 text-sm sm:text-base font-medium"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Applying...
            </span>
          ) : (
            `Apply Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`
          )}
        </Button>
      </div>
    </div>
  </div>
);

const FilterSection = ({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
}) => (
  <div className="space-y-3 sm:space-y-4">
    <h4 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    {children}
  </div>
);

const FilterButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-200 min-h-[40px] sm:min-h-[48px] ${
      active
        ? 'border-[#7fd783] bg-green-50 text-[#7fd783] font-medium shadow-sm'
        : 'border-gray-200 hover:border-gray-400 text-gray-700'
    }`}
  >
    {children}
  </button>
);

export default SearchResults;