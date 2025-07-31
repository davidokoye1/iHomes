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

  const performSearch = useCallback(() => {
    const params = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
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
    performSearch,
    clearSearch,
    setSearchParams
  };
};