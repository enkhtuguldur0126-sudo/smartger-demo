import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './lib/i18n.jsx';
import { SettingsProvider } from './lib/settings.jsx';
import App from './App.jsx';
import './styles/theme.css';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <LangProvider>
        <App />
      </LangProvider>
    </SettingsProvider>
  </StrictMode>
);
