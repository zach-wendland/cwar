// index.tsx - application entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';  // include Bootstrap styles
import './index.css';  // global styles (including map hover)
import { GameProvider } from './game/GameContext';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <GameProvider>
      <App />
    </GameProvider>
  );
}
