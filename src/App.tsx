import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Library = lazy(() => import('./pages/Library').then(m => ({ default: m.Library })));
const VNDetails = lazy(() => import('./pages/VNDetails').then(m => ({ default: m.VNDetails })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Releases = lazy(() => import('./pages/Releases').then(m => ({ default: m.Releases })));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500">
            Loading VNDB Client…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="releases" element={<Releases />} />
            <Route path="library" element={<Library />} />
            <Route path="profile" element={<Profile />} />
            <Route path="vn/:id" element={<VNDetails />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
