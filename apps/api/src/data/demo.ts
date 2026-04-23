import type { CommentRecord, DealRecord, UserRecord, VoteRecord } from "@firesale/shared";

type DemoData = {
  deals: DealRecord[];
  comments: CommentRecord[];
  users: UserRecord[];
  votes: VoteRecord[];
};

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();
const hoursFromNow = (hours: number) => new Date(now + hours * 60 * 60 * 1000).toISOString();

export function buildDemoData(): DemoData {
  const users: UserRecord[] = [
    { id: "user-ava", username: "Ava", reputationScore: 88, createdAt: hoursAgo(400) },
    { id: "user-milo", username: "Milo", reputationScore: 52, createdAt: hoursAgo(260) },
    { id: "user-rin", username: "Rin", reputationScore: 67, createdAt: hoursAgo(180) },
    { id: "user-jules", username: "Jules", reputationScore: 41, createdAt: hoursAgo(120) }
  ];

  const deals: DealRecord[] = [
    {
      id: "deal-echo-park-tv",
      title: "Open-box 55\" OLEDs marked down to $499",
      description: "Manager special in the clearance corner. Three units left when I walked out.",
      storeName: "Best Buy Echo Park",
      location: { lat: 34.0812, lng: -118.2606, address: "2715 Sunset Blvd, Los Angeles, CA" },
      category: "electronics",
      price: 499,
      discount: 55,
      imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-ava",
      createdAt: hoursAgo(1.5),
      expiresAt: hoursFromNow(4)
    },
    {
      id: "deal-arts-district-tacos",
      title: "Late lunch combo for $6 until 3 PM",
      description: "Two tacos, chips, and agua fresca. Line was short and the cashier confirmed the window ends at 3 PM.",
      storeName: "Mercado Norte",
      location: { lat: 34.0365, lng: -118.2329, address: "801 Mateo St, Los Angeles, CA" },
      category: "food",
      price: 6,
      discount: 40,
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-rin",
      createdAt: hoursAgo(0.75),
      expiresAt: hoursFromNow(1.5)
    },
    {
      id: "deal-silverlake-grocery",
      title: "Organic berries buy one get one",
      description: "Cooler near the entrance is full. Great for same-day use and the produce still looks solid.",
      storeName: "Green Basket Silver Lake",
      location: { lat: 34.0911, lng: -118.2706, address: "1710 Hillhurst Ave, Los Angeles, CA" },
      category: "grocery",
      price: 5.99,
      discount: 50,
      imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-milo",
      createdAt: hoursAgo(3.25),
      expiresAt: hoursFromNow(8)
    },
    {
      id: "deal-culver-home",
      title: "Floor models 35% off tonight only",
      description: "Living room section only. Staff said markdowns apply to tagged pieces and pickup can happen this weekend.",
      storeName: "Westside Home Studio",
      location: { lat: 34.0226, lng: -118.3964, address: "9300 Culver Blvd, Culver City, CA" },
      category: "home",
      discount: 35,
      imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-jules",
      createdAt: hoursAgo(5),
      expiresAt: hoursFromNow(6)
    },
    {
      id: "deal-santa-monica-style",
      title: "Denim wall at 60% off",
      description: "Mostly sizes 26 to 31 left. Dressing rooms are open and the markdown rack keeps getting replenished.",
      storeName: "Pacific Thread",
      location: { lat: 34.0189, lng: -118.4965, address: "1352 3rd Street Promenade, Santa Monica, CA" },
      category: "fashion",
      discount: 60,
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-ava",
      createdAt: hoursAgo(2.5),
      expiresAt: hoursFromNow(10)
    },
    {
      id: "deal-koreatown-skincare",
      title: "Sheet masks 10 for $12 near register",
      description: "Impulse shelf deal. The clerk said it is good until they sell through tonight.",
      storeName: "Glow House KTown",
      location: { lat: 34.0616, lng: -118.3015, address: "3250 W 8th St, Los Angeles, CA" },
      category: "beauty",
      price: 12,
      discount: 45,
      imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-rin",
      createdAt: hoursAgo(4.5),
      expiresAt: hoursFromNow(3)
    },
    {
      id: "deal-burbank-coffee",
      title: "Free pastry with any latte after 2 PM",
      description: "Not huge, but quick win if you are nearby. Staff still honoring it as of 2:20.",
      storeName: "Northlight Coffee",
      location: { lat: 34.1804, lng: -118.308, address: "310 N San Fernando Blvd, Burbank, CA" },
      category: "food",
      price: 6.5,
      discount: 25,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-milo",
      createdAt: hoursAgo(0.3),
      expiresAt: hoursFromNow(5)
    },
    {
      id: "deal-dtla-speaker",
      title: "Portable speakers clearance bin for $19",
      description: "Good for dorm or patio use. Mostly black models left by checkout lane 4.",
      storeName: "Target Fig at 7th",
      location: { lat: 34.0484, lng: -118.2586, address: "735 S Figueroa St, Los Angeles, CA" },
      category: "electronics",
      price: 19,
      discount: 52,
      imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-jules",
      createdAt: hoursAgo(6),
      expiresAt: hoursFromNow(2.2)
    },
    {
      id: "deal-pasadena-blender",
      title: "Blenders were marked down but stock looks wiped",
      description: "Could be worth calling first. Shelf tag still showed the markdown earlier today.",
      storeName: "Kitchen Harbor Pasadena",
      location: { lat: 34.1459, lng: -118.1445, address: "52 E Colorado Blvd, Pasadena, CA" },
      category: "home",
      price: 39,
      discount: 50,
      imageUrl: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=1200&q=80",
      createdBy: "user-rin",
      createdAt: hoursAgo(7),
      expiresAt: hoursFromNow(1)
    }
  ];

  const votes: VoteRecord[] = [
    { id: "vote-1", dealId: "deal-echo-park-tv", userId: "user-rin", value: 1, createdAt: hoursAgo(1.2) },
    { id: "vote-2", dealId: "deal-echo-park-tv", userId: "user-milo", value: 1, createdAt: hoursAgo(1) },
    { id: "vote-3", dealId: "deal-arts-district-tacos", userId: "user-ava", value: 1, createdAt: hoursAgo(0.5) },
    { id: "vote-4", dealId: "deal-arts-district-tacos", userId: "user-jules", value: 1, createdAt: hoursAgo(0.25) },
    { id: "vote-5", dealId: "deal-silverlake-grocery", userId: "user-rin", value: 1, createdAt: hoursAgo(2.5) },
    { id: "vote-6", dealId: "deal-silverlake-grocery", userId: "user-ava", value: 1, createdAt: hoursAgo(2.75) },
    { id: "vote-7", dealId: "deal-koreatown-skincare", userId: "user-ava", value: 1, createdAt: hoursAgo(3.5) },
    { id: "vote-8", dealId: "deal-koreatown-skincare", userId: "user-jules", value: -1, createdAt: hoursAgo(3.2) },
    { id: "vote-9", dealId: "deal-burbank-coffee", userId: "user-ava", value: 1, createdAt: hoursAgo(0.2) },
    { id: "vote-10", dealId: "deal-dtla-speaker", userId: "user-rin", value: 1, createdAt: hoursAgo(4.8) },
    { id: "vote-11", dealId: "deal-pasadena-blender", userId: "user-jules", value: -1, createdAt: hoursAgo(1) },
    { id: "vote-12", dealId: "deal-pasadena-blender", userId: "user-ava", value: -1, createdAt: hoursAgo(0.8) }
  ];

  const comments: CommentRecord[] = [
    { id: "comment-1", dealId: "deal-echo-park-tv", userId: "user-rin", content: "Still seeing two on the floor at 8:30.", createdAt: hoursAgo(0.75) },
    { id: "comment-2", dealId: "deal-arts-district-tacos", userId: "user-jules", content: "Confirmed active and fast line.", createdAt: hoursAgo(0.35) },
    { id: "comment-3", dealId: "deal-silverlake-grocery", userId: "user-ava", content: "Berries looked fresh. Good pickup.", createdAt: hoursAgo(2) },
    { id: "comment-4", dealId: "deal-koreatown-skincare", userId: "user-jules", content: "Only floral packs left but still active.", createdAt: hoursAgo(2.5) },
    { id: "comment-5", dealId: "deal-burbank-coffee", userId: "user-ava", content: "Pastries are mini croissants today.", createdAt: hoursAgo(0.15) },
    { id: "comment-6", dealId: "deal-pasadena-blender", userId: "user-ava", content: "Looked sold out when I checked.", createdAt: hoursAgo(0.6) },
    { id: "comment-7", dealId: "deal-pasadena-blender", userId: "user-jules", content: "Shelf was empty by 5 PM.", createdAt: hoursAgo(0.4) },
    { id: "comment-8", dealId: "deal-dtla-speaker", userId: "user-rin", content: "Still active but lower stock now.", createdAt: hoursAgo(2.2) }
  ];

  return { deals, comments, users, votes };
}
