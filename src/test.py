import json
from amadeus import Client, ResponseError
import os
import certifi
import sys

# Configure Python to use updated SSL certificates
os.environ['SSL_CERT_FILE'] = certifi.where()

# Initializes the Amadeus client
amadeus = Client(
    client_id="tDEFuHpbkdj0elK6Cu3xmxYwCExrkBFD",
    client_secret="t6ObweQDLggDjcLw"
)

arr = []
origin = ""
destination = ""
departure_date = ""
adults = ""
selected_price = 0

def format_flight_data_one(flight):
    """Formats and prints a single flight data."""
    print("Selected Flight:")
    print(f"  Airline: {flight['airline']}")
    print(f"  Departure: {flight['departure_city']} ({flight['departure_airport']})")
    print(f"  Destination: {flight['arrival_city']} ({flight['arrival_airport']})")
    print(f"  Departure Time: {flight['departure_time']}")
    print(f"  Arrival Time: {flight['arrival_time']}")
    print(f"  Duration: {flight['duration']}")
    print(f"  Price: {flight['price']} {flight['currency']}")
    print("-" * 50)

def format_flight_data(flight_data):
    """Formats and prints flight data."""
    for i, flight in enumerate(flight_data, 1):
        print(f"Flight {i}:")
        print(f"  Airline: {flight['airline']}")
        print(f"  Departure: {flight['departure_city']} ({flight['departure_airport']})")
        print(f"  Destination: {flight['arrival_city']} ({flight['arrival_airport']})")
        print(f"  Departure Time: {flight['departure_time']}")
        print(f"  Arrival Time: {flight['arrival_time']}")
        print(f"  Duration: {flight['duration']}")
        print(f"  Price: {flight['price']} {flight['currency']}")
        print("-" * 50)

def flight_offers_search(origin, destination, departure_date, adults):
    """Fetches flight offers and formats the output."""
    try:
        # API call and rest of the code
        # Use these arguments instead of referencing global variables
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=departure_date,
            adults=adults
        )

        # Parse the response
        flights = response.data
        if not flights:
            print("No flights found.")
            return

        # Extract and format the relevant details
        formatted_data = []
        for flight in flights:
            itinerary = flight['itineraries'][0]
            first_segment = itinerary['segments'][0]
            last_segment = itinerary['segments'][-1]

            formatted_data.append({
                "airline": first_segment['carrierCode'],
                "departure_city": first_segment['departure']['iataCode'],
                "departure_airport": first_segment['departure']['iataCode'],
                "arrival_city": last_segment['arrival']['iataCode'],
                "arrival_airport": last_segment['arrival']['iataCode'],
                "departure_time": first_segment['departure']['at'],
                "arrival_time": last_segment['arrival']['at'],
                "duration": itinerary['duration'],
                "price": flight['price']['grandTotal'],
                "currency": flight['price']['currency']
            })

            arr.append(flight['price']['grandTotal'])

        # Print the formatted flight data
        format_flight_data(formatted_data)
        # Select the middle-priced flight
        middle_index = len(formatted_data) // 2
        selected_flight = formatted_data[middle_index]
        # Print the selected flight
        format_flight_data_one(selected_flight)
  
    except ResponseError as error:
        print(f"Error fetching flight details: {error}")
        return None
    return selected_flight

def format_hotel_data_one(hotel):
    """Formats and prints one hotels data."""
    print(f"Selected Hotel:")
    print(f"  Name: {hotel.get('name', 'N/A')}")
    address_lines = hotel['address'].get('lines', ['N/A'])[0] if 'address' in hotel else 'N/A'
    city_name = hotel['address'].get('cityName', 'N/A') if 'address' in hotel else 'N/A'
    print(f"  Address: {address_lines}, {city_name}")
    print(f"  Rating: {hotel.get('rating', 'N/A')}")
    print("-" * 50)

def format_hotel_data(hotel_data):
    """Formats and prints hotel data."""
    for i, hotel in enumerate(hotel_data, 1):
        print(f"Hotel {i}:")
        print(f"  Name: {hotel.get('name', 'N/A')}")
        address_lines = hotel['address'].get('lines', ['N/A'])[0] if 'address' in hotel else 'N/A'
        city_name = hotel['address'].get('cityName', 'N/A') if 'address' in hotel else 'N/A'
        print(f"  Address: {address_lines}, {city_name}")
        print(f"  Rating: {hotel.get('rating', 'N/A')}")
        print(f"  Hotel ID: {hotel.get('hotelId', 'N/A')} ")
        print("-" * 50)

hotelsID = []
def hotel_list_search(destination):
    """Fetches hotels and formats the output."""
    try:
        # API call
        response = amadeus.reference_data.locations.hotels.by_city.get(
            cityCode=destination, 
            radius=10, 
            radiusUnit="KM", 
            ratings="1, 2, 3, 4, 5"
        )
        hotels = response.data
        if not hotels:
            print("No hotels found.")
            return
        
        # Extract and format the relevant details
        formatted_data_hotels = []
        for hotel in hotels:
            # Extracting name, address, rating, and price
            name = hotel.get('name', 'N/A')
            address = hotel.get('address', {})
            rating = hotel.get('rating', 'N/A')
            hotelId = hotel.get('hotelId', 'N/A')
            hotelsID.append(hotel.get('hotelId', 'N/A'))
            # Append to the formatted data
            formatted_data_hotels.append({
                "name": name,
                "address": address,
                "rating": rating,
                "hotelId": hotelId
            })

        # Print the formatted hotel data for all hotels
        format_hotel_data(formatted_data_hotels)
        
        # Save response to a JSON file for debugging
        file_path = "hotel_offers_response.json"
        with open(file_path, "w") as json_file:
            json.dump(hotels, json_file, indent=4)
        


    except ResponseError as error:
        print(f"Error fetching hotel details: {error}")
        return None


selected_hotels = {}
def select_hotel_price():
    """Fetches hotel price using the hotel ID in smaller batches."""
    middle_hotel = ""
    try:
        batch_size = 10  # Reduce batch size
        for i in range(0, len(hotelsID), batch_size):
            batch = hotelsID[i:i + batch_size]  # Get a batch of 10 IDs
            hotelIds_str = ",".join(batch)  # Convert to comma-separated string
            
            print(f"Fetching prices for hotels: {hotelIds_str}")

            response = amadeus.shopping.hotel_offers_search.get(
                hotelIds=hotelIds_str
            )

            hotel_price = response.data

            # Save response to a JSON file for debugging
            file_path = f"hotel_offers_price_batch_{i}.json"
            with open(file_path, "w") as json_file:
                json.dump(hotel_price, json_file, indent=4)

            print(f"Response saved to {file_path}")

            # Check if valid data is returned
            if not hotel_price:
                print("No hotel price data available for this batch.")
                continue

            # Print hotel prices
            for hotel in hotel_price:
                offers = hotel.get('offers', [])
                if offers:
                    try:
                        total_price = offers[0]['price']['total']
                        print(f"Hotel {hotel.get('hotel', {}).get('name', 'Unknown')} - Price: ${total_price}")
                        selected_hotels[hotel.get('hotel', {}).get('name', 'Unknown')] = total_price
                    except KeyError:
                        print(f"Missing price data for hotel: {hotel.get('hotel', {}).get('name', 'Unknown')}")
    except ResponseError as error:
        print(f"Error fetching hotel details: {error}")
        
    # print(selected_hotels)
    price = list(selected_hotels.values())
    # print(price)
    price.sort()
    # print(price)
    selected_price = price[len(price)//2]
    for key, value in selected_hotels.items():
        if value == selected_price:
            print(f"Value ${selected_price} found at key: {key}")
            middle_hotel = key
            break # Exit the loop once found
        else:
            print(f"Value ${selected_price} not found in the dictionary")
    return middle_hotel
        
def find_and_print_middle_hotel(middle_hotel):
    """Finds the hotel matching middle_hotel in hotel_offers_response.json and prints details."""
    file_path = "hotel_offers_response.json"
    
    try:
        # Load JSON data
        with open(file_path, "r") as json_file:
            hotels = json.load(json_file)

        # Find the matching hotel
        for hotel in hotels:
            if hotel.get("name") == middle_hotel:
                format_hotel_data_one(hotel)
                return hotel

        print(f"Hotel '{middle_hotel}' not found in {file_path}")

    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
    except json.JSONDecodeError:
        print(f"Error: Failed to parse JSON from {file_path}.")
    
def read_from_file(word):
    try:
        with open("input.txt", 'r') as file:
            for line in file:
                if line.startswith(word):
                    return line.strip()  # Return the line without leading/trailing whitespace
        return None  # Target word not found
    except FileNotFoundError:
        return None # Handle the case where the file does not exist

def format_activities_data(activity_data):
    """Formats and prints activity data."""
    for i, activity in enumerate(activity_data, 1):
        print(f"activity {i}:")
        print(f"  Name: {activity.get('name', 'N/A')}")
        print(f"  Description: {activity.get('description', 'N/A')}")
        print(f"  Price: {activity.get('price', 'N/A')} {activity.get('currency', 'N/A')}")
        print("-" * 50)

def activities_search(latitude, longitude, radius=20):
    try:
        # Returns activities for a location in Barcelona based on geolocation coordinates
        response = amadeus.shopping.activities.get(
        latitude=latitude,
        longitude=longitude,
        radius=20
    )
        activities = response.data
        if not activities:
            print("No activities found.")
            return
        
        formatted_data_activities = []
        for activity in activities:
            # Extracting name, address, rating, and price
            name = activity.get('name', 'N/A')
            description = activity.get('description', {})
            price = activity["price"].get('amount', '0.00')
            currency = activity["price"].get('currencyCode', 'N/A')
            # Append to the formatted data
            formatted_data_activities.append({
                "name": name,
                "description": description,
                "price": price,
                "currency": currency
            })

        # Print the formatted hotel data for all hotels
        format_activities_data(formatted_data_activities)
        
    except ResponseError as error:
        raise error
    # Save response to a JSON file for debugging
    file_path = "activities_search_response.json"
    with open(file_path, "w") as json_file:
        json.dump(activities, json_file, indent=4)

def extract_budget(budget):
    """Extract numeric budget value from a string like 'Budget: $1234'.

    If no dollar amount is found, 0 is returned to avoid crashes."""
    if not budget:
        return 0

    dollar_index = budget.find("$")
    if dollar_index == -1:
        return 0

    # Gather consecutive digits following the '$' symbol
    digits = []
    for ch in budget[dollar_index + 1:]:
        if ch.isdigit():
            digits.append(ch)
        else:
            break

    return int("".join(digits)) if digits else 0
            
    
def main():
    print("Welcome to the Vacation Planner!")

    # Collect user inputs
    origin = input("Please enter an origin location code: ")
    destination = input("Please enter a destination location code: ")
    departure_date = input("Please enter a departure date in the YYYY-MM-DD format: ")
    adults = int(input("The number of adult passengers with age 12 or older: "))
    # Fetch flight offers
    middle_flight = flight_offers_search(origin, destination, departure_date, adults)
    decision = input("Do you want to continue to get the hotel results: \nIf yes, enter 'Y', else, enter 'N' to quit.")
    
    if(decision == "y" or decision == "Y"):
        # Fetch hotel list and get the middle-priced hotel's ID
        # Get check-in date from the user
        hotel_list_search(destination)
        middle_hotel = select_hotel_price()
        find_and_print_middle_hotel(middle_hotel)
    if(decision == "n" or decision == "N"):
        print("Program has quit.")
        sys.exit()
    budget = read_from_file("Budget")
    # Calculate the remaining budget after subtracting the total of hotel and flight price.
    budget_value = extract_budget(budget)
    print(f"Budget: ${budget_value:.2f}")
    budget_value -= float(middle_flight['price']) + int(selected_price)
    print(f"Remaining budget after deducting flight and hotel costs: ${budget_value:.2f}")
    
    hotel_data = find_and_print_middle_hotel(middle_hotel)
    if hotel_data:
        latitude = hotel_data.get('geoCode', {}).get('latitude', 0)
        longitude = hotel_data.get('geoCode', {}).get('longitude', 0)
        print("Fetching activities within a 20-mile radius to cover all options: ")
        activities_search(latitude, longitude, radius=20)
    

if __name__ == "__main__":
    main()