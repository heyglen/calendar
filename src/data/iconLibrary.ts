export interface IconDescriptor {
  key: string
  library: 'mdi' | 'fa'
  label: string
  category: string
}

export const ICON_LIBRARY: IconDescriptor[] = [
  // Sports
  { key: 'mdi-soccer', library: 'mdi', label: 'Soccer', category: 'Sports' },
  { key: 'mdi-swim', library: 'mdi', label: 'Swimming', category: 'Sports' },
  { key: 'mdi-basketball', library: 'mdi', label: 'Basketball', category: 'Sports' },
  { key: 'mdi-bike', library: 'mdi', label: 'Cycling', category: 'Sports' },
  { key: 'mdi-run', library: 'mdi', label: 'Running', category: 'Sports' },
  { key: 'mdi-gymnastics', library: 'mdi', label: 'Gymnastics', category: 'Sports' },
  { key: 'fa-person-skating', library: 'fa', label: 'Skating', category: 'Sports' },
  { key: 'fa-mountain', library: 'fa', label: 'Climbing', category: 'Sports' },
  { key: 'mdi-scooter', library: 'mdi', label: 'Scooter', category: 'Sports' },
  { key: 'fa-bicycle', library: 'fa', label: 'Biking', category: 'Sports' },

  // School
  { key: 'fa-school', library: 'fa', label: 'School', category: 'School' },
  { key: 'mdi-book-open-variant', library: 'mdi', label: 'Reading', category: 'School' },
  { key: 'mdi-pencil', library: 'mdi', label: 'Homework', category: 'School' },
  { key: 'mdi-test-tube', library: 'mdi', label: 'Science', category: 'School' },
  { key: 'mdi-music', library: 'mdi', label: 'Music Class', category: 'School' },
  { key: 'mdi-palette', library: 'mdi', label: 'Art Class', category: 'School' },
  { key: 'fa-graduation-cap', library: 'fa', label: 'Graduation', category: 'School' },
  { key: 'fa-calculator', library: 'fa', label: 'Math', category: 'School' },
  { key: 'fa-book', library: 'fa', label: 'Library', category: 'School' },

  // Food
  { key: 'mdi-candy', library: 'mdi', label: 'Candy', category: 'Food' },
  { key: 'mdi-food-apple', library: 'mdi', label: 'Snack', category: 'Food' },
  { key: 'mdi-food', library: 'mdi', label: 'Lunch', category: 'Food' },
  { key: 'mdi-cake', library: 'mdi', label: 'Birthday Cake', category: 'Food' },
  { key: 'mdi-pizza', library: 'mdi', label: 'Pizza', category: 'Food' },
  { key: 'mdi-ice-cream', library: 'mdi', label: 'Ice Cream', category: 'Food' },
  { key: 'fa-utensils', library: 'fa', label: 'Dinner', category: 'Food' },
  { key: 'fa-burger', library: 'fa', label: 'Fast Food', category: 'Food' },

  // Health
  { key: 'fa-user-doctor', library: 'fa', label: 'Doctor', category: 'Health' },
  { key: 'mdi-tooth', library: 'mdi', label: 'Dentist', category: 'Health' },
  { key: 'mdi-eye', library: 'mdi', label: 'Eye Doctor', category: 'Health' },
  { key: 'mdi-pill', library: 'mdi', label: 'Medicine', category: 'Health' },
  { key: 'fa-syringe', library: 'fa', label: 'Vaccination', category: 'Health' },
  { key: 'fa-heart-pulse', library: 'fa', label: 'Check-up', category: 'Health' },

  // Home
  { key: 'mdi-home', library: 'mdi', label: 'Home', category: 'Home' },
  { key: 'mdi-bathtub', library: 'mdi', label: 'Bath Time', category: 'Home' },
  { key: 'mdi-sleep', library: 'mdi', label: 'Bedtime', category: 'Home' },
  { key: 'mdi-television', library: 'mdi', label: 'TV Time', category: 'Home' },
  { key: 'mdi-gamepad-variant', library: 'mdi', label: 'Games', category: 'Home' },
  { key: 'fa-broom', library: 'fa', label: 'Chores', category: 'Home' },
  { key: 'fa-dog', library: 'fa', label: 'Walk Dog', category: 'Home' },
  { key: 'fa-cat', library: 'fa', label: 'Feed Cat', category: 'Home' },

  // Social
  { key: 'mdi-account-group', library: 'mdi', label: 'Playdate', category: 'Social' },
  { key: 'mdi-balloon', library: 'mdi', label: 'Party', category: 'Social' },
  { key: 'mdi-gift', library: 'mdi', label: 'Birthday Party', category: 'Social' },
  { key: 'mdi-theater', library: 'mdi', label: 'Theatre', category: 'Social' },
  { key: 'mdi-nature-people', library: 'mdi', label: 'Picnic', category: 'Social' },
  { key: 'fa-people-group', library: 'fa', label: 'Family Time', category: 'Social' },
  { key: 'fa-children', library: 'fa', label: 'Kids Club', category: 'Social' },
  { key: 'mdi-human-cane', library: 'mdi', label: 'Grandparents', category: 'Social' },
  { key: 'fa-people-roof', library: 'fa', label: 'Aunts, Uncles & Cousins', category: 'Social' },
  { key: 'fa-child-reaching', library: 'fa', label: 'Friend Playdate', category: 'Social' },

  // Places
  { key: 'mdi-elephant', library: 'mdi', label: 'Zoo', category: 'Places' },
  { key: 'mdi-ferris-wheel', library: 'mdi', label: 'Amusement Park', category: 'Places' },

  // Technology
  { key: 'fa-tablet-screen-button', library: 'fa', label: 'iPad', category: 'Technology' },

  // Travel
  { key: 'mdi-car', library: 'mdi', label: 'Car Trip', category: 'Travel' },
  { key: 'mdi-airplane', library: 'mdi', label: 'Flight', category: 'Travel' },
  { key: 'mdi-train', library: 'mdi', label: 'Train', category: 'Travel' },
  { key: 'mdi-beach', library: 'mdi', label: 'Beach', category: 'Travel' },
  { key: 'mdi-forest', library: 'mdi', label: 'Camping', category: 'Travel' },
  { key: 'fa-mountain-sun', library: 'fa', label: 'Hiking', category: 'Travel' },
  { key: 'fa-ferry', library: 'fa', label: 'Boat Trip', category: 'Travel' },
]

export const ICON_CATEGORIES = [...new Set(ICON_LIBRARY.map(icon => icon.category))]

export function filterIcons (query: string): IconDescriptor[] {
  if (!query.trim()) {
    return ICON_LIBRARY
  }
  const lowerQuery = query.toLowerCase()
  return ICON_LIBRARY.filter(icon =>
    icon.label.toLowerCase().includes(lowerQuery)
    || icon.category.toLowerCase().includes(lowerQuery),
  )
}
