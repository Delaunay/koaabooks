import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { ColorModeProvider } from './components/color-mode';
import { Toaster } from './components/toaster';
import { TrackerPage } from './App';
import './index.css';
import './theme.css';

const system = createSystem(defaultConfig);

// Hash routes (#/<year>/<tab>) work on any static host without rewrite rules.
createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<TrackerPage />} />
            <Route path="/:year" element={<TrackerPage />} />
            <Route path="/:year/:tab" element={<TrackerPage />} />
          </Routes>
        </HashRouter>
        <Toaster />
      </ColorModeProvider>
    </ChakraProvider>
  </StrictMode>,
);
