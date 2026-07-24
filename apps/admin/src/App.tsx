import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FoodManagerPage } from './pages/FoodManagerPage';
import { SeasonalMatrixPage } from './pages/SeasonalMatrixPage';
import { VoiceStudioPage } from './pages/VoiceStudioPage';
import { ClinicalRulesPage } from './pages/ClinicalRulesPage';
import { DHIMSExportPage } from './pages/DHIMSExportPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/foods" replace />} />
        <Route path="/foods" element={<FoodManagerPage />} />
        <Route path="/seasonal" element={<SeasonalMatrixPage />} />
        <Route path="/voice" element={<VoiceStudioPage />} />
        <Route path="/clinical" element={<ClinicalRulesPage />} />
        <Route path="/export" element={<DHIMSExportPage />} />
      </Routes>
    </Layout>
  );
}
