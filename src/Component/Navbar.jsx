import {
  Search,
  MapPin,
  Smartphone,
  ShieldAlert,
  Pill,
  Store,
  Upload,
  Bot,
  BookOpen,
  ChevronDown,
  House
} from "lucide-react";
import logo from "../assets/logo.png";
import { useAppContext } from "../Context/AppContext.jsx";

export default function Navbar() {
  const { handleNavigation } = useAppContext();

  return (
    <nav className="w-full bg-white border-b border-slate-200">
      {/* Top Navbar */}
      <div className="max-w-400 mx-auto px-6 py-5 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation("/")}>
        
                  <div className="w-14 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                    <img
                    src={logo}
                    alt="NearMyMed Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
        
                <div>
                  <h2 className="text-2xl font-bold">
                    Near<span className="text-emerald-600">MyMed</span>
                  </h2>
                </div>
        
            </div>

        {/* Location */}
        <div className="hidden lg:flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl bg-white hover:border-emerald-300 transition cursor-pointer">
          <MapPin size={18} className="text-emerald-600" />

          <span className="font-medium text-slate-700">
            New Delhi
          </span>

          <ChevronDown size={16} className="text-slate-500" />
        </div>

        {/* Search */}
        <div className="flex-1">
          <div className="flex items-center border border-slate-200 rounded-2xl px-5 py-3 bg-white shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-500 transition">
            <Search size={18} className="text-slate-400" />

            <input
              type="text"
              placeholder="Search medicine, disease, or pharmacy..."
              className="flex-1 px-3 bg-transparent outline-none text-slate-700"
            />

            <kbd className="hidden md:flex px-2 py-1 text-xs bg-slate-100 rounded-lg text-slate-500 border">
              ⌘ K
            </kbd>
          </div>
        </div>

        {/* Download App */}
        <button className="hidden lg:flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition font-medium">
          <Smartphone size={18} />
          Download App
        </button>

        {/* Login */}
        <button className="px-5 py-3 rounded-xl border border-emerald-600 text-emerald-600 font-semibold hover:bg-emerald-600 hover:text-white transition">
          Login / Sign Up
        </button>
      </div>

      {/* Bottom Menu */}
      <div className="border-t border-slate-100">
        <div className="max-w-400 mx-auto px-6">
          <div className="flex items-center gap-10 text-sm font-medium">
            {/* Home */}
            <div className="group relative py-4">
              <button
                onClick={() => handleNavigation("/")}
                className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition"
              >
                <House size={17} />
                Home
              </button>

              <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-emerald-600 rounded-full transition-all duration-300 group-hover:w-full"></div>
            </div>
            
            {/* Find Medicines */}
            <div className="group relative py-4">
              <button
                onClick={() => handleNavigation("/find-medicines")}
                className="flex items-center gap-2 text-emerald-600"
              >
                <Pill size={17} />
                Find Medicines
              </button>

              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-emerald-600 rounded-full"></div>
            </div>

            {/* Nearby Pharmacies */}
            <div className="group relative py-4">
              <button className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition">
                <Store size={17} />
                Nearby Pharmacies
              </button>

              <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-emerald-600 rounded-full transition-all duration-300 group-hover:w-full"></div>
            </div>

            {/* Upload Prescription */}
            <div className="group relative py-4">
              <button className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition">
                <Upload size={17} />
                Upload Prescription
              </button>

              <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-emerald-600 rounded-full transition-all duration-300 group-hover:w-full"></div>
            </div>

            {/* AI Assistant */}
            <div className="group relative py-4">
              <button
                onClick={() => handleNavigation("/ai-assistant")}
                className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition"
              >
                <Bot size={17} />
                AI Assistant
              </button>

              <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-emerald-600 rounded-full transition-all duration-300 group-hover:w-full"></div>
            </div>

            {/* Health Library */}
            <div className="group relative py-4">
              <button className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition">
                <BookOpen size={17} />
                Health Library
              </button>

              <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-emerald-600 rounded-full transition-all duration-300 group-hover:w-full"></div>
            </div>

            {/* Emergency */}
            <div className="group relative py-4 ml-auto">
              <button className="flex items-center gap-2 text-red-500 font-semibold hover:text-red-600 transition">
                <ShieldAlert size={17} />
                Emergency
              </button>

              <div className="absolute bottom-0 left-0 w-0 h-[3px] bg-red-500 rounded-full transition-all duration-300 group-hover:w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}