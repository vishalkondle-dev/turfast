/** Static reference data for seeding. Kept separate so it can be reused by tests/tools. */

export const SPORTS = [
  { slug: "football", name: "Football", icon: "🥅", color: "#16a34a" },
  { slug: "cricket", name: "Cricket", icon: "🏏", color: "#2563eb" },
  { slug: "box-cricket", name: "Box Cricket", icon: "📦", color: "#7c3aed" },
  { slug: "badminton", name: "Badminton", icon: "🏸", color: "#db2777" },
  { slug: "pickleball", name: "Pickleball", icon: "🎾", color: "#ea580c" },
  { slug: "basketball", name: "Basketball", icon: "🏀", color: "#f59e0b" },
  { slug: "volleyball", name: "Volleyball", icon: "🏐", color: "#0891b2" },
  { slug: "tennis", name: "Tennis", icon: "🎾", color: "#65a30d" },
  { slug: "table-tennis", name: "Table Tennis", icon: "🏓", color: "#dc2626" },
  { slug: "swimming", name: "Swimming", icon: "🏊", color: "#0ea5e9" },
  { slug: "squash", name: "Squash", icon: "🎯", color: "#9333ea" },
];

export const AMENITIES = [
  { slug: "parking", name: "Parking", icon: "Car" },
  { slug: "washroom", name: "Washroom", icon: "Toilet" },
  { slug: "changing-room", name: "Changing Room", icon: "DoorOpen" },
  { slug: "shower", name: "Shower", icon: "ShowerHead" },
  { slug: "drinking-water", name: "Drinking Water", icon: "Droplets" },
  { slug: "floodlights", name: "Floodlights", icon: "Lightbulb" },
  { slug: "seating", name: "Seating", icon: "Armchair" },
  { slug: "cafeteria", name: "Cafeteria", icon: "Coffee" },
  { slug: "equipment", name: "Equipment Rental", icon: "Dumbbell" },
  { slug: "first-aid", name: "First Aid", icon: "Cross" },
  { slug: "wifi", name: "Wi-Fi", icon: "Wifi" },
  { slug: "ac", name: "Air Conditioning", icon: "Snowflake" },
  { slug: "cctv", name: "CCTV", icon: "Cctv" },
];

export const CITIES = [
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { slug: "pune", name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
];

export const LOCALITIES: Record<string, { name: string; slug: string; lat: number; lng: number }[]> = {
  hyderabad: [
    { name: "Gachibowli", slug: "gachibowli", lat: 17.4401, lng: 78.3489 },
    { name: "Madhapur", slug: "madhapur", lat: 17.4483, lng: 78.3915 },
    { name: "Kondapur", slug: "kondapur", lat: 17.4645, lng: 78.3618 },
    { name: "Kukatpally", slug: "kukatpally", lat: 17.4948, lng: 78.3996 },
    { name: "Banjara Hills", slug: "banjara-hills", lat: 17.4156, lng: 78.4347 },
    { name: "Hitech City", slug: "hitech-city", lat: 17.4435, lng: 78.3772 },
  ],
  bengaluru: [
    { name: "Koramangala", slug: "koramangala", lat: 12.9352, lng: 77.6245 },
    { name: "Whitefield", slug: "whitefield", lat: 12.9698, lng: 77.7499 },
    { name: "Indiranagar", slug: "indiranagar", lat: 12.9719, lng: 77.6412 },
  ],
  pune: [
    { name: "Baner", slug: "baner", lat: 18.5590, lng: 73.7868 },
    { name: "Hinjewadi", slug: "hinjewadi", lat: 18.5913, lng: 73.7389 },
  ],
};

// Curated Unsplash sports images (stable ids).
export const VENUE_IMAGES = [
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80",
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1200&q=80",
  "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1200&q=80",
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1200&q=80",
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1200&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80",
  "https://images.unsplash.com/photo-1552667466-07770ae110d0?w=1200&q=80",
];

export const VENUE_NAMES = [
  "Elite Sports Arena", "Turf Nation", "PlayZone Gachibowli", "The Box Cricket Club",
  "Kickoff Football Park", "Smash Badminton Academy", "Green Field Turf", "Urban Kicks Arena",
  "Champions Court", "Sportsville Hub", "Ace Pickleball Club", "Victory Grounds",
  "Rebound Basketball Arena", "Spike Volleyball Court", "Grand Slam Tennis Club",
  "MetroPlay Sports", "The Turf Factory", "Powerplay Cricket Ground", "Prime Court Complex",
  "Arena 63", "Stadium Sports Club", "Offside Football Turf",
];

export const FIRST_NAMES = ["Vishal", "Rahul", "Priya", "Ananya", "Karthik", "Sneha", "Arjun", "Deepika", "Rohan", "Meera", "Aditya", "Kavya", "Siddharth", "Nisha", "Varun", "Pooja"];
export const LAST_NAMES = ["Kondle", "Reddy", "Sharma", "Rao", "Nair", "Gupta", "Iyer", "Patel", "Singh", "Kumar", "Verma", "Menon"];

export const REVIEW_TEXTS = [
  "Great turf, well maintained and floodlights are excellent for night games.",
  "Booking was smooth and the staff were super helpful. Will come again!",
  "Good facilities but parking gets crowded on weekends.",
  "Best box cricket setup in the area. Nets are in top condition.",
  "Clean changing rooms and the surface is fantastic. Highly recommend.",
  "Value for money. The court quality is decent for the price.",
  "Loved the ambience and the cafeteria is a nice touch after the game.",
  "Slightly pricey during peak hours but worth it for the quality.",
];
