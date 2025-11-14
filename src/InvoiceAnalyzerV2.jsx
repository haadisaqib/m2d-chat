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
  onMethodologyChange,
  theme = 'dark'
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

  // Escape CSV value (handle commas, quotes, newlines)
  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Export analysis results to CSV
  const exportToCsv = () => {
    if (!analysisResult || analysisResult.length === 0) {
      alert('No analysis results to export')
      return
    }

    const rows = []

    // Summary section
    rows.push('Summary')
    rows.push('File,Total Items,Total Emissions (tCO2)')
    rows.push([
      escapeCsvValue(selectedFile?.name || 'N/A'),
      escapeCsvValue(analysisResult.length),
      escapeCsvValue(totalEmissions.toFixed(2))
    ].join(','))

    // Blank line separator
    rows.push('')

    // Invoice Items section
    rows.push('Invoice Items')
    rows.push([
      'Name',
      'Quantity',
      'Consumption',
      'Supplier',
      'Emissions (tCO2)',
      'Confidence (%)',
      'Factor Name',
      'CO2 Value',
      'CO2 Unit',
      'Factor Confidence (%)'
    ].join(','))

    // Add each item as a row
    analysisResult.forEach((item) => {
      const quantity = item.usages ? `${item.usages} ${item.usageUnit || ''}`.trim() : '—'
      const consumption = item.consumption ? `${item.consumption} ${item.consumptionUnit || ''}`.trim() : '—'
      
      rows.push([
        escapeCsvValue(item.name || item.description || '—'),
        escapeCsvValue(quantity),
        escapeCsvValue(consumption),
        escapeCsvValue(item.tagName || '—'),
        escapeCsvValue(parseFloat(item.tco2 || 0).toFixed(2)),
        escapeCsvValue(item.weightConfidence || 0),
        escapeCsvValue(item.factor?.name || '—'),
        escapeCsvValue(item.factor?.co2 || '—'),
        escapeCsvValue(item.factor?.co2_unit || '—'),
        escapeCsvValue(item.factor?.factorConfidence || 0)
      ].join(','))
    })

    // Join all rows with newlines
    const csvContent = rows.join('\n')

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const baseFilename = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'invoice-analysis'
    const filename = `${baseFilename}-${timestamp}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`invoice-analyzer ${theme}`}>
      <div className="analyzer-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="analyzer-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.75rem' }}>
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Invoice Analyzer V2
            </h1>
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
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
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
                <div className="file-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="file-details">
                  <h3>{selectedFile.name}</h3>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button className="remove-file" onClick={resetAnalysis}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
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
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                      Analyze Invoice
                    </>
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
                              item.factor && (
                                <tr key={idx}>
                                  <td className="item-name">{item.name || '—'}</td>
                                  <td>{item.factor.name || '—'}</td>
                                  <td>{item.factor.co2 || '—'}</td>
                                  <td>{item.factor.co2_unit || '—'}</td>
                                  <td>{item.factor.factorConfidence || 0}%</td>
                                </tr>
                              )
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
                  <button className="primary-button" onClick={exportToCsv}>
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


