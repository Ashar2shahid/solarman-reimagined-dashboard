import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { Dashboard } from '@/pages/dashboard';
import { useQuery } from '@/hooks/use-query';
import { api } from '@/lib/api';

function App() {
  const { data: alertData } = useQuery(() => api.alerts.count(), []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Header alertCount={alertData?.count ?? 0} />
        <main className="max-w-7xl mx-auto px-6 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
