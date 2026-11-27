import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './lib/i18n.jsx';
import { SettingsProvider } from './lib/settings.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { loadData } from './lib/data.js';
import App from './App.jsx';
import './styles/theme.css';
import './styles/app.css';

// Өгөгдлийн сан тохируулсан бол эхлээд тэндээс уншина, үгүй бол JSON-оор шууд нээгдэнэ.
loadData().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <SettingsProvider>
        <LangProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LangProvider>
      </SettingsProvider>
    </StrictMode>
  );
});
