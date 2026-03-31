import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  "import { AccLogsModal } from './components/AccLogsModal';",
  "import { AccLogsModal } from './components/AccLogsModal';\nimport { PanelModal } from './components/PanelModal';"
);

content = content.replace(
  "import { Keyboard, LayoutDashboard, Trophy, Home as HomeIcon, LogIn, LogOut, Moon, Sun, Bot, Users, Mail, FileText } from 'lucide-react';",
  "import { Keyboard, LayoutDashboard, Trophy, Home as HomeIcon, LogIn, LogOut, Moon, Sun, Bot, Users, Mail, FileText, Shield } from 'lucide-react';"
);

content = content.replace(
  "const [isAccLogsOpen, setIsAccLogsOpen] = useState(false);",
  "const [isAccLogsOpen, setIsAccLogsOpen] = useState(false);\n  const [isPanelOpen, setIsPanelOpen] = useState(false);"
);

content = content.replace(
  "const isLight = settings.theme === 'light';",
  "const hasPanelAccess = \n    user?.email === 'eptoflprat@typetrack.local' || \n    user?.email === 'rajarin@typetrack.local' || \n    user?.email === 'pratyusalt@typetrack.local';\n  const isLight = settings.theme === 'light';"
);

content = content.replace(
  "<span>Acc Logs</span>\n                  </button>\n                )}\n                {isDev && (",
  "<span>Acc Logs</span>\n                  </button>\n                )}\n                {hasPanelAccess && (\n                  <button\n                    onClick={() => setIsPanelOpen(true)}\n                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors font-bold text-sm ${isLight ? 'bg-red-500/20 text-red-700 hover:bg-red-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}\n                    title=\"Admin Panel\"\n                  >\n                    <Shield className=\"w-4 h-4\" />\n                    <span>Panel</span>\n                  </button>\n                )}\n                {isDev && ("
);

content = content.replace(
  "<AccLogsModal\n        isOpen={isAccLogsOpen}\n        onClose={() => setIsAccLogsOpen(false)}\n      />\n      <ProfileModal",
  "<AccLogsModal\n        isOpen={isAccLogsOpen}\n        onClose={() => setIsAccLogsOpen(false)}\n      />\n      <PanelModal\n        isOpen={isPanelOpen}\n        onClose={() => setIsPanelOpen(false)}\n      />\n      <ProfileModal"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Done updating App.tsx');
