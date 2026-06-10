import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState,useEffect } from "react";
import Dashboard from "./Dashboard";
import StockDashboard from "./StockDashboard";
import KPILibraryEditor from "./KPILibraryEditor";
import ColumnMapper from "./components/ColumnMapper";

export default function App() {
  const [outputFile, setOutputFile] = useState(null);
  const [defaultCOLUMN_MAPPING, setDefaultCOLUMN_MAPPING] = useState({});
  const [COLUMN_MAPPING, setCOLUMN_MAPPING] = useState({});
  console.log("Output file in App:", COLUMN_MAPPING);
  useEffect(() => {
    fetch('http://100.103.219.73:8000/column-mapping')
      .then(res => res.json())
      .then(data => {
        setDefaultCOLUMN_MAPPING(data);
      }); 
  }, []);


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard setOutputFile={setOutputFile} columnMapping={COLUMN_MAPPING} />} />
        <Route path="/stock-dashboard" element={<StockDashboard resultFile={outputFile} />} />
        <Route path="/kpi-dashboard" element={<KPILibraryEditor/>} />
        <Route path="/column-mapper" element={<ColumnMapper kpiMetrics={defaultCOLUMN_MAPPING} setCOLUMN_MAPPING={setCOLUMN_MAPPING} />} />
      </Routes>
    </BrowserRouter>
  );
}