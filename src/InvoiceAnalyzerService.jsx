import { useState, useRef } from 'react'
import './InvoiceAnalyzer.css'

function InvoiceAnalyzerService({
  selectedFile,
  isAnalyzing,
  result,
  onFileSelect,
  onAnalyze,
  onReset,
  theme = 'dark'
}) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
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

  const analyze = () => {
    if (!selectedFile) return
    onAnalyze()
  }

  const reset = () => {
    onReset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isSupplierNotFound =
    result && result.status === 'error' && result.error_code === 'SUPPLIER_NOT_FOUND'

  return (
    <div className={`invoice-analyzer ${theme}`}>
      <div className="analyzer-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="analyzer-title">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.75rem' }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Service Invoice Analyzer
            </h1>
            <p className="analyzer-subtitle">
              Upload a service-based invoice to calculate a single consolidated tCO2 value.
            </p>
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
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3>Drop your service invoice here</h3>
            <p>Or click to browse files</p>
            <div className="supported-formats">Supports: JPG, PNG, PDF</div>
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
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="file-details">
                  <h3>{selectedFile.name}</h3>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button className="remove-file" onClick={reset}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {!result && (
              <div className="analyze-controls">
                <button className="analyze-button" onClick={analyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <span className="analyzing">
                      <span className="spinner"></span>
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                      Analyze Service Invoice
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="analysis-results">
                <div className="results-header">
                  <h3>
                    {result.status === 'success'
                      ? 'Service Invoice Summary'
                      : 'Service Invoice Error'}
                  </h3>
                </div>

                <div className="results-grid">
                  <div className="result-card">
                    <h4>Summary</h4>
                    <div className="detail-row">
                      <span>Status:</span>
                      <span
                        style={{
                          color:
                            result.status === 'success'
                              ? '#28a745'
                              : isSupplierNotFound
                              ? '#d9534f'
                              : '#f0ad4e'
                        }}
                      >
                        {result.status === 'success' ? 'Success' : 'Error'}
                      </span>
                    </div>
                    {result.filename && (
                      <div className="detail-row">
                        <span>File:</span>
                        <span>{result.filename}</span>
                      </div>
                    )}
                    {result.supplier && (
                      <div className="detail-row">
                        <span>Supplier:</span>
                        <span>{result.supplier}</span>
                      </div>
                    )}
                    {typeof result.total_cost === 'number' && (
                      <div className="detail-row">
                        <span>Total Cost:</span>
                        <span>${result.total_cost.toFixed(2)}</span>
                      </div>
                    )}
                    {result.methodology && (
                      <div className="detail-row">
                        <span>Methodology:</span>
                        <span>{result.methodology}</span>
                      </div>
                    )}
                    {typeof result.extracted_text_length === 'number' && (
                      <div className="detail-row">
                        <span>Extracted Text Length:</span>
                        <span>{result.extracted_text_length}</span>
                      </div>
                    )}
                  </div>

                  {result.status === 'success' && (
                    <div className="result-card">
                      <h4>Emissions</h4>
                      <div className="detail-row">
                        <span>Emission Factor Name:</span>
                        <span>{result.emission_factor_name || 'N/A'}</span>
                      </div>
                      {typeof result.emission_factor_value === 'number' && (
                        <div className="detail-row">
                          <span>Emission Factor Value:</span>
                          <span>{result.emission_factor_value}</span>
                        </div>
                      )}
                      {result.tco2 && (
                        <div className="detail-row total">
                          <span>Total Emissions (tCO2):</span>
                          <span>{result.tco2}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {result.status === 'error' && (
                    <div className="result-card">
                      <h4>Error Details</h4>
                      {result.error_code && (
                        <div className="detail-row">
                          <span>Error Code:</span>
                          <span>{result.error_code}</span>
                        </div>
                      )}
                      {result.message && (
                        <div className="detail-row">
                          <span>Message:</span>
                          <span>{result.message}</span>
                        </div>
                      )}
                      {isSupplierNotFound && (
                        <div className="detail-row">
                          <span>Hint:</span>
                          <span>
                            Supplier not found in mapping table. Please verify the supplier name on
                            the invoice matches one of the supported suppliers.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="action-buttons">
                  <button className="secondary-button" onClick={reset}>
                    Analyze Another
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

export default InvoiceAnalyzerService

