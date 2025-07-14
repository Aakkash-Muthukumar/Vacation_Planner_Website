import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, LogOut, MapPin, Plane, Sun, Moon, DollarSign, Star, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface HomePageProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

interface PackageResult {
  type: 'economic' | 'business' | 'luxury';
  total_price: number;
  flight: {
    airline: string;
    departure_city: string;
    departure_airport: string;
    arrival_city: string;
    arrival_airport: string;
    departure_time: string;
    arrival_time: string;
    duration: string;
    price: string;
    currency: string;
  };
  hotel: {
    name: string;
    address: any;
    rating: string;
    price?: string;
  };
  activities: {
    name: string;
    description: string;
    price: string;
    currency: string;
  }[];
  description: string;
}

export const HomePage = ({ darkMode, setDarkMode }: HomePageProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [startingLocation, setStartingLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [packages, setPackages] = useState<PackageResult[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageResult | null>(null);

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Call Amadeus API to get package options
      const response = await supabase.functions.invoke('amadeus-search', {
        body: {
          origin: startingLocation,
          destination: destination,
          departure_date: startDate.toISOString().split('T')[0],
          adults: 1
        }
      });

      if (response.error) throw response.error;

      setPackages(response.data);
      setShowPackages(true);

      toast({
        title: "Packages found!",
        description: "Choose from our curated travel packages below.",
      });

    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch travel packages. Please try again.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleSelectPackage = async (packageData: PackageResult) => {
    setSelectedPackage(packageData);
    
    try {
      const { error } = await supabase
        .from('vacation_plans')
        .insert({
          user_id: user!.id,
          starting_location: startingLocation,
          destination,
          start_date: startDate!.toISOString().split('T')[0],
          end_date: endDate!.toISOString().split('T')[0],
          number_of_people: 1,
          budget: packageData.total_price,
        });

      if (error) throw error;

      toast({
        title: "Package selected!",
        description: `Your ${packageData.type} package has been saved successfully.`,
      });

    } catch (error) {
      console.error('Error saving vacation plan:', error);
      toast({
        title: "Error",
        description: "Failed to save vacation plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setStartingLocation('');
    setDestination('');
    setStartDate(undefined);
    setEndDate(undefined);
    setShowPackages(false);
    setPackages([]);
    setSelectedPackage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-start to-gradient-end relative">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent"></div>
      
      {/* Top navigation */}
      <div className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-4">
          <span className="text-foreground font-medium">{user?.email}</span>
          <Button variant="outline" size="sm" className="bg-card/80 border-border hover:bg-card">
            My Plans
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-foreground hover:bg-card/50">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {showPackages && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="bg-card/80 border-border hover:bg-card"
            >
              New Search
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="text-foreground hover:bg-card/50"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6">
        
        {!showPackages ? (
          <>
            {/* Hero section */}
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="text-foreground">Vacation</span>{' '}
                <span className="text-accent">Planner</span>
              </h1>
              <p className="text-xl text-foreground mb-6">Your Dream Trip, Perfectly Planned!</p>
              
              {/* Feature bullets */}
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center text-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-feature-blue"></div>
                  <span>Personalized Planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-feature-pink"></div>
                  <span>Budget Optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-feature-green"></div>
                  <span>Instant Results</span>
                </div>
              </div>
            </div>

            {/* Planning card */}
            <Card className="w-full max-w-lg shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Plane className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Plan Your Vacation</CardTitle>
                <CardDescription>
                  Tell us about your dream trip and we'll help you plan it perfectly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlanTrip} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="startingLocation">Starting Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="startingLocation"
                        placeholder="Where are you starting from? (e.g., NYC)"
                        value={startingLocation}
                        onChange={(e) => setStartingLocation(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="destination"
                        placeholder="Where do you want to go? (e.g., BCN)"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) => date < (startDate || new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Finding Packages...' : 'Find Travel Packages'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Package Selection */}
            <div className="w-full max-w-6xl">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4 text-foreground">
                  Choose Your Perfect Package
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  From {startingLocation} to {destination} • {startDate && format(startDate, "MMM dd")} - {endDate && format(endDate, "MMM dd, yyyy")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <Card key={pkg.type} className={cn(
                    "relative shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer",
                    pkg.type === 'business' && "border-primary scale-105",
                    selectedPackage?.type === pkg.type && "ring-2 ring-primary"
                  )}>
                    {pkg.type === 'business' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-3">
                        {pkg.type === 'economic' && <DollarSign className="h-8 w-8 text-feature-green" />}
                        {pkg.type === 'business' && <Star className="h-8 w-8 text-primary" />}
                        {pkg.type === 'luxury' && <Sparkles className="h-8 w-8 text-accent" />}
                      </div>
                      <CardTitle className="text-2xl capitalize">{pkg.type}</CardTitle>
                      <CardDescription className="text-sm">{pkg.description}</CardDescription>
                      <div className="text-3xl font-bold text-foreground mt-2">
                        ${pkg.total_price.toFixed(2)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Flight Details */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Plane className="h-4 w-4" />
                          Flight
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          <p>{pkg.flight.airline} • {pkg.flight.departure_city} → {pkg.flight.arrival_city}</p>
                          <p>{new Date(pkg.flight.departure_time).toLocaleDateString()} • {pkg.flight.duration}</p>
                          <p className="font-medium text-foreground">${pkg.flight.price} {pkg.flight.currency}</p>
                        </div>
                      </div>

                      {/* Hotel Details */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          🏨 Hotel
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{pkg.hotel.name}</p>
                          <p>Rating: {pkg.hotel.rating}/5</p>
                          <p className="font-medium text-foreground">${pkg.hotel.price || '100'}/night</p>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          🎯 Activities
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {pkg.activities.slice(0, 2).map((activity, idx) => (
                            <p key={idx}>{activity.name} - ${activity.price}</p>
                          ))}
                          {pkg.activities.length > 2 && (
                            <p className="text-primary">+{pkg.activities.length - 2} more activities</p>
                          )}
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-6" 
                        onClick={() => handleSelectPackage(pkg)}
                        variant={pkg.type === 'business' ? 'default' : 'outline'}
                      >
                        Select {pkg.type} Package
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};