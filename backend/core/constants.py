# /backend/core/constants.py (Complete File)

from typing import List, Literal, Dict, Set

# --- Core Algorithm & Search Parameters ---
DEFAULT_TRAVEL_MODE: Literal["driving", "walking", "bicycling", "transit"] = "driving"
SEARCH_RADIUS_SPEED_KMPH: float = 20.0
MIN_SEARCH_RADIUS_KM: float = 1.0
MAX_WAIT_TIME_HOURS: float = 1.5
MIN_VIABLE_ACTIVITY_HOURS: float = 0.4
MAX_SERENDIPITY_CANDIDATES_FROM_OVERPASS: int = 10

# --- Costing ---
COST_PER_KM_INR_DRIVING: float = 15.0
COST_BASE_FARE_INR_DRIVING: float = 30.0
GOOGLE_PRICE_LEVEL_TO_INR: Dict[int, float] = {0: 50.0, 1: 300.0, 2: 700.0, 3: 1200.0, 4: 2500.0}
DEFAULT_CAFE_COST_INR: float = 200.0
DEFAULT_RESTAURANT_COST_INR: float = 500.0
DEFAULT_SNACK_COST_INR: float = 150.0
DEFAULT_DESSERT_SPECIALTY_COST_INR: float = 100.0
DEFAULT_MUSEUM_FEE_INR: float = 250.0
DEFAULT_ATTRACTION_FEE_INR: float = 150.0
DEFAULT_VIEWPOINT_FEE_INR: float = 50.0
GENERIC_FEE_INR: float = 100.0
DEFAULT_ENTRY_COST_INR: float = 0.0
DEFAULT_SHOPPING_COST_INR: None = None

# --- Time & Duration ---
MIN_ACTIVITY_TIME_HOURS: float = 0.5
DEFAULT_ACTIVITY_TIME_HOURS: float = 1.0
DEFAULT_MEAL_DURATION_HOURS: float = 1.0
DEFAULT_SNACK_DURATION_HOURS: float = 0.5
DEFAULT_DESSERT_DURATION_HOURS: float = 0.4
DEFAULT_SHOPPING_MALL_DURATION_HOURS: float = 1.5
DEFAULT_SHOPPING_SOUVENIR_DURATION_HOURS: float = 0.75
DEFAULT_SHOPPING_GENERAL_DURATION_HOURS: float = 1.0
MIN_HOURS_BETWEEN_MEALS: float = 3.0
MIN_MEAL_OVERLAP_MINUTES: float = 30

# --- Meal Definitions ---
MEAL_TIMES: Dict[str, Dict[str, int]] = {
    "breakfast": {"start_hour": 7, "end_hour": 10},
    "lunch": {"start_hour": 12, "end_hour": 15},
    "dinner": {"start_hour": 18, "end_hour": 21}
}
MAX_MEALS_PER_WINDOW: int = 1
MEAL_AMENITIES: Set[str] = {'restaurant', 'cafe'}
SNACK_AMENITIES: Set[str] = {'pub', 'bar', 'food_court', 'juice_bar', 'tea_house', 'biergarten', 'internet_cafe'}
DESSERT_AMENITIES: Set[str] = {'ice_cream_parlor', 'bakery', 'pastry'}
DESSERT_SHOP_TAGS: Set[str] = {"ice_cream", "cakes", "doughnut", "sweets", "confectionery", "chocolate", "candy"}

# --- Preferences & AI ---
SURPRISE_ME_PREFERENCES: Set[str] = {"sights", "history", "foodie", "park", "shopping"}
LANDMARK_PREFERENCE_PRIORITY: List[str] = ["sights", "history", "religious", "foodie", "shopping"]
AUTHENTICITY_KEYWORDS: Set[str] = {"authentic", "traditional", "original since", "famous for its", "heritage", "local favorite", "specialty of", "since 19", "since 18", "generations", "classic", "renowned", "award-winning"}
SHOPPING_AUTHENTICITY_KEYWORDS: Set[str] = {"handmade", "local art", "traditional craft", "artisan", "local design", "handicraft", "bespoke", "custom", "unique finds", "indigenous", "specialty shop", "made in"}
INTERNATIONAL_FOOD_CHAINS_EXCLUDE: Set[str] = {"mcdonald's", "starbucks", "subway", "kfc", "pizza hut", "burger king", "domino's pizza", "taco bell", "costa coffee", "tim hortons", "dunkin'", "dunkin' donuts", "papa john's", "wendy's", "baskin robbins", "pizzaexpress", "pret a manger", "cafe coffee day", "barista", "costa", "gloria jean's coffees", "hard rock cafe"}
PROMPT_EXAMPLES_FOR_PREFERENCES: Dict[str, str] = {
    "history": "For 'history', list specific historical periods, architectural styles, or famous dynasties associated with the city. Examples for another city might be: 'Mughal Architecture', 'Nawabi Era', 'Colonial Buildings'.",
    "sights": "For 'sights', list types of famous landmarks or unique viewpoints the city is known for. Examples for another city might be: 'Riverfront Views', 'Rooftop Cafes', 'Iconic Bridges'.",
    "nightlife": "For 'nightlife', list specific types of nightlife scenes or famous areas. Examples for another city might be: 'Live Music Venues', 'Rooftop Bars', 'Brewpubs'.",
    "park": "For 'park', list types of unique natural or public spaces. Examples for another city might be: 'Botanical Gardens', 'Lakeside Promenades', 'Urban Oasis'.",
    "religious": "For 'religious', list specific significant religious figures, pilgrimage sites, or architectural styles of worship places in the city. Examples for another city might be: 'Sufi Shrines', 'Gothic Churches', 'Shiva Temples'.",
    "foodie": "For 'foodie', list a mix of 2-3 distinct items: 1. An iconic main dish the city is famous for. 2. A famous and popular street food or snack item (like 'chaat'). 3. A trendy or 'buzzworthy' cafe known for its great ambiance. Examples for Lucknow could be: 'Galouti Kebab', 'Royal Cafe Chaat', 'Mocha Cafe'.",
    "shopping": "For 'shopping', list specific local crafts, famous markets, or unique shopping items. Examples for Lucknow might be: 'Chikankari embroidery', 'Attar perfumes', 'Hazratganj market'."
}

# --- Scoring Weights & Penalties ---
LANDMARK_DISCOVERY_BONUS: int = 10000
KEYWORD_DISCOVERY_BONUS: int = 500
PREFERENCE_COVERAGE_BONUS: int = 350
DIVERSIFICATION_BONUS: int = 200
RATING_SCORE_BONUS: Dict[str, int] = {"high": 50, "medium": 30, "low": 10}
MIN_REVIEWS_FOR_HIGH_RATING: int = 25
POPULARITY_BONUS_FOOD: int = 75
MIN_REVIEWS_FOR_POPULARITY_BONUS: int = 1500
MEAL_TIMING_BONUS: int = 150
SIGNIFICANCE_BONUS_SIGHTS: int = 120
SIGNIFICANCE_BONUS_PARK: int = 80
WIKIPEDIA_NOTABILITY_BOOST_FOOD: int = 50
LOCAL_CUISINE_TAG_BOOST: int = 35
AUTHENTICITY_KEYWORD_BOOST_FOOD: int = 40
HIGH_RATING_HIGH_REVIEWS_FOOD_BOOST: int = 40
GOOD_RATING_MODERATE_REVIEWS_FOOD_BOOST: int = 25
LOW_RATING_PENALTY_FOOD: int = -40
GOOGLE_LOCAL_CUISINE_TYPE_BOOST: int = 30
PRE_AI_FOODIE_SCORE_THRESHOLD_FOR_AI_CALL: int = 65
GENERAL_SWEET_SHOP_PENALTY: int = -75
GENERIC_FAST_FOOD_PENALTY: int = -60
WIKIPEDIA_NOTABILITY_BOOST_SHOP: int = 40
SHOPPING_AUTHENTICITY_KEYWORD_BOOST: int = 40
HIGH_RATING_HIGH_REVIEWS_SHOP_BOOST: int = 35
GOOD_RATING_MODERATE_REVIEWS_SHOP_BOOST: int = 20
LOW_RATING_PENALTY_SHOP: int = -35
SHOPPING_MALL_BOOST: int = 40
SOUVENIR_GIFT_CRAFT_ART_BOOST: int = 50
GENERAL_SHOP_PENALTY: int = -50
RELIGIOUS_NON_NOTABLE_PENALTY: int = -100
SIMILAR_ACTIVITY_PENALTY: int = -150
RATING_SIMILARITY_THRESHOLD: float = 0.5
GENERIC_STORE_KEYWORDS_PENALTY: int = -10000
GENERIC_STORE_MATCH_TERMS: Set[str] = {
    "store", "stores", "kirana", "supermarket", "traders", "enterprises", 
    "sons", "emporium", "bazaar", "mart", "world", "collection", "point",
    "spencer's", "reliance", "more", "big bazaar", "dmart", "easyday", "vishal mega mart"
}

# --- External APIs ---
OVERPASS_API_URL: str = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT: int = 60
WIKI_LOOKUP_TIMEOUT: int = 15

# --- OSM Tag Definitions ---
PREFERENCE_TO_OSM_SELECTOR: Dict[str, List[str]] = {
    "foodie": [
        '[amenity~"restaurant|cafe|pub|bar|food_court|ice_cream_parlor|juice_bar|tea_house|biergarten|fast_food"]',
        '[shop~"bakery|pastry|ice_cream|sweets|confectionery|deli|chocolate|coffee|tea"]'
    ],
    "history": ['[historic]'],
    "sights": ['[tourism~"attraction|viewpoint|museum|artwork"]'],
    "shopping": ['[shop]'],
    "nightlife": ['[amenity~"bar|pub|nightclub|casino"]'],
    "park": [
        '[leisure~"park|garden|nature_reserve|promenade|beach_resort"]',
        '[natural~"beach|wood|water"]',
        '[waterway~"waterfall|riverbank"]'
    ],
    "religious": [
        '[amenity=place_of_worship][tourism~"attraction|artwork"]',
        '[amenity=place_of_worship][historic]',
        '[amenity=place_of_worship][wikipedia]',
        '[amenity=place_of_worship][heritage]'
    ]
}

EXCLUDED_OSM_TAGS: Dict[str, Set[str]] = {
    "shop": {
        "stationery", "kiosk", "convenience", "copyshop", "newsagent", "tobacco", "greengrocer", 
        "butcher", "hardware", "laundry", "dry_cleaning", "tailor", "shoe_repair", "vacant", 
        "chemist", "mobile_phone", "optician", "beauty", "hairdresser", "bookmaker", "charity", 
        "lottery", "travel_agency", "estate_agent", "insurance", "money_lender", "pawnbroker", 
        "car", "motorcycle", "bicycle", "boat", "truck", "atv", "snowmobile", "car_repair", 
        "car_parts", "tyres", "automotive", "motorcycle_repair", "bicycle_repair", "electronics", 
        "appliance", "computer", "hifi", "video_games", "video", "general", "trade", "wholesale", 
        "rental", "storage_rental", "tool_hire", "medical_supply", "electrical", "paint", "florist", 
        "pet", "agrarian", "farm", "doityourself", "bathroom_furnishing", "erotic", 
        "funeral_directors", "gas", "kitchen", "security", "tiles", "window_construction", 
        "weapons", "outpost", "photo", "photo_processing", "pyrotechnics", "fabric", "sewing", 
        "variety_store", "bed", "carpet", "curtain", "doors", "flooring", "furniture", 
        "houseware", "lamps", "window_blind", "second_hand", "office_supplies", 
        "building_materials", "diy", "repair", "service", "trophy", "awards", 
        "photo_studio", "frame", "glaziery", "bed", "interior_decoration"
    },
    "amenity": {
        "atm", "bank", "clinic", "dentist", "doctors", "pharmacy", "post_box", "post_office", 
        "telephone", "toilets", "recycling", "waste_basket", "bench", "shelter", "taxi", 
        "bus_station", "ferry_terminal", "car_rental", "fuel", "parking", "bicycle_parking", 
        "motorcycle_parking", "charging_station", "police", "fire_station", "library", 
        "townhall", "courthouse", "community_centre", "social_facility", "kindergarten", 
        "school", "college", "university", "public_bath", "grave_yard", "place_of_mourning", 
        "crematorium", "animal_shelter", "car_wash", "driving_school", "veterinary", 
        "childcare", "clock", "compressed_air", "hunting_stand", "payment_terminal", 
        "public_bookcase", "waste_disposal", "water_point", "fountain", "photo_booth"
    },
    "building": {
        "yes", "residential", "apartments", "house", "detached", "semidetached_house", 
        "industrial", "warehouse", "office", "commercial", "retail", "garage", "hut", 
        "shed", "service", "construction", "ruins", "farm", "static_caravan", 
        "transformer_tower", "kiosk", "cabin", "school", "hospital", "train_station", 
        "transportation", "public", "government", "civic", "tower"
    },
    "tourism": {
        "information", "guidepost", "map", "board", "hotel", "hostel", "motel", 
        "guest_house", "alpine_hut", "camp_site", "caravan_site", "apartment", "chalet"
    },
    "leisure": {
        "pitch", "playground", "track", "stadium", "sports_centre", "dog_park", "picnic_table", 
        "firepit", "swimming_pool", "fitness_centre", "golf_course", "ice_rink", "water_park", 
        "marina", "slipway", "adult_gaming_centre", "amusement_arcade", "bandstand", "dance", 
        "fitness_station", "hackerspace", "horse_riding", "miniature_golf", "sauna", 
        "sports_hall", "summer_camp", "tanning_salon"
    },
    "landuse": {
        "residential", "industrial", "commercial", "retail", "construction", "farmland", 
        "military", "quarry", "landfill", "cemetery", "brownfield", "greenfield", 
        "railway", "basin", "meadow", "orchard", "plant_nursery", "reservoir", "village_green"
    },
    "highway": {
        "bus_stop", "street_lamp", "traffic_signals", "crossing", "service", "footway", 
        "cycleway", "path", "steps", "give_way", "mini_roundabout", "motorway_junction", 
        "passing_place", "platform", "rest_area", "speed_camera", "stop", "turning_circle", 
        "turning_loop"
    },
    "power": {"pole", "tower", "substation", "generator", "line", "minor_line", "cable"},
    "man_made": {
        "storage_tank", "wastewater_plant", "water_works", "chimney", "crane", "surveillance", 
        "mast", "pipeline", "adit", "breakwater", "bunker_silo", "clearcut", "cutline", 
        "dyke", "embankment", "flagpole", "gasometer", "groyne", "lighthouse", 
        "monitoring_station", "pier", "reservoir_covered", "silo", "street_cabinet", 
        "survey_point", "water_tap", "water_tower", "water_well", "windmill", "works", "tower"
    },
    "_exclude_key_exists": {"noname", "fixme", "construction", "proposed", "disused", "abandoned", "razed", "noexit"}
}

INCLUSION_CRITERIA_TAGS: Dict[str, Set[str]] = {
    "key_exists": {"tourism", "historic", "wikipedia", "wikidata", "heritage", "name:en"},
    "amenity": {"restaurant", "cafe", "pub", "bar", "nightclub", "cinema", "theatre", "marketplace", "place_of_worship", "arts_centre", "ice_cream_parlor", "juice_bar", "biergarten", "food_court", "internet_cafe", "tea_house", "fast_food"},
    "shop": {"mall", "department_store", "souvenir", "gift", "crafts", "art", "antiques", "jewelry", "perfumery", "toys", "games", "boutique", "fashion", "clothes", "shoes", "fashion_accessories", "bags", "watches", "book", "music", "collector", "hobby", "sports", "outdoor", "bakery", "pastry", "chocolate", "deli", "coffee", "tea", "ice_cream", "wine", "alcohol", "beverages", "local_products", "fair_trade", "market", "farm"},
    "leisure": {"park", "garden", "museum", "gallery", "marina", "beach_resort", "nature_reserve", "bird_hide", "botanical_garden", "zoo", "theme_park", "amusement_park"},
    "tourism": {"attraction", "viewpoint", "museum", "artwork", "gallery", "theme_park", "zoo", "aquarium", "planetarium", "winery", "distillery", "brewery"}
}

# --- Weather Data Structures ---
class WeatherCondition:
    """A simple class to hold weather condition data, used as a default."""
    def __init__(self, description: str, icon_char: str):
        self.description = description
        self.icon_char = icon_char

DEFAULT_WEATHER_CONDITION_OBJ = WeatherCondition(description="Weather data unavailable", icon_char="❓")

WMO_CODE_DESCRIPTIONS_DICT: Dict[int, WeatherCondition] = {
    0: WeatherCondition(description="Clear sky", icon_char="☀️"),
    1: WeatherCondition(description="Mainly clear", icon_char="🌤️"),
    2: WeatherCondition(description="Partly cloudy", icon_char="🌥️"),
    3: WeatherCondition(description="Overcast", icon_char="☁️"),
    45: WeatherCondition(description="Fog", icon_char="🌫️"),
    48: WeatherCondition(description="Depositing rime fog", icon_char="🌫️"),
    51: WeatherCondition(description="Light drizzle", icon_char="🌦️"),
    53: WeatherCondition(description="Moderate drizzle", icon_char="🌦️"),
    55: WeatherCondition(description="Dense drizzle", icon_char="🌧️"),
    56: WeatherCondition(description="Light freezing drizzle", icon_char="🌨️"),
    57: WeatherCondition(description="Dense freezing drizzle", icon_char="🌨️"),
    61: WeatherCondition(description="Slight rain", icon_char="🌦️"),
    63: WeatherCondition(description="Moderate rain", icon_char="🌧️"),
    65: WeatherCondition(description="Heavy rain", icon_char="🌧️"),
    66: WeatherCondition(description="Light freezing rain", icon_char="🌨️"),
    67: WeatherCondition(description="Heavy freezing rain", icon_char="🌨️"),
    71: WeatherCondition(description="Slight snow fall", icon_char="🌨️"),
    73: WeatherCondition(description="Moderate snow fall", icon_char="❄️"),
    75: WeatherCondition(description="Heavy snow fall", icon_char="❄️"),
    77: WeatherCondition(description="Snow grains", icon_char="🌨️"),
    80: WeatherCondition(description="Slight rain showers", icon_char="🌦️"),
    81: WeatherCondition(description="Moderate rain showers", icon_char="🌧️"),
    82: WeatherCondition(description="Violent rain showers", icon_char="🌧️"),
    85: WeatherCondition(description="Slight snow showers", icon_char="🌨️"),
    86: WeatherCondition(description="Heavy snow showers", icon_char="❄️"),
    95: WeatherCondition(description="Thunderstorm", icon_char="⛈️"),
    96: WeatherCondition(description="Thunderstorm with slight hail", icon_char="⛈️"),
    99: WeatherCondition(description="Thunderstorm with heavy hail", icon_char="⛈️"),
}