
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Star } from "lucide-react";
// Removed supabase import - using server-side API calls instead
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Pharmacy {
  id: string;
  business_name: string;
  address: string;
  contact_phone?: string;
  latitude?: number;
  longitude?: number;
  verified_at?: string;
  operating_hours?: any;
  distance?: string;
  rating?: number;
}

interface PharmacyMapProps {
  searchQuery: string;
}

const PharmacyMap = ({ searchQuery }: PharmacyMapProps) => {
  const { profile, loading } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    fetchMapboxToken();
    fetchRegisteredPharmacies();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = pharmacies.filter(pharmacy =>
        pharmacy.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPharmacies(filtered);
    } else {
      setFilteredPharmacies(pharmacies);
    }
  }, [searchQuery, pharmacies]);

  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapboxToken]);

  const fetchMapboxToken = async () => {
    try {
      // Use environment variable for Mapbox token
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (token) {
        setMapboxToken(token);
      } else {
        console.error('VITE_MAPBOX_TOKEN environment variable not set');
      }
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [80.7718, 7.8731], // Sri Lanka center coordinates (Kandy)
      zoom: 8
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for pharmacies
    filteredPharmacies.forEach(pharmacy => {
      if (pharmacy.latitude && pharmacy.longitude) {
        new mapboxgl.Marker()
          .setLngLat([pharmacy.longitude, pharmacy.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-semibold">${pharmacy.business_name}</h3>
                  <p class="text-sm text-gray-600">${pharmacy.address}</p>
                  ${pharmacy.contact_phone ? `<p class="text-sm">📞 ${pharmacy.contact_phone}</p>` : ''}
                </div>
              `)
          )
          .addTo(map.current!);
      }
    });
  };

  const fetchRegisteredPharmacies = async () => {
    try {
      const response = await fetch('/api/pharmacies');
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacies');
      }
      
      const data = await response.json();
      
      const mappedPharmacies = data.map((pharmacy: any) => ({
        id: pharmacy.id,
        business_name: pharmacy.business_name,
        address: pharmacy.address,
        contact_phone: pharmacy.contact_phone,
        latitude: pharmacy.latitude ? Number(pharmacy.latitude) : undefined,
        longitude: pharmacy.longitude ? Number(pharmacy.longitude) : undefined,
        verified_at: pharmacy.verified_at,
        operating_hours: pharmacy.operating_hours,
        distance: '0.5 km', // Calculate actual distance based on user location
        rating: 4.5 // TODO: Calculate from reviews
      }));

      setPharmacies(mappedPharmacies);
      setFilteredPharmacies(mappedPharmacies);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const getOperatingHours = (hours: any) => {
    if (!hours) return '9:00 AM - 6:00 PM';
    return hours.general || '9:00 AM - 6:00 PM';
  };

  const isOpen24Hours = (hours: any) => {
    if (!hours) return false;
    return hours.is_24_hours || false;
  };

  return (
    <div className="p-6">
      {loading || !profile || profile.role === 'customer' ? (
        <div className="text-center p-8 bg-white/80 border rounded">
          <h3 className="text-lg font-semibold">Please sign in</h3>
          <p className="text-sm text-muted-foreground">Pharmacy finder is available to verified pharmacists, laboratory staff and admins only. Please sign in to continue.</p>
        </div>
      ) : null}
      {!loading && profile && profile.role !== 'customer' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardContent className="p-0 h-full relative">
                {!mapboxToken ? (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-medical-blue/10 to-medical-green/10">
                    <div className="text-center space-y-4 p-8">
                      <MapPin className="h-16 w-16 text-medical-blue mx-auto" />
                      <h3 className="text-xl font-semibold">Interactive Map</h3>
                      <p className="text-muted-foreground max-w-md">
                        Map is not available. Please configure the Mapbox token in Admin Dashboard API Settings.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={mapContainer} 
                    className="absolute inset-0 rounded-lg"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pharmacy List */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-medical-blue" />
              Registered Pharmacies ({filteredPharmacies.length})
            </h3>
            
            {mapLoading ? (
              <div className="text-center py-8">Loading pharmacies...</div>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {filteredPharmacies.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No registered pharmacies found.</p>
                        <p className="text-sm">Try adjusting your search criteria.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPharmacies.map((pharmacy) => (
                    <Card 
                      key={pharmacy.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedPharmacy?.id === pharmacy.id 
                          ? 'ring-2 ring-medical-blue shadow-lg' 
                          : 'hover:ring-1 hover:ring-medical-blue/50'
                      }`}
                      onClick={() => setSelectedPharmacy(pharmacy)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{pharmacy.business_name}</CardTitle>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{pharmacy.rating || 'N/A'}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {pharmacy.address} {pharmacy.distance && `• ${pharmacy.distance}`}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-medical-green" />
                          <span>{getOperatingHours(pharmacy.operating_hours)}</span>
                        </div>
                        
                        {pharmacy.contact_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-medical-blue" />
                            <span>{pharmacy.contact_phone}</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-medical-green/10 text-medical-green">
                            Verified
                          </Badge>
                          {isOpen24Hours(pharmacy.operating_hours) && (
                            <Badge variant="secondary" className="bg-medical-green/10 text-medical-green">
                              24/7
                            </Badge>
                          )}
                        </div>
                        
                        <Button 
                          className="w-full medical-gradient text-white hover:opacity-90"
                          size="sm"
                        >
                          Get Directions
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyMap;
