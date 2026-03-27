import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix duplicate imports
content = content.replace(
  "import { PanelModal } from './components/PanelModal';\nimport { PanelModal } from './components/PanelModal';",
  "import { PanelModal } from './components/PanelModal';"
);

// Fix duplicate state
content = content.replace(
  "const [isPanelOpen, setIsPanelOpen] = useState(false);\n  const [isPanelOpen, setIsPanelOpen] = useState(false);",
  "const [isPanelOpen, setIsPanelOpen] = useState(false);"
);

// Fix duplicate hasPanelAccess
content = content.replace(
  "const hasPanelAccess = \n    user?.email === 'eptoflprat@typetrack.local' || \n    user?.email === 'rajarin@typetrack.local' || \n    user?.email === 'pratyusalt@typetrack.local';\n  const hasPanelAccess = \n    user?.email === 'eptoflprat@typetrack.local' || \n    user?.email === 'rajarin@typetrack.local' || \n    user?.email === 'pratyusalt@typetrack.local';",
  "const hasPanelAccess = \n    user?.email === 'eptoflprat@typetrack.local' || \n    user?.email === 'rajarin@typetrack.local' || \n    user?.email === 'pratyusalt@typetrack.local';"
);

// Fix className={}
content = content.replace(
  "className={}",
  "className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors font-bold text-sm ${isLight ? 'bg-red-500/20 text-red-700 hover:bg-red-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx');
