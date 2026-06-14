import { useState, useRef, useEffect } from "react";

// ── User location (Bhopal city centre as origin) ──────────────────────────────
const USER = { lat: 23.2599, lng: 77.4126 };

const MEDICINE_SUGGESTIONS = [
  "Paracetamol 500mg","Paracetamol 650mg","Dolo 650","Crocin","Aspirin 75mg",
  "Ibuprofen 400mg","Pantoprazole 40mg","Azithromycin 500mg","Amoxicillin 500mg",
  "Cetirizine 10mg","Metformin 500mg","Atorvastatin 10mg","Omeprazole 20mg",
  "Vitamin D3","Vitamin B12","Calcium Carbonate","Montelukast 10mg",
  "Amlodipine 5mg","Losartan 50mg","Ciprofloxacin 500mg",
];

// Each pharmacy has real lat/lng so we can compute actual inter-pharmacy distance
const PHARMACIES = [
  { id:1, name:"MedPlus Pharmacy",    address:"Shop 12, Arera Colony, Bhopal",   lat:23.2489, lng:77.4012, open:true,  rating:4.5, icon:"🏥" },
  { id:2, name:"Apollo Pharmacy",     address:"MP Nagar Zone II, Bhopal",         lat:23.2331, lng:77.4272, open:true,  rating:4.7, icon:"💊" },
  { id:3, name:"City Medical Store",  address:"New Market, T.T. Nagar, Bhopal",  lat:23.2686, lng:77.4008, open:true,  rating:4.2, icon:"🏪" },
  { id:4, name:"Jan Aushadhi Kendra", address:"Habibganj, Bhopal",                lat:23.2311, lng:77.4340, open:false, rating:4.0, icon:"🌿" },
  { id:5, name:"LifeCare Pharmacy",   address:"Kolar Road, Bhopal",               lat:23.2104, lng:77.4680, open:true,  rating:4.3, icon:"❤️" },
];

// ── Haversine distance (km) between two lat/lng points ────────────────────────
function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))).toFixed(2));
}

// ── Route cost: User→P1→P2→…→User (round trip through ordered stops) ─────────
function routeCost(pharmacyList) {
  const stops = [USER, ...pharmacyList, USER];
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) total += haversine(stops[i], stops[i + 1]);
  return parseFloat(total.toFixed(2));
}

// ── Optimal stop order for a combo (TSP nearest-neighbour for ≤3 stops) ──────
function bestOrder(pharmacies) {
  if (pharmacies.length === 1) return pharmacies;
  if (pharmacies.length === 2) {
    const ab = routeCost([pharmacies[0], pharmacies[1]]);
    const ba = routeCost([pharmacies[1], pharmacies[0]]);
    return ab <= ba ? pharmacies : [pharmacies[1], pharmacies[0]];
  }
  // 3 pharmacies: try all 6 permutations
  const perms = [
    [0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0],
  ];
  let best = null, bestCost = Infinity;
  perms.forEach(([a,b,c]) => {
    const order = [pharmacies[a], pharmacies[b], pharmacies[c]];
    const cost = routeCost(order);
    if (cost < bestCost) { bestCost = cost; best = order; }
  });
  return best;
}

// ── Generate mock availability ─────────────────────────────────────────────────
function generateAvailability(medicines) {
  return PHARMACIES.map((pharmacy) => {
    const availability = {};
    medicines.forEach((med) => {
      const r = Math.random();
      availability[med] = r > 0.5 ? "in-stock" : r > 0.25 ? "low-stock" : "out-of-stock";
    });
    const inStockCount = medicines.filter((m) => availability[m] === "in-stock").length;
    const score = inStockCount === medicines.length ? 3 : inStockCount > 0 ? 2 : 1;
    const distanceFromUser = haversine(USER, pharmacy);
    // Single-pharmacy round-trip cost: User → P → User
    const singleTripCost = parseFloat((distanceFromUser * 2).toFixed(2));
    return { ...pharmacy, availability, inStockCount, score, distanceFromUser, singleTripCost };
  });
}

// ── Find combos that cover all medicines, compute true route cost ──────────────
function findCombinations(results, medicines) {
  const covers = (p, med) => p.availability[med] !== "out-of-stock";
  const coversAll = (arr) => medicines.every((med) => arr.some((p) => covers(p, med)));
  const aloneCoversAll = (p) => medicines.every((m) => covers(p, m));

  const combos = [];

  // 2-pharmacy combos
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const pair = [results[i], results[j]];
      if (!coversAll(pair)) continue;
      if (aloneCoversAll(results[i]) || aloneCoversAll(results[j])) continue;

      const ordered = bestOrder(pair);
      const tripCost = routeCost(ordered);

      const assignment = {};
      medicines.forEach((med) => {
        assignment[med] = ordered.find((p) => covers(p, med)).id;
      });

      const legs = [
        { from:"You", to:ordered[0].name, dist: haversine(USER, ordered[0]) },
        { from:ordered[0].name, to:ordered[1].name, dist: haversine(ordered[0], ordered[1]) },
        { from:ordered[1].name, to:"Home", dist: haversine(ordered[1], USER) },
      ];

      combos.push({ pharmacies: ordered, tripCost, assignment, legs });
    }
  }

  // 3-pharmacy combos (only when no 2-combos cover all)
  if (combos.length === 0) {
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        for (let k = j + 1; k < results.length; k++) {
          const trio = [results[i], results[j], results[k]];
          if (!coversAll(trio)) continue;

          const ordered = bestOrder(trio);
          const tripCost = routeCost(ordered);

          const assignment = {};
          medicines.forEach((med) => {
            assignment[med] = ordered.find((p) => covers(p, med)).id;
          });

          const legs = [
            { from:"You", to:ordered[0].name, dist: haversine(USER, ordered[0]) },
            { from:ordered[0].name, to:ordered[1].name, dist: haversine(ordered[0], ordered[1]) },
            { from:ordered[1].name, to:ordered[2].name, dist: haversine(ordered[1], ordered[2]) },
            { from:ordered[2].name, to:"Home", dist: haversine(ordered[2], USER) },
          ];

          combos.push({ pharmacies: ordered, tripCost, assignment, legs });
        }
      }
    }
  }

  return combos.sort((a, b) => a.tripCost - b.tripCost).slice(0, 3);
}

// ── UI helpers ────────────────────────────────────────────────────────────────
const AVAIL_FILTERS = [
  { key:"all",     label:"All pharmacies" },
  { key:"full",    label:"All medicines" },
  { key:"partial", label:"Some available" },
];

const COMBO_COLORS = [
  { bg:"bg-violet-100", text:"text-violet-800", border:"border-violet-200", line:"bg-violet-300" },
  { bg:"bg-sky-100",    text:"text-sky-800",    border:"border-sky-200",    line:"bg-sky-300"    },
  { bg:"bg-orange-100", text:"text-orange-800", border:"border-orange-200", line:"bg-orange-300" },
];

function StatusBadge({ status }) {
  const map = {
    "in-stock":     { label:"In Stock",     cls:"bg-green-50 text-green-700 border border-green-200" },
    "low-stock":    { label:"Low Stock",    cls:"bg-amber-50 text-amber-700 border border-amber-200" },
    "out-of-stock": { label:"Out of Stock", cls:"bg-red-50 text-red-600 border border-red-200" },
  };
  const { label, cls } = map[status] || map["out-of-stock"];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function MiniBar({ inStock, total }) {
  const pct = total === 0 ? 0 : Math.round((inStock / total) * 100);
  const color = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width:`${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${pct===100?"text-emerald-600":pct>=50?"text-amber-600":"text-red-500"}`}>
        {inStock}/{total} in stock
      </span>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${active?"bg-emerald-600 text-white border-emerald-600":"bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"}`}>
      {children}
    </button>
  );
}

// Inline route legs diagram
function RouteLegs({ legs }) {
  return (
    <div className="flex items-center gap-0 flex-wrap mt-3 mb-1">
      {legs.map((leg, i) => (
        <div key={i} className="flex items-center gap-0">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap max-w-[70px] truncate text-center">{leg.from}</span>
          </div>
          <div className="flex flex-col items-center mx-1 min-w-[36px]">
            <span className="text-[9px] text-violet-600 font-bold">{leg.dist} km</span>
            <div className="flex items-center w-full">
              <div className="h-px flex-1 bg-violet-300" />
              <svg className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
              </svg>
            </div>
          </div>
          {i === legs.length - 1 && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">{leg.to}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FindMedicine() {
  const [query, setQuery]               = useState("");
  const [suggestions, setSuggestions]   = useState([]);
  const [medicineList, setMedicineList] = useState([]);
  const [results, setResults]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [activeIdx, setActiveIdx]       = useState(-1);
  const [availFilter, setAvailFilter]   = useState("all");
  const [sortBy, setSortBy]             = useState("tripcost"); // "tripcost" | "availability" | "distance"
  const inputRef    = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 1) { setSuggestions([]); return; }
    const filtered = MEDICINE_SUGGESTIONS.filter(
      (m) => m.toLowerCase().includes(query.toLowerCase()) && !medicineList.includes(m)
    );
    setSuggestions(filtered.slice(0, 6));
    setActiveIdx(-1);
  }, [query, medicineList]);

  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const addMedicine = (name) => {
    const t = name.trim();
    if (!t || medicineList.includes(t)) return;
    setMedicineList((p) => [...p, t]);
    setQuery(""); setSuggestions([]); setResults(null);
    inputRef.current?.focus();
  };

  const removeMedicine = (name) => { setMedicineList((p) => p.filter((m) => m !== name)); setResults(null); };

  const handleKeyDown = (e) => {
    if (e.key==="ArrowDown") setActiveIdx((i) => Math.min(i+1, suggestions.length-1));
    else if (e.key==="ArrowUp") setActiveIdx((i) => Math.max(i-1, -1));
    else if (e.key==="Enter") {
      e.preventDefault();
      if (activeIdx>=0 && suggestions[activeIdx]) addMedicine(suggestions[activeIdx]);
      else if (query.trim()) addMedicine(query.trim());
    } else if (e.key==="Escape") setSuggestions([]);
  };

  const handleSearch = () => {
    if (!medicineList.length) return;
    setLoading(true); setResults(null);
    setTimeout(() => { setResults(generateAvailability(medicineList)); setLoading(false); }, 1200);
  };

  const combos   = results && medicineList.length > 1 ? findCombinations(results, medicineList) : [];

  const displayResults = results
    ? [...results]
        .filter((p) => {
          if (availFilter==="full")    return p.inStockCount === medicineList.length;
          if (availFilter==="partial") return p.inStockCount > 0 && p.inStockCount < medicineList.length;
          return true;
        })
        .sort((a, b) => {
          if (sortBy==="distance")  return a.distanceFromUser - b.distanceFromUser;
          if (sortBy==="tripcost")  return a.singleTripCost - b.singleTripCost;
          return b.score - a.score || a.singleTripCost - b.singleTripCost;
        })
    : [];

  return (
    <div className="min-h-sh-[calc(100vh-9.25rem)] bg-gray-50 font-sans">
      
      <main className="w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Find Medicines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Search medicines,<br /><span className="text-emerald-600">find them nearby.</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">Add medicines, then get single-stop or optimised multi-stop routes — ranked by true round-trip distance.</p>
        </div>

        {/* Search card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-5 pb-0">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Add medicines to your list</label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input ref={inputRef} type="text" value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Type medicine name, e.g. Paracetamol…"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50" autoComplete="off" />
                </div>
                <button onClick={()=>addMedicine(query)} disabled={!query.trim()}
                  className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Add
                </button>
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-14 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                  {suggestions.map((s,i) => (
                    <button key={s} onMouseDown={()=>addMedicine(s)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${i===activeIdx?"bg-emerald-50 text-emerald-700":"text-gray-700 hover:bg-gray-50"}`}>
                      <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {medicineList.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your list ({medicineList.length})</span>
                  <button onClick={()=>{setMedicineList([]);setResults(null);}} className="text-xs text-red-400 hover:text-red-600 transition-colors">Clear all</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {medicineList.map((med) => (
                    <div key={med} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-1.5 rounded-full">
                      <span>{med}</span>
                      <button onClick={()=>removeMedicine(med)} className="text-emerald-500 hover:text-emerald-800 transition-colors ml-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-5 mt-2">
            <button onClick={handleSearch} disabled={!medicineList.length||loading}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm">
              {loading
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Searching nearby pharmacies…</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>Find pharmacies with these medicines</>
              }
            </button>
            {!medicineList.length && <p className="text-center text-xs text-gray-400 mt-2">Add at least one medicine to search</p>}
          </div>
        </div>

        {/* ── RESULTS ── */}
        {results && !loading && (
          <div className="mt-6 space-y-6">

            {/* ══ SMART COMBO SECTION ══ */}
            {medicineList.length > 1 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">Smart multi-stop routes</h2>
                    <p className="text-xs text-gray-400">Ranked by true round-trip cost · You → Pharmacy stops → Home</p>
                  </div>
                </div>

                {combos.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl px-5 py-5 text-center">
                    <p className="text-sm text-gray-500">No multi-stop combo found covering all medicines.</p>
                    <p className="text-xs text-gray-400 mt-1">Check single pharmacies below for partial matches.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {combos.map((combo, ci) => {
                      const pharmMeds = {};
                      combo.pharmacies.forEach((p) => { pharmMeds[p.id] = []; });
                      medicineList.forEach((med) => { pharmMeds[combo.assignment[med]].push(med); });
                      const isBest = ci === 0;

                      return (
                        <div key={ci} className={`bg-white rounded-2xl overflow-hidden border ${isBest?"border-violet-400 shadow-md shadow-violet-100":"border-gray-200"}`}>

                          {/* Header */}
                          <div className={`px-4 py-2.5 flex items-center justify-between ${isBest?"bg-violet-600":"bg-gray-50 border-b border-gray-100"}`}>
                            <div className="flex items-center gap-2">
                              {isBest && <span className="text-[10px] font-bold text-violet-100 bg-violet-500 px-2 py-0.5 rounded-full uppercase tracking-wide">⚡ Optimal route</span>}
                              <span className={`text-xs font-semibold ${isBest?"text-white":"text-gray-600"}`}>
                                {combo.pharmacies.length}-stop route · all {medicineList.length} medicines covered
                              </span>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold ${isBest?"text-white":"text-gray-700"}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                              {combo.tripCost} km
                            </div>
                          </div>

                          <div className="p-4">
                            {/* Route legs diagram */}
                            <RouteLegs legs={combo.legs} />

                            {/* Stop-by-stop */}
                            <div className="mt-3 space-y-3">
                              {combo.pharmacies.map((pharmacy, pi) => {
                                const col = COMBO_COLORS[pi % COMBO_COLORS.length];
                                const medsHere = pharmMeds[pharmacy.id] || [];
                                const legDist = combo.legs[pi + 1]
                                  ? combo.legs[pi].dist
                                  : combo.legs[pi]?.dist;

                                return (
                                  <div key={pharmacy.id} className="flex gap-3">
                                    <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                                      <div className={`w-7 h-7 rounded-full ${col.bg} border-2 ${col.border} flex items-center justify-center text-xs font-bold ${col.text}`}>
                                        {pi + 1}
                                      </div>
                                      {pi < combo.pharmacies.length - 1 && (
                                        <div className={`w-0.5 mt-1 ${col.line} flex-1`} style={{minHeight:"20px"}} />
                                      )}
                                    </div>

                                    <div className={`flex-1 min-w-0 p-3 rounded-xl border ${col.border} ${col.bg} bg-opacity-40`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="font-semibold text-gray-900 text-sm">{pharmacy.icon} {pharmacy.name}</p>
                                          <p className="text-xs text-gray-500 truncate">{pharmacy.address}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-gray-400">{pharmacy.distanceFromUser} km from you</span>
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${pharmacy.open?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>
                                              {pharmacy.open?"Open":"Closed"}
                                            </span>
                                          </div>
                                        </div>
                                        <button className={`text-xs font-medium border px-2 py-1 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${col.text} ${col.border} hover:opacity-80`}>
                                          Directions
                                        </button>
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {medsHere.map((med) => (
                                          <span key={med} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${col.bg} ${col.text} ${col.border}`}>
                                            💊 {med}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Trip cost breakdown */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">Route cost:</span>
                                {combo.legs.map((leg, li) => (
                                  <span key={li} className="flex items-center gap-1">
                                    <span className="text-gray-400">{leg.from}</span>
                                    <svg className="w-3 h-3 text-violet-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/></svg>
                                    <span className="font-semibold text-violet-700">{leg.dist} km</span>
                                    {li < combo.legs.length - 1 && <span className="text-gray-300 ml-1">+</span>}
                                  </span>
                                ))}
                                <span className="ml-1 font-bold text-gray-900">= {combo.tripCost} km total</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ INDIVIDUAL PHARMACIES ══ */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">Individual pharmacies</h2>
                    <p className="text-xs text-gray-400">Single-stop options · round-trip = distance × 2</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Filter + Sort */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M10 17h4"/></svg>
                    Sort by
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key:"tripcost",     label:"Round-trip cost", icon:"M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
                      { key:"availability", label:"Medicine availability", icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                      { key:"distance",     label:"Nearest first", icon:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
                    ].map(({ key, label, icon }) => (
                      <button key={key} onClick={()=>setSortBy(key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${sortBy===key?"bg-emerald-600 text-white border-emerald-600":"bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon}/></svg>
                        {label}
                        {sortBy===key && <span className="ml-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Active</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-100" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
                    Filter by availability
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVAIL_FILTERS.map((f) => {
                      const count = results.filter((p) => {
                        if (f.key==="full")    return p.inStockCount === medicineList.length;
                        if (f.key==="partial") return p.inStockCount > 0 && p.inStockCount < medicineList.length;
                        return true;
                      }).length;
                      return (
                        <FilterChip key={f.key} active={availFilter===f.key} onClick={()=>setAvailFilter(f.key)}>
                          {f.label}
                          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${availFilter===f.key?"bg-white/20 text-white":"bg-gray-100 text-gray-500"}`}>{count}</span>
                        </FilterChip>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pharmacy cards */}
              {displayResults.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 py-10 text-center">
                  <p className="text-gray-500 text-sm font-medium">No pharmacies match this filter</p>
                  <button onClick={()=>setAvailFilter("all")} className="mt-2 text-xs text-emerald-600 hover:underline">Show all</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayResults.map((pharmacy) => {
                    const total = medicineList.length;
                    const inStock = pharmacy.inStockCount;
                    const fullyStocked = inStock === total;
                    const noneStocked  = inStock === 0;
                    return (
                      <div key={pharmacy.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${fullyStocked?"border-emerald-300":noneStocked?"border-gray-100 opacity-70":"border-gray-200"}`}>
                        {fullyStocked && (
                          <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                              All medicines — single stop
                            </span>
                            <span className="text-emerald-100 font-bold">Round-trip: {pharmacy.singleTripCost} km</span>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${fullyStocked?"bg-emerald-50":"bg-gray-50"}`}>{pharmacy.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">{pharmacy.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{pharmacy.address}</p>
                                <MiniBar inStock={inStock} total={total} />
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                                    {pharmacy.distanceFromUser} km away
                                  </span>
                                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                    ↩ {pharmacy.singleTripCost} km round-trip
                                  </span>
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${pharmacy.open?"bg-green-50 text-green-700":"bg-red-50 text-red-600"}`}>
                                    {pharmacy.open?"Open":"Closed"}
                                  </span>
                                  <span className="text-xs text-amber-600">★ {pharmacy.rating}</span>
                                </div>
                              </div>
                            </div>
                            <button className="px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap flex-shrink-0">
                              Directions
                            </button>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100 grid gap-1.5">
                            {medicineList.map((med) => (
                              <div key={med} className="flex items-center justify-between py-0.5">
                                <span className="text-xs text-gray-600 truncate mr-2">{med}</span>
                                <StatusBadge status={pharmacy.availability[med]} />
                              </div>
                            ))}
                          </div>
                          {fullyStocked && (
                            <button className="mt-3 w-full py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors">View Pharmacy Details</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 justify-center">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> In Stock</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Low Stock</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Out of Stock</span>
              </div>
            </div>
          </div>
        )}

        {!results && !loading && !medicineList.length && (
          <div className="mt-8 text-center py-12">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <p className="text-gray-600 font-medium text-sm">Start building your medicine list</p>
            <p className="text-gray-400 text-xs mt-1">We'll find single-stop pharmacies and optimised multi-stop routes ranked by true travel cost.</p>
          </div>
        )}
      </main>

      <div className="border-t border-gray-100 mt-12 py-4 text-center text-xs text-gray-400">© 2024 NearMyMed · Made with ❤️ in India</div>
    </div>
  );
}