import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import Header from './components/Header';
import Home from './pages/Home';
import Share from './pages/Share';
import Watch from './pages/Watch';
import How from './pages/How';
function App() {  
return <div className="min-h-screen">
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/share" element={<Share />} />
      <Route path="/watch" element={<Watch />} />
      <Route path="/how" element={<How />} />
      <Route path="*" element={<Home />} />
    </Routes>
  </div>
}
createRoot(document.getElementById('root')).render(<BrowserRouter>
  <App />
</BrowserRouter>);
