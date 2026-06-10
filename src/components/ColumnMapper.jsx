import React, { useState, useCallback, useEffect } from 'react';
import './ColumnMapper.css';
import { useNavigate } from 'react-router-dom';
/**
 * ColumnMapper Component
 * Handles manual mapping of data file columns to KPI metrics
 * 
 * Workflow:
 * 1. User uploads CSV/Excel file
 * 2. Component extracts available columns from file
 * 3. User maps each KPI metric to a data column via dropdown
 * 4. Sends mapped configuration to backend
 */

const ColumnMapper = ({ onMappingComplete, kpiMetrics = [], setCOLUMN_MAPPING }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileDataPreview, setFileDataPreview] = useState([]);
  const navigate = useNavigate();

  /**
   * Handle file upload
   * Extracts columns from CSV/Excel and sets up initial state
   */
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const columns = await extractColumnsFromFile(file);
      console.log('Extracted columns:', columns);
      setUploadedFile(file);
      setAvailableColumns(columns);
      console.log('KPI Metrics:', kpiMetrics);
      // Initialize mapping state with empty values
      const initialMapping = {};
      Object.values(kpiMetrics).forEach(metric => {
        initialMapping[metric] = '';
      });
      setColumnMapping(initialMapping);

      // Get preview data
      const preview = await getFilePreview(file);
      console.log('File preview data:', preview);
      if (preview && Array.isArray(preview)) {
        setFileDataPreview(preview);

        // 2. Use the local 'preview' variable here, NOT the state variable
        // fileDataPreview.map(row => console.log('Preview row:', row.split(',').map(cell => cell.trim())));
      } else {
        console.error("Preview returned null or invalid data");
      }
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
      console.error('File processing error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [kpiMetrics]);

  /**
   * Extract columns from CSV or Excel file
   */
  const extractColumnsFromFile = async (file) => {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      return await extractColumnsFromCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
      return await extractColumnsFromExcel(file);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or Excel file.');
    }
  };

  /**
   * Extract columns from CSV file
   */
  const extractColumnsFromCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          resolve(headers.filter(h => h.length > 0));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  /**
   * Extract columns from Excel file
   * Note: Requires xlsx library - add to package.json
   */
  const extractColumnsFromExcel = async (file) => {
    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error('Excel file is empty');
      }

      return Object.keys(data[0]);
    } catch (err) {
      throw new Error(`Failed to read Excel file: ${err.message}`);
    }
  };

  /**
   * Get preview of file data (first 3 rows)
   */
  const getFilePreview = async (file) => {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      return await getCSVPreview(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
      return await getExcelPreview(file);
    }
    return [];
  };

  const getCSVPreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').slice(0, 4);
          resolve(lines);
        } catch {
          resolve([]);
        }
      };
      reader.readAsText(file);
    });
  };

  const getExcelPreview = async (file) => {
    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = utils.sheet_to_json(worksheet);
      return data.slice(0, 3);
    } catch {
      return [];
    }
  };

  /**
   * Handle mapping change for a specific metric
   */
  const handleMappingChange = (metricId, columnName) => {
    setColumnMapping(prev => ({
      ...prev,
      [metricId]: columnName
    }));
  };

  /**
   * Validate that all metrics are mapped
   */
  const validateMapping = async () => {
    const mappedMetrics = Object.keys(columnMapping).filter(metric => columnMapping[metric] !== '');
    console.log('Mapped metrics:', columnMapping);

    if (mappedMetrics.length <= 0) {
      setError(
        `Please map the following metrics: ${mappedMetrics.map(m => m.name).join(', ')}`
      );
      return null;
    }

    const mappedData = await mappedMetrics.map(metric => {
      // if (!availableColumns.includes(columnMapping[metric.id])) {
      const selectedColumn = columnMapping[metric];
      return { [selectedColumn]: metric };
      // }
    });
    console.log('Mapped data to submit:', mappedData);

    return mappedData;
  };

  /**
   * Submit mapping configuration to parent/backend
   */
  const handleSubmitMapping = async () => {

    const mappedData = await validateMapping();
    if (mappedData === null) return;

    setIsLoading(true);
    try {
      console.log(mappedData);

      // Send to backend
      await sendMappingToBackend(mappedData);

      // Notify parent component
      onMappingComplete(mappedData);
    } catch (err) {
      setError(`Error submitting mapping: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send mapping configuration to backend API
   */
  const sendMappingToBackend = async (mappingConfig) => {
    setCOLUMN_MAPPING(mappingConfig);
    navigate('/'); // Redirect to dashboard after successful mapping
  };

  /**
   * Reset all mappings
   */
  const handleReset = () => {
    setUploadedFile(null);
    setAvailableColumns([]);
    setColumnMapping({});
    setFileDataPreview([]);
    setError(null);
  };

  useEffect(() => {
    if (fileDataPreview.length > 0) {
      console.log('Successfully updated fileDataPreview state:', fileDataPreview);
      // You can now safely trigger your mapping logic or UI updates here
    }
  }, [fileDataPreview]);

  // Object.keys(kpiMetrics).forEach(metric => {
  //   console.log('KPI Metric:', metric);
  // });
  // console.log(fileDataPreview);

  return (
    <div className="column-mapper">
      <h2>Manual Column Mapping</h2>

      {/* File Upload Section */}
      <div className="mapper-section">
        <h3>Step 1: Upload Data File</h3>
        <div className="file-upload-area">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isLoading}
            id="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {uploadedFile ? uploadedFile.name : 'Choose CSV or Excel file'}
          </label>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* File Preview */}
      {fileDataPreview.length > 0 && (
        <div className="mapper-section">
          <h3>File Preview</h3>
          <div className="preview-container">
            {Array.isArray(fileDataPreview[0]) ? (
              <table className="preview-table">
                {/* <tbody>
                  {fileDataPreview.map((row, idx) => (
                    <tr key={idx}>
                      {row.split(',').map((cell, cellIdx) => (
                        <td key={cellIdx}>{cell.trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody> */}
              </table>
            ) : (
              <table className="preview-table">
                <thead>
                  <tr>
                    {fileDataPreview[0].split(',').map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Add .slice(1) to skip the first row (the header) */}
                  {fileDataPreview.slice(1).map((row, idx) => (
                    <tr key={idx}>
                      {(typeof row === 'string'
                        ? row.split(',')
                        : Object.values(row)
                      ).map((cell, cellIdx) => (
                        <td key={cellIdx}>{String(cell || '').trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Column Mapping Section */}
      {availableColumns.length > 0 && (
        <div className="mapper-section">
          <h3>Step 2: Map Columns to KPI Metrics</h3>
          <p className="instruction">
            Select the data column for each KPI metric
          </p>

          <div className="mapping-grid">
            {availableColumns.map(metric => (
              <div className="mapping-row">
                <label className="metric-label">
                  {metric}
                </label>
                <select
                  value={columnMapping[metric] || ''}
                  onChange={(e) => handleMappingChange(metric, e.target.value)}
                  className={`column-select ${columnMapping[metric.id] ? 'mapped' : 'unmapped'}`}
                >
                  <option value="">-- Select Column --</option>
                  {Object.keys(kpiMetrics).map(kpi => (
                    <option key={kpi} value={kpi}>
                      {kpi}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {availableColumns.length > 0 && (
        <div className="mapper-actions">
          <button
            className="btn btn-primary"
            onClick={handleSubmitMapping}
            disabled={isLoading || availableColumns.length === 0}
          >
            {isLoading ? 'Processing...' : 'Confirm Mapping'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default ColumnMapper;
