import { useState, useRef } from 'react'
import './InvoiceAnalyzer.css'

function InvoiceAnalyzerV2({ 
  selectedFile, 
  isAnalyzing, 
  analysisResult, 
  onFileSelect, 
  onAnalyze, 
  onReset,
  methodology,
  onMethodologyChange
}) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const [expandItems, setExpandItems] = useState(true)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    if (file.type.includes('image/') || file.type === 'application/pdf') {
      onFileSelect(file)
    } else {
      alert('Please select an image file or PDF')
    }
  }

  const analyzeInvoice = () => {
    if (!selectedFile) return
    onAnalyze()
  }

  const resetAnalysis = () => {
    onReset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Calculate total emissions
  const totalEmissions = analysisResult ? 
    analysisResult.reduce((sum, item) => sum + parseFloat(item.tco2 || 0), 0) : 0

  return (
    <div className="invoice-analyzer purple-theme">
      <div className="analyzer-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="analyzer-title">📊 Invoice Analyzer V2</h1>
            <p className="analyzer-subtitle">Advanced invoice analysis with detailed emission calculations</p>
          </div>
        </div>
      </div>

      <div className="analyzer-content">
        {!selectedFile ? (
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📁</div>
            <h3>Drop your invoice here</h3>
            <p>Or click to browse files</p>
            <div className="supported-formats">
              Supports: JPG, PNG, PDF
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="analysis-section">
            <div className="file-preview">
              <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <h3>{selectedFile.name}</h3>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button className="remove-file" onClick={resetAnalysis}>
                  ✕
                </button>
              </div>
            </div>

            {!analysisResult && (
              <div className="analyze-controls">
                <div className="methodology-controls">
                  <label htmlFor="methodology-select">Methodology</label>
                  <select
                    id="methodology-select"
                    value={methodology || 'auto'}
                    onChange={(e) => onMethodologyChange?.(e.target.value)}
                    disabled={isAnalyzing}
                  >
                    <option value="auto">Auto</option>
                    <option value="activity">Activity</option>
                    <option value="spend">Spend</option>
                  </select>
                </div>
                <button
                  className="analyze-button"
                  onClick={analyzeInvoice}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <span className="analyzing">
                      <span className="spinner"></span>
                      Analyzing...
                    </span>
                  ) : (
                    '🔍 Analyze Invoice'
                  )}
                </button>
              </div>
            )}

            {analysisResult && (
              <div className="analysis-results">
                <div className="results-header">
                  <h3>Analysis Results</h3>
                  <div className="results-actions">
                    <button className="chip-button" onClick={() => setExpandItems(true)}>Expand all</button>
                    <button className="chip-button" onClick={() => setExpandItems(false)}>Collapse all</button>
                  </div>
                </div>

                <div className="results-grid">
                  <div className="result-card">
                    <h4>Summary</h4>
                    <div className="detail-row">
                      <span>File:</span>
                      <span>{selectedFile?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span>Total Items:</span>
                      <span>{analysisResult.length}</span>
                    </div>
                    <div className="detail-row total">
                      <span>Total Emissions:</span>
                      <span>{totalEmissions.toFixed(2)} tCO2</span>
                    </div>
                  </div>

                  <div className="result-card items-card">
                    <div className="card-header">
                      <h4>Invoice Items</h4>
                      <button className="card-toggle" onClick={() => setExpandItems(v => !v)}>
                        {expandItems ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {expandItems && (
                      <div className="table-wrapper scroll-section">
                        <table className="cell-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Quantity</th>
                              <th>Consumption</th>
                              <th>Supplier</th>
                              <th>Emissions (tCO2)</th>
                              <th>Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResult.length === 0 && (
                              <tr>
                                <td colSpan={6} className="empty">No items found</td>
                              </tr>
                            )}
                            {analysisResult.map((item, idx) => (
                              <tr key={idx}>
                                <td className="item-name">{item.name || item.description || '—'}</td>
                                <td>{item.usages} {item.usageUnit || ''}</td>
                                <td>{item.consumption} {item.consumptionUnit || ''}</td>
                                <td>{item.tagName || '—'}</td>
                                <td className="emissions">{parseFloat(item.tco2 || 0).toFixed(2)}</td>
                                <td>{item.weightConfidence || 0}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="result-card items-card">
                    <div className="card-header">
                      <h4>Emission Factors</h4>
                      <button className="card-toggle" onClick={() => setExpandItems(v => !v)}>
                        {expandItems ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {expandItems && (
                      <div className="table-wrapper scroll-section">
                        <table className="cell-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Factor Name</th>
                              <th>CO2 Value</th>
                              <th>Unit</th>
                              <th>Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisResult.map((item, idx) => (
                              item.factor && item.factor.map((factor, fIdx) => (
                                <tr key={`${idx}-${fIdx}`}>
                                  <td className="item-name">{item.name || '—'}</td>
                                  <td>{factor.name || '—'}</td>
                                  <td>{factor.co2 || '—'}</td>
                                  <td>{factor.co2_unit || '—'}</td>
                                  <td>{factor.factorConfidence || 0}%</td>
                                </tr>
                              ))
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="secondary-button" onClick={resetAnalysis}>
                    Analyze Another
                  </button>
                  <button className="primary-button">
                    Export Results
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoiceAnalyzerV2


