import { useState, useRef } from 'react'
import './InvoiceAnalyzer.css'

function InvoiceAnalyzer({ 
  selectedFile, 
  isAnalyzing, 
  analysisResult, 
  onFileSelect, 
  onAnalyze, 
  onReset 
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
                    <button className="chip-button" onClick={() => { setExpandLineItems(true); setExpandEmissions(true) }}>Expand all</button>
                    <button className="chip-button" onClick={() => { setExpandLineItems(false); setExpandEmissions(false) }}>Collapse all</button>
                  </div>
                </div>
                
                <div className="results-grid">
                  <div className="result-card">
                    <h4>Invoice Details</h4>
                    <div className="detail-row">
                      <span>Invoice #:</span>
                      <span>{analysisResult.invoiceNumber}</span>
                    </div>
                    <div className="detail-row">
                      <span>Vendor:</span>
                      <span>{analysisResult.vendor}</span>
                    </div>
                    <div className="detail-row">
                      <span>Date:</span>
                      <span>{analysisResult.date}</span>
                    </div>
                    <div className="detail-row total">
                      <span>Total:</span>
                      <span>{analysisResult.total}</span>
                    </div>
                    {analysisResult.methodology && (
                      <div className="detail-row">
                        <span>Methodology:</span>
                        <span>{analysisResult.methodology}</span>
                      </div>
                    )}
                    {analysisResult.filename && (
                      <div className="detail-row">
                        <span>File:</span>
                        <span>{analysisResult.filename}</span>
                      </div>
                    )}
                    {typeof analysisResult.extractedTextLength === 'number' && (
                      <div className="detail-row">
                        <span>Extracted Text Length:</span>
                        <span>{analysisResult.extractedTextLength}</span>
                      </div>
                    )}
                  </div>

                  <div className="result-card">
                    <h4>Environmental Impact</h4>
                    <div className="impact-metric">
                      <div className="metric-icon">🌱</div>
                      <div className="metric-text">
                        <div className="metric-value">{analysisResult.carbonFootprint.estimated}</div>
                        <div className="metric-desc">{analysisResult.carbonFootprint.equivalence}</div>
                      </div>
                    </div>
                  </div>

                  <div className="result-card items-card">
                    <div className="card-header">
                      <h4>Line Items</h4>
                      <button className="card-toggle" onClick={() => setExpandLineItems(v => !v)}>{expandLineItems ? 'Hide' : 'Show'}</button>
                    </div>
                    {expandLineItems && (
                    <div className="items-list scroll-section">
                      {analysisResult.items.map((item, index) => (
                        <div key={index} className="item-row expanded">
                          <div className="item-main">
                            <div className="item-desc">{item.description}</div>
                            <div className="item-qty">Qty: {item.quantity}</div>
                            <div className="item-price">{item.price}</div>
                          </div>
                          <div className="item-details">
                            {typeof item.unitPrice === 'number' && (
                              <div className="item-unit-price">Unit Price: ${item.unitPrice.toFixed(2)}</div>
                            )}
                            <div className="item-weight">Weight: {item.weight || 'N/A'}</div>
                            <div className="item-material">Material: {item.material || 'N/A'}</div>
                            <div className="item-method">Method: {item.method || 'N/A'}</div>
                            <div className="item-confidence">
                              Confidence: {item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                  <div className="result-card">
                    <div className="card-header">
                      <h4>Emissions</h4>
                      <button className="card-toggle" onClick={() => setExpandEmissions(v => !v)}>{expandEmissions ? 'Hide' : 'Show'}</button>
                    </div>
                    {!analysisResult.emissions && (
                      <div className="detail-row">
                        <span>Summary:</span>
                        <span>No emissions data available</span>
                      </div>
                    )}
                    {analysisResult.emissions && analysisResult.emissions.error && (
                      <div className="detail-row">
                        <span>Status:</span>
                        <span style={{ color: '#d9534f' }}>Error - {analysisResult.emissions.error.message}</span>
                      </div>
                    )}
                    {analysisResult.emissions && !analysisResult.emissions.error && expandEmissions && (
                      <>
                        <div className="detail-row">
                          <span>Invoice:</span>
                          <span>{analysisResult.emissions.invoice_name}</span>
                        </div>
                        <div className="detail-row">
                          <span>Supplier:</span>
                          <span>{analysisResult.emissions.supplier}</span>
                        </div>
                        <div className="detail-row">
                          <span>Currency:</span>
                          <span>{analysisResult.emissions.currency}</span>
                        </div>
                        <div className="items-list scroll-section">
                          {analysisResult.emissions.items?.map((eItem, idx) => (
                            <div key={idx} className="item-row expanded">
                              <div className="item-main">
                                <div className="item-desc">{eItem.name}</div>
                                <div className="item-qty">Method: {eItem.methodology_applied}</div>
                                <div className="item-price">Emissions: {typeof eItem.emissions_kgco2e === 'number' ? `${eItem.emissions_kgco2e.toFixed(2)} kgCO2e` : 'N/A'}</div>
                              </div>
                              <div className="item-details">
                                <div className="item-weight">Inputs:</div>
                                <div className="item-material">
                                  Qty: {eItem.inputs?.quantity ?? 'N/A'} | Unit Price: {typeof eItem.inputs?.unit_price === 'number' ? `$${eItem.inputs.unit_price.toFixed(2)}` : 'N/A'} | Total: {typeof eItem.inputs?.total_price === 'number' ? `$${eItem.inputs.total_price.toFixed(2)}` : 'N/A'}
                                </div>
                                <div className="item-weight">Weight: {eItem.inputs?.weight ?? 'N/A'} | Material: {eItem.inputs?.material ?? 'N/A'}</div>
                                {eItem.factor_used && (
                                  <div className="item-material">Factor: {eItem.factor_used.value} {eItem.factor_used.unit} ({eItem.factor_used.basis})</div>
                                )}
                                {eItem.calculation && (
                                  <div className="item-material">Calc: <TruncatedText text={eItem.calculation} /></div>
                                )}
                                {eItem.assumptions && (
                                  <div className="item-material">Assumptions: <TruncatedText text={eItem.assumptions} /></div>
                                )}
                                {typeof eItem.confidence === 'number' && (
                                  <div className="item-confidence">Confidence: {(eItem.confidence * 100).toFixed(0)}%</div>
                                )}
                                {eItem.source && (
                                  <div className="item-material">Source: {eItem.source}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="detail-row total">
                          <span>Total Emissions:</span>
                          <span>{typeof analysisResult.emissions.totals?.sum_emissions_kgco2e === 'number' ? `${analysisResult.emissions.totals.sum_emissions_kgco2e.toFixed(2)} kgCO2e` : 'N/A'}</span>
                        </div>
                        {analysisResult.emissions.notes && (
                          <div className="detail-row">
                            <span>Notes:</span>
                            <span className="long-text"><TruncatedText text={analysisResult.emissions.notes} limit={320} /></span>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoiceAnalyzer