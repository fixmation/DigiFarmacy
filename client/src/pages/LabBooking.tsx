import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, MapPin, Phone, Clock, Home, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import PageLayout from '@/components/PageLayout';
import mapboxgl from 'mapbox-gl';

interface Laboratory {
  id: string;
  business_name: string;
  address: string;
  contact_phone?: string;
  services_offered?: string[];
  home_visit_available: boolean;
  home_visit_charges?: number;
  operating_hours?: any;
}

const LabBooking: React.FC = () => {
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);
  const [bookingForm, setBookingForm] = useState({
    customer_name: '',
    contact_phone: '',
    address: '',
    service_type: '',
    preferred_date: '',
    preferred_time: '',
    special_instructions: ''
  });

  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const customerLocation = { lat: 6.9271, lng: 79.8612 }; // Example: Colombo coordinates

  const { data: laboratories = [], isLoading } = useQuery({
    queryKey: ['/api/laboratories'],
    queryFn: () => fetch('/api/laboratories')
      .then(res => res.json())
      .then(labs => {
        const labsWithDistance = labs.map(lab => {
          // Ensure lab has location data with fallback to Colombo coordinates
          const labLocation = lab.location || { lat: 6.9271, lng: 79.8612 };
          const distance = calculateDistance(customerLocation, labLocation);
          return {
            ...lab,
            location: labLocation,
            distance
          };
        }).sort((a, b) => a.distance - b.distance);
        
        // Initialize map with laboratory data
        if (!mapLoaded && labs.length > 0) {
          initializeMap(labsWithDistance);
        }
        
        return labsWithDistance;
      })
  });

  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        // Implement logic if data contains provinces and districts mapping
      });
  }, []);

  // Initialize Mapbox
  const initializeMap = (labs: Laboratory[]) => {
    if (!mapContainer.current || mapLoaded) return;
    
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('VITE_MAPBOX_TOKEN not found');
      toast.error('Map configuration missing');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [customerLocation.lng, customerLocation.lat],
      zoom: 12
    });

    // Add markers for laboratories
    labs.forEach(lab => {
      if (lab.location) {
        new mapboxgl.Marker({ color: '#22C55E' })
          .setLngLat([lab.location.lng, lab.location.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${lab.business_name}</h3>
              <p class="text-sm text-gray-600">${lab.address}</p>
              <p class="text-sm text-blue-600">Distance: ${lab.distance?.toFixed(1)}km</p>
            </div>
          `))
          .addTo(map.current!);
      }
    });

    // Add customer location marker
    new mapboxgl.Marker({ color: '#00bfff' })
      .setLngLat([customerLocation.lng, customerLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<h3>Your Location</h3><p>Colombo, Sri Lanka</p>'))
      .addTo(map.current);

    setMapLoaded(true);
  };

  // Function to calculate distance between two coordinates
  function calculateDistance({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 }) {
    const toRad = (value) => value * Math.PI / 180;
    const R = 6371; // Radius of the earth in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  // Fetch districts and provinces
  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        // Assume data contains provinces and districts mapping
        // Update state or whatever handle logic you need here
      });
  }, []);

  const bookingMutation = useMutation({
    mutationFn: (bookingData: any) => apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }),
    onSuccess: () => {
      toast.success('Booking request submitted successfully!');
      setBookingForm({
        customer_name: '',
        contact_phone: '',
        address: '',
        service_type: '',
        preferred_date: '',
        preferred_time: '',
        special_instructions: ''
      });
      setSelectedLab(null);
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error) => {
      toast.error('Failed to submit booking request');
      console.error('Booking error:', error);
    }
  });

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLab) {
      toast.error('Please select a laboratory first');
      return;
    }

    const bookingData = {
      ...bookingForm,
      laboratory_id: selectedLab.id,
      laboratory_name: selectedLab.business_name,
      booking_date: new Date().toISOString()
    };

    bookingMutation.mutate(bookingData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-[#7aebcf] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#10b981] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading laboratories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout title="Laboratory Home Visits">
      <div className="min-h-screen bg-gradient-to-br from-white to-[#7aebcf]/20 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Laboratory Home Visits</h1>
            <p className="text-xl text-gray-600">Book convenient home visit laboratory services across Sri Lanka</p>
          </div>

          {/* Interactive Map */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#10b981]" />
                  Laboratory Locations Map
                </CardTitle>
                <CardDescription>
                  Click on markers to view laboratory details and book services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapContainer}
                  className="w-full h-96 rounded-lg border border-gray-300"
                  style={{ minHeight: '400px' }}
                />
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#00bfff] rounded-full"></div>
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                    <span>Laboratories</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Laboratory Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Select Laboratory</h2>
            <select 
              onChange={(e) => {
                const selectedId = e.target.value;
                const lab = laboratories.find(l => l.id === selectedId);
                setSelectedLab(lab || null);
              }} 
              value={selectedLab?.id || ''}
              className="block w-full mb-4 p-2 border border-gray-300 rounded"
            >
              <option value="" disabled>Select a Laboratory</option>
              {laboratories.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.business_name}
                </option>
              ))}
            </select>
            {laboratories.map((lab: Laboratory) => (
              <Card 
                key={lab.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedLab?.id === lab.id 
                    ? 'ring-2 ring-[#10b981] bg-[#7aebcf]/20' 
                    : 'bg-white/80 backdrop-blur-sm'
                }`}
                onClick={() => setSelectedLab(lab)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="h-6 w-6 text-[#10b981]" />
                      <div>
                        <CardTitle className="text-lg">{lab.business_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4" />
                          {lab.address}
                        </CardDescription>
                      </div>
                    </div>
                    {lab.home_visit_available && (
                      <Badge variant="secondary" className="bg-[#10b981] text-white">
                        <Home className="h-3 w-3 mr-1" />
                        Home Visit
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lab.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {lab.contact_phone}
                      </div>
                    )}
                    {lab.services_offered && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lab.services_offered.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {lab.home_visit_available && lab.home_visit_charges && (
                      <div className="text-sm text-[#10b981] font-medium">
                        Home Visit Charges: LKR {lab.home_visit_charges}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Booking Form */}
          <div className="sticky top-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#10b981]" />
                  Booking Details
                </CardTitle>
                <CardDescription>
                  {selectedLab ? `Booking with ${selectedLab.business_name}` : 'Select a laboratory to continue'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Full Name</Label>
                      <Input
                        id="customer_name"
                        name="customer_name"
                        value={bookingForm.customer_name}
                        onChange={handleInputChange}
                        required
                        disabled={!selectedLab}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        type="tel"
                        value={bookingForm.contact_phone}
                        onChange={handleInputChange}
                        required
                        disabled={!selectedLab}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={bookingForm.address}
                      onChange={handleInputChange}
                      required
                      disabled={!selectedLab}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="service_type">Service Type</Label>
                    <Input
                      id="service_type"
                      name="service_type"
                      value={bookingForm.service_type}
                      onChange={handleInputChange}
                      placeholder="e.g., Blood Test, X-Ray, Home Visit"
                      required
                      disabled={!selectedLab}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferred_date">Preferred Date</Label>
                      <Input
                        id="preferred_date"
                        name="preferred_date"
                        type="date"
                        value={bookingForm.preferred_date}
                        onChange={handleInputChange}
                        required
                        disabled={!selectedLab}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferred_time">Preferred Time</Label>
                      <Input
                        id="preferred_time"
                        name="preferred_time"
                        type="time"
                        value={bookingForm.preferred_time}
                        onChange={handleInputChange}
                        required
                        disabled={!selectedLab}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="special_instructions">Special Instructions</Label>
                    <Textarea
                      id="special_instructions"
                      name="special_instructions"
                      value={bookingForm.special_instructions}
                      onChange={handleInputChange}
                      placeholder="Any special requirements or instructions..."
                      disabled={!selectedLab}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#00bfff] to-green-500 hover:from-[#0099cc] hover:to-green-600 text-white border-none shadow-lg"
                    disabled={!selectedLab || bookingMutation.isPending}
                  >
                    {bookingMutation.isPending ? 'Submitting...' : 'Book Appointment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default LabBooking;