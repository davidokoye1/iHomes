// src/hooks/useSearch.ts
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchParams } from '../types/database';

export const useSearch = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const navigate = useNavigate();

  const updateSearchParam = useCallback((key: keyof SearchParams, value: string | number | string[] | boolean | null | undefined) => {
    setSearchParams(prev => {
      // For min_price and max_price, we need to handle them together
      if (key === 'min_price' || key === 'max_price') {
        // Convert string values to numbers where possible
        if (typeof value === 'string' && value.trim() !== '') {
          const numValue = parseFloat(value);
          value = isNaN(numValue) ? null : numValue;
        }
        // Ensure value is either number, null, or undefined
        if (typeof value === 'number' || value === null || value === undefined) {
          return {
            ...prev,
            min_price: key === 'min_price' ? value : prev.min_price,
            max_price: key === 'max_price' ? value : prev.max_price
          };
        }
        return prev; // Ignore invalid types
      }
      return {
        ...prev,
        [key]: value
      };
    });
  }, []);

  const toggleArrayParam = useCallback((key: keyof SearchParams, value: string) => {
    setSearchParams(prev => {
      const currentValues = (prev[key] as string[] | undefined) || [];
      const index = currentValues.indexOf(value);
      
      if (index === -1) {
        return { ...prev, [key]: [...currentValues, value] };
      } else {
        return { 
          ...prev, 
          [key]: currentValues.filter(item => item !== value) 
        };
      }
    });
  }, []);

  const performSearch = useCallback(() => {
    const params = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, String(value));
        }
      }
    });

    navigate(`/search?${params.toString()}`);
  }, [searchParams, navigate]);

  const clearSearch = useCallback(() => {
    setSearchParams({});
  }, []);

  return {
    searchParams,
    updateSearchParam,
    toggleArrayParam,
    performSearch,
    clearSearch,
    setSearchParams
  };
};