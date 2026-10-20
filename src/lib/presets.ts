export type PresetTemplate = {
  id: "dhaba" | "cafe" | "south_indian" | "street_food";
  title: string;
  badge: string;
  icon: string;
  description: string;
  categories: { id: string; name: string }[];
  items: {
    name: string;
    categoryIndex: number;
    price: number;
    description: string;
    image_url: string;
  }[];
};

export const STARTER_PRESETS: PresetTemplate[] = [
  {
    id: "dhaba",
    title: "North Indian Dhaba",
    badge: "Most Popular",
    icon: "🍛",
    description: "Dal Makhani, Paneer Tikka, Butter Naan, Jeera Rice & Gulab Jamun",
    categories: [
      { id: "dhaba-cat-1", name: "Starters & Tandoor" },
      { id: "dhaba-cat-2", name: "Main Course Gravies" },
      { id: "dhaba-cat-3", name: "Breads & Basmati Rice" },
      { id: "dhaba-cat-4", name: "Desserts & Chaas" },
    ],
    items: [
      {
        name: "Paneer Tikka Angara",
        categoryIndex: 0,
        price: 280,
        description: "Charcoal roasted cottage cheese marinated in hung curd and spices.",
        image_url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Dahi Ke Kebab",
        categoryIndex: 0,
        price: 240,
        description: "Melt-in-mouth spiced yogurt patties with crushed cardamom and coriander.",
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Dal Makhani Amritsari",
        categoryIndex: 1,
        price: 320,
        description: "Slow simmered black lentils cooked overnight with cream and desi butter.",
        image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Paneer Butter Masala",
        categoryIndex: 1,
        price: 340,
        description: "Fresh cottage cheese cubes in rich tomato, cashew nut and butter gravy.",
        image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Garlic Butter Naan",
        categoryIndex: 2,
        price: 70,
        description: "Clay oven leavened bread glazed with minced garlic and butter.",
        image_url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Jeera Basmati Pulao",
        categoryIndex: 2,
        price: 180,
        description: "Aromatic long-grain basmati rice tempered with roasted cumin.",
        image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Gulab Jamun with Rabdi",
        categoryIndex: 3,
        price: 110,
        description: "Warm golden khoya dumplings served with chilled thick rabdi.",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "cafe",
    title: "Cafe & Fast Food",
    badge: "Trending",
    icon: "☕",
    description: "Cold Brews, Grilled Sandwiches, Burgers, Fries & Brownies",
    categories: [
      { id: "cafe-cat-1", name: "Cold Brews & Beverages" },
      { id: "cafe-cat-2", name: "Artisanal Sandwiches & Burgers" },
      { id: "cafe-cat-3", name: "Loaded Fries & Starters" },
      { id: "cafe-cat-4", name: "Bakes & Desserts" },
    ],
    items: [
      {
        name: "Hazelnut Cold Coffee",
        categoryIndex: 0,
        price: 160,
        description: "Creamy espresso blend shaken with rich roasted hazelnut syrup.",
        image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Cheesy Paneer Tikka Sandwich",
        categoryIndex: 1,
        price: 180,
        description: "Toasted sourdough loaded with marinated cottage cheese, bell peppers & mozzarella.",
        image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Crispy Peri Peri Fries",
        categoryIndex: 2,
        price: 130,
        description: "Golden crisp french fries dusted with spicy African bird's eye chili seasoning.",
        image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Double Cheese Veg Burger",
        categoryIndex: 1,
        price: 190,
        description: "Crispy vegetable patty with double melted cheddar, jalapeños and secret sauce.",
        image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Warm Sizzling Walnut Brownie",
        categoryIndex: 3,
        price: 150,
        description: "Fudgy Belgian chocolate brownie served with vanilla ice cream and chocolate drizzle.",
        image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "south_indian",
    title: "South Indian Tiffin",
    badge: "Authentic",
    icon: "🥞",
    description: "Crispy Dosas, Idli-Vada combos, Filter Coffee & Uttapam",
    categories: [
      { id: "south-cat-1", name: "Crispy Dosas & Uttapams" },
      { id: "south-cat-2", name: "Steamed Idli & Medu Vada" },
      { id: "south-cat-3", name: "Meals & Traditional Rice" },
      { id: "south-cat-4", name: "Filter Kaapi & Drinks" },
    ],
    items: [
      {
        name: "Mysore Special Masala Dosa",
        categoryIndex: 0,
        price: 140,
        description: "Crispy golden crepe smeared with spicy red garlic chutney and spiced potato bhaji.",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Ghee Roast Paper Dosa",
        categoryIndex: 0,
        price: 160,
        description: "Ultra thin crisp cone dosa made with pure organic desi ghee.",
        image_url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Idli & Medu Vada Combo",
        categoryIndex: 1,
        price: 110,
        description: "Two melt-in-mouth steamed idlis and one crispy vada served with sambar and fresh coconut chutney.",
        image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Authentic Degree Filter Kaapi",
        categoryIndex: 3,
        price: 50,
        description: "Traditional chicory-blended South Indian filter coffee frothed in a brass davarah.",
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "street_food",
    title: "Chaat & Street Food",
    badge: "Quick Bites",
    icon: "🫖",
    description: "Pav Bhaji, Chole Bhature, Sev Puri, Rolls & Kulhad Chai",
    categories: [
      { id: "street-cat-1", name: "Chaat & Snacks" },
      { id: "street-cat-2", name: "Hot Meals & Combos" },
      { id: "street-cat-3", name: "Frankie & Rolls" },
      { id: "street-cat-4", name: "Chai & Shikanji" },
    ],
    items: [
      {
        name: "Amul Butter Special Pav Bhaji",
        categoryIndex: 1,
        price: 150,
        description: "Spiced mashed vegetable curry slow-cooked on flat tawa with extra butter pav.",
        image_url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Amritsari Chole Bhature",
        categoryIndex: 1,
        price: 180,
        description: "Two fluffy golden bhatures served with spiced chickpea curry and pickled onions.",
        image_url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Mumbai Sev Puri Crisp",
        categoryIndex: 0,
        price: 90,
        description: "Crispy flat puris topped with potatoes, trio of chutneys and crunchy nylon sev.",
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
      },
      {
        name: "Ginger Elaichi Kulhad Chai",
        categoryIndex: 3,
        price: 35,
        description: "Strong milk tea brewed with crushed ginger and green cardamom, served in clay kulhad.",
        image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
];
