/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, type ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { 
  ArrowRight, 
  Search, 
  ChevronRight, 
  MapPin, 
  Mail, 
  Phone, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  CheckCircle2,
  Menu,
  X,
  Instagram,
  Facebook,
  Twitter,
  User,
  LogIn,
  LogOut,
  UserPlus,
  Key,
  Info,
  Wrench
} from "lucide-react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const MarkerWithInfoWindow = ({ location }: { location: PhysicalLocation, key?: string }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={location.position}
        onClick={() => setOpen(true)}
      >
        <div className={`p-2 rounded-full shadow-2xl transition-transform hover:scale-125 ${
          location.type === "Showroom" ? "bg-brand-gold text-black" : 
          location.type === "Charging Station" ? "bg-blue-500 text-white" : 
          "bg-purple-500 text-white"
        }`}>
          {location.type === "Showroom" ? <MapPin size={16} /> : 
           location.type === "Charging Station" ? <Zap size={16} /> : 
           <Wrench size={16} />}
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-1 min-w-48 text-black">
            <p className="text-[10px] uppercase tracking-widest text-brand-gold font-black mb-1">{location.type}</p>
            <h4 className="text-sm font-bold mb-1">{location.name}</h4>
            <p className="text-[10px] text-gray-600 mb-2">{location.address}</p>
            <div className={`text-[10px] font-bold inline-block px-2 py-0.5 rounded-full ${
              location.status === "Open" || location.status === "Operational" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            }`}>
              {location.status}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const NetworkMap = ({ locations, filterType }: { locations: PhysicalLocation[], filterType: string }) => {
  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white/5 border border-white/10 rounded-[2.5rem]">
        <MapPin size={48} className="text-brand-gold mb-6 opacity-20" />
        <h2 className="text-2xl font-bold mb-4">Google Maps API Key Required</h2>
        <p className="text-gray-400 max-w-md mb-8 text-sm">
          To enable interactive maps, please add your Google Maps API key to the environment secrets.
        </p>
        <div className="text-left space-y-4 bg-black/40 p-6 rounded-2xl border border-white/5 w-full max-w-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Quick Setup</p>
          <div className="space-y-3">
            <div className="flex gap-3 text-xs">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold">1</span>
              <p>Get a key from <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-brand-gold underline">Google Cloud Console</a></p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold">2</span>
              <p>Open <b>Settings</b> (⚙️ gear) → <b>Secrets</b></p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold">3</span>
              <p>Name: <code>GOOGLE_MAPS_PLATFORM_KEY</code></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredLocations = locations.filter(loc => filterType === "All" || loc.type === filterType);

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10">
        <Map
          defaultCenter={{ lat: 30, lng: 0 }}
          defaultZoom={2}
          mapId="e8c566085a544f80"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          theme="dark"
          mapTypeControl={false}
          streetViewControl={false}
        >
          {filteredLocations.map(loc => (
            <MarkerWithInfoWindow key={loc.id} location={loc} />
          ))}
        </Map>
      </div>
    </APIProvider>
  );
};

const specExplanations: Record<string, string> = {
  "Acceleration": "The time it takes to reach 60 mph from a standstill. Measured in seconds.",
  "0-60 mph": "The time it takes to reach 60 mph from a standstill. Measured in seconds.",
  "Top Speed": "Ultimate velocity achievable by the electric powertrain under optimal conditions.",
  "Power": "Combined output from front and rear drive units, calculated in peak horsepower.",
  "Range": "Estimated total driving distance on a full charge (WLTP cycle).",
  "Torque": "Instantaneous rotational force delivered by the electric motors.",
  "Weight": "Total curb mass including standard mechanical and battery systems.",
  "Wheelbase": "Longitudinal distance between the center points of the front and rear axles.",
  "Length": "Total physical footprint of the vehicle from front to rear edge."
};

const SpecTooltip = ({ label, children }: { label: string, children: ReactNode }) => {
  const [show, setShow] = useState(false);
  const explanation = specExplanations[label] || "Advanced engineering specification.";

  return (
    <div 
      className="relative group inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="flex items-center gap-1.5 cursor-help">
        {children}
        <Info size={10} className="text-gray-600 group-hover:text-brand-gold transition-colors" />
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-3 w-64 p-4 bg-brand-dark border border-white/10 rounded-2xl shadow-2xl z-[100] backdrop-blur-xl"
          >
            <p className="text-[10px] text-brand-gold uppercase tracking-widest font-black mb-2">{label}</p>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">{explanation}</p>
            <div className="absolute top-full left-4 -translate-y-1/2 border-8 border-transparent border-t-brand-dark"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type Page = "home" | "models" | "inventory" | "innovation" | "about" | "contact" | "build" | "garage" | "model-details" | "parts" | "network";

interface PhysicalLocation {
  id: string;
  name: string;
  type: "Showroom" | "Charging Station" | "Repair Facility";
  position: { lat: number; lng: number };
  address: string;
  status: "Open" | "Operational" | "Busy";
}

interface Part {
  id: string;
  name: string;
  category: "Performance" | "Exterior" | "Interior" | "Tech";
  price: string;
  image: string;
  compatibleWith: string[]; // Model IDs
  description: string;
}

interface Model {
  id: string;
  name: string;
  type: string;
  category: string;
  priceValue: number;
  price: string;
  image: string;
  gallery?: string[];
  specs: string[];
  description?: string;
  details: {
    acceleration: string;
    topSpeed: string;
    power: string;
    range?: string;
    weight: string;
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<any[]>([]);
  
  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterPartCategory, setFilterPartCategory] = useState<string>("All");
  const [filterCompatibleModel, setFilterCompatibleModel] = useState<string>("All");
  const [filterLocationType, setFilterLocationType] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Hero Background Slideshow
  const heroImages = [
    "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2674&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2564&auto=format&fit=crop"
  ];
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  useEffect(() => {
    if (currentPage === "home") {
      const timer = setInterval(() => {
        setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [currentPage, heroImages.length]);

  // Quick Search Home State
  const [homeSearch, setHomeSearch] = useState({ model: "", region: "", price: "All" });

  const regions = [
    "Miami Showroom",
    "Los Angeles Flagship",
    "New York Studio",
    "London Mayfair",
    "Tokyo Aoyama",
    "Monaco Port"
  ];
  
  // Auth State
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        fetchSavedData();
      }
    } catch (err) {
      console.error("Auth check failed");
    }
  };

  const fetchSavedData = async () => {
    try {
      const [configsRes, compsRes] = await Promise.all([
        fetch("/api/saved-configs"),
        fetch("/api/saved-comparisons")
      ]);
      if (configsRes.ok) {
        const data = await configsRes.json();
        setSavedConfigs(data.configs);
      }
      if (compsRes.ok) {
        const data = await compsRes.json();
        setSavedComparisons(data.comparisons);
      }
    } catch (err) {
      console.error("Data fetch failed");
    }
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    const endpoint = authMode === "login" ? "/api/login" : "/api/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (authMode === "login") {
        setUser(data.user);
        setAuthMode(null);
        fetchSavedData();
      } else {
        setAuthMode("login");
        setAuthError("Account created! Please login.");
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
  };

  const saveConfig = async (config: any) => {
    if (!user) {
      setAuthMode("login");
      return;
    }

    try {
      const res = await fetch("/api/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        alert("Configuration saved to your garage!");
        fetchSavedData();
      }
    } catch (err) {
      console.error("Save failed");
    }
  };

  const saveComparison = async () => {
    if (!user) {
      setAuthMode("login");
      return;
    }

    try {
      const res = await fetch("/api/save-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelIds: compareIds }),
      });
      if (res.ok) {
        alert("Comparison saved to your profile!");
        fetchSavedData();
      }
    } catch (err) {
      console.error("Save failed");
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { label: "Luxury Models", value: "80+" },
    { label: "Cars Delivered", value: "150K+" },
    { label: "Happy Drivers", value: "100K+" },
    { label: "Expert Rating", value: "4.9" },
  ];

  const parts: Part[] = [
    {
      id: "p1",
      name: "Carbon Ceramic Brake Kit",
      category: "Performance",
      price: "$12,500",
      image: "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?q=80&w=2670&auto=format&fit=crop",
      compatibleWith: ["apex", "aero"],
      description: "Ultimate thermal stability and stopping power for high-speed track sessions."
    },
    {
      id: "p2",
      name: "Forged Aero Wheels (21\")",
      category: "Exterior",
      price: "$8,200",
      image: "https://images.unsplash.com/photo-1551522435-a13afa10f103?q=80&w=2670&auto=format&fit=crop",
      compatibleWith: ["aero"],
      description: "Optimized for drag reduction and battery efficiency."
    },
    {
      id: "p3",
      name: "Alcantara Track Steering Wheel",
      category: "Interior",
      price: "$3,400",
      image: "https://images.unsplash.com/photo-1594732832278-abd644401426?q=80&w=2574&auto=format&fit=crop",
      compatibleWith: ["apex", "gt"],
      description: "Direct feedback and superior grip with integrated shift lights."
    },
    {
      id: "p4",
      name: "IM4 Neural Link Upgrade",
      category: "Tech",
      price: "$5,000",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop",
      compatibleWith: ["apex", "aero", "gt"],
      description: "Next-gen AI processing for enhanced autonomous capabilities."
    },
    {
      id: "p5",
      name: "Active Rear Diffuser",
      category: "Performance",
      price: "$4,800",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c34b?q=80&w=2574&auto=format&fit=crop",
      compatibleWith: ["apex"],
      description: "Dynamic downforce adjustment for aggressive cornering."
    }
  ];

  const locations: PhysicalLocation[] = [
    { id: "loc1", name: "Miami Design District", type: "Showroom", position: { lat: 25.8130, lng: -80.1917 }, address: "151 NE 41st St, Miami, FL", status: "Open" },
    { id: "loc2", name: "NYC Manhattan Studio", type: "Showroom", position: { lat: 40.7286, lng: -74.0084 }, address: "550 Washington St, New York, NY", status: "Open" },
    { id: "loc3", name: "LA Flagship", type: "Showroom", position: { lat: 34.0588, lng: -118.4201 }, address: "10250 Santa Monica Blvd, Los Angeles, CA", status: "Open" },
    { id: "loc4", name: "London Mayfair", type: "Showroom", position: { lat: 51.5100, lng: -0.1477 }, address: "Berkeley Square, London", status: "Open" },
    { id: "loc5", name: "Tokyo Aoyama", type: "Showroom", position: { lat: 35.6664, lng: 139.7132 }, address: "3-5-1 Kita-Aoyama, Tokyo", status: "Open" },
    { id: "loc6", name: "FastCharge Hub - Vegas", type: "Charging Station", position: { lat: 36.1699, lng: -115.1398 }, address: "Las Vegas Blvd", status: "Operational" },
    { id: "loc7", name: "MegaVolt - Chicago", type: "Charging Station", position: { lat: 41.8781, lng: -87.6298 }, address: "Michigan Ave, Chicago", status: "Operational" },
    { id: "loc8", name: "IMIV Service Center - SF", type: "Repair Facility", position: { lat: 37.7833, lng: -122.4167 }, address: "Folsom St, San Francisco", status: "Busy" },
    { id: "loc9", name: "IMIV Service Center - Berlin", type: "Repair Facility", position: { lat: 52.5200, lng: 13.4050 }, address: "Kurfürstendamm, Berlin", status: "Open" },
    { id: "loc10", name: "FastCharge Hub - Munich", type: "Charging Station", position: { lat: 48.1417, lng: 11.5772 }, address: "Odeonsplatz, Munich", status: "Operational" },
  ];

  const models: Model[] = [
    {
      id: "apex",
      name: "IMIV Apex",
      type: "IM4 Track Beast",
      category: "Performance",
      priceValue: 210000,
      price: "From $210,000",
      image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2670&auto=format&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1603584173870-7f3ca936813d?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2574&auto=format&fit=crop"
      ],
      description: "The Apex represents the pinnacle of IM4 engineering. A carbon-fiber monocoque housing a tri-motor electric system that redefines what a street-legal vehicle can achieve on the track.",
      specs: ["0-60 in 2.1s", "980 HP", "IM4 Carbon Frame"],
      details: {
        acceleration: "2.1s",
        topSpeed: "217 mph",
        power: "980 HP",
        weight: "1,450 kg"
      }
    },
    {
      id: "aero",
      name: "IMIV Aero",
      type: "IM4 Electric GT",
      category: "Grand Tourer",
      priceValue: 145000,
      price: "From $145,000",
      image: "https://images.unsplash.com/photo-1621259182978-f09e56bcc70a?q=80&w=2670&auto=format&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1621259182978-f09e56bcc70a?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1590362891175-306915354974?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2574&auto=format&fit=crop"
      ],
      description: "Silent, surgical, and sublime. The Aero is our masterclass in fluid dynamics, cutting through the air with a record-breaking 0.19 drag coefficient while offering a 420-mile electric sanctuary.",
      specs: ["420mi Range", "3.2s 0-60", "IM4 AI Driving"],
      details: {
        acceleration: "3.2s",
        topSpeed: "155 mph",
        power: "670 HP",
        range: "420 miles",
        weight: "2,100 kg"
      }
    },
    {
      id: "gt",
      name: "IMIV GT",
      type: "IM4 Modern Classic",
      category: "Classic",
      priceValue: 115000,
      price: "From $115,000",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2670&auto=format&fit=crop",
      gallery: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2670&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2574&auto=format&fit=crop"
      ],
      description: "For those who believe driving is an emotional pursuit. The GT pairs a high-performance Quad-Motor EV system with hand-stitched leather interiors, creating a grand touring experience without equal.",
      specs: ["Quad-Motor EV", "4.0s 0-60", "IM4 Luxury Interior"],
      details: {
        acceleration: "4.0s",
        topSpeed: "190 mph",
        power: "550 HP",
        weight: "1,850 kg"
      }
    }
  ];

  const toggleCompare = (id: string) => {
    setCompareIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const NavItem = ({ name, id }: { name: string; id: Page }) => (
    <button
      onClick={() => {
        setCurrentPage(id);
        setIsMenuOpen(false);
        window.scrollTo(0, 0);
      }}
      className={`px-6 py-2 rounded-full font-medium transition-all hover:bg-white/10 cursor-pointer ${
        currentPage === id ? "bg-white text-black" : "text-white"
      }`}
    >
      {name}
    </button>
  );

  const MobileNavItem = ({ name, id, index }: { name: string; id: Page; index: number }) => (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      onClick={() => {
        setCurrentPage(id);
        setIsMenuOpen(false);
        window.scrollTo(0, 0);
      }}
      className={`w-full text-left py-3 text-xl font-semibold transition-all border-b border-white/5 hover:pl-2 hover:text-brand-gold ${
        currentPage === id ? "text-brand-gold" : "text-white"
      }`}
    >
      {name}
    </motion.button>
  );

  return (
    <div className="bg-brand-dark text-white font-sans antialiased min-h-screen selection:bg-white selection:text-black">
      {/* Universal Header */}
      <header className={`fixed top-0 left-0 right-0 z-[100] w-full px-6 py-4 md:px-12 flex justify-between items-center transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-md pt-4 shadow-2xl" : "pt-8"}`}>
        <button onClick={() => setCurrentPage("home")} className="text-2xl font-bold tracking-tighter cursor-pointer flex items-center">
          IMIV
        </button>

        <nav className="hidden md:flex items-center space-x-1 glass-nav px-2 py-1.5 rounded-full">
          <NavItem id="home" name="Home" />
          <NavItem id="models" name="Models" />
          <NavItem id="inventory" name="Inventory" />
          <NavItem id="innovation" name="Innovation" />
          <NavItem id="parts" name="Parts" />
          <NavItem id="contact" name="Contact" />
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="hidden lg:flex items-center gap-3 glass-nav px-4 py-1.5 rounded-full">
              <button 
                onClick={() => setCurrentPage("garage")}
                className={`text-xs font-bold uppercase tracking-widest transition-colors ${currentPage === "garage" ? "text-brand-gold" : "text-gray-400 hover:text-white"}`}
              >
                {user.name}
              </button>
              <button 
                onClick={logout}
                className="text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setAuthMode("login")}
              className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              <User size={16} />
              Login
            </button>
          )}

          <button 
            onClick={() => {
              setCurrentPage("build");
              setIsMenuOpen(false);
              window.scrollTo(0, 0);
            }}
            className="hidden sm:block bg-white text-black px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-200 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            Build Yours
          </button>
          
          {!isMenuOpen && (
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-white glass-nav rounded-full hover:bg-white/10 transition-all z-[110]"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] md:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm z-[105] bg-brand-dark border-l border-white/10 p-6 pt-5 flex flex-col md:hidden shadow-2xl overflow-y-auto"
            >
              {/* Close Button Inside Sidebar */}
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-5 right-6 p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col gap-1 mt-0 pr-14">
                <MobileNavItem id="home" name="Home" index={0} />
                <MobileNavItem id="models" name="Models" index={1} />
                <MobileNavItem id="inventory" name="Inventory" index={2} />
                <MobileNavItem id="innovation" name="Innovation" index={3} />
                <MobileNavItem id="parts" name="Parts" index={4} />
                <MobileNavItem id="contact" name="Contact" index={5} />
                {user && <MobileNavItem id="garage" name="Garage" index={6} />}
                <div className="mt-8 border-t border-white/5 pt-8">
                  {user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                          <User size={20} className="text-brand-gold" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-widest uppercase">{user.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Premium Member</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setAuthMode("login");
                        setIsMenuOpen(false);
                      }}
                      className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-white font-bold"
                    >
                      <User size={20} />
                      Sign In
                    </button>
                  )}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => {
                    setCurrentPage("build");
                    setIsMenuOpen(false);
                    window.scrollTo(0, 0);
                  }}
                  className="mt-8 mb-8 w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  Build Yours <ArrowRight size={16} />
                </motion.button>
              </div>
              
              <div className="mt-auto pb-12 pt-8 flex gap-6 justify-center">
                 <Instagram className="text-gray-500 hover:text-white transition-colors cursor-pointer" />
                 <Twitter className="text-gray-500 hover:text-white transition-colors cursor-pointer" />
                 <Facebook className="text-gray-500 hover:text-white transition-colors cursor-pointer" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-[200] bg-black p-6 md:p-12 overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-6">
                  <h2 className="text-4xl md:text-5xl font-bold">Comparison</h2>
                  {user && compareIds.length > 0 && (
                    <button 
                      onClick={saveComparison}
                      className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-gold border border-brand-gold/20 px-4 py-2 rounded-full hover:bg-brand-gold hover:text-black transition-all"
                    >
                      <ShieldCheck size={14} />
                      Save Comparison
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowComparison(false)}
                  className="p-3 bg-white/10 rounded-full hover:bg-white text-white hover:text-black transition-all"
                >
                  <X size={32} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Labels Column (Hidden on mobile) */}
                <div className="hidden lg:block pt-32 space-y-12">
                  <div className="h-48" /> {/* offset for car image */}
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold border-b border-white/10 pb-4">Performance</div>
                  <div className="text-gray-400 font-medium">0-60 mph</div>
                  <div className="text-gray-400 font-medium">Top Speed</div>
                  <div className="text-gray-400 font-medium">Power</div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold border-b border-white/10 pb-4 mt-8">Engineering</div>
                  <div className="text-gray-400 font-medium">Weight</div>
                  <div className="text-gray-400 font-medium">Range</div>
                </div>

                {models.filter(m => compareIds.includes(m.id)).map(model => (
                  <div key={model.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 lg:p-8 relative">
                    <button 
                      onClick={() => toggleCompare(model.id)}
                      className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                    
                    <div className="mb-8">
                      <img src={model.image} className="w-full h-40 object-cover rounded-2xl mb-4" alt={model.name} />
                      <h4 className="text-2xl font-bold">{model.name}</h4>
                      <p className="text-brand-gold text-sm">{model.price}</p>
                    </div>

                    <div className="space-y-12">
                      <div className="hidden lg:block h-6" /> {/* Performance label spacer */}
                      <div className="flex flex-col gap-1 border-b border-white/5 pb-4 lg:border-none lg:pb-0">
                        <span className="lg:hidden text-[10px] text-gray-500 uppercase tracking-widest mb-1">0-60 mph</span>
                        <div className="text-xl font-bold">{model.details.acceleration}</div>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-white/5 pb-4 lg:border-none lg:pb-0">
                        <span className="lg:hidden text-[10px] text-gray-500 uppercase tracking-widest mb-1">Top Speed</span>
                        <div className="text-xl font-bold">{model.details.topSpeed}</div>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-white/5 pb-4 lg:border-none lg:pb-0">
                        <span className="lg:hidden text-[10px] text-gray-500 uppercase tracking-widest mb-1">Power</span>
                        <div className="text-xl font-bold">{model.details.power}</div>
                      </div>

                      <div className="hidden lg:block h-6" /> {/* Engineering label spacer */}
                      <div className="flex flex-col gap-1 border-b border-white/5 pb-4 lg:border-none lg:pb-0">
                        <span className="lg:hidden text-[10px] text-gray-500 uppercase tracking-widest mb-1">Weight</span>
                        <div className="text-xl font-bold">{model.details.weight}</div>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-white/5 pb-4 lg:border-none lg:pb-0">
                        <span className="lg:hidden text-[10px] text-gray-500 uppercase tracking-widest mb-1">Range</span>
                        <div className="text-xl font-bold">{model.details.range || "—"}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setCurrentPage("build");
                        setShowComparison(false);
                      }}
                      className="w-full mt-12 py-4 bg-white text-black font-bold rounded-xl active:scale-95 transition-all text-sm"
                    >
                      Configure This
                    </button>
                  </div>
                ))}

                {compareIds.length < 3 && (
                  <button 
                    onClick={() => {
                      setShowComparison(false);
                      setCurrentPage("models");
                    }}
                    className="flex flex-col items-center justify-center gap-4 bg-white/5 border border-dashed border-white/20 rounded-[2.5rem] p-12 text-gray-500 hover:text-white hover:border-white/40 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Search size={32} />
                    </div>
                    <p className="font-bold">Add Another Model</p>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl p-10 relative"
            >
              <button 
                onClick={() => setAuthMode(null)}
                className="absolute top-6 right-6 p-3 bg-white/5 rounded-full text-white/50 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {authMode === "login" ? <LogIn className="text-brand-gold" /> : <UserPlus className="text-brand-gold" />}
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  {authMode === "login" ? "Welcome Back" : "Join the Elite"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {authMode === "login" ? "Sign in to access your saved garage." : "Create an account to save configurations."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {authMode === "register" && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        required
                        type="text"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-brand-gold transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      required
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-brand-gold transition-colors"
                      placeholder="concierge@imiv.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      required
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-brand-gold transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {authError && (
                  <p className={`text-xs text-center py-2 ${authError.includes("created") ? "text-green-400" : "text-red-400"}`}>
                    {authError}
                  </p>
                )}

                <button 
                  disabled={isAuthLoading}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isAuthLoading ? "Processing..." : authMode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <div className="mt-8 text-center text-sm">
                <p className="text-gray-500">
                  {authMode === "login" ? "Don't have an account?" : "Already member?"}
                  <button 
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "register" : "login");
                      setAuthError("");
                    }}
                    className="text-brand-gold font-bold ml-2 underline underline-offset-4"
                  >
                    {authMode === "login" ? "Register Now" : "Login Here"}
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentPage === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen w-full flex flex-col"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentHeroImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <img
                    alt="Hero Slide"
                    className="w-full h-full object-cover"
                    src={heroImages[currentHeroImage]}
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 hero-gradient-overlay"></div>
            </div>

            <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 pt-40 pb-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-5xl mx-auto"
              >
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.1] text-shadow">
                  Drive the Future of <br />
                  Performance <span className="font-serif italic font-light">& Enjoy</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                  Experience the pinnacle of automotive engineering with our new 2024 lineup.
                  From electric grand tourers to high-performance track beasts.
                </p>
                <button 
                  onClick={() => setCurrentPage("models")}
                  className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl cursor-pointer"
                >
                  Explore Models
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </main>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12 mt-auto">
              {/* Search Bar Placeholder */}
              <div className="glass-panel p-2 rounded-2xl md:rounded-full mb-12 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div className="px-6 py-3 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Model Selection</label>
                    <select 
                      value={homeSearch.model}
                      onChange={(e) => setHomeSearch({ ...homeSearch, model: e.target.value })}
                      className="bg-transparent border-none p-0 focus:ring-0 text-white text-sm outline-none appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-brand-dark">All Models</option>
                      {models.map(m => (
                        <option key={m.id} value={m.name} className="bg-brand-dark">{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="px-6 py-3 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Region</label>
                    <select 
                      value={homeSearch.region}
                      onChange={(e) => setHomeSearch({ ...homeSearch, region: e.target.value })}
                      className="bg-transparent border-none p-0 focus:ring-0 text-white text-sm outline-none appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-brand-dark">Select showroom...</option>
                      {regions.map(r => (
                        <option key={r} value={r} className="bg-brand-dark">{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="px-6 py-3 flex flex-col">
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Price Range</label>
                    <select 
                      value={homeSearch.price}
                      onChange={(e) => setHomeSearch({ ...homeSearch, price: e.target.value })}
                      className="bg-transparent border-none p-0 focus:ring-0 text-white text-sm outline-none appearance-none cursor-pointer"
                    >
                      <option value="All" className="bg-brand-dark">All Ranges</option>
                      <option value="150000" className="bg-brand-dark">Under $150k</option>
                      <option value="200000" className="bg-brand-dark">Under $200k</option>
                      <option value="300000" className="bg-brand-dark">Under $300k</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end p-1">
                    <button 
                      onClick={() => {
                        if (homeSearch.model) setSearchQuery(homeSearch.model);
                        if (homeSearch.price !== "All") setMaxPrice(parseInt(homeSearch.price));
                        setCurrentPage("models");
                        window.scrollTo(0, 0);
                      }}
                      className="bg-white text-black h-full w-full py-3 md:py-0 rounded-xl md:rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-sm mr-2">Search Models</span>
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-4 px-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center md:text-left">
                    <div className="text-2xl md:text-3xl font-bold uppercase">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === "models" && (
          <motion.div
            key="models"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <h2 className="text-5xl md:text-6xl font-bold mb-4">IM4 Lineup</h2>
                <p className="text-gray-400 max-w-2xl text-lg">Every IMIV is an expression of IM4 precision, speed, and luxury. Our strictly electric series redefines performance for the modern era.</p>
              </div>
              {compareIds.length > 0 && (
                <button 
                  onClick={() => setShowComparison(true)}
                  className="bg-brand-gold text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-xl active:scale-95"
                >
                  Compare ({compareIds.length})
                  <ArrowRight size={18} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-8 mb-16 p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Search & Category</p>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text"
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-brand-gold transition-colors text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Performance", "Grand Tourer", "Classic"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${
                          filterCategory === cat 
                            ? "bg-white text-black border-white" 
                            : "bg-transparent text-gray-400 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-72">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Max Price</p>
                  <p className="text-sm font-bold text-brand-gold">${maxPrice.toLocaleString()}</p>
                </div>
                <input 
                  type="range"
                  min="100000"
                  max="300000"
                  step="5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                />
                <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  <span>$100k</span>
                  <span>$300k+</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {models
                .filter(m => 
                  (filterCategory === "All" || m.category === filterCategory) && 
                  m.priceValue <= maxPrice &&
                  (m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   m.type.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-500 text-lg mb-4">No models match your current search or filters.</p>
                    <button 
                      onClick={() => {
                        setFilterCategory("All");
                        setMaxPrice(300000);
                        setSearchQuery("");
                      }}
                      className="text-brand-gold font-bold uppercase tracking-widest text-xs underline underline-offset-4"
                    >
                      Reset All
                    </button>
                  </div>
                ) : (
                  models
                    .filter(m => 
                      (filterCategory === "All" || m.category === filterCategory) && 
                      m.priceValue <= maxPrice &&
                      (m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       m.type.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((model, i) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={model.id}
                        className={`group relative overflow-hidden rounded-3xl bg-white/5 border transition-all p-4 ${
                          compareIds.includes(model.id) ? "border-brand-gold ring-1 ring-brand-gold" : "border-white/10 hover:border-white/20"
                        }`}
                      >
                  <div className="w-full h-64 md:h-72 lg:h-80 overflow-hidden rounded-2xl mb-6 relative">
                    <img 
                      src={model.image} 
                      alt={model.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer" 
                      onClick={() => {
                        setSelectedModelId(model.id);
                        setCurrentPage("model-details");
                        window.scrollTo(0, 0);
                      }}
                    />
                    <button 
                      onClick={() => toggleCompare(model.id)}
                      className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
                        compareIds.includes(model.id) ? "bg-brand-gold text-black" : "bg-black/40 text-white hover:bg-black/60"
                      }`}
                    >
                      {compareIds.includes(model.id) ? <CheckCircle2 size={20} /> : <Search size={20} className="scale-75" />}
                    </button>
                  </div>
                  <div className="px-2 pb-4">
                    <div className="flex justify-between items-start mb-2 text-left">
                      <div 
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedModelId(model.id);
                          setCurrentPage("model-details");
                          window.scrollTo(0, 0);
                        }}
                      >
                        <h3 className="text-2xl font-bold">{model.name}</h3>
                        <p className="text-brand-gold font-medium text-sm">{model.type}</p>
                      </div>
                      <p className="font-mono text-sm text-gray-400">{model.price}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {model.specs.map(spec => (
                        <span key={spec} className="text-[9px] px-2.5 py-1 bg-white/10 rounded-full text-gray-300 uppercase tracking-widest">{spec}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-8">
                      <button 
                        onClick={() => toggleCompare(model.id)}
                        className={`py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          compareIds.includes(model.id) ? "bg-brand-gold text-black" : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {compareIds.includes(model.id) ? "Selected" : "Add to Compare"}
                      </button>
                      <button 
                        onClick={() => setCurrentPage("build")}
                        className="py-3.5 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer text-sm"
                      >
                        Configure <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
                    )))}
            </div>
          </motion.div>
        )}

        {currentPage === "inventory" && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
              <div>
                <h2 className="text-5xl font-bold mb-4">Available Now</h2>
                <p className="text-gray-400">Immediate delivery for selected configurations.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="px-6 py-3 glass-nav rounded-full flex items-center gap-3">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input className="bg-transparent border-none p-0 focus:ring-0 text-sm outline-none" placeholder="Search VIN or Specs..." />
                </div>
                <div className="px-6 py-3 glass-nav rounded-full flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <select 
                    className="bg-transparent border-none p-0 focus:ring-0 text-sm outline-none text-white appearance-none cursor-pointer pr-4"
                  >
                    <option className="bg-brand-dark">All Regions</option>
                    {regions.map(r => (
                      <option key={r} value={r} className="bg-brand-dark">{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-6 px-4 text-xs uppercase tracking-widest text-gray-500">Vehicle</th>
                    <th className="py-6 px-4 text-xs uppercase tracking-widest text-gray-500">Status</th>
                    <th className="py-6 px-4 text-xs uppercase tracking-widest text-gray-500">Location</th>
                    <th className="py-6 px-4 text-xs uppercase tracking-widest text-gray-500">Price</th>
                    <th className="py-6 px-4 text-xs uppercase tracking-widest text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <tr key={item} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="py-8 px-4">
                        <div className="flex items-center gap-4">
                          <img src={models[item % 3].image} className="w-16 h-16 rounded-xl object-cover" />
                          <div>
                            <div className="font-bold text-lg">{models[item % 3].name}</div>
                            <div className="text-xs text-gray-500">VIN: IM4-2024-{(9382 + item).toString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-8 px-4">
                        <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          In Transit
                        </span>
                      </td>
                      <td className="py-8 px-4 text-gray-300">Miami Showroom</td>
                      <td className="py-8 px-4 font-mono">${(120000 + item * 10000).toLocaleString()}</td>
                      <td className="py-8 px-4 text-right">
                        <button className="px-6 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all font-medium text-sm cursor-pointer">
                          Inquire
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {currentPage === "innovation" && (
          <motion.div
            key="innovation"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-brand-gold font-bold tracking-widest uppercase text-xs mb-4 block">Future Forward</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">Beyond Engineering.<br/>Pure Artistry.</h2>
                <div className="space-y-8 lg:space-y-12">
                  <div className="flex gap-6">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Zap className="text-brand-gold w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">E-Pulse Powertrain</h4>
                      <p className="text-gray-400 text-sm lg:text-base">Our signature solid-state battery technology delivers 400 miles of range in just 10 minutes of charging.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Cpu className="text-brand-gold w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">IM4 OS</h4>
                      <p className="text-gray-400 text-sm lg:text-base">A quantum-processor based operating system that predicts your driving needs with millisecond precision.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="text-brand-gold w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">Titanium Safety Cell</h4>
                      <p className="text-gray-400 text-sm lg:text-base">Aerospace-grade materials provide a 5-star safety rating even at top performance speeds.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-12 lg:mt-0">
                <div className="aspect-[4/5] md:aspect-video lg:aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/20">
                  <img src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2574&auto=format&fit=crop" className="w-full h-full object-cover" alt="Innovation" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-8 p-6 md:p-8 glass-panel rounded-3xl border border-white/10 max-w-[220px] md:max-w-[280px]">
                  <p className="text-2xl md:text-3xl font-bold mb-2">0.19 cd</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Lowest drag coefficient in class history</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === "about" && (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-32 pb-20 px-6 min-h-screen"
          >
            <div className="max-w-4xl mx-auto text-center mb-24">
              <h2 className="text-7xl font-bold mb-8">IM4: Luxury Since 1994.</h2>
              <p className="text-xl text-gray-400 leading-relaxed">IMIV was born from a singular obsession: to fuse the raw thrill of high-performance racing with the uncompromising refinement of luxury grand touring.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto mb-32">
              <div className="h-[600px] rounded-3xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2566&auto=format&fit=crop" className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-rows-2 gap-4">
                <div className="rounded-3xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1542362567-b05500269774?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white/5 rounded-3xl p-12 flex flex-col justify-end border border-white/10">
                  <h3 className="text-3xl font-bold mb-4">Sustainability</h3>
                  <p className="text-gray-400">We aim to be completely carbon-neutral across our entire manufacturing chain by 2030, without sacrificing an ounce of performance.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === "contact" && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
              <div>
                <h2 className="text-6xl font-bold mb-8">Let's Connect.</h2>
                <div className="space-y-8 mb-12">
                  <div className="flex items-center gap-4 text-gray-300">
                    <MapPin className="text-brand-gold" />
                    <span>IM4 Complex, Silicon Valley, CA 94025</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300">
                    <Mail className="text-brand-gold" />
                    <span>concierge@imiv.com</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300">
                    <Phone className="text-brand-gold" />
                    <span>+1 (800) LUM-INA0</span>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer">
                    <Instagram size={20} />
                  </button>
                  <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer">
                    <Twitter size={20} />
                  </button>
                  <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer">
                    <Facebook size={20} />
                  </button>
                </div>
              </div>

              <div className="glass-panel p-10 rounded-[2.5rem] border border-white/10">
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">First Name</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Last Name</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Email Address</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Message</label>
                    <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors" />
                  </div>
                  <button className="w-full py-4 bg-brand-gold text-black font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
                    Send Inquiry
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === "model-details" && selectedModelId && (
          <motion.div
            key="model-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            {(() => {
              const model = models.find(m => m.id === selectedModelId);
              if (!model) return null;
              return (
                <div className="space-y-20">
                  <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="w-full lg:w-1/2">
                      <button 
                        onClick={() => setCurrentPage("models")}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 uppercase text-xs tracking-widest font-bold"
                      >
                        <ChevronRight className="rotate-180 w-4 h-4" /> Back to Lineup
                      </button>
                      <h2 className="text-6xl font-bold mb-4">{model.name}</h2>
                      <p className="text-brand-gold text-xl font-medium mb-8">{model.type}</p>
                      <p className="text-gray-400 text-lg leading-relaxed max-w-xl mb-12">
                        {model.description}
                      </p>

                      <div className="grid grid-cols-2 gap-8 mb-12">
                        <div>
                          <SpecTooltip label="Acceleration">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Acceleration</p>
                          </SpecTooltip>
                          <p className="text-3xl font-bold mt-2">{model.details.acceleration}</p>
                        </div>
                        <div>
                          <SpecTooltip label="Top Speed">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Top Speed</p>
                          </SpecTooltip>
                          <p className="text-3xl font-bold mt-2">{model.details.topSpeed}</p>
                        </div>
                        <div>
                          <SpecTooltip label="Power">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Power</p>
                          </SpecTooltip>
                          <p className="text-3xl font-bold mt-2">{model.details.power}</p>
                        </div>
                        <div>
                          <SpecTooltip label="Range">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Range</p>
                          </SpecTooltip>
                          <p className="text-3xl font-bold mt-2">{model.details.range || "—"}</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setCurrentPage("build")}
                          className="px-10 py-4 bg-white text-black font-black uppercase text-sm tracking-widest rounded-xl hover:bg-brand-gold transition-all"
                        >
                          Configure Build
                        </button>
                        <button 
                          onClick={() => {
                            if (!compareIds.includes(model.id)) {
                              toggleCompare(model.id);
                            }
                            setShowComparison(true);
                          }}
                          className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-white/10 transition-all"
                        >
                          Add to Compare
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <img src={model.image} className="w-full h-96 object-cover rounded-[2.5rem] border border-white/10" alt={model.name} />
                      </div>
                      {model.gallery?.slice(1).map((img, idx) => (
                        <div key={idx} className="h-48 overflow-hidden rounded-[1.5rem] border border-white/10">
                          <img src={img} className="w-full h-full object-cover" alt={`${model.name} view ${idx + 2}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-20">
                    <h3 className="text-2xl font-bold mb-12 uppercase tracking-tighter">Full Engineering Specs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                      <div className="space-y-4">
                        <h4 className="text-xs text-brand-gold font-bold uppercase tracking-widest">Performance</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                          <li className="flex justify-between items-center group">
                            <SpecTooltip label="0-60 mph">
                              <span>0-60 mph</span>
                            </SpecTooltip>
                            <span className="text-white">{model.details.acceleration}</span>
                          </li>
                          <li className="flex justify-between items-center group">
                            <SpecTooltip label="Top Speed">
                              <span>Top Speed</span>
                            </SpecTooltip>
                            <span className="text-white">{model.details.topSpeed}</span>
                          </li>
                          <li className="flex justify-between items-center group">
                            <SpecTooltip label="Torque">
                              <span>Torque</span>
                            </SpecTooltip>
                            <span className="text-white">850 lb-ft</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs text-brand-gold font-bold uppercase tracking-widest">Dimensions</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                          <li className="flex justify-between items-center group">
                            <SpecTooltip label="Weight">
                              <span>Weight</span>
                            </SpecTooltip>
                            <span className="text-white">{model.details.weight}</span>
                          </li>
                          <li className="flex justify-between items-center group">
                            <SpecTooltip label="Wheelbase">
                              <span>Wheelbase</span>
                            </SpecTooltip>
                            <span className="text-white">2,850 mm</span>
                          </li>
                          <li className="flex justify-between items-center group">
                            <SpecTooltip label="Length">
                              <span>Length</span>
                            </SpecTooltip>
                            <span className="text-white">4,650 mm</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {currentPage === "parts" && (
          <motion.div
            key="parts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <h2 className="text-5xl md:text-6xl font-bold mb-4">Official Parts</h2>
                <p className="text-gray-400 max-w-2xl text-lg">
                  Genuine IM4 components and performance modifications designed specifically for our all-electric architecture.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-8 mb-16 p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Part Search & Filter</p>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text"
                      placeholder="Search parts (e.g. wheels, brakes)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-brand-gold transition-colors text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Performance", "Exterior", "Interior", "Tech"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterPartCategory(cat)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${
                          filterPartCategory === cat 
                            ? "bg-white text-black border-white" 
                            : "bg-transparent text-gray-400 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-72">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4">Compatible Model</p>
                <select 
                  value={filterCompatibleModel}
                  onChange={(e) => setFilterCompatibleModel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors text-sm text-white appearance-none cursor-pointer"
                >
                  <option value="All" className="bg-brand-dark">Show All Models</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id} className="bg-brand-dark">{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {parts
                .filter(p => 
                  (filterPartCategory === "All" || p.category === filterPartCategory) &&
                  (filterCompatibleModel === "All" || p.compatibleWith.includes(filterCompatibleModel)) &&
                  (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-500 text-lg mb-4">No parts match your search or filters.</p>
                    <button 
                      onClick={() => {
                        setFilterPartCategory("All");
                        setFilterCompatibleModel("All");
                        setSearchQuery("");
                      }}
                      className="text-brand-gold font-bold uppercase tracking-widest text-xs underline underline-offset-4"
                    >
                      Reset All
                    </button>
                  </div>
                ) : (
                  parts
                    .filter(p => 
                      (filterPartCategory === "All" || p.category === filterPartCategory) &&
                      (filterCompatibleModel === "All" || p.compatibleWith.includes(filterCompatibleModel)) &&
                      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((part, i) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={part.id}
                        className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col h-full"
                      >
                        <div className="w-full h-48 overflow-hidden rounded-2xl mb-6">
                          <img src={part.image} alt={part.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-bold">{part.name}</h3>
                              <p className="text-brand-gold font-medium text-xs uppercase tracking-widest mt-1">{part.category}</p>
                            </div>
                            <span className="text-lg font-bold">{part.price}</span>
                          </div>
                          <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                            {part.description}
                          </p>
                        </div>
                        
                        <div className="mt-auto space-y-4">
                          <div className="pt-4 border-t border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Compatible With:</p>
                            <div className="flex flex-wrap gap-2">
                              {part.compatibleWith.map(modelId => {
                                const m = models.find(mod => mod.id === modelId);
                                return (
                                  <span key={modelId} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-gray-300">
                                    {m ? m.name : modelId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <button className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-brand-gold transition-all">
                            Add to Order
                          </button>
                        </div>
                      </motion.div>
                    ))
                )}
            </div>
          </motion.div>
        )}

        {currentPage === "network" && (
          <motion.div
            key="network"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <h2 className="text-5xl md:text-6xl font-bold mb-4">Global Network</h2>
                <p className="text-gray-400 max-w-2xl text-lg">
                  Find showrooms, ultra-fast charging hubs, and certified IMIV repair facilities across the globe.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Filters */}
              <div className="space-y-8">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-6">Filter Locations</h3>
                  <div className="space-y-3">
                    {["All", "Showroom", "Charging Station", "Repair Facility"].map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterLocationType(type)}
                        className={`w-full px-6 py-3 rounded-xl text-sm font-bold transition-all border text-left flex items-center justify-between ${
                          filterLocationType === type 
                            ? "bg-white text-black border-white" 
                            : "bg-transparent text-gray-400 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {type}
                        {filterLocationType === type && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                  <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-6">Recent Activity</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-2 h-2 mt-2 rounded-full bg-brand-gold animate-pulse" />
                      <div>
                        <p className="text-sm font-bold">New Hub Open</p>
                        <p className="text-xs text-gray-400">Berlin service center is now fully operational.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-bold">Maintenance Notice</p>
                        <p className="text-xs text-gray-400">Scheduled upgrades for Miami charging stations.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Interface */}
              <div className="lg:col-span-3 space-y-8">
                <div className="relative aspect-[16/9] bg-zinc-900 rounded-[2.5rem] border border-white/10 overflow-hidden group">
                  <NetworkMap locations={locations} filterType={filterLocationType} />
                  
                  <div className="absolute bottom-6 right-6 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col gap-4 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-brand-gold" /> Showrooms
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500" /> Charging
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-purple-500" /> Service
                    </div>
                  </div>
                </div>

                {/* List View of Filtered Locations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {locations
                    .filter(loc => filterLocationType === "All" || loc.type === filterLocationType)
                    .map(loc => (
                      <div key={loc.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-white/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            loc.type === "Showroom" ? "bg-brand-gold/10 text-brand-gold" : 
                            loc.type === "Charging Station" ? "bg-blue-500/10 text-blue-500" : 
                            "bg-purple-500/10 text-purple-500"
                          }`}>
                            {loc.type === "Showroom" ? <MapPin size={20} /> : 
                             loc.type === "Charging Station" ? <Zap size={20} /> : 
                             <Wrench size={20} />}
                          </div>
                          <div>
                            <h4 className="font-bold">{loc.name}</h4>
                            <p className="text-xs text-gray-500">{loc.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-green-500 mb-1">{loc.status}</p>
                          <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform ml-auto" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === "garage" && (
          <motion.div
            key="garage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen"
          >
            <div className="mb-16">
              <h2 className="text-5xl font-bold mb-4">Your Garage</h2>
              <p className="text-gray-400">Manage your saved configurations and vehicle comparisons.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-xl font-bold uppercase tracking-widest text-brand-gold flex items-center gap-3">
                  <ChevronRight size={20} />
                  Saved Builds
                </h3>
                {savedConfigs.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center text-gray-500">
                    No saved builds yet. Explore models to start configuring.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedConfigs.map(config => (
                      <div key={config.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center group">
                        <div>
                          <h4 className="font-bold text-lg">{config.model}</h4>
                          <p className="text-xs text-gray-500 uppercase tracking-widest">{config.color} • {config.wheels}</p>
                        </div>
                        <button className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                          View Build
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <h3 className="text-xl font-bold uppercase tracking-widest text-brand-gold flex items-center gap-3">
                  <ChevronRight size={20} />
                  Saved Comparisons
                </h3>
                {savedComparisons.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center text-gray-500">
                    No saved comparisons yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedComparisons.map(comp => (
                      <div key={comp.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center group">
                        <div>
                          <h4 className="font-bold text-lg">{comp.modelIds.join(" vs ")}</h4>
                          <p className="text-xs text-gray-500 uppercase tracking-widest">
                            {new Date(comp.date).toLocaleDateString()}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setCompareIds(comp.modelIds);
                            setShowComparison(true);
                          }}
                          className="text-xs font-bold uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors"
                        >
                          Relaunch
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === "build" && (
          <motion.div
            key="configurator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-24 min-h-screen bg-black"
          >
            <div className="h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-4">
              <div className="lg:col-span-3 relative flex items-center justify-center bg-zinc-950 px-10 overflow-hidden">
                <motion.div 
                  layoutId="car-preview"
                  className="w-full max-w-5xl"
                  key={selectedModelId || "apex"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <img 
                    src={models.find(m => m.id === (selectedModelId || "apex"))?.image} 
                    className="w-full aspect-video object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
                    alt="Preview" 
                  />
                </motion.div>
                
                <div className="absolute bottom-10 left-10 flex gap-4">
                  <div className="p-4 glass-panel rounded-2xl border border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Price Est.</p>
                    <p className="text-2xl font-bold">$214,500</p>
                  </div>
                  <div className="p-4 glass-panel rounded-2xl border border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Delivery</p>
                    <p className="text-2xl font-bold">Aug 2024</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border-l border-white/10 p-8 overflow-y-auto">
                <div className="mb-12">
                  <h3 className="text-2xl font-bold mb-6">Start Your Build</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Select Model</label>
                      <select 
                        value={selectedModelId || "apex"}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors text-sm text-white appearance-none cursor-pointer"
                      >
                        {models.map(m => (
                          <option key={m.id} value={m.id} className="bg-brand-dark">{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Delivery Region</label>
                      <select 
                        value={homeSearch.region}
                        onChange={(e) => setHomeSearch({ ...homeSearch, region: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors text-sm text-white appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-brand-dark">Select closest showroom...</option>
                        {regions.map(r => (
                          <option key={r} value={r} className="bg-brand-dark">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <label className="text-xs uppercase tracking-tighter text-gray-400 font-bold mb-4 block">Exterior Color</label>
                    <div className="flex gap-4">
                      {["bg-blue-600", "bg-red-600", "bg-zinc-800", "bg-brand-gold", "bg-white"].map(color => (
                        <button key={color} className={`w-10 h-10 rounded-full ${color} border-2 border-transparent hover:border-white transition-all cursor-pointer shadow-xl`} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-tighter text-gray-400 font-bold mb-4 block">Wheel Selection</label>
                    <div className="space-y-4">
                      <button className="w-full p-4 rounded-xl bg-white/5 border border-brand-gold flex items-center justify-between group cursor-pointer">
                        <span className="text-sm font-medium">21" Apex Titanium</span>
                        <CheckCircle2 size={16} className="text-brand-gold" />
                      </button>
                      <button className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between hover:border-white/20 cursor-pointer">
                        <span className="text-sm font-medium text-gray-400">22" Aero Discs (Black)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-tighter text-gray-400 font-bold mb-4 block">Interior Theme</label>
                    <div className="space-y-4">
                      <button className="w-full p-4 rounded-xl bg-white text-black flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold">Noir Edition</span>
                        <CheckCircle2 size={16} />
                      </button>
                      <button className="w-full p-4 rounded-xl bg-black border border-white/10 flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-medium text-gray-400">Terra Cotta Alcantara</span>
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => saveConfig({ model: "Apex", color: "Titanium", wheels: "21-inch" })}
                    className="w-full py-5 bg-white text-black font-black uppercase text-sm tracking-widest rounded-xl hover:bg-brand-gold transition-all mt-12 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    Confirm Build <ChevronRight size={18} />
                  </button>
                  {user && (
                    <button 
                      onClick={() => saveConfig({ model: "Apex", color: "Titanium", wheels: "21-inch" })}
                      className="w-full py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                    >
                      Save to Garage
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Footer */}
      <footer className="bg-black py-10 border-t border-white/5 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-3xl font-bold tracking-tighter mb-4">IMIV</h3>
            <p className="text-gray-500 max-w-sm mx-auto md:mx-0">Driving the evolution of luxury through high-performance engineering and sustainable innovation.</p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">Experience</h4>
            <ul className="space-y-3 text-gray-500 text-sm">
              <li><button onClick={() => setCurrentPage("models")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Test Drive</button></li>
              <li><button onClick={() => setCurrentPage("inventory")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Showrooms</button></li>
              <li><button onClick={() => setCurrentPage("build")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Pre-order</button></li>
              <li><button onClick={() => setCurrentPage("contact")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Ownership</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">Corporate</h4>
            <ul className="space-y-3 text-gray-500 text-sm">
              <li><button onClick={() => setCurrentPage("about")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">About IMIV</button></li>
              <li><button onClick={() => setCurrentPage("network")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Global Network</button></li>
              <li><button onClick={() => setCurrentPage("innovation")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Motorsport</button></li>
              <li><button onClick={() => setCurrentPage("home")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Investor Relations</button></li>
              <li><button onClick={() => setCurrentPage("home")} className="hover:text-white transition-colors cursor-pointer outline-none block w-full md:inline md:w-auto">Global Press</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 mt-10">
          <p className="text-gray-600 text-xs uppercase tracking-widest">© 2024 IMIV INTERNATIONAL CORP.</p>
          <div className="flex gap-8 text-gray-600 text-xs uppercase tracking-widest">
            <button className="hover:text-white transition-colors cursor-pointer outline-none">Privacy</button>
            <button className="hover:text-white transition-colors cursor-pointer outline-none">Terms</button>
            <button className="hover:text-white transition-colors cursor-pointer outline-none">Cookie Policy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
