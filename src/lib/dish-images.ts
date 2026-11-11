/**
 * Smart culinary photo dictionary and fallback image resolver.
 * Maps dish names, cuisines, and categories to appetizing, high-resolution food photography.
 */

const DISH_PHOTO_KEYWORDS: Array<{ keywords: string[]; url: string }> = [
  // Fast Food & Snacks
  {
    keywords: ["fries", "french fries", "peri peri", "potato wedges", "chips", "finger chips"],
    url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["taco", "tacos", "burrito", "quesadilla", "mexican"],
    url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["cheeseburger", "burger", "veggie burger", "chicken burger", "slider"],
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["hotdog", "hot dog", "sausage roll"],
    url: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["pizza", "margherita", "pepperoni", "pizza slice", "calzone"],
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["spaghetti", "pasta", "bolognese", "arrabbiata", "alfredo", "macaroni", "lasagna", "penne"],
    url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["sandwich", "toast", "club sandwich", "grilled sandwich", "panini"],
    url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["momo", "momos", "dumpling", "dim sum", "wonton"],
    url: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["noodle", "noodles", "chowmein", "hakka", "ramen"],
    url: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["samosa", "kachori", "pakora", "fritters", "bhajiya", "chaat", "golgappa", "pani puri"],
    url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["nachos", "tortilla", "loaded nachos"],
    url: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80",
  },

  // Beverages & Cold Drinks
  {
    keywords: ["cola", "coke", "pepsi", "cold drink", "soda", "sprite", "thums up", "fizz"],
    url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["coffee", "cold coffee", "cappuccino", "latte", "espresso", "americano", "frappe"],
    url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["chai", "tea", "masala chai", "adrak chai", "green tea"],
    url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["shake", "milkshake", "smoothie", "chocolate shake", "mango shake", "oreo shake"],
    url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["mojito", "mocktail", "lemonade", "nimbu pani", "cooler"],
    url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["chaas", "buttermilk", "lassi"],
    url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
  },

  // Indian Vegetarian Classics
  {
    keywords: ["paneer", "tikka", "shahi paneer", "kadai paneer", "palak paneer", "cottage cheese"],
    url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["dal", "dal makhani", "dal tadka", "lentils", "yellow dal", "chana", "rajma"],
    url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["naan", "roti", "garlic naan", "butter naan", "kulcha", "paratha", "tandoori roti"],
    url: "https://upload.wikimedia.org/wikipedia/commons/7/79/Butter_Naan.jpg",
  },
  {
    keywords: ["biryani", "pulao", "jeera rice", "basmati", "fried rice", "khichdi"],
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["dosa", "idli", "vada", "sambar", "uttapam", "south indian"],
    url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["curry", "kofta", "malai kofta", "mix veg", "mushroom", "soya chaap"],
    url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
  },

  // Non-Veg Specialities
  {
    keywords: ["chicken", "butter chicken", "tandoori chicken", "chicken curry", "wings", "kebab"],
    url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["mutton", "lamb", "rogan josh", "meat", "seekh kebab"],
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["fish", "fish fry", "prawn", "prawns", "seafood", "shrimp"],
    url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["egg", "omelette", "anda bhurji", "egg curry"],
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
  },

  // Soups & Salads
  {
    keywords: ["soup", "tomato soup", "manchow", "sweet corn soup"],
    url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["salad", "caesar", "green salad", "sprouts"],
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
  },

  // Desserts & Sweets
  {
    keywords: ["ice cream", "kulfi", "sundae", "gelato"],
    url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80",
  },
  {
    keywords: ["gulab jamun", "rasgulla", "rabdi", "sweet", "halwa", "mithai"],
    url: "https://upload.wikimedia.org/wikipedia/commons/5/56/Gulab_Jamun.jpg",
  },
  {
    keywords: ["cake", "brownie", "pastry", "cheesecake", "waffle", "pancake"],
    url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
  },
];

const DEFAULT_VEG_URL = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80";
const DEFAULT_NON_VEG_URL = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80";

/**
 * Resolves a high-quality appetizing food photo URL based on dish name and context.
 */
export function getSmartDishImageUrl(
  dishName: string,
  categoryName?: string | null,
  isVeg?: boolean | null
): string {
  const query = `${dishName || ""} ${categoryName || ""}`.toLowerCase().trim();

  for (const entry of DISH_PHOTO_KEYWORDS) {
    for (const kw of entry.keywords) {
      // Word boundary or substring matching
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(query) || query.includes(kw)) {
        return entry.url;
      }
    }
  }

  // Fallback based on veg/non-veg flag
  return isVeg === false ? DEFAULT_NON_VEG_URL : DEFAULT_VEG_URL;
}
