import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertTriangle, Info, Clock, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { sriLankanMedicines, Medicine, searchMedicines } from '@/data/sriLankanMedicines';
import { completeNMRADatabase, searchCompleteNMRADatabase, getNMRADrugSuggestions } from '@/data/completeNMRADatabase';
import DrugAnalysisCard from './DrugAnalysisCard';

interface DrugInformationProps {
  selectedDrug?: string | null;
}

interface DrugInfo {
  name: string;
  genericName: string;
  category: string;
  description: string;
  uses: string[];
  dosage: string;
  sideEffects: string[];
  warnings: string[];
  interactions: string[];
  storage: string;
}

const DrugInformation: React.FC<DrugInformationProps> = ({ selectedDrug }) => {
  const { profile, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sri Lankan medicine database
  const sriLankanMedicineDatabase: Record<string, DrugInfo> = {
    paracetamol: {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      category: 'Analgesic/Antipyretic',
      description: 'A pain reliever and fever reducer commonly used to treat headaches, muscle aches, arthritis, backaches, toothaches, colds, and fevers.',
      uses: ['Pain relief', 'Fever reduction', 'Headaches', 'Muscle pain', 'Cold symptoms'],
      dosage: '500mg-1000mg every 4-6 hours, maximum 4000mg per day',
      sideEffects: ['Nausea', 'Stomach upset', 'Allergic reactions (rare)', 'Liver damage (with overdose)'],
      warnings: ['Do not exceed recommended dose', 'Avoid alcohol consumption', 'Consult doctor if symptoms persist'],
      interactions: ['Warfarin', 'Alcohol', 'Other paracetamol-containing medications'],
      storage: 'Store at room temperature, away from moisture and heat'
    },
    aspirin: {
      name: 'Aspirin',
      genericName: 'Acetylsalicylic Acid',
      category: 'NSAID/Antiplatelet',
      description: 'A nonsteroidal anti-inflammatory drug used to reduce pain, fever, or inflammation and prevent blood clots.',
      uses: ['Pain relief', 'Anti-inflammatory', 'Fever reduction', 'Heart attack prevention', 'Stroke prevention'],
      dosage: '325mg-650mg every 4 hours for pain, 81mg daily for heart protection',
      sideEffects: ['Stomach irritation', 'Nausea', 'Heartburn', 'Bleeding risk', 'Ringing in ears'],
      warnings: ['Not for children under 16', 'Avoid if allergic to NSAIDs', 'Risk of bleeding'],
      interactions: ['Warfarin', 'Methotrexate', 'Other NSAIDs', 'Alcohol'],
      storage: 'Store in a cool, dry place away from light'
    },
    amoxicillin: {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      category: 'Antibiotic (Penicillin)',
      description: 'A penicillin-type antibiotic used to treat various bacterial infections.',
      uses: ['Bacterial infections', 'Ear infections', 'Pneumonia', 'Urinary tract infections', 'Skin infections'],
      dosage: '250mg-500mg every 8 hours, or 500mg-875mg every 12 hours',
      sideEffects: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Skin rash'],
      warnings: ['Complete full course', 'Allergic reactions possible', 'May reduce contraceptive effectiveness'],
      interactions: ['Oral contraceptives', 'Methotrexate', 'Allopurinol'],
      storage: 'Store at room temperature, liquid form in refrigerator'
    },
    'siddhalepa balm': {
      name: 'Siddhalepa Balm',
      genericName: 'Ayurvedic Herbal Balm',
      category: 'Topical Analgesic',
      description: 'Traditional Sri Lankan herbal balm used for external pain relief, made with natural ingredients.',
      uses: ['Muscle pain', 'Joint pain', 'Headaches', 'Sprains', 'Arthritis pain'],
      dosage: 'Apply thin layer to affected area 2-3 times daily',
      sideEffects: ['Skin irritation (rare)', 'Allergic reactions in sensitive individuals'],
      warnings: ['For external use only', 'Avoid contact with eyes', 'Discontinue if irritation occurs'],
      interactions: ['No known drug interactions'],
      storage: 'Store in cool, dry place'
    },
    'link natural': {
      name: 'Link Natural',
      genericName: 'Herbal Supplement',
      category: 'Ayurvedic Medicine',
      description: 'Sri Lankan herbal supplement for general wellness and immune support.',
      uses: ['Immune support', 'General wellness', 'Energy boost', 'Stress relief'],
      dosage: '1-2 capsules twice daily with meals',
      sideEffects: ['Mild stomach upset (rare)', 'Allergic reactions in sensitive individuals'],
      warnings: ['Consult physician if pregnant or breastfeeding', 'Keep out of reach of children'],
      interactions: ['May interact with blood thinners'],
      storage: 'Store in cool, dry place away from direct sunlight'
    },
    'samahan': {
      name: 'Samahan',
      genericName: 'Herbal Drink Mix',
      category: 'Ayurvedic Medicine',
      description: 'Traditional Sri Lankan herbal drink mix for cold, flu, and general wellness.',
      uses: ['Cold symptoms', 'Flu symptoms', 'Cough', 'Sore throat', 'Immune support'],
      dosage: '1 packet dissolved in hot water, 2-3 times daily',
      sideEffects: ['Generally well tolerated', 'May cause mild stomach upset'],
      warnings: ['Consult physician if symptoms persist', 'Not recommended for children under 2'],
      interactions: ['No known drug interactions'],
      storage: 'Store in cool, dry place'
    },
    'paspanguwa': {
      name: 'Paspanguwa',
      genericName: 'Herbal Decoction',
      category: 'Ayurvedic Medicine',
      description: 'Traditional Sri Lankan herbal decoction for respiratory ailments and fever.',
      uses: ['Cough', 'Cold', 'Fever', 'Respiratory congestion', 'Sore throat'],
      dosage: 'Boil ingredients and drink as tea 2-3 times daily',
      sideEffects: ['Generally safe', 'May cause mild nausea in sensitive individuals'],
      warnings: ['Use fresh ingredients', 'Consult physician for persistent symptoms'],
      interactions: ['No known drug interactions'],
      storage: 'Store dried herbs in airtight containers'
    }
  };

  useEffect(() => {
    if (selectedDrug) {
      setSearchTerm(selectedDrug);
      handleSearch(selectedDrug);
    }
  }, [selectedDrug]);

  if (!loading && !profile) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-white/90 rounded">
          <h3 className="font-semibold">Please sign in</h3>
          <p className="text-sm text-muted-foreground">NMRA drug search is available to authenticated pharmacists and healthcare professionals only.</p>
        </div>
      </div>
    );
  }

  // Function to search the drug information
  // Removed external DrugBank API - now using local NMRA database

  const handleSearch = async (term?: string) => {
    const searchQuery = (term || searchTerm).toLowerCase().trim();

    if (!searchQuery) {
      toast.error('Please enter a drug name to search');
      return;
    }

    setIsLoading(true);
    setDrugInfo(null);

    try {
      // Search complete NMRA database and local medicines
      const localResults = searchMedicines(searchQuery);
      const nmraResults = searchCompleteNMRADatabase(searchQuery, 20);
      const allResults = [...localResults, ...nmraResults];
      
      const foundMedicine = allResults[0]; // Get the first (best) match

      if (foundMedicine) {
        // Convert to DrugInfo format
        const drugInfo: DrugInfo = {
          name: foundMedicine.name,
          genericName: foundMedicine.genericName,
          category: foundMedicine.category,
          description: foundMedicine.pharmacology || `${foundMedicine.name} is a pharmaceutical product manufactured by ${foundMedicine.manufacturer}.`,
          uses: foundMedicine.uses,
          dosage: foundMedicine.dosage,
          sideEffects: foundMedicine.sideEffects,
          warnings: foundMedicine.warnings,
          interactions: foundMedicine.interactions,
          storage: foundMedicine.storage
        };
        
        setDrugInfo(drugInfo);
        toast.success(`Information found for ${foundMedicine.name}`);
      } else {
        // Check hardcoded database as fallback
        const hardcodedDrug = sriLankanMedicineDatabase[searchQuery];
        if (hardcodedDrug) {
          setDrugInfo(hardcodedDrug);
          toast.success(`Information found for ${hardcodedDrug.name}`);
        } else {
          toast.error(`No information found for "${searchQuery}". Database contains ${completeNMRADatabase.length + sriLankanMedicines.length} registered medications.`);
        }
      }
    } catch (error) {
      toast.error('Failed to search drug information');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-medical-blue to-medical-green bg-clip-text text-transparent">
          Drug Information Search
        </h2>
        <p className="text-muted-foreground">
          Search for comprehensive information about medications approved by National Medicines Regulatory Authority (NMRA)
        </p>
      </div>

      {/* Search Bar - Stackable in mobile */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select onValueChange={(value) => setSearchTerm(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select from 4,921+ NMRA registered medicines" />
                </SelectTrigger>
                <SelectContent>
                  {/* Local Sri Lankan medicines */}
                  {sriLankanMedicines.map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.name.toLowerCase()}>
                      {medicine.name} - {medicine.category}
                    </SelectItem>
                  ))}
                  {/* Complete NMRA registered medicines */}
                  {completeNMRADatabase.slice(0, 200).map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.name.toLowerCase()}>
                      {medicine.name} - {medicine.category} (NMRA: {medicine.nmraRegistration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Or type medicine name manually"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-4"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="medical-gradient text-white w-full sm:w-auto"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="mt-3 text-sm text-muted-foreground text-center">
            Try searching: <span className="font-medium">paracetamol</span>, <span className="font-medium">aspirin</span>, or <span className="font-medium">amoxicillin</span>
          </div>
        </CardContent>
      </Card>

      {/* Drug Information Display */}
      {drugInfo && (
        <div className="space-y-4">
          {/* Basic Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-medical-blue" />
                {drugInfo.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{drugInfo.category}</Badge>
                <Badge variant="secondary">Generic: {drugInfo.genericName}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{drugInfo.description}</p>
            </CardContent>
          </Card>

          {/* Uses */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-medical-green">Medical Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {drugInfo.uses?.map((use, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-medical-green rounded-full"></div>
                    <span className="text-sm">{use}</span>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No uses information available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Dosage */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-blue-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Dosage Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{drugInfo.dosage}</p>
            </CardContent>
          </Card>

          {/* Side Effects */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Side Effects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {drugInfo.sideEffects?.map((effect, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">{effect}</span>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No side effects information available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          <Card className="glass-card border-red-200">
            <CardHeader>
              <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Important Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {drugInfo.warnings?.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-700">{warning}</span>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No warnings information available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Drug Interactions */}
          <Card className="glass-card border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg text-purple-600">Drug Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {drugInfo.interactions?.map((interaction, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">{interaction}</span>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No interactions information available</p>}
              </div>
            </CardContent>
          </Card>

          {/* Storage Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-gray-600">Storage Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{drugInfo.storage}</p>
            </CardContent>
          </Card>

          {/* AI-Powered Drug Analysis */}
          <DrugAnalysisCard 
            drugName={drugInfo.name} 
            drugDetails={drugInfo} 
          />

          {/* Disclaimer */}
          <Card className="glass-card border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-orange-800 mb-2">Medical Disclaimer</h4>
                  <p className="text-sm text-orange-700">
                    This information is for educational purposes only and should not replace professional medical advice. 
                    Always consult with a qualified healthcare provider before starting, stopping, or changing any medication.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!drugInfo && !isLoading && (
        <Card className="glass-card">
          <CardContent className="pt-6 text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Search for Drug Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter a medication name to get comprehensive information about dosage, side effects, and warnings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DrugInformation;