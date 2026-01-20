import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { GlobalStyles } from './components/GlobalStyles';
import { AuthOverlay } from './components/AuthOverlay';
import { Sidebar } from './components/Sidebar';
import { D3Chart } from './components/D3Chart';
import { NodeData, Recipe, Season, SkinType, Ingredient } from './types';

// Constant Data (Translated to Vietnamese)
const NODES: NodeData[] = [
  { id: "BRG", name: "Cam Bergamot", layer: "Top", season: "SP", long: 3, sill: 6 },
  { id: "GTE", name: "Trà Xanh", layer: "Top", season: "SP", long: 4, sill: 4 },
  { id: "ROS", name: "Hoa Hồng", layer: "Mid", season: "SP", long: 6, sill: 7 },
  { id: "PEO", name: "Mẫu Đơn", layer: "Mid", season: "SP", long: 5, sill: 6 },
  { id: "LMN", name: "Chanh Vàng", layer: "Top", season: "SU", long: 2, sill: 8 },
  { id: "LAV", name: "Oải Hương", layer: "Mid", season: "SU", long: 5, sill: 6 },
  { id: "WMK", name: "Xạ Hương Trắng", layer: "Base", season: "SU", long: 8, sill: 3 },
  { id: "SDW", name: "Đàn Hương", layer: "Base", season: "AU", long: 9, sill: 5 },
  { id: "AMB", name: "Hổ Phách", layer: "Base", season: "AU", long: 9, sill: 6 },
  { id: "VET", name: "Cỏ Hương Bài", layer: "Base", season: "AU", long: 8, sill: 7 },
  { id: "VNL", name: "Vani", layer: "Base", season: "AU", long: 8, sill: 5 },
  { id: "JAS", name: "Hoa Nhài", layer: "Mid", season: "WI", long: 7, sill: 9 },
  { id: "BPP", name: "Tiêu Đen", layer: "Mid", season: "WI", long: 6, sill: 8 },
  { id: "PAT", name: "Hoắc Hương", layer: "Base", season: "WI", long: 10, sill: 8 },
  { id: "LTH", name: "Da Thuộc", layer: "Base", season: "WI", long: 9, sill: 7 },
  { id: "CDW", name: "Tuyết Tùng", layer: "Base", season: "WI", long: 9, sill: 5 },
];

// Logic Functions
function calculateLogic(sel: NodeData[], skin: SkinType, totalWeight: number, concentration: number): Ingredient[] {
    const oilConc = concentration / 100;
    const totalOilWeight = totalWeight * oilConc;
    const alcoholWeight = totalWeight - totalOilWeight;

    let totalParts = 0;
    const partValues = sel.map((n) => {
        let p = n.layer === "Base" ? 5 : n.layer === "Mid" ? 3 : 2;
        if (skin === "DRY" && n.layer === "Base") p += 2;
        if (skin === "OIL" && n.layer === "Top") p += 2;
        totalParts += p;
        return p;
    });

    const ingredients: Ingredient[] = sel.map((n, i) => {
        const pctOfOil = partValues[i] / totalParts;
        return {
            name: n.name,
            pct: (pctOfOil * oilConc * 100).toFixed(1),
            gram: (pctOfOil * totalOilWeight).toFixed(2),
        };
    });

    ingredients.push({
        name: "Cồn (96°)",
        pct: ((alcoholWeight / totalWeight) * 100).toFixed(1),
        gram: alcoholWeight.toFixed(2),
        isAlcohol: true,
    });

    return ingredients;
}

function calculatePerformance(selectedNodes: NodeData[], skin: SkinType) {
    let baseLong = d3.mean(selectedNodes, (d) => d.long) || 0;
    baseLong = baseLong * 1.1;
    if (skin === "DRY") baseLong += 1.2;
    let sillageFactor = d3.mean(selectedNodes, (d) => d.sill) || 0;
    let dist = sillageFactor * 0.25;
    if (skin === "OIL") dist *= 1.4;
    if (skin === "DRY") dist *= 0.8;
    return {
        longevity: `${baseLong.toFixed(1)}h`,
        distance: `${dist.toFixed(1)}m`,
    };
}

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [season, setSeason] = useState<Season>('AU');
  const [skin, setSkin] = useState<SkinType>('OIL');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Sounds
  const clickSound = useRef<HTMLAudioElement | null>(null);
  const successSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    successSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3");
  }, []);

  const playClick = () => {
    if (clickSound.current) {
        clickSound.current.currentTime = 0;
        clickSound.current.play().catch(() => {});
    }
  };

  const playSuccess = () => {
    if (successSound.current) successSound.current.play().catch(() => {});
  };

  // Generate recipes once on mount or when recipes needed
  useEffect(() => {
    const newRecipes: Recipe[] = [];
    for (let i = 0; i < 200; i++) {
        let pool = [...NODES];
        let selected: NodeData[] = [];
        const count = Math.random() > 0.5 ? 3 : 2;
        while (selected.length < count) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          selected.push(pool.splice(randomIndex, 1)[0]);
        }
        newRecipes.push({
          id: i,
          ids: selected.map((n) => n.id),
          rawSelected: selected,
          primarySeason: selected[0].season,
        });
    }
    setRecipes(newRecipes);
  }, []);

  // Sync CSS Variable for active color
  useEffect(() => {
    const colors = {
        'SP': 'var(--accent-sp)',
        'SU': 'var(--accent-su)',
        'AU': 'var(--accent-au)',
        'WI': 'var(--accent-wi)'
    };
    document.documentElement.style.setProperty('--active-color', colors[season]);
  }, [season]);

  const handleUnlock = () => {
    playSuccess();
    setUnlocked(true);
  };

  const handleSeasonChange = (s: Season) => {
    playClick();
    setSeason(s);
    setActiveNodeId(null);
  };

  const handleSkinChange = (s: SkinType) => {
    playClick();
    setSkin(s);
  };

  const handleNodeClick = (id: string) => {
    playClick();
    setActiveNodeId(id);
  };

  const activeNodeData = useMemo(() => 
    NODES.find(n => n.id === activeNodeId), 
  [activeNodeId]);

  return (
    <>
      <GlobalStyles />
      {!unlocked && <AuthOverlay onUnlock={handleUnlock} />}
      
      {/* Use 100dvh for better mobile browser support */}
      <div className={`wrapper ${unlocked ? 'unlocked' : ''} flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden`}>
        <Sidebar 
            season={season}
            setSeason={handleSeasonChange}
            skin={skin}
            setSkin={handleSkinChange}
            activeNodeId={activeNodeId}
            activeNodeData={activeNodeData}
            recipes={recipes}
            onCalculate={calculateLogic}
            onPerformance={calculatePerformance}
        />
        <D3Chart 
            nodes={NODES}
            recipes={recipes}
            currentSeason={season}
            activeNodeId={activeNodeId}
            onNodeHover={handleNodeClick}
            onNodeClick={handleNodeClick}
        />
      </div>
    </>
  );
};

export default App;