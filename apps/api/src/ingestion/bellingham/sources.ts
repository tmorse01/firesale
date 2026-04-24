import type { BellinghamSourceDefinition } from "../types.js";

export const bellinghamSources: BellinghamSourceDefinition[] = [
  {
    key: "haggen-fairhaven",
    name: "Haggen Fairhaven Local Offers",
    retailer: "Haggen",
    sourceUrl: "https://local.haggen.com/wa/bellingham/1401-12th-st.html",
    dealUrl: "https://www.haggen.com/weeklyad",
    storeUrl: "https://local.haggen.com/wa/bellingham/1401-12th-st.html",
    parser: "haggenLocal",
    storeName: "Haggen Fairhaven",
    category: "grocery",
    expiresAfterHours: 24,
    pruneMissingAutomatedDeals: true,
    location: {
      lat: 48.718863,
      lng: -122.501699,
      address: "1401 12th St, Bellingham, WA 98225"
    }
  },
  {
    key: "haggen-sehome",
    name: "Haggen Sehome Local Offers",
    retailer: "Haggen",
    sourceUrl: "https://local.haggen.com/wa/bellingham/210-36th-st.html",
    dealUrl: "https://www.haggen.com/weeklyad",
    storeUrl: "https://local.haggen.com/wa/bellingham/210-36th-st.html",
    parser: "haggenLocal",
    storeName: "Haggen Sehome",
    category: "grocery",
    expiresAfterHours: 24,
    pruneMissingAutomatedDeals: true,
    location: {
      lat: 48.7326525,
      lng: -122.4718121,
      address: "210 36th St, Bellingham, WA 98225"
    }
  },
  {
    key: "haggen-meridian",
    name: "Haggen Meridian Local Offers",
    retailer: "Haggen",
    sourceUrl: "https://local.haggen.com/wa/bellingham/2814-meridian-st.html",
    dealUrl: "https://www.haggen.com/weeklyad",
    storeUrl: "https://local.haggen.com/wa/bellingham/2814-meridian-st.html",
    parser: "haggenLocal",
    storeName: "Haggen Meridian",
    category: "grocery",
    expiresAfterHours: 24,
    pruneMissingAutomatedDeals: true,
    location: {
      lat: 48.7679964,
      lng: -122.4847638,
      address: "2814 Meridian St, Bellingham, WA 98225"
    }
  },
  {
    key: "haggen-barkley",
    name: "Haggen Barkley Local Offers",
    retailer: "Haggen",
    sourceUrl: "https://local.haggen.com/wa/bellingham/2900-woburn-st.html",
    dealUrl: "https://www.haggen.com/weeklyad",
    storeUrl: "https://local.haggen.com/wa/bellingham/2900-woburn-st.html",
    parser: "haggenLocal",
    storeName: "Haggen Barkley",
    category: "grocery",
    expiresAfterHours: 24,
    pruneMissingAutomatedDeals: true,
    location: {
      lat: 48.7693489,
      lng: -122.4445888,
      address: "2900 Woburn St, Bellingham, WA 98226"
    }
  },
  {
    key: "walgreens-samish",
    name: "Walgreens Samish Way Weekly Ad",
    retailer: "Walgreens",
    sourceUrl: "https://www.walgreens.com/offers/offers.jsp/weeklyad/",
    dealUrl: "https://www.walgreens.com/offers/offers.jsp/weeklyad/",
    storeUrl: "https://www.walgreens.com/locator/walgreens-125%2Bs%2Bsamish%2Bway-bellingham-wa-98225/id%3D16095",
    parser: "walgreensWeeklyAd",
    storeName: "Walgreens Samish Way",
    category: "other",
    expiresAfterHours: 24,
    maxPromotionsPerRun: 5,
    pruneMissingAutomatedDeals: true,
    location: {
      lat: 48.7344255,
      lng: -122.4694215,
      address: "125 Samish Way, Bellingham, WA 98225"
    }
  },
  {
    key: "whole-foods-lakeway",
    name: "Whole Foods Lakeway Weekly Sales",
    retailer: "Whole Foods Market",
    sourceUrl: "https://www.wholefoodsmarket.com/stores/bellinghamlakeway",
    dealUrl: "https://www.wholefoodsmarket.com/sales-flyer?store-id=10637",
    storeUrl: "https://www.wholefoodsmarket.com/stores/bellinghamlakeway",
    parser: "wholeFoodsStoreSales",
    storeName: "Whole Foods Bellingham Lakeway",
    category: "grocery",
    expiresAfterHours: 120,
    maxPromotionsPerRun: 5,
    pruneMissingAutomatedDeals: true,
    fallbackImageUrl:
      "https://m.media-amazon.com/images/S/assets.wholefoodsmarket.com/storepages/seo/store-OG-img-4x3.png",
    location: {
      lat: 48.74363266,
      lng: -122.461261,
      address: "1030 Lakeway Dr, Bellingham, WA 98229"
    }
  },
  {
    key: "target-bellis-fair-grocery",
    name: "Target Bellis Fair Grocery Weekly Ad",
    retailer: "Target",
    sourceUrl: "https://www.target.com/c/grocery/weekly-ad/-/N-5xt1aZ55dgn",
    dealUrl: "https://www.target.com/weekly-ad?view=page",
    storeUrl: "https://www.target.com/store-locator/find-stores/98244",
    parser: "targetWeeklyAdStories",
    storeName: "Target Bellis Fair",
    category: "grocery",
    expiresAfterHours: 96,
    maxPromotionsPerRun: 4,
    pruneMissingAutomatedDeals: true,
    fallbackImageUrl: "https://target.scene7.com/is/image/Target/GUEST_9930b034-392c-4839-a212-8e5071e8520f",
    location: {
      lat: 48.792485,
      lng: -122.491083,
      address: "30 Bellis Fair Pkwy, Bellingham, WA 98226"
    }
  }
];
