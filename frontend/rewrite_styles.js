import fs from 'fs';

const files = [
  'src/App.jsx',
  'src/components/LiveSession.jsx',
  'src/components/StatusBar.jsx',
  'src/components/TutorOverlay.jsx',
  'src/components/CubeViewer.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Background gradients
  content = content.replace(/bg-\[radial-[^\]]+\]/g, 'bg-[#131314]');
  content = content.replace(/bg-\[linear-[^\]]+\]/g, 'bg-[#131314]');
  
  // Slate/dark tones -> specific Gemini surfaces
  content = content.replace(/bg-slate-900\/40/g, 'bg-[#1e1f20]/60');
  content = content.replace(/bg-slate-900\/70/g, 'bg-[#1e1f20]/80');
  content = content.replace(/bg-slate-950\/90/g, 'bg-[#131314]/90');
  content = content.replace(/bg-slate-800\/80/g, 'bg-[#444746]/80');
  content = content.replace(/border-white\/15/g, 'border-[#444746]');
  content = content.replace(/border-white\/20/g, 'border-[#444746]');

  // Cyans -> Blues/Google branding
  content = content.replace(/bg-cyan-400/g, 'bg-[#4285f4]');
  content = content.replace(/bg-cyan-300/g, 'bg-[#3b78e7]');
  content = content.replace(/text-cyan-100/g, 'text-blue-100');
  content = content.replace(/text-cyan-200/g, 'text-blue-200');
  content = content.replace(/text-cyan-300/g, 'text-blue-300');
  content = content.replace(/text-cyan-400/g, 'text-blue-400');
  content = content.replace(/bg-cyan-500\/10/g, 'bg-blue-500/10');
  content = content.replace(/bg-cyan-500\/20/g, 'bg-blue-500/20');
  content = content.replace(/border-cyan-200\/30/g, 'border-blue-500/30');
  content = content.replace(/border-cyan-300\/40/g, 'border-blue-500/40');
  content = content.replace(/decoration-cyan-400\/50/g, 'decoration-blue-400/50');
  
  // Specific Title updates
  content = content.replace(
    /Meet Cubey, Your AI Rubik&apos;s Tutor/,
    'Meet <span className="gemini-text-gradient">Cubey</span>, Your AI Rubik&apos;s Tutor'
  );
  content = content.replace(
    /text-xs uppercase tracking-\[0\.2em\] text-blue-200/,
    'text-xs font-bold uppercase tracking-[0.2em] gemini-text-gradient'
  );

  fs.writeFileSync(file, content);
});
