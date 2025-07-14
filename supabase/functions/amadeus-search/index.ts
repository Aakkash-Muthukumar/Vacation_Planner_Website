import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  origin: string
  destination: string
  departure_date: string
  adults: number
  budget?: number
  package_type?: 'economic' | 'business' | 'luxury'
}

interface FlightOffer {
  airline: string
  departure_city: string
  departure_airport: string
  arrival_city: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  duration: string
  price: string
  currency: string
}

interface Hotel {
  name: string
  address: any
  rating: string
  hotelId: string
  price?: string
}

interface Activity {
  name: string
  description: string
  price: string
  currency: string
}

interface PackageResult {
  type: 'economic' | 'business' | 'luxury'
  total_price: number
  flight: FlightOffer
  hotel: Hotel
  activities: Activity[]
  description: string
}

const AMADEUS_CLIENT_ID = "tDEFuHpbkdj0elK6Cu3xmxYwCExrkBFD"
const AMADEUS_CLIENT_SECRET = "t6ObweQDLggDjcLw"

let accessToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get access token')
  }

  const data = await response.json()
  accessToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early
  
  return accessToken
}

async function searchFlights(origin: string, destination: string, departureDate: string, adults: number): Promise<FlightOffer[]> {
  const token = await getAccessToken()
  
  const response = await fetch(
    `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}&adults=${adults}&max=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to search flights')
  }

  const data = await response.json()
  
  return data.data?.map((flight: any) => {
    const itinerary = flight.itineraries[0]
    const firstSegment = itinerary.segments[0]
    const lastSegment = itinerary.segments[itinerary.segments.length - 1]

    return {
      airline: firstSegment.carrierCode,
      departure_city: firstSegment.departure.iataCode,
      departure_airport: firstSegment.departure.iataCode,
      arrival_city: lastSegment.arrival.iataCode,
      arrival_airport: lastSegment.arrival.iataCode,
      departure_time: firstSegment.departure.at,
      arrival_time: lastSegment.arrival.at,
      duration: itinerary.duration,
      price: flight.price.grandTotal,
      currency: flight.price.currency
    }
  }) || []
}

async function searchHotels(destination: string): Promise<Hotel[]> {
  const token = await getAccessToken()
  
  const response = await fetch(
    `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${destination}&radius=10&radiusUnit=KM&ratings=1,2,3,4,5`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to search hotels')
  }

  const data = await response.json()
  
  return data.data?.slice(0, 20).map((hotel: any) => ({
    name: hotel.name || 'N/A',
    address: hotel.address || {},
    rating: hotel.rating || 'N/A',
    hotelId: hotel.hotelId || 'N/A'
  })) || []
}

async function getHotelPrices(hotelIds: string[]): Promise<{ [key: string]: string }> {
  const token = await getAccessToken()
  const priceMap: { [key: string]: string } = {}
  
  // Process in batches of 10
  for (let i = 0; i < hotelIds.length; i += 10) {
    const batch = hotelIds.slice(i, i + 10)
    const hotelIdsStr = batch.join(',')
    
    try {
      const response = await fetch(
        `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIdsStr}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        data.data?.forEach((hotel: any) => {
          const offers = hotel.offers || []
          if (offers.length > 0) {
            const hotelName = hotel.hotel?.name || 'Unknown'
            priceMap[hotelName] = offers[0].price?.total || '0'
          }
        })
      }
    } catch (error) {
      console.error('Error fetching hotel prices for batch:', error)
    }
  }
  
  return priceMap
}

async function searchActivities(latitude: number, longitude: number): Promise<Activity[]> {
  const token = await getAccessToken()
  
  const response = await fetch(
    `https://test.api.amadeus.com/v1/shopping/activities?latitude=${latitude}&longitude=${longitude}&radius=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    return [] // Activities might not be available for all locations
  }

  const data = await response.json()
  
  return data.data?.slice(0, 10).map((activity: any) => ({
    name: activity.name || 'N/A',
    description: activity.description || 'N/A',
    price: activity.price?.amount || '0.00',
    currency: activity.price?.currencyCode || 'EUR'
  })) || []
}

function selectItemsByPackage<T extends { price?: string }>(items: T[], packageType: 'economic' | 'business' | 'luxury'): T {
  if (items.length === 0) return items[0]
  
  const sortedItems = [...items].sort((a, b) => {
    const priceA = parseFloat(a.price || '0')
    const priceB = parseFloat(b.price || '0')
    return priceA - priceB
  })
  
  switch (packageType) {
    case 'economic':
      return sortedItems[0] // Cheapest
    case 'business':
      return sortedItems[Math.floor(sortedItems.length / 2)] // Middle
    case 'luxury':
      return sortedItems[sortedItems.length - 1] // Most expensive
    default:
      return sortedItems[Math.floor(sortedItems.length / 2)]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Amadeus function called with method:', req.method)
    const requestData = await req.json()
    console.log('Request data:', requestData)

    const { origin, destination, departure_date, adults, budget, package_type }: SearchRequest = requestData

    // For now, return mock data since Amadeus API might not be working in demo
    const mockPackages = [
      {
        type: 'economic' as const,
        total_price: 850,
        flight: {
          airline: 'AA',
          departure_city: origin || 'NYC',
          departure_airport: origin || 'JFK',
          arrival_city: destination || 'BCN',
          arrival_airport: destination || 'BCN',
          departure_time: '2025-01-20T08:00:00Z',
          arrival_time: '2025-01-20T20:00:00Z',
          duration: 'PT8H',
          price: '450',
          currency: 'USD'
        },
        hotel: {
          name: 'Budget Inn Downtown',
          address: { lines: ['123 Main St'], cityName: destination || 'Barcelona' },
          rating: '3',
          price: '80'
        },
        activities: [
          { name: 'City Walking Tour', description: 'Explore the historic center', price: '25', currency: 'USD' },
          { name: 'Local Food Market', description: 'Taste local cuisine', price: '35', currency: 'USD' }
        ],
        description: 'Budget-friendly options'
      },
      {
        type: 'business' as const,
        total_price: 1450,
        flight: {
          airline: 'DL',
          departure_city: origin || 'NYC',
          departure_airport: origin || 'JFK',
          arrival_city: destination || 'BCN',
          arrival_airport: destination || 'BCN',
          departure_time: '2025-01-20T10:00:00Z',
          arrival_time: '2025-01-20T22:00:00Z',
          duration: 'PT7H30M',
          price: '850',
          currency: 'USD'
        },
        hotel: {
          name: 'Comfort Hotel Central',
          address: { lines: ['456 Business Ave'], cityName: destination || 'Barcelona' },
          rating: '4',
          price: '150'
        },
        activities: [
          { name: 'Museum Pass', description: 'Access to top museums', price: '65', currency: 'USD' },
          { name: 'Harbor Cruise', description: 'Scenic boat tour', price: '45', currency: 'USD' }
        ],
        description: 'Balanced comfort and value'
      },
      {
        type: 'luxury' as const,
        total_price: 2850,
        flight: {
          airline: 'UA',
          departure_city: origin || 'NYC',
          departure_airport: origin || 'JFK',
          arrival_city: destination || 'BCN',
          arrival_airport: destination || 'BCN',
          departure_time: '2025-01-20T14:00:00Z',
          arrival_time: '2025-01-21T02:00:00Z',
          duration: 'PT7H',
          price: '1800',
          currency: 'USD'
        },
        hotel: {
          name: 'Grand Luxury Resort & Spa',
          address: { lines: ['789 Premium Blvd'], cityName: destination || 'Barcelona' },
          rating: '5',
          price: '350'
        },
        activities: [
          { name: 'Private Chef Experience', description: 'Exclusive dining experience', price: '200', currency: 'USD' },
          { name: 'Helicopter Tour', description: 'Aerial city views', price: '180', currency: 'USD' }
        ],
        description: 'Premium luxury experience'
      }
    ]

    console.log('Returning mock packages:', mockPackages.length)

    if (package_type) {
      const selectedPackage = mockPackages.find(pkg => pkg.type === package_type)
      return new Response(JSON.stringify(selectedPackage), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(mockPackages), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in amadeus-search function:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})