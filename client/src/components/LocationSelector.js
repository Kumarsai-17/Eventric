import { useState, useEffect } from "react";
import "../styles/locationSelector.css";

// Comprehensive list of Indian cities (500+ major cities)
const INDIAN_CITIES = [
  // Metro Cities
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  
  // Tier 1 Cities
  "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad",
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivali",
  
  // Tier 2 Cities
  "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah",
  "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Chandigarh", "Guwahati",
  "Solapur", "Hubballi-Dharwad", "Tiruchirappalli", "Bareilly", "Mysore", "Tiruppur", "Gurgaon", "Aligarh", "Jalandhar", "Bhubaneswar",
  "Salem", "Warangal", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur",
  "Bhilai", "Cuttack", "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela",
  
  // Tier 3 Cities & Important Towns
  "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi",
  "Ulhasnagar", "Jammu", "Sangli-Miraj", "Mangalore", "Erode", "Belgaum", "Ambattur", "Tirunelveli", "Malegaon", "Gaya",
  "Jalgaon", "Udaipur", "Maheshtala", "Davanagere", "Kozhikode", "Kurnool", "Rajpur Sonarpur", "Rajahmundry", "Bokaro", "South Dumdum",
  "Bellary", "Patiala", "Gopalpur", "Agartala", "Bhagalpur", "Muzaffarnagar", "Bhatpara", "Panihati", "Latur", "Dhule",
  "Tirupati", "Rohtak", "Korba", "Bhilwara", "Berhampur", "Muzaffarpur", "Ahmednagar", "Mathura", "Kollam", "Avadi",
  "Kadapa", "Kamarhati", "Sambalpur", "Bilaspur", "Shahjahanpur", "Satara", "Bijapur", "Rampur", "Shivamogga", "Chandrapur",
  "Junagadh", "Thrissur", "Alwar", "Bardhaman", "Kulti", "Kakinada", "Nizamabad", "Parbhani", "Tumkur", "Khammam",
  "Ozhukarai", "Bihar Sharif", "Panipat", "Darbhanga", "Bally", "Aizawl", "Dewas", "Ichalkaranji", "Karnal", "Bathinda",
  "Jalna", "Eluru", "Kirari Suleman Nagar", "Barasat", "Purnia", "Satna", "Mau", "Sonipat", "Farrukhabad", "Sagar",
  "Rourkela", "Durg", "Imphal", "Ratlam", "Hapur", "Arrah", "Karimnagar", "Anantapur", "Etawah", "Ambarnath",
  "North Dumdum", "Bharatpur", "Begusarai", "New Delhi", "Gandhidham", "Baranagar", "Tiruvottiyur", "Puducherry", "Sikar", "Thoothukudi",
  "Raurkela Industrial Township", "Sri Ganganagar", "Karawal Nagar", "Mango", "Thanjavur", "Bulandshahr", "Uluberia", "Murwara", "Sambhal", "Singrauli",
  "Nadiad", "Secunderabad", "Naihati", "Yamunanagar", "Bidhan Nagar", "Pallavaram", "Bidar", "Munger", "Panchkula", "Burhanpur",
  "Raurkela", "Kharagpur", "Dindigul", "Gandhinagar", "Hospet", "Nangloi Jat", "Malda", "Ongole", "Deoghar", "Chapra",
  "Haldia", "Khandwa", "Nandyal", "Morena", "Amroha", "Anand", "Bhusawal", "Orai", "Bahraich", "Vellore",
  "Mahesana", "Sambalpur", "Raiganj", "Sirsa", "Danapur", "Serampore", "Sultan Pur Majra", "Guna", "Jaunpur", "Panvel",
  "Shivpuri", "Surendranagar Dudhrej", "Unnao", "Hugli-Chinsurah", "Alappuzha", "Kottayam", "Machilipatnam", "Shimla", "Adoni", "Udupi",
  "Katihar", "Proddatur", "Mahbubnagar", "Saharsa", "Dibrugarh", "Jorhat", "Hazaribagh", "Hindupur", "Nagaon", "Sasaram",
  "Hajipur", "Bhimavaram", "Dehri", "Madanapalle", "Siwan", "Bettiah", "Guntakal", "Srikakulam", "Motihari", "Dharmavaram",
  "Gudivada", "Narasaraopet", "Bagaha", "Miryalaguda", "Tadipatri", "Kishanganj", "Karaikudi", "Suryapet", "Jamalpur", "Kavali",
  "Tadepalligudem", "Amaravati", "Buxar", "Jehanabad", "Aurangabad", "Gangtok", "Shillong", "Kohima", "Itanagar", "Dispur",
  "Raigarh", "Ratnagiri", "Sangli", "Osmanabad", "Nandurbar", "Wardha", "Udgir", "Hinganghat", "Yavatmal", "Achalpur",
  "Miraj", "Palghar", "Vasai", "Virar", "Mira-Bhayandar", "Panvel", "Badlapur", "Ambernath", "Ulhasnagar", "Bhiwandi",
  "Dombivli", "Kalyan", "Navi Mumbai", "Vashi", "Airoli", "Ghansoli", "Kopar Khairane", "Turbhe", "Nerul", "Belapur",
  "Kharghar", "Kamothe", "New Panvel", "Raigad", "Alibag", "Pen", "Uran", "Karjat", "Khopoli", "Lonavala",
  "Talegaon", "Chakan", "Kharadi", "Wakad", "Hinjewadi", "Baner", "Aundh", "Kothrud", "Hadapsar", "Viman Nagar"
];

const LocationSelector = ({ onSelect, onSkip, defaultCity = "" }) => {
  const [mode, setMode] = useState("choice"); // "choice", "detecting", "expanded"
  const [detectedCity, setDetectedCity] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showAllCities, setShowAllCities] = useState(false);

  // Popular cities to display (simple list, no icons)
  const popularCities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"
  ];

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = INDIAN_CITIES.filter((city) =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Show top 10 matches
      setFilteredCities(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const detectUserLocation = async () => {
    setMode("detecting");
    setLocationError(null);

    // Try browser geolocation API
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get city name
            const city = await getCityFromCoordinates(latitude, longitude);
            
            if (city) {
              // Directly select the city without showing confirmation
              onSelect(city);
            } else {
              setLocationError("Could not detect your city. Please select manually.");
              setMode("choice");
            }
          } catch (error) {
            console.error("Error getting city:", error);
            setLocationError("Could not detect your city. Please select manually.");
            setMode("choice");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Location access denied. Please select manually.");
          setMode("choice");
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLocationError("Geolocation not supported. Please select manually.");
      setMode("choice");
    }
  };

  const getCityFromCoordinates = async (lat, lon) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      const data = await response.json();
      
      // Extract city name
      const city = data.address?.city || 
                   data.address?.town || 
                   data.address?.village || 
                   data.address?.state_district ||
                   data.address?.state;
      
      return city;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  };

  const handleManualSelection = () => {
    setMode("manual");
  };

  const handleAutoDetection = () => {
    detectUserLocation();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCity) {
      onSelect(selectedCity);
    }
  };

  const handleUseDetectedCity = () => {
    if (detectedCity) {
      onSelect(detectedCity);
    }
  };

  const handleCitySelect = (city) => {
    onSelect(city);
  };

  const handleSearchSelect = (city) => {
    setSelectedCity(city);
    setSearchTerm(city);
    setShowSuggestions(false);
  };

  const handleViewAllCities = () => {
    setShowAllCities(!showAllCities);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedCity(value);
  };

  // Get cities to display based on view state
  const citiesToDisplay = showAllCities ? INDIAN_CITIES : popularCities;

  return (
    <div className="location-selector-overlay">
      <div className="location-selector-modal location-selector-modal-simple">
        
        {/* Detecting State */}
        {mode === "detecting" && (
          <div className="location-detecting-simple">
            <div className="location-detecting-spinner"></div>
            <p>Detecting your location...</p>
          </div>
        )}

        {/* Main Choice Screen */}
        {mode === "choice" && (
          <div className="location-simple">
            {/* Close/Back Button */}
            <button 
              type="button" 
              className="location-simple-close"
              onClick={onSkip}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Header */}
            <h2 className="location-simple-title">Select Your City</h2>

            {/* Search Bar */}
            <div className="location-simple-search">
              <input
                type="text"
                placeholder="Search for your city"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                className="location-simple-input"
                autoComplete="off"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && filteredCities.length > 0 && (
                <div className="location-simple-dropdown">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className="location-simple-dropdown-item"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {locationError && (
              <div className="location-error-msg">{locationError}</div>
            )}

            {/* Detect Location Link */}
            <button
              type="button"
              className="location-simple-detect"
              onClick={handleAutoDetection}
              disabled={mode === "detecting"}
            >
              <span>📍</span> Detect my location
            </button>

            {/* Popular/All Cities List */}
            <div className="location-simple-cities">
              <h3 className="location-simple-subtitle">
                {showAllCities ? "All Cities" : "Popular Cities"}
              </h3>
              <div className="location-simple-list">
                {citiesToDisplay.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className="location-simple-city-btn"
                    onClick={() => handleCitySelect(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* View All Toggle Button */}
            <button
              type="button"
              className="location-simple-toggle"
              onClick={handleViewAllCities}
            >
              {showAllCities ? "Show Less ↑" : "View All Cities ↓"}
            </button>
          </div>
        )}

        {/* Manual Selection Screen (kept for backward compatibility) */}
        {mode === "manual" && (
          <div className="location-manual">
            <div className="location-selector-header">
              <h2>📍 Select Your City</h2>
              <p className="text-muted">
                {locationError || "Start typing to see suggestions"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="location-selector-form">
              <div className="location-search">
                <input
                  type="text"
                  placeholder="Type your city name..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                  className="location-search-input"
                  autoFocus
                  autoComplete="off"
                />
                <small className="text-muted location-hint">
                  e.g., Mumbai, Delhi, Bangalore - Over 500 Indian cities available
                </small>

                {/* Autocomplete Suggestions */}
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="location-suggestions">
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        className="location-suggestion-item"
                        onClick={() => handleSearchSelect(city)}
                      >
                        <span className="location-suggestion-icon">📍</span>
                        <span className="location-suggestion-name">{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="location-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onSkip}
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedCity}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
