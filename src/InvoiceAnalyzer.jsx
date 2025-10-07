import { useState, useRef } from 'react'
import './InvoiceAnalyzer.css'

function InvoiceAnalyzer({ 
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
  const [expandLineItems, setExpandLineItems] = useState(true)
  const [expandEmissions, setExpandEmissions] = useState(true)

  const TruncatedText = ({ text, limit = 240 }) => {
    const [expanded, setExpanded] = useState(false)
    if (!text) return null
    const isLong = text.length > limit
    const shown = expanded || !isLong ? text : text.slice(0, limit) + '…'
    return (
      <span>
        {shown}
        {isLong && (
          <button className="inline-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? ' Show less' : ' Show more'}
          </button>
        )}
      </span>
    )
  }

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

  return (
    <div className="invoice-analyzer purple-theme">
      <div className="analyzer-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="analyzer-title">📄 Invoice Analyzer</h1>
            <p className="analyzer-subtitle">Upload your invoices to analyze environmental impact and costs</p>
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
                {(() => {
                  const api = analysisResult?.result ? analysisResult.result : analysisResult
                  const formatted = api?.formatted_result
                  const emissions = api?.emission_calculations || api?.emissions_calculations || api?.emissions
                  const meta = {
                    filename: api?.filename || analysisResult?.filename,
                    supplier: formatted?.supplier ?? emissions?.supplier ?? analysisResult?.vendor ?? analysisResult?.supplier,
                    total_cost: typeof formatted?.total_cost === 'number' ? formatted.total_cost : analysisResult?.total,
                    methodology: api?.methodology || analysisResult?.methodology,
                    extracted_text_length: api?.extracted_text_length ?? analysisResult?.extractedTextLength
                  }
                  const items = Array.isArray(formatted?.items) ? formatted.items : (Array.isArray(analysisResult?.items) ? analysisResult.items : [])
                  const emissionsError = emissions && emissions.status === 'error'
                  const emissionsOk = emissions && !emissionsError
                  return (
                    <>
                      <div className="results-header">
                        <h3>Analysis Results</h3>
                        <div className="results-actions">
                          <button className="chip-button" onClick={() => { setExpandLineItems(true); setExpandEmissions(true) }}>Expand all</button>
                          <button className="chip-button" onClick={() => { setExpandLineItems(false); setExpandEmissions(false) }}>Collapse all</button>
                        </div>
                      </div>

                      <div className="results-grid">
                        <div className="result-card">
                          <h4>Header / Meta</h4>
                          <div className="detail-row">
                            <span>File:</span>
                            <span>{meta.filename || selectedFile?.name || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span>Supplier:</span>
                            <span>{meta.supplier || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span>Total Cost:</span>
                            <span>{typeof meta.total_cost === 'number' ? `$${meta.total_cost.toFixed(2)}` : (meta.total_cost || 'N/A')}</span>
                          </div>
                          <div className="detail-row">
                            <span>Methodology:</span>
                            <span>{meta.methodology || 'N/A'}</span>
                          </div>
                          {typeof meta.extracted_text_length === 'number' && (
                            <div className="detail-row">
                              <span>Extracted Text Length:</span>
                              <span>{meta.extracted_text_length}</span>
                            </div>
                          )}
                        </div>

                        <div className="result-card items-card">
                          <div className="card-header">
                            <h4>Items (LLM)</h4>
                            <button className="card-toggle" onClick={() => setExpandLineItems(v => !v)}>{expandLineItems ? 'Hide' : 'Show'}</button>
                          </div>
                          {expandLineItems && (
                            <div className="table-wrapper scroll-section">
                              <table className="cell-table">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Total Price</th>
                                    <th>Method</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="empty">No items</td>
                                    </tr>
                                  )}
                                  {items.map((it, idx) => (
                                    <tr key={idx}>
                                      <td>{it.name || it.description || '—'}</td>
                                      <td>{typeof it.quantity === 'number' ? it.quantity : '—'}</td>
                                      <td>{typeof it.unit_price === 'number' ? `$${it.unit_price.toFixed(2)}` : (typeof it.unitPrice === 'number' ? `$${it.unitPrice.toFixed(2)}` : '—')}</td>
                                      <td>{typeof it.total_price === 'number' ? `$${it.total_price.toFixed(2)}` : (typeof it.price === 'number' ? `$${it.price.toFixed(2)}` : (it.price || '—'))}</td>
                                      <td>{it.method || it.methodology_applied || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div className="result-card items-card">
                          <div className="card-header">
                            <h4>Emissions (Expert)</h4>
                            <button className="card-toggle" onClick={() => setExpandEmissions(v => !v)}>{expandEmissions ? 'Hide' : 'Show'}</button>
                          </div>
                          {!emissions && (
                            <div className="detail-row">
                              <span>Summary:</span>
                              <span>No emissions data available</span>
                            </div>
                          )}
                          {emissionsError && (
                            <div className="detail-row">
                              <span>Status:</span>
                              <span style={{ color: '#d9534f' }}>Error - {emissions?.message || 'Unknown error'}</span>
                            </div>
                          )}
                          {emissionsOk && expandEmissions && (
                            <>
                              <div className="detail-row">
                                <span>Invoice:</span>
                                <span>{emissions.invoice_name || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <span>Supplier:</span>
                                <span>{emissions.supplier || 'N/A'}</span>
                              </div>
                              <div className="detail-row">
                                <span>Currency:</span>
                                <span>{emissions.currency || 'N/A'}</span>
                              </div>
                              <div className="table-wrapper scroll-section">
                                <table className="cell-table">
                                  <thead>
                                    <tr>
                                      <th>Name</th>
                                      <th>Factor Used</th>
                                      <th>Calculation</th>
                                      <th>Emissions (kgCO2e)</th>
                                      <th>Confidence</th>
                                      <th>Source</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Array.isArray(emissions.items) && emissions.items.length > 0 ? (
                                      emissions.items.map((eItem, idx) => (
                                        <tr key={idx}>
                                          <td>{eItem.name || '—'}</td>
                                          <td>{eItem.factor_used ? `${eItem.factor_used.value} ${eItem.factor_used.unit}` : '—'}</td>
                                          <td className="calc"><TruncatedText text={eItem.calculation} limit={160} /></td>
                                          <td>{typeof eItem.emissions_kgco2e === 'number' ? eItem.emissions_kgco2e.toFixed(2) : '—'}</td>
                                          <td>{typeof eItem.confidence === 'number' ? `${(eItem.confidence * 100).toFixed(0)}%` : '—'}</td>
                                          <td>{eItem.source || '—'}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={6} className="empty">No emissions items</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              <div className="detail-row total">
                                <span>Total Emissions:</span>
                                <span>{typeof emissions.totals?.sum_emissions_kgco2e === 'number' ? `${emissions.totals.sum_emissions_kgco2e.toFixed(2)} kgCO2e` : 'N/A'}</span>
                              </div>
                              {emissions.notes && (
                                <div className="detail-row">
                                  <span>Notes:</span>
                                  <span className="long-text"><TruncatedText text={emissions.notes} limit={320} /></span>
                                </div>
                              )}
                            </>
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
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoiceAnalyzer