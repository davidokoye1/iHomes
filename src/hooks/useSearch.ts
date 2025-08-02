// src/hooks/useSearch.ts
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchParams } from '../types/database';

export const useSearch = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const navigate = useNavigate();

  const updateSearchParam = useCallback((key: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }));
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