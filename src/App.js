import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./Dashboard";
import StockDashboard from "./StockDashboard";
import KPILibraryEditor from "./KPILibraryEditor";

export default function App() {
  const [outputFile, setOutputFile] = useState(null);
  console.log("Output file in App:", outputFile);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard setOutputFile={setOutputFile} />} />
        <Route path="/stock-dashboard" element={<StockDashboard resultFile={outputFile} />} />
        <Route path="/kpi-dashboard" element={<KPILibraryEditor/>} />
      </Routes>
    </BrowserRouter>
  );
}