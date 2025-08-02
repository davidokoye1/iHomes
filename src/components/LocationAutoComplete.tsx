// src/components/LocationAutocomplete.tsx
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash-es';
import { supabase } from '../lib/supabaseClient';

interface Location {
  id: string;
  name: string;
  type: string;
  region?: string;
  parent_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_popular: boolean;
  display_order: number;
}

interface Props {
  onSelect: (location: Location) => void;
  placeholder?: string;
  selectedLocationId?: string | null;
}

export const LocationAutocomplete = ({ 
  onSelect,
  placeholder = 'Search locations...',
  selectedLocationId
}: Props) => {
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setLocations([]);
      return;
    }

    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Search locations with trigram similarity
        const { data, error: fetchError } = await supabase
          .from('locations')
          .select('*')
          .or(`name.ilike.%${query}%,region.ilike.%${query}%`)
          .order('is_popular', { ascending: false })
          .order('display_order', { ascending: true })
          .limit(10);

        if (fetchError) throw fetchError;
        setLocations(data || []);
      } catch (err) {
        setError('Failed to fetch locations');
        console.error('Location search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const handler = setTimeout(fetchLocations, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    // If we have a selected location ID, fetch its details
    if (selectedLocationId) {
      const fetchLocation = async () => {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('id', selectedLocationId)
          .single();
        
        if (data) {
          setQuery(`${data.name}${data.region ? `, ${data.region}` : ''}`);
        }
      };
      
      fetchLocation();
    }
  }, [selectedLocationId]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-autocomplete="list"
        aria-controls={locations.length > 0 ? "location-options" : undefined}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {locations.length > 0 && (
        <ul 
          id="location-options"
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {locations.map(location => (
            <li
              key={location.id}
              role="option"
              aria-selected={selectedLocationId === location.id}
              onClick={() => {
                onSelect(location);
                setQuery(`${location.name}${location.region ? `, ${location.region}` : ''}`);
                setLocations([]);
              }}
              className={`p-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                selectedLocationId === location.id ? 'bg-blue-50' : ''
              }`}
            >
              <p className="font-medium">{location.name}</p>
              <p className="text-sm text-gray-500">
                {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                {location.region && ` in ${location.region}`}
              </p>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div role="alert" className="mt-1 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};