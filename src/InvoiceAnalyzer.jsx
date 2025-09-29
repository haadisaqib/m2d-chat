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
                <h3>Analysis Results</h3>
                
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
                    <h4>Line Items</h4>
                    <div className="items-list">
                      {analysisResult.items.map((item, index) => (
                        <div key={index} className="item-row expanded">
                          <div className="item-main">
                            <div className="item-desc">{item.description}</div>
                            <div className="item-qty">Qty: {item.quantity}</div>
                            <div className="item-price">{item.price}</div>
                          </div>
                          <div className="item-details">
                            <div className="item-weight">Weight: {item.weight || 'N/A'}</div>
                            <div className="item-material">Material: {item.material || 'N/A'}</div>
                            <div className="item-confidence">
                              Confidence: {item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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