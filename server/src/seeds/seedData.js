/**
 * Hero Showroom — Development Demo Seed Dataset
 * Realistic automotive catalogue data for Brands, Cities, Showrooms, Bikes, and Bike Variants.
 */

const brandsData = [
  {
    name: 'Hero MotoCorp',
    slug: 'hero-motocorp',
    logo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300',
    description: "The world's largest manufacturer of two-wheelers, renowned for reliability and fuel efficiency.",
    originCountry: 'India',
    website: 'https://www.heromotocorp.com',
    isActive: true
  },
  {
    name: 'Hero Premia',
    slug: 'hero-premia',
    logo: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300',
    description: 'The exclusive premium dealership network of Hero MotoCorp for flagship performance motorcycles.',
    originCountry: 'India',
    website: 'https://www.heromotocorp.com/en-in/premia.html',
    isActive: true
  },
  {
    name: 'Vida',
    slug: 'vida',
    logo: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300',
    description: 'Powered by Hero MotoCorp, Vida is the electric mobility brand defining future urban commutes.',
    originCountry: 'India',
    website: 'https://www.vidaworld.com',
    isActive: true
  },
  {
    name: 'Harley-Davidson',
    slug: 'harley-davidson',
    logo: 'https://images.unsplash.com/photo-1558981420-87aa92d0c649?w=300',
    description: 'Iconic American roadster heritage, collaboratively co-developed with Hero MotoCorp in India.',
    originCountry: 'United States',
    website: 'https://www.harley-davidson.com/in',
    isActive: true
  },
  {
    name: 'Hero Motorsports',
    slug: 'hero-motorsports',
    logo: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?w=300',
    description: 'Rally and motorsport division engineering Dakar-proven endurance motorcycle technology.',
    originCountry: 'India',
    website: 'https://www.heromotosports.com',
    isActive: true
  },
  {
    name: 'Honda Motorcycles',
    slug: 'honda-motorcycles',
    logo: 'https://images.unsplash.com/photo-1558981854-3e9a9a3b6f84?w=300',
    description: 'Japanese automotive engineering pioneer delivering efficient commuter and performance two-wheelers.',
    originCountry: 'Japan',
    website: 'https://www.honda2wheelersindia.com',
    isActive: true
  },
  {
    name: 'TVS Motor Company',
    slug: 'tvs-motor',
    logo: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=300',
    description: 'Leading Indian two-wheeler manufacturer pioneering racing-inspired engineering and tech.',
    originCountry: 'India',
    website: 'https://www.tvsmotor.com',
    isActive: true
  },
  {
    name: 'Bajaj Auto',
    slug: 'bajaj-auto',
    logo: 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?w=300',
    description: "The World's Favourite Indian manufacturer of sport and commuter motorcycles.",
    originCountry: 'India',
    website: 'https://www.bajajauto.com',
    isActive: true
  },
  {
    name: 'Royal Enfield',
    slug: 'royal-enfield',
    logo: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=300',
    description: 'Oldest global motorcycle brand in continuous production, defining classic modern motorcycling.',
    originCountry: 'India',
    website: 'https://www.royalenfield.com',
    isActive: true
  },
  {
    name: 'Ather Energy',
    slug: 'ather-energy',
    logo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300',
    description: 'Next-generation smart electric scooter manufacturer with connected telematics and fast charging.',
    originCountry: 'India',
    website: 'https://www.atherenergy.com',
    isActive: true
  }
];

const citiesData = [
  {
    name: 'Mumbai',
    slug: 'mumbai',
    state: 'Maharashtra',
    country: 'India',
    tier: 'Metro',
    coordinates: { latitude: 18.922, longitude: 72.8347 },
    isActive: true
  },
  {
    name: 'New Delhi',
    slug: 'delhi',
    state: 'Delhi',
    country: 'India',
    tier: 'Metro',
    coordinates: { latitude: 28.6139, longitude: 77.209 },
    isActive: true
  },
  {
    name: 'Bengaluru',
    slug: 'bengaluru',
    state: 'Karnataka',
    country: 'India',
    tier: 'Metro',
    coordinates: { latitude: 12.9716, longitude: 77.5946 },
    isActive: true
  },
  {
    name: 'Hyderabad',
    slug: 'hyderabad',
    state: 'Telangana',
    country: 'India',
    tier: 'Metro',
    coordinates: { latitude: 17.385, longitude: 78.4867 },
    isActive: true
  },
  {
    name: 'Chennai',
    slug: 'chennai',
    state: 'Tamil Nadu',
    country: 'India',
    tier: 'Metro',
    coordinates: { latitude: 13.0827, longitude: 80.2707 },
    isActive: true
  },
  {
    name: 'Kolkata',
    slug: 'kolkata',
    state: 'West Bengal',
    country: 'India',
    tier: 'Metro',
    coordinates: { latitude: 22.5726, longitude: 88.3639 },
    isActive: true
  },
  {
    name: 'Pune',
    slug: 'pune',
    state: 'Maharashtra',
    country: 'India',
    tier: 'Tier 1',
    coordinates: { latitude: 18.5204, longitude: 73.8567 },
    isActive: true
  },
  {
    name: 'Ahmedabad',
    slug: 'ahmedabad',
    state: 'Gujarat',
    country: 'India',
    tier: 'Tier 1',
    coordinates: { latitude: 23.0225, longitude: 72.5714 },
    isActive: true
  },
  {
    name: 'Jaipur',
    slug: 'jaipur',
    state: 'Rajasthan',
    country: 'India',
    tier: 'Tier 1',
    coordinates: { latitude: 26.9124, longitude: 75.7873 },
    isActive: true
  },
  {
    name: 'Lucknow',
    slug: 'lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    tier: 'Tier 1',
    coordinates: { latitude: 26.8467, longitude: 80.9462 },
    isActive: true
  },
  {
    name: 'Chandigarh',
    slug: 'chandigarh',
    state: 'Punjab',
    country: 'India',
    tier: 'Tier 2',
    coordinates: { latitude: 30.7333, longitude: 76.7794 },
    isActive: true
  },
  {
    name: 'Kochi',
    slug: 'kochi',
    state: 'Kerala',
    country: 'India',
    tier: 'Tier 2',
    coordinates: { latitude: 9.9312, longitude: 76.2673 },
    isActive: true
  },
  {
    name: 'Indore',
    slug: 'indore',
    state: 'Madhya Pradesh',
    country: 'India',
    tier: 'Tier 2',
    coordinates: { latitude: 22.7196, longitude: 75.8577 },
    isActive: true
  },
  {
    name: 'Dehradun',
    slug: 'dehradun',
    state: 'Uttarakhand',
    country: 'India',
    tier: 'Tier 2',
    coordinates: { latitude: 30.3165, longitude: 78.0322 },
    isActive: true
  },
  {
    name: 'Bhopal',
    slug: 'bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
    tier: 'Tier 2',
    coordinates: { latitude: 23.2599, longitude: 77.4126 },
    isActive: true
  }
];

const showroomsData = [
  {
    name: 'Hero Premia Flagship Worli',
    slug: 'hero-premia-worli-mumbai',
    brandSlug: 'hero-premia',
    citySlug: 'mumbai',
    dealerName: 'Fortune Premia Auto',
    showroomType: 'Premia Flagship',
    address: {
      street: 'Dr. Annie Besant Road',
      area: 'Worli',
      pincode: '400018',
      fullAddress: 'Showroom 4, Atria Mall, Dr. Annie Besant Road, Worli, Mumbai, Maharashtra 400018'
    },
    contact: {
      phone: '+91 22 2490 8888',
      email: 'worli.premia@heropremia.com',
      website: 'https://www.heromotocorp.com/en-in/premia.html'
    },
    location: {
      type: 'Point',
      coordinates: [72.8183, 19.0144] // [longitude, latitude]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Lounge Cafe', 'Customization Studio'],
    rating: { average: 4.8, count: 240 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Fortune Hero Dealership Andheri',
    slug: 'fortune-hero-andheri-mumbai',
    brandSlug: 'hero-motocorp',
    citySlug: 'mumbai',
    dealerName: 'Fortune Motor Corp',
    showroomType: 'Standard Dealership',
    address: {
      street: 'SV Road, Near Station',
      area: 'Andheri West',
      pincode: '400058',
      fullAddress: 'Plot 12, SV Road, Andheri West, Mumbai, Maharashtra 400058'
    },
    contact: {
      phone: '+91 22 2620 5555',
      email: 'andheri@fortunehero.com',
      website: 'https://www.heromotocorp.com'
    },
    location: {
      type: 'Point',
      coordinates: [72.8467, 19.1136]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Finance Assistance'],
    rating: { average: 4.4, count: 520 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Connaught Place',
    slug: 'hero-premia-connaught-delhi',
    brandSlug: 'hero-premia',
    citySlug: 'delhi',
    dealerName: 'Capital Automotive Hub',
    showroomType: 'Premia Flagship',
    address: {
      street: 'Barakhamba Road, Outer Circle',
      area: 'Connaught Place',
      pincode: '110001',
      fullAddress: 'Block K, Connaught Place, New Delhi, Delhi 110001'
    },
    contact: {
      phone: '+91 11 2341 9999',
      email: 'cp.premia@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [77.2167, 28.6315]
    },
    openingHours: { displayText: '10:00 AM - 9:00 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'VIP Lounge', 'Accessories Display'],
    rating: { average: 4.9, count: 310 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Vida Experience Center Saket',
    slug: 'vida-experience-center-delhi',
    brandSlug: 'vida',
    citySlug: 'delhi',
    dealerName: 'Vida Mobility Delhi',
    showroomType: 'Experience Center',
    address: {
      street: 'Press Enclave Marg',
      area: 'Saket District Centre',
      pincode: '110017',
      fullAddress: 'Ground Floor, Select Citywalk Mall, Saket, New Delhi, Delhi 110017'
    },
    contact: {
      phone: '+91 11 4100 2200',
      email: 'delhi@vidaworld.com'
    },
    location: {
      type: 'Point',
      coordinates: [77.2192, 28.5244]
    },
    openingHours: { displayText: '11:00 AM - 9:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['EV Test Rides', 'Fast Charging Station', 'Battery Swap Demo'],
    rating: { average: 4.7, count: 185 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Koramangala',
    slug: 'hero-premia-koramangala-bengaluru',
    brandSlug: 'hero-premia',
    citySlug: 'bengaluru',
    dealerName: 'Bangalore Flagship Motors',
    showroomType: 'Premia Flagship',
    address: {
      street: '100 Feet Road, 4th Block',
      area: 'Koramangala',
      pincode: '560034',
      fullAddress: 'Plot 42, 100 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034'
    },
    contact: {
      phone: '+91 80 2552 4444',
      email: 'koramangala@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [77.6271, 12.9352]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Cafe & Merch'],
    rating: { average: 4.8, count: 290 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Prakruthi Hero Indiranagar',
    slug: 'prakruthi-hero-indiranagar-bengaluru',
    brandSlug: 'hero-motocorp',
    citySlug: 'bengaluru',
    dealerName: 'Prakruthi Auto Agencies',
    showroomType: 'Standard Dealership',
    address: {
      street: 'CMH Road',
      area: 'Indiranagar',
      pincode: '560038',
      fullAddress: '154 CMH Road, Near Metro Station, Indiranagar, Bengaluru, Karnataka 560038'
    },
    contact: {
      phone: '+91 80 2528 7777',
      email: 'prakruthi@heromotocorp.com'
    },
    location: {
      type: 'Point',
      coordinates: [77.6412, 12.9784]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Express Service', 'Spare Parts'],
    rating: { average: 4.5, count: 640 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Vida Hub Banjara Hills',
    slug: 'vida-hub-banjara-hyderabad',
    brandSlug: 'vida',
    citySlug: 'hyderabad',
    dealerName: 'Telangana EV Hub',
    showroomType: 'Experience Center',
    address: {
      street: 'Road No. 2, Banjara Hills',
      area: 'Banjara Hills',
      pincode: '500034',
      fullAddress: '8-2-293/82/A, Road No. 2, Banjara Hills, Hyderabad, Telangana 500034'
    },
    contact: {
      phone: '+91 40 2335 1111',
      email: 'hyderabad@vidaworld.com'
    },
    location: {
      type: 'Point',
      coordinates: [78.4357, 17.4156]
    },
    openingHours: { displayText: '10:00 AM - 9:00 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['EV Test Rides', 'DC Fast Charging', 'Battery Swapping'],
    rating: { average: 4.6, count: 140 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Metro Hero Secunderabad',
    slug: 'metro-hero-secunderabad',
    brandSlug: 'hero-motocorp',
    citySlug: 'hyderabad',
    dealerName: 'Metro Automotive Sales',
    showroomType: 'Standard Dealership',
    address: {
      street: 'MG Road, Secunderabad',
      area: 'Secunderabad',
      pincode: '500003',
      fullAddress: '44 MG Road, Near Paradise, Secunderabad, Telangana 500003'
    },
    contact: {
      phone: '+91 40 2780 4321',
      email: 'metro@heromotocorp.com'
    },
    location: {
      type: 'Point',
      coordinates: [78.5011, 17.4399]
    },
    openingHours: { displayText: '9:00 AM - 8:30 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Finance Lounge'],
    rating: { average: 4.3, count: 480 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Alwarpet',
    slug: 'hero-premia-alwarpet-chennai',
    brandSlug: 'hero-premia',
    citySlug: 'chennai',
    dealerName: 'Southern Star Automobiles',
    showroomType: 'Premia Flagship',
    address: {
      street: 'TTK Road',
      area: 'Alwarpet',
      pincode: '600018',
      fullAddress: '88 TTK Road, Alwarpet, Chennai, Tamil Nadu 600018'
    },
    contact: {
      phone: '+91 44 2499 6666',
      email: 'alwarpet@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [80.252, 13.0334]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'VIP Delivery Bay', 'Service Lounge'],
    rating: { average: 4.8, count: 215 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Khivraj Hero Anna Nagar',
    slug: 'khivraj-hero-anna-nagar-chennai',
    brandSlug: 'hero-motocorp',
    citySlug: 'chennai',
    dealerName: 'Khivraj Motors Pvt Ltd',
    showroomType: 'Standard Dealership',
    address: {
      street: '2nd Avenue',
      area: 'Anna Nagar',
      pincode: '600040',
      fullAddress: 'Plot 310, 2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040'
    },
    contact: {
      phone: '+91 44 2621 1234',
      email: 'annanagar@khivrajhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [80.2091, 13.085]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Workshop', 'Insurance Renewal'],
    rating: { average: 4.4, count: 590 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Saini Hero Park Street',
    slug: 'saini-hero-park-street-kolkata',
    brandSlug: 'hero-motocorp',
    citySlug: 'kolkata',
    dealerName: 'Saini Two Wheelers',
    showroomType: 'Standard Dealership',
    address: {
      street: 'Park Street',
      area: 'Central Kolkata',
      pincode: '700016',
      fullAddress: '65 Park Street, Near Mullick Bazar, Kolkata, West Bengal 700016'
    },
    contact: {
      phone: '+91 33 2229 8765',
      email: 'parkstreet@sainihero.com'
    },
    location: {
      type: 'Point',
      coordinates: [88.3524, 22.5516]
    },
    openingHours: { displayText: '9:30 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Finance Help'],
    rating: { average: 4.5, count: 410 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Bengal Hero Service Hub Salt Lake',
    slug: 'bengal-hero-salt-lake-kolkata',
    brandSlug: 'hero-motocorp',
    citySlug: 'kolkata',
    dealerName: 'Bengal Two Wheelers Hub',
    showroomType: 'Service Hub',
    address: {
      street: 'Sector V, Electronics Complex',
      area: 'Salt Lake',
      pincode: '700091',
      fullAddress: 'Plot B4, Sector V, Salt Lake, Kolkata, West Bengal 700091'
    },
    contact: {
      phone: '+91 33 2357 1122',
      email: 'saltlake@bengalhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [88.4172, 22.5804]
    },
    openingHours: { displayText: '8:30 AM - 7:30 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Major Repairs', 'Genuine Parts Store', 'Express Maintenance'],
    rating: { average: 4.2, count: 320 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Baner',
    slug: 'hero-premia-baner-pune',
    brandSlug: 'hero-premia',
    citySlug: 'pune',
    dealerName: 'Apex Premium Wheels',
    showroomType: 'Premia Flagship',
    address: {
      street: 'Baner Road',
      area: 'Baner',
      pincode: '411045',
      fullAddress: 'Survey 48, Baner Road, Near High Street, Pune, Maharashtra 411045'
    },
    contact: {
      phone: '+91 20 2729 3333',
      email: 'baner@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [73.7868, 18.559]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Customer Lounge'],
    rating: { average: 4.8, count: 275 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Sai Hero Kothrud',
    slug: 'sai-hero-kothrud-pune',
    brandSlug: 'hero-motocorp',
    citySlug: 'pune',
    dealerName: 'Sai Auto Wheels Pvt Ltd',
    showroomType: 'Standard Dealership',
    address: {
      street: 'Paud Road',
      area: 'Kothrud',
      pincode: '411038',
      fullAddress: 'Plot 18, Paud Road, Kothrud, Pune, Maharashtra 411038'
    },
    contact: {
      phone: '+91 20 2538 4567',
      email: 'kothrud@saihero.com'
    },
    location: {
      type: 'Point',
      coordinates: [73.8153, 18.5074]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Workshop', 'Finance Assistance'],
    rating: { average: 4.5, count: 580 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Ritu Hero SG Highway',
    slug: 'ritu-hero-sg-highway-ahmedabad',
    brandSlug: 'hero-motocorp',
    citySlug: 'ahmedabad',
    dealerName: 'Ritu Automobile Agency',
    showroomType: 'Standard Dealership',
    address: {
      street: 'SG Highway, Thaltej',
      area: 'SG Highway',
      pincode: '380054',
      fullAddress: 'Opposite Acropolis Mall, SG Highway, Ahmedabad, Gujarat 380054'
    },
    contact: {
      phone: '+91 79 2685 9900',
      email: 'sghighway@rituhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [72.5076, 23.0338]
    },
    openingHours: { displayText: '9:00 AM - 8:30 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Service Center', 'Fast Delivery'],
    rating: { average: 4.6, count: 490 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Vida Experience Hub Bodakdev',
    slug: 'vida-hub-bodakdev-ahmedabad',
    brandSlug: 'vida',
    citySlug: 'ahmedabad',
    dealerName: 'Gujarat EV Mobility',
    showroomType: 'Experience Center',
    address: {
      street: 'Sindhu Bhavan Road',
      area: 'Bodakdev',
      pincode: '380054',
      fullAddress: 'Near Times Square, Sindhu Bhavan Road, Bodakdev, Ahmedabad, Gujarat 380054'
    },
    contact: {
      phone: '+91 79 4000 5566',
      email: 'ahmedabad@vidaworld.com'
    },
    location: {
      type: 'Point',
      coordinates: [72.5186, 23.0415]
    },
    openingHours: { displayText: '10:00 AM - 9:00 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['EV Test Rides', 'Fast Charging Dock', 'Smart Scooter Tour'],
    rating: { average: 4.7, count: 160 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Rajasthan Hero Tonk Road',
    slug: 'rajasthan-hero-tonk-road-jaipur',
    brandSlug: 'hero-motocorp',
    citySlug: 'jaipur',
    dealerName: 'Rajasthan Auto Corp',
    showroomType: 'Standard Dealership',
    address: {
      street: 'Tonk Road',
      area: 'Bapu Nagar',
      pincode: '302015',
      fullAddress: 'B-12 Tonk Road, Near Gandhi Nagar Station, Jaipur, Rajasthan 302015'
    },
    contact: {
      phone: '+91 141 270 4455',
      email: 'tonkroad@rajasthanhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [75.8012, 26.852]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Finance Help'],
    rating: { average: 4.4, count: 430 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Vaishali Nagar',
    slug: 'hero-premia-vaishali-jaipur',
    brandSlug: 'hero-premia',
    citySlug: 'jaipur',
    dealerName: 'Royal Premia Wheels',
    showroomType: 'Premia Flagship',
    address: {
      street: 'Amrapali Marg',
      area: 'Vaishali Nagar',
      pincode: '302021',
      fullAddress: 'Plot 7, Amrapali Marg, Vaishali Nagar, Jaipur, Rajasthan 302021'
    },
    contact: {
      phone: '+91 141 235 9988',
      email: 'vaishali@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [75.7423, 26.9085]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'Lounge Cafe', 'VIP Delivery'],
    rating: { average: 4.8, count: 195 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Awadh Hero Gomti Nagar',
    slug: 'awadh-hero-gomti-nagar-lucknow',
    brandSlug: 'hero-motocorp',
    citySlug: 'lucknow',
    dealerName: 'Awadh Automotive',
    showroomType: 'Standard Dealership',
    address: {
      street: 'Vibhuti Khand',
      area: 'Gomti Nagar',
      pincode: '226010',
      fullAddress: 'TCG 4/4 Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010'
    },
    contact: {
      phone: '+91 522 272 1234',
      email: 'gomtinagar@awadhhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [80.9984, 26.8504]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Full Service Workshop', 'Spares'],
    rating: { average: 4.5, count: 510 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Capital Hero Service Hub Hazratganj',
    slug: 'capital-hero-hazratganj-lucknow',
    brandSlug: 'hero-motocorp',
    citySlug: 'lucknow',
    dealerName: 'Capital Two Wheelers',
    showroomType: 'Service Hub',
    address: {
      street: 'MG Marg',
      area: 'Hazratganj',
      pincode: '226001',
      fullAddress: '22 MG Marg, Hazratganj, Lucknow, Uttar Pradesh 226001'
    },
    contact: {
      phone: '+91 522 228 5566',
      email: 'hazratganj@capitalhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [80.9462, 26.8489]
    },
    openingHours: { displayText: '8:30 AM - 7:30 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Periodic Service', 'Accident Repair', 'Genuine Parts'],
    rating: { average: 4.3, count: 340 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Tricity Hero Sector 17',
    slug: 'tricity-hero-sector-17-chandigarh',
    brandSlug: 'hero-motocorp',
    citySlug: 'chandigarh',
    dealerName: 'Tricity Wheels Agency',
    showroomType: 'Standard Dealership',
    address: {
      street: 'Sector 17-C',
      area: 'City Centre',
      pincode: '160017',
      fullAddress: 'SCO 112-113, Sector 17-C, Chandigarh, Punjab 160017'
    },
    contact: {
      phone: '+91 172 270 8899',
      email: 'sec17@tricityhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [76.7794, 30.7398]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Finance Help'],
    rating: { average: 4.6, count: 420 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Industrial Area Chandigarh',
    slug: 'hero-premia-chandigarh',
    brandSlug: 'hero-premia',
    citySlug: 'chandigarh',
    dealerName: 'Northern Highway Flagship',
    showroomType: 'Premia Flagship',
    address: {
      street: 'Phase 1',
      area: 'Industrial Area',
      pincode: '160002',
      fullAddress: 'Plot 82, Industrial Area Phase 1, Chandigarh, Punjab 160002'
    },
    contact: {
      phone: '+91 172 265 4433',
      email: 'chandigarh@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [76.7925, 30.7055]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'Custom Studio', 'Premium Lounge'],
    rating: { average: 4.9, count: 260 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Cochin Hero MG Road',
    slug: 'cochin-hero-mg-road-kochi',
    brandSlug: 'hero-motocorp',
    citySlug: 'kochi',
    dealerName: 'Kochi Motor Ventures',
    showroomType: 'Standard Dealership',
    address: {
      street: 'MG Road',
      area: 'Ernakulam',
      pincode: '682016',
      fullAddress: 'Door 40/123, MG Road, Ernakulam, Kochi, Kerala 682016'
    },
    contact: {
      phone: '+91 484 236 7788',
      email: 'mgroad@cochinhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [76.2827, 9.9674]
    },
    openingHours: { displayText: '9:00 AM - 7:30 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Finance Help'],
    rating: { average: 4.5, count: 390 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Vida Experience Center Edappally',
    slug: 'vida-experience-center-kochi',
    brandSlug: 'vida',
    citySlug: 'kochi',
    dealerName: 'Kerala Green Mobility',
    showroomType: 'Experience Center',
    address: {
      street: 'NH 544, Edappally Toll',
      area: 'Edappally',
      pincode: '682024',
      fullAddress: 'Opposite Lulu Mall, Edappally, Kochi, Kerala 682024'
    },
    contact: {
      phone: '+91 484 280 9900',
      email: 'kochi@vidaworld.com'
    },
    location: {
      type: 'Point',
      coordinates: [76.3079, 10.0261]
    },
    openingHours: { displayText: '10:00 AM - 9:00 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['EV Test Rides', 'Fast Charging Pods', 'Tech Demo'],
    rating: { average: 4.7, count: 175 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Malwa Hero AB Road Indore',
    slug: 'malwa-hero-ab-road-indore',
    brandSlug: 'hero-motocorp',
    citySlug: 'indore',
    dealerName: 'Malwa Two Wheelers',
    showroomType: 'Standard Dealership',
    address: {
      street: 'AB Road',
      area: 'Palasia',
      pincode: '452001',
      fullAddress: '55 AB Road, Old Palasia, Indore, Madhya Pradesh 452001'
    },
    contact: {
      phone: '+91 731 254 3322',
      email: 'abroad@malwahero.com'
    },
    location: {
      type: 'Point',
      coordinates: [75.889, 22.7441]
    },
    openingHours: { displayText: '9:00 AM - 8:30 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Service Center', 'Finance Assistance'],
    rating: { average: 4.5, count: 480 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Vijay Nagar Indore',
    slug: 'hero-premia-vijay-nagar-indore',
    brandSlug: 'hero-premia',
    citySlug: 'indore',
    dealerName: 'Central Premia Motors',
    showroomType: 'Premia Flagship',
    address: {
      street: 'Ring Road, Near C21 Mall',
      area: 'Vijay Nagar',
      pincode: '452010',
      fullAddress: 'Plot 10, Scheme 54, Vijay Nagar, Indore, Madhya Pradesh 452010'
    },
    contact: {
      phone: '+91 731 405 8899',
      email: 'indore@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [75.8988, 22.7533]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'VIP Lounge', 'Apparel Display'],
    rating: { average: 4.8, count: 230 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Doon Hero Rajpur Road',
    slug: 'doon-hero-rajpur-road-dehradun',
    brandSlug: 'hero-motocorp',
    citySlug: 'dehradun',
    dealerName: 'Doon Valley Motors',
    showroomType: 'Standard Dealership',
    address: {
      street: 'Rajpur Road',
      area: 'Dilaram Chowk',
      pincode: '248001',
      fullAddress: '72 Rajpur Road, Dilaram Chowk, Dehradun, Uttarakhand 248001'
    },
    contact: {
      phone: '+91 135 274 5566',
      email: 'rajpur@doonhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [78.0664, 30.3444]
    },
    openingHours: { displayText: '9:00 AM - 7:30 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Service Workshop', 'Spares Counter'],
    rating: { average: 4.4, count: 360 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Shivalik Hero Service Hub Dehradun',
    slug: 'shivalik-hero-service-dehradun',
    brandSlug: 'hero-motocorp',
    citySlug: 'dehradun',
    dealerName: 'Shivalik Automotive Care',
    showroomType: 'Service Hub',
    address: {
      street: 'Saharanpur Road',
      area: 'Patel Nagar',
      pincode: '248001',
      fullAddress: '45 Saharanpur Road, Patel Nagar, Dehradun, Uttarakhand 248001'
    },
    contact: {
      phone: '+91 135 252 1100',
      email: 'service@shivalikhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [78.0125, 30.2982]
    },
    openingHours: { displayText: '8:30 AM - 7:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Quick Service Bay', 'Diagnostic Station', 'Accident Repair'],
    rating: { average: 4.2, count: 280 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Bhopal Hero MP Nagar',
    slug: 'bhopal-hero-mp-nagar',
    brandSlug: 'hero-motocorp',
    citySlug: 'bhopal',
    dealerName: 'Bhopal Motors Corp',
    showroomType: 'Standard Dealership',
    address: {
      street: 'Zone II',
      area: 'MP Nagar',
      pincode: '462011',
      fullAddress: 'Plot 32, Zone II, Maharana Pratap Nagar, Bhopal, Madhya Pradesh 462011'
    },
    contact: {
      phone: '+91 755 255 4488',
      email: 'mpnagar@bhopalhero.com'
    },
    location: {
      type: 'Point',
      coordinates: [77.4344, 23.2332]
    },
    openingHours: { displayText: '9:00 AM - 8:00 PM', daysOpen: 'Monday to Saturday' },
    facilities: ['Test Rides Available', 'Authorized Service', 'Finance Help'],
    rating: { average: 4.5, count: 410 },
    isVerified: true,
    isActive: true
  },
  {
    name: 'Hero Premia Hoshangabad Road Bhopal',
    slug: 'hero-premia-bhopal',
    brandSlug: 'hero-premia',
    citySlug: 'bhopal',
    dealerName: 'Capital Flagship Auto',
    showroomType: 'Premia Flagship',
    address: {
      street: 'Hoshangabad Road',
      area: 'Misrod',
      pincode: '462026',
      fullAddress: 'Near Aashima Mall, Hoshangabad Road, Bhopal, Madhya Pradesh 462026'
    },
    contact: {
      phone: '+91 755 400 9911',
      email: 'bhopal@heropremia.com'
    },
    location: {
      type: 'Point',
      coordinates: [77.4478, 23.195]
    },
    openingHours: { displayText: '9:30 AM - 8:30 PM', daysOpen: 'Monday to Sunday' },
    facilities: ['Test Rides Available', 'VIP Lounge', 'Accessories Studio'],
    rating: { average: 4.8, count: 210 },
    isVerified: true,
    isActive: true
  }
];

const bikesData = [
  // 1. Splendor Plus
  {
    name: 'Hero Splendor Plus',
    slug: 'hero-splendor-plus',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Lage Raho, Chalte Raho',
    description: "India's trusted mileage icon powered by the dependable 97.2cc xSens engine with i3S technology.",
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 97.2,
      maxPower: '7.91 bhp @ 8000 rpm',
      maxTorque: '8.05 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 75441, maxPrice: 78286, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Self Start with Alloy Wheel',
        slug: 'self-start-alloy-wheel',
        exShowroomPrice: 75441,
        colors: [
          { name: 'Black with Silver', hexCode: '#333333' },
          { name: 'Black with Purple', hexCode: '#4B0082' }
        ],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 9.8, seatHeightMm: 785, groundClearanceMm: 165 },
        keyFeatures: ['Integrated Braking System', 'i3S Technology', 'Alloy Wheels']
      },
      {
        name: 'Black and Accent Edition',
        slug: 'black-and-accent-edition',
        exShowroomPrice: 76786,
        colors: [{ name: 'All Black', hexCode: '#111111' }],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 9.8, seatHeightMm: 785, groundClearanceMm: 165 },
        keyFeatures: ['All Black Theme', 'Chrome Silencer Guard', 'Custom Graphics']
      },
      {
        name: 'Matt Shield Gold Edition',
        slug: 'matt-shield-gold',
        exShowroomPrice: 78286,
        colors: [{ name: 'Matt Gold', hexCode: '#D4AF37' }],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 9.8, seatHeightMm: 785, groundClearanceMm: 165 },
        keyFeatures: ['Matt Shield Gold Paint', '3D Splendor Emblem', 'Tubeless Tyres']
      }
    ]
  },
  // 2. Splendor Plus XTEC
  {
    name: 'Hero Splendor Plus XTEC',
    slug: 'hero-splendor-plus-xtec',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'High-Tech Mileage King',
    description: 'Fully digital console with Bluetooth connectivity, call alerts, and real-time mileage indicator.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 97.2,
      maxPower: '7.91 bhp @ 8000 rpm',
      maxTorque: '8.05 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 79911, maxPrice: 83461, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'XTEC Drum',
        slug: 'xtec-drum',
        exShowroomPrice: 79911,
        colors: [{ name: 'Sparkling Beta Blue', hexCode: '#0055A5' }],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 9.8, seatHeightMm: 785, groundClearanceMm: 165 },
        keyFeatures: ['Full Digital Meter', 'Bluetooth Connectivity', 'USB Charger']
      },
      {
        name: 'XTEC 2.0 Drum',
        slug: 'xtec-2-0-drum',
        exShowroomPrice: 83461,
        colors: [{ name: 'Tornado Grey', hexCode: '#708090' }],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 9.8, seatHeightMm: 785, groundClearanceMm: 165 },
        keyFeatures: ['LED High-Intensity Headlamp', 'Real-Time Mileage Indicator', 'Hazard Warning']
      }
    ]
  },
  // 3. HF Deluxe
  {
    name: 'Hero HF Deluxe',
    slug: 'hero-hf-deluxe',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Zidd Har Pal Aage Badhne Ki',
    description: 'Practical, low maintenance, high fuel efficiency two-wheeler built for daily commuters across India.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 97.2,
      maxPower: '7.91 bhp @ 8000 rpm',
      maxTorque: '8.05 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 59998, maxPrice: 68768, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Kick Start Drum Spoke',
        slug: 'kick-start-drum-spoke',
        exShowroomPrice: 59998,
        colors: [{ name: 'Heavy Grey with Black', hexCode: '#4A4A4A' }],
        keySpecifications: { kerbWeightKg: 110, fuelCapacityLitres: 9.6, seatHeightMm: 805, groundClearanceMm: 165 },
        keyFeatures: ['Spoke Wheels', 'Kick Start', 'Long Comfortable Seat']
      },
      {
        name: 'Self Start Drum Alloy',
        slug: 'self-start-drum-alloy',
        exShowroomPrice: 67268,
        colors: [{ name: 'Techno Blue', hexCode: '#0066CC' }],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 9.6, seatHeightMm: 805, groundClearanceMm: 165 },
        keyFeatures: ['Self Start', 'Alloy Wheels', 'i3S Stop-Start']
      },
      {
        name: 'All Black Gold Edition',
        slug: 'all-black-gold-edition',
        exShowroomPrice: 68768,
        colors: [{ name: 'Gold Black', hexCode: '#1C1C1C' }],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 9.6, seatHeightMm: 805, groundClearanceMm: 165 },
        keyFeatures: ['All Black Theme', 'Gold Pinstripes', 'Tubeless Tyres']
      }
    ]
  },
  // 4. Passion Plus
  {
    name: 'Hero Passion Plus',
    slug: 'hero-passion-plus',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Styling Meets Reliability',
    description: 'Iconic commuter styling revitalized with mobile charging port and sleek semi-digital console.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 97.2,
      maxPower: '7.91 bhp @ 8000 rpm',
      maxTorque: '8.05 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 77951, maxPrice: 80801, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Standard Drum',
        slug: 'standard-drum',
        exShowroomPrice: 77951,
        colors: [{ name: 'Sports Red', hexCode: '#CC0000' }],
        keySpecifications: { kerbWeightKg: 115, fuelCapacityLitres: 11, seatHeightMm: 790, groundClearanceMm: 168 },
        keyFeatures: ['Digi-Analog Meter', 'Utility Storage', 'Side Stand Engine Cutoff']
      },
      {
        name: 'Pro Alloy',
        slug: 'pro-alloy',
        exShowroomPrice: 80801,
        colors: [{ name: 'Black Nexus Blue', hexCode: '#0A2540' }],
        keySpecifications: { kerbWeightKg: 115, fuelCapacityLitres: 11, seatHeightMm: 790, groundClearanceMm: 168 },
        keyFeatures: ['USB Mobile Charger', 'i3S Technology', 'Plush Seat']
      }
    ]
  },
  // 5. Passion XTEC
  {
    name: 'Hero Passion XTEC',
    slug: 'hero-passion-xtec',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Tech-Loaded Style',
    description: 'First in 110cc segment with LED projector headlamp, Bluetooth call/SMS notification and digital display.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 113.2,
      maxPower: '9.02 bhp @ 7500 rpm',
      maxTorque: '9.79 Nm @ 5000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 81538, maxPrice: 85938, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'XTEC Drum',
        slug: 'xtec-drum',
        exShowroomPrice: 81538,
        colors: [{ name: 'Candy Blazing Red', hexCode: '#E60000' }],
        keySpecifications: { kerbWeightKg: 117, fuelCapacityLitres: 10, seatHeightMm: 799, groundClearanceMm: 180 },
        keyFeatures: ['LED Projector Headlamp', 'Bluetooth Calling Alerts', 'Digital Console']
      },
      {
        name: 'XTEC Disc',
        slug: 'xtec-disc',
        exShowroomPrice: 85938,
        colors: [{ name: 'Black with Force Silver', hexCode: '#2B2B2B' }],
        keySpecifications: { kerbWeightKg: 118, fuelCapacityLitres: 10, seatHeightMm: 799, groundClearanceMm: 180 },
        keyFeatures: ['Front Disc Brake 240mm', 'USB Charger', 'Real-Time Mileage Display']
      }
    ]
  },
  // 6. Glamour
  {
    name: 'Hero Glamour',
    slug: 'hero-glamour',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Simply Irresistible',
    description: 'Refined 125cc commuter featuring muscular tank shrouds and proven fuel-injected engine efficiency.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 124.7,
      maxPower: '10.72 bhp @ 7500 rpm',
      maxTorque: '10.6 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 82598, maxPrice: 86598, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Drum Variant',
        slug: 'drum-variant',
        exShowroomPrice: 82598,
        colors: [{ name: 'Techno Blue Black', hexCode: '#0B3C5D' }],
        keySpecifications: { kerbWeightKg: 121, fuelCapacityLitres: 10, seatHeightMm: 798, groundClearanceMm: 170 },
        keyFeatures: ['i3S System', 'Auto Sail Tech', 'Tubeless Tyres']
      },
      {
        name: 'Disc Variant',
        slug: 'disc-variant',
        exShowroomPrice: 86598,
        colors: [{ name: 'Sports Red Black', hexCode: '#A61C1C' }],
        keySpecifications: { kerbWeightKg: 122, fuelCapacityLitres: 10, seatHeightMm: 798, groundClearanceMm: 170 },
        keyFeatures: ['240mm Front Disc', 'Digital-Analog Meter', 'Premium Badging']
      }
    ]
  },
  // 7. Glamour XTEC
  {
    name: 'Hero Glamour XTEC',
    slug: 'hero-glamour-xtec',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Leading the Future of Commute',
    description: 'High-tech 125cc offering turn-by-turn navigation, LED headlamp, and bank angle sensor safety.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 124.7,
      maxPower: '10.72 bhp @ 7500 rpm',
      maxTorque: '10.6 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 87998, maxPrice: 92598, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'XTEC Drum',
        slug: 'xtec-drum',
        exShowroomPrice: 87998,
        colors: [{ name: 'Glossy Black', hexCode: '#000000' }],
        keySpecifications: { kerbWeightKg: 122, fuelCapacityLitres: 10, seatHeightMm: 798, groundClearanceMm: 180 },
        keyFeatures: ['Turn-by-Turn Navigation', 'Gear Position Indicator', 'Side-Stand Engine Cutoff']
      },
      {
        name: 'XTEC Disc',
        slug: 'xtec-disc',
        exShowroomPrice: 92598,
        colors: [{ name: 'Nexus Blue', hexCode: '#003366' }],
        keySpecifications: { kerbWeightKg: 123, fuelCapacityLitres: 10, seatHeightMm: 798, groundClearanceMm: 180 },
        keyFeatures: ['Front Disc Brake', 'Bluetooth Call/SMS', 'Bank Angle Sensor']
      }
    ]
  },
  // 8. Super Splendor
  {
    name: 'Hero Super Splendor',
    slug: 'hero-super-splendor',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Buland Hamesha',
    description: 'Full-sized 125cc workhorse engineered with strong low-end torque for Indian road conditions.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 124.7,
      maxPower: '10.72 bhp @ 7500 rpm',
      maxTorque: '10.6 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 80848, maxPrice: 84848, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Drum Self Cast',
        slug: 'drum-self-cast',
        exShowroomPrice: 80848,
        colors: [{ name: 'Heavy Grey', hexCode: '#5A5A5A' }],
        keySpecifications: { kerbWeightKg: 122, fuelCapacityLitres: 12, seatHeightMm: 799, groundClearanceMm: 180 },
        keyFeatures: ['12L Fuel Tank', 'Auto Sail Tech', 'Long Comfortable Seat']
      },
      {
        name: 'Disc Self Cast',
        slug: 'disc-self-cast',
        exShowroomPrice: 84848,
        colors: [{ name: 'Dusky Black', hexCode: '#1A1A1A' }],
        keySpecifications: { kerbWeightKg: 123, fuelCapacityLitres: 12, seatHeightMm: 799, groundClearanceMm: 180 },
        keyFeatures: ['Front Disc 240mm', 'USB Port', 'Tubeless Tyres']
      }
    ]
  },
  // 9. Super Splendor XTEC
  {
    name: 'Hero Super Splendor XTEC',
    slug: 'hero-super-splendor-xtec',
    brandSlug: 'hero-motocorp',
    category: 'Commuter',
    tagline: 'Smart Commuting Upgraded',
    description: 'Digital LCD speedometer, Bluetooth smart connectivity, and all-LED headlamp on 125cc platform.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 124.7,
      maxPower: '10.72 bhp @ 7500 rpm',
      maxTorque: '10.6 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 85178, maxPrice: 89428, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'XTEC Drum',
        slug: 'xtec-drum',
        exShowroomPrice: 85178,
        colors: [{ name: 'Gloss Black', hexCode: '#080808' }],
        keySpecifications: { kerbWeightKg: 122, fuelCapacityLitres: 12, seatHeightMm: 799, groundClearanceMm: 180 },
        keyFeatures: ['Full LCD Console', 'Bluetooth Alerts', 'LED DRL']
      },
      {
        name: 'XTEC Disc',
        slug: 'xtec-disc',
        exShowroomPrice: 89428,
        colors: [{ name: 'Matte Axis Grey', hexCode: '#48494B' }],
        keySpecifications: { kerbWeightKg: 123, fuelCapacityLitres: 12, seatHeightMm: 799, groundClearanceMm: 180 },
        keyFeatures: ['Front Disc Brake', 'Mobile Charging Port', 'Real-Time Mileage']
      }
    ]
  },
  // 10. Xtreme 125R
  {
    name: 'Hero Xtreme 125R',
    slug: 'hero-xtreme-125r',
    brandSlug: 'hero-motocorp',
    category: 'Sport',
    tagline: 'Challenge The Extreme',
    description: 'Aggressive streetfighter styling, single-channel ABS, and sprint acceleration in the 125cc category.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 124.7,
      maxPower: '11.4 bhp @ 8250 rpm',
      maxTorque: '10.5 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 95000, maxPrice: 99500, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'IBS Variant',
        slug: 'ibs-variant',
        exShowroomPrice: 95000,
        colors: [{ name: 'Firestorm Red', hexCode: '#D62828' }],
        keySpecifications: { kerbWeightKg: 136, fuelCapacityLitres: 10, seatHeightMm: 794, groundClearanceMm: 180 },
        keyFeatures: ['Integrated Braking System', 'Split Seat', 'LCD Inverted Console']
      },
      {
        name: 'Single Channel ABS',
        slug: 'single-channel-abs',
        exShowroomPrice: 99500,
        colors: [
          { name: 'Cobalt Blue', hexCode: '#0047AB' },
          { name: 'Stallion Black', hexCode: '#1A1A1A' }
        ],
        keySpecifications: { kerbWeightKg: 136, fuelCapacityLitres: 10, seatHeightMm: 794, groundClearanceMm: 180 },
        keyFeatures: ['Single Channel ABS', 'Hazard Lamp', 'Wide 120mm Rear Radial Tyre']
      }
    ]
  },
  // 11. Xtreme 160R 4V
  {
    name: 'Hero Xtreme 160R 4V',
    slug: 'hero-xtreme-160r-4v',
    brandSlug: 'hero-motocorp',
    category: 'Sport',
    tagline: 'Born To Drag',
    description: '4-valve oil-cooled engine with upside-down (USD) front forks and sharp streetfighter aerodynamics.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 163.2,
      maxPower: '16.6 bhp @ 8500 rpm',
      maxTorque: '14.6 Nm @ 6500 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 127300, maxPrice: 136500, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Standard 4V',
        slug: 'standard-4v',
        exShowroomPrice: 127300,
        colors: [{ name: 'Blazing Sports Red', hexCode: '#B22222' }],
        keySpecifications: { kerbWeightKg: 144, fuelCapacityLitres: 12, seatHeightMm: 795, groundClearanceMm: 165 },
        keyFeatures: ['4-Valve Engine', 'Telescopic Suspension', 'Single Channel ABS']
      },
      {
        name: 'Pro USD Fork Edition',
        slug: 'pro-usd-fork',
        exShowroomPrice: 136500,
        colors: [{ name: 'Neon Shooting Star', hexCode: '#39FF14' }],
        keySpecifications: { kerbWeightKg: 145, fuelCapacityLitres: 12, seatHeightMm: 795, groundClearanceMm: 165 },
        keyFeatures: ['KYB 37mm USD Front Forks', 'Dual Channel ABS', 'Split Seat']
      }
    ]
  },
  // 12. Xtreme 200S 4V
  {
    name: 'Hero Xtreme 200S 4V',
    slug: 'hero-xtreme-200s-4v',
    brandSlug: 'hero-motocorp',
    category: 'Sport',
    tagline: 'Track DNA for Everyday Roads',
    description: 'Fully faired sports tourer with 200cc 4-valve oil-cooled powerplant and aerodynamic windscreen.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 199.6,
      maxPower: '18.9 bhp @ 8000 rpm',
      maxTorque: '17.35 Nm @ 6500 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 141250, maxPrice: 144500, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Standard 4V',
        slug: 'standard-4v',
        exShowroomPrice: 141250,
        colors: [{ name: 'Moon Yellow', hexCode: '#F4D03F' }],
        keySpecifications: { kerbWeightKg: 155, fuelCapacityLitres: 12.8, seatHeightMm: 795, groundClearanceMm: 165 },
        keyFeatures: ['Aerodynamic Fairing', 'Bluetooth Turn-by-Turn Navigation', 'Dual Disc Brakes']
      },
      {
        name: 'Special Edition Black',
        slug: 'special-edition-black',
        exShowroomPrice: 144500,
        colors: [{ name: 'Panther Black', hexCode: '#111111' }],
        keySpecifications: { kerbWeightKg: 155, fuelCapacityLitres: 12.8, seatHeightMm: 795, groundClearanceMm: 165 },
        keyFeatures: ['Black Diamond Cut Graphics', 'LED Headlamp & Tail Lamp', 'Single Channel ABS']
      }
    ]
  },
  // 13. Karizma XMR 210
  {
    name: 'Hero Karizma XMR 210',
    slug: 'hero-karizma-xmr-210',
    brandSlug: 'hero-motocorp',
    category: 'Sport',
    tagline: 'Born of Legend',
    description: 'Hero flagship supersport featuring DOHC 4V liquid-cooled motor, trellis frame, and adjustable windscreen.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 210,
      maxPower: '25.15 bhp @ 9250 rpm',
      maxTorque: '20.4 Nm @ 7250 rpm',
      cooling: 'Liquid Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 179900, maxPrice: 184500, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Standard Edition',
        slug: 'standard-edition',
        exShowroomPrice: 179900,
        colors: [
          { name: 'Iconic Yellow', hexCode: '#FFCC00' },
          { name: 'Turbo Red', hexCode: '#D90429' }
        ],
        keySpecifications: { kerbWeightKg: 163.5, fuelCapacityLitres: 11, seatHeightMm: 810, groundClearanceMm: 160 },
        keyFeatures: ['Liquid Cooled DOHC', 'Dual Channel ABS', 'Adjustable Windscreen', 'LCD Inverted Display']
      },
      {
        name: 'Combat Special Matte',
        slug: 'combat-special-matte',
        exShowroomPrice: 184500,
        colors: [{ name: 'Matte Phantom Black', hexCode: '#222222' }],
        keySpecifications: { kerbWeightKg: 163.5, fuelCapacityLitres: 11, seatHeightMm: 810, groundClearanceMm: 160 },
        keyFeatures: ['Slip & Assist Clutch', 'Class-D LED Projector', 'Smartphone Telematics']
      }
    ]
  },
  // 14. XPulse 200 4V
  {
    name: 'Hero XPulse 200 4V',
    slug: 'hero-xpulse-200-4v',
    brandSlug: 'hero-motocorp',
    category: 'Adventure',
    tagline: 'Make New Tracks',
    description: 'Ultimate affordable adventure motorcycle with 220mm ground clearance and long-travel off-road suspension.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 199.6,
      maxPower: '18.9 bhp @ 8500 rpm',
      maxTorque: '17.35 Nm @ 6500 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 146276, maxPrice: 153126, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Base 4V Standard',
        slug: 'base-4v-standard',
        exShowroomPrice: 146276,
        colors: [{ name: 'Nexus Blue Multi', hexCode: '#005F73' }],
        keySpecifications: { kerbWeightKg: 159, fuelCapacityLitres: 13, seatHeightMm: 825, groundClearanceMm: 220 },
        keyFeatures: ['21-inch Front Spoke Wheel', 'ABS Modes (Road, Off-Road, Rally)', 'Knuckle Guards']
      },
      {
        name: 'Pro Rally Edition',
        slug: 'pro-rally-edition',
        exShowroomPrice: 153126,
        colors: [{ name: 'Rally Edition White & Red', hexCode: '#F8F9FA' }],
        keySpecifications: { kerbWeightKg: 161, fuelCapacityLitres: 13, seatHeightMm: 891, groundClearanceMm: 270 },
        keyFeatures: ['Fully Adjustable Cartridge Forks', 'Handlebar Risers', 'Maxxis Off-Road Tyres']
      }
    ]
  },
  // 15. XPulse 200T 4V
  {
    name: 'Hero XPulse 200T 4V',
    slug: 'hero-xpulse-200t-4v',
    brandSlug: 'hero-motocorp',
    category: 'Tourer',
    tagline: 'Tour in Neo-Retro Style',
    description: 'Neo-retro urban tourer fitted with 17-inch alloy wheels, comfortable ergonomics, and USB charging.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 199.6,
      maxPower: '18.9 bhp @ 8500 rpm',
      maxTorque: '17.35 Nm @ 6500 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 140246, maxPrice: 143500, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Standard Tourer',
        slug: 'standard-tourer',
        exShowroomPrice: 140246,
        colors: [{ name: 'Sports Red Gold', hexCode: '#9B2226' }],
        keySpecifications: { kerbWeightKg: 154, fuelCapacityLitres: 13, seatHeightMm: 795, groundClearanceMm: 178 },
        keyFeatures: ['17-inch Alloy Wheels', 'Tubeless Radial Tyres', 'Single Channel ABS']
      },
      {
        name: 'Matt Funk Edition',
        slug: 'matt-funk-edition',
        exShowroomPrice: 143500,
        colors: [{ name: 'Matt Shield Gold', hexCode: '#AE2012' }],
        keySpecifications: { kerbWeightKg: 154, fuelCapacityLitres: 13, seatHeightMm: 795, groundClearanceMm: 178 },
        keyFeatures: ['Flyscreen Visor', 'Bluetooth Navigation', 'Under-Seat Luggage Plate']
      }
    ]
  },
  // 16. Mavrick 440
  {
    name: 'Hero Mavrick 440',
    slug: 'hero-mavrick-440',
    brandSlug: 'hero-premia',
    category: 'Cruiser',
    tagline: 'Defy The Norm',
    description: 'All-metal muscle roadster boasting a 440cc TorqX motor delivering massive low-end torque.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 440,
      maxPower: '27 bhp @ 6000 rpm',
      maxTorque: '36 Nm @ 4000 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 199000, maxPrice: 224000, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Base Spoke Wheel',
        slug: 'base-spoke',
        exShowroomPrice: 199000,
        colors: [{ name: 'Arctic White', hexCode: '#FFFFFF' }],
        keySpecifications: { kerbWeightKg: 187, fuelCapacityLitres: 13.5, seatHeightMm: 803, groundClearanceMm: 175 },
        keyFeatures: ['Spoke Wheels', 'Dual Channel ABS', 'Digital Negative LCD']
      },
      {
        name: 'Mid Alloy Wheel',
        slug: 'mid-alloy',
        exShowroomPrice: 214000,
        colors: [{ name: 'Celestial Blue', hexCode: '#1E3D59' }],
        keySpecifications: { kerbWeightKg: 187, fuelCapacityLitres: 13.5, seatHeightMm: 803, groundClearanceMm: 175 },
        keyFeatures: ['Alloy Wheels', 'Tubeless Tyres', 'Dual Channel ABS']
      },
      {
        name: 'Top Spec Diamond Cut',
        slug: 'top-spec-diamond-cut',
        exShowroomPrice: 224000,
        colors: [{ name: 'Phantom Black', hexCode: '#1C1C1C' }],
        keySpecifications: { kerbWeightKg: 187, fuelCapacityLitres: 13.5, seatHeightMm: 803, groundClearanceMm: 175 },
        keyFeatures: ['Diamond Cut Alloys', 'e-SIM Telematics', 'Machined Engine Fins']
      }
    ]
  },
  // 17. Harley-Davidson X440
  {
    name: 'Harley-Davidson X440',
    slug: 'harley-davidson-x440',
    brandSlug: 'harley-davidson',
    category: 'Cruiser',
    tagline: 'The New American Dream in India',
    description: 'Distinctive Harley-Davidson roadster styling with deep exhaust rumble, KYB USD forks, and premium road presence.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 440,
      maxPower: '27 bhp @ 6000 rpm',
      maxTorque: '38 Nm @ 4000 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 239500, maxPrice: 279500, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Denim Spoke',
        slug: 'denim-spoke',
        exShowroomPrice: 239500,
        colors: [{ name: 'Mustard Denim', hexCode: '#E5A93C' }],
        keySpecifications: { kerbWeightKg: 190.5, fuelCapacityLitres: 13.5, seatHeightMm: 805, groundClearanceMm: 170 },
        keyFeatures: ['Wire Spoke Wheels', 'KYB Inverted 43mm Forks', 'Dual Channel ABS']
      },
      {
        name: 'Vivid Alloy',
        slug: 'vivid-alloy',
        exShowroomPrice: 259500,
        colors: [{ name: 'Metallic Dark Silver', hexCode: '#5A6265' }],
        keySpecifications: { kerbWeightKg: 190.5, fuelCapacityLitres: 13.5, seatHeightMm: 805, groundClearanceMm: 170 },
        keyFeatures: ['Cast Alloy Wheels', 'Tubeless Tyres', 'Harley Heritage Graphics']
      },
      {
        name: 'S-Trim Premium',
        slug: 's-trim-premium',
        exShowroomPrice: 279500,
        colors: [{ name: 'Matte Black Custom', hexCode: '#111111' }],
        keySpecifications: { kerbWeightKg: 190.5, fuelCapacityLitres: 13.5, seatHeightMm: 805, groundClearanceMm: 170 },
        keyFeatures: ['Diamond Cut Alloys', 'e-SIM Connected Suite', 'Bronze 3D Tank Medallions']
      }
    ]
  },
  // 18. Pleasure Plus XTEC
  {
    name: 'Hero Pleasure Plus XTEC',
    slug: 'hero-pleasure-plus-xtec',
    brandSlug: 'hero-motocorp',
    category: 'Scooter',
    tagline: 'Why Should Boys Have All The Fun',
    description: 'Lightweight urban scooter with projector LED headlamp, pillion backrest, and Bluetooth alerts.',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: {
      displacementCc: 110.9,
      maxPower: '8 bhp @ 7000 rpm',
      maxTorque: '8.7 Nm @ 5500 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 71213, maxPrice: 79738, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'LX Sheet Metal Wheel',
        slug: 'lx-sheet-metal',
        exShowroomPrice: 71213,
        colors: [{ name: 'Polestar Blue', hexCode: '#0077B6' }],
        keySpecifications: { kerbWeightKg: 104, fuelCapacityLitres: 4.8, seatHeightMm: 765, groundClearanceMm: 155 },
        keyFeatures: ['Metal Body Accents', 'Integrated Braking System', 'Side-Stand Indicator']
      },
      {
        name: 'XTEC Connected',
        slug: 'xtec-connected',
        exShowroomPrice: 79738,
        colors: [{ name: 'Jubilant Yellow', hexCode: '#F4A261' }],
        keySpecifications: { kerbWeightKg: 106, fuelCapacityLitres: 4.8, seatHeightMm: 765, groundClearanceMm: 155 },
        keyFeatures: ['LED Projector Lamp', 'Pillion Backrest', 'Bluetooth Connectivity']
      }
    ]
  },
  // 19. Destini 125 XTEC
  {
    name: 'Hero Destini 125 XTEC',
    slug: 'hero-destini-125-xtec',
    brandSlug: 'hero-motocorp',
    category: 'Scooter',
    tagline: 'Family Scooter with Executive Style',
    description: 'Spacious 125cc scooter with chrome garnishes, i3S technology, and comfortable tandem seat.',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: {
      displacementCc: 124.6,
      maxPower: '9 bhp @ 7000 rpm',
      maxTorque: '10.4 Nm @ 5500 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 80048, maxPrice: 86538, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'LX Drum',
        slug: 'lx-drum',
        exShowroomPrice: 80048,
        colors: [{ name: 'Chestnut Bronze', hexCode: '#8D5B4C' }],
        keySpecifications: { kerbWeightKg: 114, fuelCapacityLitres: 5, seatHeightMm: 778, groundClearanceMm: 155 },
        keyFeatures: ['External Fuel Cap', 'i3S Start-Stop', 'Integrated Braking']
      },
      {
        name: 'XTEC Disc Platinum',
        slug: 'xtec-disc-platinum',
        exShowroomPrice: 86538,
        colors: [{ name: 'Nexus Blue Chrome', hexCode: '#102A43' }],
        keySpecifications: { kerbWeightKg: 115, fuelCapacityLitres: 5, seatHeightMm: 778, groundClearanceMm: 155 },
        keyFeatures: ['Front Disc Brake', 'Chrome Mirrors & Grille', 'Dual-Tone Seat']
      }
    ]
  },
  // 20. Maestro Edge 125
  {
    name: 'Hero Maestro Edge 125',
    slug: 'hero-maestro-edge-125',
    brandSlug: 'hero-motocorp',
    category: 'Scooter',
    tagline: 'It Makes You Look Good',
    description: 'Sporty youth scooter with sharp edgy styling, prism-inspired headlamp, and Bluetooth connectivity.',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: {
      displacementCc: 124.6,
      maxPower: '9 bhp @ 7000 rpm',
      maxTorque: '10.4 Nm @ 5500 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 82766, maxPrice: 89316, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Alloy Drum',
        slug: 'alloy-drum',
        exShowroomPrice: 82766,
        colors: [{ name: 'Prismatic Purple', hexCode: '#5C2D91' }],
        keySpecifications: { kerbWeightKg: 111, fuelCapacityLitres: 5, seatHeightMm: 775, groundClearanceMm: 155 },
        keyFeatures: ['Diamond Cut Alloys', 'LED Tail Lamp', 'External Fuel Filling']
      },
      {
        name: 'Disc Connected',
        slug: 'disc-connected',
        exShowroomPrice: 89316,
        colors: [{ name: 'Matte Techno Blue', hexCode: '#005F9E' }],
        keySpecifications: { kerbWeightKg: 112, fuelCapacityLitres: 5, seatHeightMm: 775, groundClearanceMm: 155 },
        keyFeatures: ['Front Disc 190mm', 'Hero Connect Suite', 'Full Digital Cluster']
      }
    ]
  },
  // 21. Xoom 110
  {
    name: 'Hero Xoom 110',
    slug: 'hero-xoom-110',
    brandSlug: 'hero-motocorp',
    category: 'Scooter',
    tagline: 'Go Big. Go Xoom.',
    description: 'Class-first cornering lights, aerodynamic design, and zippy 110cc engine for urban riders.',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: {
      displacementCc: 110.9,
      maxPower: '8.05 bhp @ 7250 rpm',
      maxTorque: '8.7 Nm @ 5750 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 71484, maxPrice: 79967, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'LX Drum',
        slug: 'lx-drum',
        exShowroomPrice: 71484,
        colors: [{ name: 'Sports Red', hexCode: '#C8102E' }],
        keySpecifications: { kerbWeightKg: 108, fuelCapacityLitres: 5.2, seatHeightMm: 770, groundClearanceMm: 155 },
        keyFeatures: ['Signature H-shaped LED Headlamp', 'Real-Time Mileage', 'Sheet Metal Wheels']
      },
      {
        name: 'ZX Cornering Lights Disc',
        slug: 'zx-cornering-lights-disc',
        exShowroomPrice: 79967,
        colors: [{ name: 'Polestar Blue Black', hexCode: '#003B46' }],
        keySpecifications: { kerbWeightKg: 109, fuelCapacityLitres: 5.2, seatHeightMm: 770, groundClearanceMm: 155 },
        keyFeatures: ['Active Cornering Lights', '190mm Front Disc', 'Bluetooth Telematics']
      }
    ]
  },
  // 22. Xoom 125R
  {
    name: 'Hero Xoom 125R',
    slug: 'hero-xoom-125r',
    brandSlug: 'hero-motocorp',
    category: 'Scooter',
    tagline: 'Maximized Street Performance',
    description: 'Sport maxi-scooter powered by 125cc engine, sequential LED blinkers, and 14-inch large wheels.',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: {
      displacementCc: 124.6,
      maxPower: '9.4 bhp @ 7500 rpm',
      maxTorque: '10.14 Nm @ 6000 rpm',
      cooling: 'Air Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 84000, maxPrice: 89500, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Standard Drum',
        slug: 'standard-drum',
        exShowroomPrice: 84000,
        colors: [{ name: 'Racing Yellow Black', hexCode: '#E5A93C' }],
        keySpecifications: { kerbWeightKg: 116, fuelCapacityLitres: 5.5, seatHeightMm: 780, groundClearanceMm: 160 },
        keyFeatures: ['14-inch Alloy Wheels', 'Sequential Indicators', 'Digital Speedo']
      },
      {
        name: 'Pro Disc ABS',
        slug: 'pro-disc-abs',
        exShowroomPrice: 89500,
        colors: [{ name: 'Matte Stealth Grey', hexCode: '#3E4444' }],
        keySpecifications: { kerbWeightKg: 118, fuelCapacityLitres: 5.5, seatHeightMm: 780, groundClearanceMm: 160 },
        keyFeatures: ['Petal Front Disc Brake', 'Turn-by-Turn Navigation', 'LED Projector Lamps']
      }
    ]
  },
  // 23. Xoom 160
  {
    name: 'Hero Xoom 160',
    slug: 'hero-xoom-160',
    brandSlug: 'hero-motocorp',
    category: 'Scooter',
    tagline: 'Adventure Maxi-Scooter',
    description: 'First Indian adventure maxi-scooter with liquid-cooled 156cc engine, 14-inch dual-purpose tyres and smart key.',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engine: {
      displacementCc: 156,
      maxPower: '14 bhp @ 8000 rpm',
      maxTorque: '13.7 Nm @ 6500 rpm',
      cooling: 'Liquid Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 110000, maxPrice: 125000, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Urban Maxi',
        slug: 'urban-maxi',
        exShowroomPrice: 110000,
        colors: [{ name: 'Glacier White', hexCode: '#F0F3F4' }],
        keySpecifications: { kerbWeightKg: 141, fuelCapacityLitres: 8.5, seatHeightMm: 785, groundClearanceMm: 175 },
        keyFeatures: ['Smart Key Remote Ignition', 'Large Under-Seat Boot', 'Tall Touring Windscreen']
      },
      {
        name: 'Adventure Cross',
        slug: 'adventure-cross',
        exShowroomPrice: 125000,
        colors: [{ name: 'Camo Green Matte', hexCode: '#4B5320' }],
        keySpecifications: { kerbWeightKg: 143, fuelCapacityLitres: 8.5, seatHeightMm: 785, groundClearanceMm: 175 },
        keyFeatures: ['Block Pattern Adventure Tyres', 'Dual Disc Brakes with ABS', 'Top Box Luggage Mount']
      }
    ]
  },
  // 24. Vida V1 Plus
  {
    name: 'Vida V1 Plus',
    slug: 'vida-v1-plus',
    brandSlug: 'vida',
    category: 'Electric',
    tagline: 'The Clean Mobility Shift',
    description: 'Electric smart scooter featuring 3.44 kWh removable dual-battery, 7-inch TFT touchscreen and 143 km IDC range.',
    fuelType: 'Electric',
    transmission: 'Automatic',
    engine: {
      displacementCc: 0,
      maxPower: '8 bhp (6 kW peak)',
      maxTorque: '25 Nm',
      cooling: 'Electric Motor',
      emissionStandard: 'Zero Emission'
    },
    priceRange: { minPrice: 115000, maxPrice: 128000, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Standard Dual Battery',
        slug: 'standard-dual-battery',
        exShowroomPrice: 115000,
        colors: [
          { name: 'Matte White', hexCode: '#EDEDED' },
          { name: 'Sports Red', hexCode: '#BA181B' }
        ],
        keySpecifications: { kerbWeightKg: 124, fuelCapacityLitres: 0, seatHeightMm: 780, groundClearanceMm: 155 },
        keyFeatures: ['Removable Dual Li-Ion Battery', '7-inch Touchscreen', 'Custom Riding Modes']
      },
      {
        name: 'Plus Connected Pro',
        slug: 'plus-connected-pro',
        exShowroomPrice: 128000,
        colors: [{ name: 'Matte Grey', hexCode: '#4A4E69' }],
        keySpecifications: { kerbWeightKg: 124, fuelCapacityLitres: 0, seatHeightMm: 780, groundClearanceMm: 155 },
        keyFeatures: ['Fast Charging Capable', 'Cruise Control', 'Reverse Assist Mode']
      }
    ]
  },
  // 25. Vida V1 Pro
  {
    name: 'Vida V1 Pro',
    slug: 'vida-v1-pro',
    brandSlug: 'vida',
    category: 'Electric',
    tagline: 'Leader in Smart Electric Mobility',
    description: 'Flagship electric scooter boasting 3.94 kWh battery, 165 km certified range, 0-40 in 3.2s, and keyless access.',
    fuelType: 'Electric',
    transmission: 'Automatic',
    engine: {
      displacementCc: 0,
      maxPower: '8.05 bhp (6 kW peak)',
      maxTorque: '25 Nm',
      cooling: 'Electric Motor',
      emissionStandard: 'Zero Emission'
    },
    priceRange: { minPrice: 130000, maxPrice: 145900, currency: 'INR' },
    isFeatured: true,
    isActive: true,
    variants: [
      {
        name: 'Pro Standard',
        slug: 'pro-standard',
        exShowroomPrice: 130000,
        colors: [{ name: 'Matte Abrax Orange', hexCode: '#F77F00' }],
        keySpecifications: { kerbWeightKg: 125, fuelCapacityLitres: 0, seatHeightMm: 780, groundClearanceMm: 155 },
        keyFeatures: ['3.94 kWh Removable Battery', '165 km Certified Range', 'Keyless Remote Fob']
      },
      {
        name: 'Pro Premium Edition',
        slug: 'pro-premium-edition',
        exShowroomPrice: 145900,
        colors: [{ name: 'Glossy Black Cyan', hexCode: '#0B090A' }],
        keySpecifications: { kerbWeightKg: 125, fuelCapacityLitres: 0, seatHeightMm: 780, groundClearanceMm: 155 },
        keyFeatures: ['Fast Charging Network Access', 'Anti-Theft Geofencing', 'Document Storage in Dash']
      }
    ]
  },
  // 26. Vida V1 Lite
  {
    name: 'Vida V1 Lite',
    slug: 'vida-v1-lite',
    brandSlug: 'vida',
    category: 'Electric',
    tagline: 'Accessible Urban Electric',
    description: 'Value-oriented city electric commuter with quick battery swap and simplified digital dash.',
    fuelType: 'Electric',
    transmission: 'Automatic',
    engine: {
      displacementCc: 0,
      maxPower: '5.3 bhp (4 kW peak)',
      maxTorque: '20 Nm',
      cooling: 'Electric Motor',
      emissionStandard: 'Zero Emission'
    },
    priceRange: { minPrice: 99000, maxPrice: 105000, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Eco Single Battery',
        slug: 'eco-single-battery',
        exShowroomPrice: 99000,
        colors: [{ name: 'Mint Green', hexCode: '#A7C957' }],
        keySpecifications: { kerbWeightKg: 110, fuelCapacityLitres: 0, seatHeightMm: 775, groundClearanceMm: 155 },
        keyFeatures: ['95 km True Range', 'Home 5A Charging', 'Under-Seat Storage']
      },
      {
        name: 'City Dual Battery',
        slug: 'city-dual-battery',
        exShowroomPrice: 105000,
        colors: [{ name: 'Solar Yellow', hexCode: '#FFD166' }],
        keySpecifications: { kerbWeightKg: 118, fuelCapacityLitres: 0, seatHeightMm: 775, groundClearanceMm: 155 },
        keyFeatures: ['120 km True Range', 'Reverse Throttle Assist', 'Regenerative Braking']
      }
    ]
  },
  // 27. Hero Electric Optima
  {
    name: 'Hero Electric Optima',
    slug: 'hero-electric-optima',
    brandSlug: 'hero-motocorp',
    category: 'Electric',
    tagline: 'Everyday Practical Electric',
    description: 'Proven city runabout with dual battery extended range, lightweight chassis, and low operating costs.',
    fuelType: 'Electric',
    transmission: 'Automatic',
    engine: {
      displacementCc: 0,
      maxPower: '2.5 bhp (1.9 kW peak)',
      maxTorque: '16 Nm',
      cooling: 'Electric Motor',
      emissionStandard: 'Zero Emission'
    },
    priceRange: { minPrice: 83300, maxPrice: 92000, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'CX Single Battery',
        slug: 'cx-single-battery',
        exShowroomPrice: 83300,
        colors: [{ name: 'Maroon', hexCode: '#800000' }],
        keySpecifications: { kerbWeightKg: 93, fuelCapacityLitres: 0, seatHeightMm: 765, groundClearanceMm: 150 },
        keyFeatures: ['82 km Range', 'Portable Battery Pack', 'Digital Instrument Cluster']
      },
      {
        name: 'CX Dual Battery Pro',
        slug: 'cx-dual-battery-pro',
        exShowroomPrice: 92000,
        colors: [{ name: 'Metallic Silver', hexCode: '#C0C0C0' }],
        keySpecifications: { kerbWeightKg: 102, fuelCapacityLitres: 0, seatHeightMm: 765, groundClearanceMm: 150 },
        keyFeatures: ['140 km Extended Range', 'Regenerative Braking', 'Anti-Theft Remote Alarm']
      }
    ]
  },
  // 28. TVS Apache RTR 160 4V
  {
    name: 'TVS Apache RTR 160 4V',
    slug: 'tvs-apache-rtr-160-4v',
    brandSlug: 'tvs-motor',
    category: 'Sport',
    tagline: 'Racing DNA Unleashed',
    description: 'Track-tuned 160cc sports motorcycle featuring 3 ride modes, SmartXonnect, and Glide Through Technology.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 159.7,
      maxPower: '17.31 bhp @ 9250 rpm',
      maxTorque: '14.73 Nm @ 7250 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 124870, maxPrice: 132000, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Rear Drum Ride Modes',
        slug: 'rear-drum-ride-modes',
        exShowroomPrice: 124870,
        colors: [{ name: 'Racing Red', hexCode: '#E63946' }],
        keySpecifications: { kerbWeightKg: 144, fuelCapacityLitres: 12, seatHeightMm: 800, groundClearanceMm: 180 },
        keyFeatures: ['Urban, Rain & Sport Modes', 'Single Channel Super-Moto ABS', 'GTT']
      },
      {
        name: 'Special Edition Dual Disc',
        slug: 'special-edition-dual-disc',
        exShowroomPrice: 132000,
        colors: [{ name: 'Matte Black Red Alloy', hexCode: '#1D3557' }],
        keySpecifications: { kerbWeightKg: 146, fuelCapacityLitres: 12, seatHeightMm: 800, groundClearanceMm: 180 },
        keyFeatures: ['Red Alloy Wheels', 'Adjustable Clutch & Brake Levers', 'SmartXonnect Bluetooth']
      }
    ]
  },
  // 29. Bajaj Pulsar NS200
  {
    name: 'Bajaj Pulsar NS200',
    slug: 'bajaj-pulsar-ns200',
    brandSlug: 'bajaj-auto',
    category: 'Sport',
    tagline: 'The Definitive Naked Sport',
    description: 'High-revving triple-spark 200cc liquid-cooled engine with perimeter frame and upside-down front forks.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 199.5,
      maxPower: '24.13 bhp @ 9750 rpm',
      maxTorque: '18.74 Nm @ 8000 rpm',
      cooling: 'Liquid Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 142000, maxPrice: 154000, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Standard Dual Channel ABS',
        slug: 'standard-dual-abs',
        exShowroomPrice: 142000,
        colors: [{ name: 'Burnt Red', hexCode: '#9D0208' }],
        keySpecifications: { kerbWeightKg: 158, fuelCapacityLitres: 12, seatHeightMm: 805, groundClearanceMm: 168 },
        keyFeatures: ['Perimeter Frame', '33mm USD Forks', 'Dual Channel ABS']
      },
      {
        name: 'Connected Pro Digital',
        slug: 'connected-pro-digital',
        exShowroomPrice: 154000,
        colors: [{ name: 'Glossy Pewter Grey', hexCode: '#2B2D42' }],
        keySpecifications: { kerbWeightKg: 158, fuelCapacityLitres: 12, seatHeightMm: 805, groundClearanceMm: 168 },
        keyFeatures: ['Fully Digital Bluetooth Dash', 'Turn-by-Turn Navigation', 'Gear Position Indicator']
      }
    ]
  },
  // 30. Royal Enfield Hunter 350
  {
    name: 'Royal Enfield Hunter 350',
    slug: 'royal-enfield-hunter-350',
    brandSlug: 'royal-enfield',
    category: 'Cruiser',
    tagline: 'A Shot of Motorcycling',
    description: 'Agile modern roadster built on the refined J-series 349cc engine with retro compact urban geometry.',
    fuelType: 'Petrol',
    transmission: 'Manual',
    engine: {
      displacementCc: 349,
      maxPower: '20.2 bhp @ 6100 rpm',
      maxTorque: '27 Nm @ 4000 rpm',
      cooling: 'Air/Oil Cooled',
      emissionStandard: 'BS6 Phase 2'
    },
    priceRange: { minPrice: 149900, maxPrice: 174655, currency: 'INR' },
    isFeatured: false,
    isActive: true,
    variants: [
      {
        name: 'Retro Factory Spoke',
        slug: 'retro-factory-spoke',
        exShowroomPrice: 149900,
        colors: [{ name: 'Factory Black', hexCode: '#262626' }],
        keySpecifications: { kerbWeightKg: 177, fuelCapacityLitres: 13, seatHeightMm: 790, groundClearanceMm: 150 },
        keyFeatures: ['Spoke Wheels', 'Single Channel ABS', 'Classic Retro Speedo']
      },
      {
        name: 'Metro Dapper Alloy',
        slug: 'metro-dapper-alloy',
        exShowroomPrice: 169656,
        colors: [{ name: 'Dapper Ash', hexCode: '#6C757D' }],
        keySpecifications: { kerbWeightKg: 181, fuelCapacityLitres: 13, seatHeightMm: 800, groundClearanceMm: 150 },
        keyFeatures: ['Cast Alloy Wheels', 'Dual Channel ABS', 'Tubeless Tyres']
      },
      {
        name: 'Metro Rebel Dual Tone',
        slug: 'metro-rebel-dual-tone',
        exShowroomPrice: 174655,
        colors: [{ name: 'Rebel Blue Black', hexCode: '#0077B6' }],
        keySpecifications: { kerbWeightKg: 181, fuelCapacityLitres: 13, seatHeightMm: 800, groundClearanceMm: 150 },
        keyFeatures: ['Tripper Navigation Pod', 'Dual Tone Tank Graphics', 'LED Tail Lamp']
      }
    ]
  }
];

const offersData = [
  {
    title: 'Festive Cashback on Hero Mavrick 440',
    slug: 'festive-cashback-hero-mavrick-440',
    description: 'Celebrate this season with an exclusive cashback of ₹10,000 and complimentary 5-year roadside assistance on the Hero Mavrick 440.',
    bikeSlug: 'hero-mavrick-440',
    showroomSlug: 'hero-premia-bhopal',
    offerType: 'cashback',
    discountValue: 10000,
    benefits: ['₹10,000 Direct Cashback', 'Complimentary 5-Year Roadside Assistance (RSA)', 'Zero Processing Fee on Select Banks'],
    terms: 'Offer valid on bookings confirmed before the validity period. Terms apply.',
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true
  },
  {
    title: 'Exchange Bonus on Karizma XMR',
    slug: 'exchange-bonus-karizma-xmr',
    description: 'Upgrade your ride! Bring in any old two-wheeler and get an exchange bonus of up to ₹7,500 on the iconic Hero Karizma XMR.',
    bikeSlug: 'hero-karizma-xmr-210',
    showroomSlug: null,
    offerType: 'exchange',
    discountValue: 7500,
    benefits: ['Up to ₹7,500 Exchange Bonus', 'Instant On-Spot Valuation', 'Free Helmet & Riding Kit Voucher'],
    terms: 'Exchange value evaluated based on vehicle condition. Subject to showroom inspection.',
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true
  },
  {
    title: 'Zero Down Payment on Xtreme 125R',
    slug: 'zero-down-payment-xtreme-125r',
    description: 'Ride home the sharp and sporty Hero Xtreme 125R with special introductory zero down-payment finance schemes and free accessories pack.',
    bikeSlug: 'hero-xtreme-125r',
    showroomSlug: null,
    offerType: 'accessories',
    discountValue: 4000,
    benefits: ['Complimentary Engine Guard & Grip Covers', 'Special 6.99% Interest Rate Scheme', 'Free First Year Labor Service'],
    terms: 'Financing schemes subject to credit approval by partner NBFCs/banks.',
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true
  },
  {
    title: 'Corporate Benefit on Vida V1 Pro',
    slug: 'corporate-benefit-vida-v1-pro',
    description: 'Exclusive corporate employee discount of ₹8,000 on the all-electric Vida V1 Pro with complimentary portable fast-charging cable.',
    bikeSlug: 'vida-v1-pro',
    showroomSlug: 'hero-premia-bhopal',
    offerType: 'discount',
    discountValue: 8000,
    benefits: ['₹8,000 Corporate Discount', 'Free Home Charging Station Installation', '3-Year Battery Warranty Coverage'],
    terms: 'Valid on presentation of valid employee ID at authorized Premia dealerships.',
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true
  },
  {
    title: 'Royal Enfield Hunter 350 Custom Gear Bundle',
    slug: 'hunter-350-custom-gear-bundle',
    description: 'Purchase a new Royal Enfield Hunter 350 and receive an authentic touring accessories kit worth ₹6,500 free of charge.',
    bikeSlug: 'royal-enfield-hunter-350',
    showroomSlug: null,
    offerType: 'accessories',
    discountValue: 6500,
    benefits: ['Free Bar-end Mirrors & Sump Guard', 'Royal Enfield Commuter Backpack', '1 Free Maintenance Check'],
    terms: 'Available on select color variants at participating dealerships.',
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true
  },
  {
    title: 'Splendor Plus 0% Processing Festive Deal',
    slug: 'splendor-plus-zero-processing-deal',
    description: 'India’s most trusted motorcycle now comes with a festive gift voucher of ₹2,500 and zero processing charges on finance.',
    bikeSlug: 'hero-splendor-plus',
    showroomSlug: null,
    offerType: 'discount',
    discountValue: 2500,
    benefits: ['₹2,500 Festive Savings', 'Zero Loan Processing Charges', '5-Year Comprehensive Warranty'],
    terms: 'Limited period festive promotional offer.',
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    isActive: true
  }
];

module.exports = {
  brandsData,
  citiesData,
  showroomsData,
  bikesData,
  offersData
};
