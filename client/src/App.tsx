import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Dashboard } from '@/pages/dashboard';
import { DevicePage } from '@/pages/device';
import { HistoryPage } from '@/pages/history';
import { SettingsPage } from '@/pages/settings';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-6 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/device" element={<DevicePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
