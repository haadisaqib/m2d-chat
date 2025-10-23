import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import InvoiceAnalyzer from './InvoiceAnalyzer'
import InvoiceAnalyzerV2 from './InvoiceAnalyzerV2'
import './App.css'
import m2dLogo from './assets/m2d.png'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [environment, setEnvironment] = useState('prod') // 'dev' | 'prod'
  
  // Invoice analyzer state
  const [invoiceFile, setInvoiceFile] = useState(null)
  const [invoiceAnalysis, setInvoiceAnalysis] = useState(null)
  const [invoiceAnalyzing, setInvoiceAnalyzing] = useState(false)
  const [invoiceMethodology, setInvoiceMethodology] = useState('auto')
  
  // Invoice analyzer V2 state
  const [invoiceV2File, setInvoiceV2File] = useState(null)
  const [invoiceV2Analysis, setInvoiceV2Analysis] = useState(null)
  const [invoiceV2Analyzing, setInvoiceV2Analyzing] = useState(false)
  const [invoiceV2Methodology, setInvoiceV2Methodology] = useState('auto')
  
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMessage])

  const baseUrl = environment === 'dev' ? 'http://localhost:8000' : 'https://api.m2d.com'

  const sendMessage = async () => {
    if (!inputMessage.trim()) return
    
    const userMessage = { role: 'user', content: inputMessage, id: Date.now() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 1'
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({ role: msg.role, content: msg.content })),
          user_id: 'user-' + Date.now()
        })
      })

      const data = await response.json()
      
      const aiMessage = { 
        role: 'assistant', 
        content: data.response,
        timestamp: data.timestamp,
        id: Date.now() + 1
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        id: Date.now() + 1
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Invoice analysis handler
  const analyzeInvoice = async () => {
    if (!invoiceFile) return

    setInvoiceAnalyzing(true)
    setInvoiceAnalysis(null)
    
    try {
      // Convert file to base64 using ArrayBuffer (no data URI prefix)
      const arrayBuffer = await invoiceFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binaryString = ''
      const chunkSize = 8192 // Process in chunks to avoid stack overflow
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize)
        binaryString += String.fromCharCode(...chunk)
      }
      const base64Data = btoa(binaryString)
      
      // Prepare API payload
      const payload = {
        document_base64: base64Data,
        methodology: invoiceMethodology || 'auto',
        filename: invoiceFile.name
      }

      // Make API call
      const url = `${baseUrl}/api/v1/invoice-analyzer/invoice?methodology=${encodeURIComponent(invoiceMethodology || 'auto')}`
      
      console.log('Request URL:', url)
      console.log('Request payload:', payload)
      console.log('Base64 length:', base64Data.length)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 1'
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.status === 'success' && data.result) {
        // Transform API response to match UI structure
        const formattedResult = data.result.formatted_result || {}
        const emissionCalculations = data.result.emission_calculations || data.result.emissions_calculations || data.result.emissions

        // Build emissions structure with error handling
        let emissions = null
        let carbonEstimatedText = 'N/A'
        let carbonEquivalenceText = 'Carbon impact unavailable'

        if (emissionCalculations && emissionCalculations.status === 'error') {
          emissions = { error: { message: emissionCalculations.message || 'Unknown error' } }
        } else if (emissionCalculations && Array.isArray(emissionCalculations.items)) {
          const sum = emissionCalculations.totals?.sum_emissions_kgco2e
          emissions = {
            invoice_name: emissionCalculations.invoice_name,
            supplier: emissionCalculations.supplier,
            currency: emissionCalculations.currency,
            items: emissionCalculations.items,
            totals: emissionCalculations.totals,
            notes: emissionCalculations.notes
          }
          if (typeof sum === 'number') {
            carbonEstimatedText = `${sum.toFixed(2)} kgCO2e`
            carbonEquivalenceText = `Total estimated emissions`
          }
        }

        setInvoiceAnalysis({
          vendor: formattedResult.supplier || 'Unknown Vendor',
          total: `$${(formattedResult.total_cost ?? 0).toFixed(2)}`,
          date: new Date().toLocaleDateString(), // API doesn't provide date, using current date
          invoiceNumber: formattedResult.invoice_name || 'N/A',
          items: (formattedResult.items || []).map(item => ({
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            price: `$${(item.total_price ?? 0).toFixed(2)}`,
            weight: item.weight,
            material: item.material,
            confidence: item.confidence,
            method: item.method
          })),
          carbonFootprint: {
            estimated: carbonEstimatedText,
            equivalence: carbonEquivalenceText
          },
          emissions,
          methodology: data.result.methodology,
          filename: data.result.filename,
          extractedTextLength: data.result.extracted_text_length,
          rawData: data.result // Store raw data for debugging/export
        })
      } else {
        throw new Error(data.message || 'Failed to analyze invoice')
      }
    } catch (error) {
      console.error('Error analyzing invoice:', error)
      alert(`Failed to analyze invoice: ${error.message}`)
      setInvoiceAnalysis(null)
    } finally {
      setInvoiceAnalyzing(false)
    }
  }

  // Invoice file handler
  const handleInvoiceFile = (file) => {
    if (file.type.includes('image/') || file.type === 'application/pdf') {
      setInvoiceFile(file)
      setInvoiceAnalysis(null)
    } else {
      alert('Please select an image file or PDF')
    }
  }

  // Invoice reset handler
  const resetInvoiceAnalysis = () => {
    setInvoiceFile(null)
    setInvoiceAnalysis(null)
  }

  // Invoice V2 analysis handler
  const analyzeInvoiceV2 = async () => {
    if (!invoiceV2File) return

    setInvoiceV2Analyzing(true)
    setInvoiceV2Analysis(null)
    
    try {
      // Convert file to base64 using ArrayBuffer (no data URI prefix)
      const arrayBuffer = await invoiceV2File.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binaryString = ''
      const chunkSize = 8192 // Process in chunks to avoid stack overflow
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize)
        binaryString += String.fromCharCode(...chunk)
      }
      const base64Data = btoa(binaryString)
      
      // Prepare API payload
      const payload = {
        document_base64: base64Data,
        filename: invoiceV2File.name
      }

      // Make API call to V2 endpoint
      const url = `${baseUrl}/api/v1/invoice-analyzer-v2/invoice?methodology=${encodeURIComponent(invoiceV2Methodology || 'auto')}`
      
      console.log('V2 Request URL:', url)
      console.log('V2 Request payload:', payload)
      console.log('V2 Base64 length:', base64Data.length)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 1'
        },
        body: JSON.stringify(payload)
      })

      console.log('V2 Response status:', response.status)
      console.log('V2 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('V2 Error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const responseText = await response.text()
      console.log('V2 Raw response text:', responseText)
      
      // Try to extract JSON from the response (in case there are log messages mixed in)
      let data
      try {
        // First try to parse the entire response as JSON
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.log('Failed to parse as JSON, trying to extract JSON from response')
        // If that fails, try to find JSON array in the response
        // Look for the first '[' that starts a JSON array
        const firstBracket = responseText.indexOf('[')
        if (firstBracket !== -1) {
          // Find the matching closing bracket by counting brackets
          let bracketCount = 0
          let endIndex = firstBracket
          for (let i = firstBracket; i < responseText.length; i++) {
            if (responseText[i] === '[') bracketCount++
            if (responseText[i] === ']') bracketCount--
            if (bracketCount === 0) {
              endIndex = i
              break
            }
          }
          const jsonString = responseText.substring(firstBracket, endIndex + 1)
          data = JSON.parse(jsonString)
        } else {
          throw new Error('Could not find JSON array in response')
        }
      }
      
      console.log('V2 Parsed data:', data)
      console.log('Data type:', typeof data)
      console.log('Has result?', !!data?.result)
      console.log('Has emission_calculations?', !!data?.result?.emission_calculations)
      console.log('Is emission_calculations array?', Array.isArray(data?.result?.emission_calculations))

      // V2 API returns a wrapper object with emissions in result.emission_calculations
      if (data && data.result && Array.isArray(data.result.emission_calculations)) {
        console.log('Setting V2 analysis with emissions array')
        setInvoiceV2Analysis(data.result.emission_calculations)
      } else if (data && data.status === 'error') {
        throw new Error(data.detail || 'Failed to analyze invoice')
      } else if (Array.isArray(data)) {
        // Fallback: if it's still a direct array (old format)
        console.log('Fallback: Setting V2 analysis with direct array data')
        setInvoiceV2Analysis(data)
      } else {
        console.log('Unexpected response format:', data)
        throw new Error('Unexpected response format')
      }
    } catch (error) {
      console.error('Error analyzing invoice V2:', error)
      alert(`Failed to analyze invoice: ${error.message}`)
      setInvoiceV2Analysis(null)
    } finally {
      setInvoiceV2Analyzing(false)
    }
  }

  // Invoice V2 file handler
  const handleInvoiceV2File = (file) => {
    if (file.type.includes('image/') || file.type === 'application/pdf') {
      setInvoiceV2File(file)
      setInvoiceV2Analysis(null)
    } else {
      alert('Please select an image file or PDF')
    }
  }

  // Invoice V2 reset handler
  const resetInvoiceV2Analysis = () => {
    setInvoiceV2File(null)
    setInvoiceV2Analysis(null)
  }


  return (
    <div className="app">
      <div className="tab-navigation">
        <div className="tab-container">
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button 
            className={`tab-button ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            📄 Invoice Analyzer
            {invoiceFile && !invoiceAnalyzing && !invoiceAnalysis && (
              <span className="tab-status file-uploaded">📁</span>
            )}
            {invoiceAnalyzing && (
              <span className="tab-status analyzing">⏳</span>
            )}
            {invoiceAnalysis && (
              <span className="tab-status completed">✅</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'invoice-v2' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice-v2')}
          >
            📊 Invoice Analyzer V2
            {invoiceV2File && !invoiceV2Analyzing && !invoiceV2Analysis && (
              <span className="tab-status file-uploaded">📁</span>
            )}
            {invoiceV2Analyzing && (
              <span className="tab-status analyzing">⏳</span>
            )}
            {invoiceV2Analysis && (
              <span className="tab-status completed">✅</span>
            )}
          </button>
          <div className="env-toggle">
            <span className="env-label">Env</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={environment === 'prod'}
                onChange={(e) => setEnvironment(e.target.checked ? 'prod' : 'dev')}
              />
              <span className="toggle-slider">
                <span className="toggle-text">{environment === 'prod' ? 'PROD' : 'DEV'}</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-section">
              <div className="logo-container">
                <div className="logo">
                  <img src={m2dLogo} alt="Minus2Degrees" className="logo-image" />
                </div>
                <p className="tagline">Your AI assistant for sustainable living</p>
              </div>
              <div className="starter-prompts">
                <div className="prompt-card" onClick={() => setInputMessage("How can I reduce my carbon footprint at home?")}>
                  <span>How can I reduce my carbon footprint at home?</span>
                </div>
                <div className="prompt-card" onClick={() => setInputMessage("What are the best renewable energy options for my house?")}>
                  <span>What are the best renewable energy options for my house?</span>
                </div>
                <div className="prompt-card" onClick={() => setInputMessage("How do I start composting as a beginner?")}>
                  <span>How do I start composting as a beginner?</span>
                </div>
                <div className="prompt-card" onClick={() => setInputMessage("What sustainable transportation alternatives should I consider?")}>
                  <span>What sustainable transportation alternatives should I consider?</span>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`message-wrapper ${message.role}`}>
              <div className="message">
                <div className="message-avatar">
                  {message.role === 'user' ? (
                    <div className="user-avatar">You</div>
                  ) : (
                    <div className="ai-avatar"><img src={m2dLogo} alt="M2D" className="ai-avatar-image" /></div>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.timestamp && (
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message-wrapper assistant">
              <div className="message">
                <div className="message-avatar">
                  <div className="ai-avatar"><img src={m2dLogo} alt="M2D" className="ai-avatar-image" /></div>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-section">
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Minus2Degrees..."
                rows="1"
                disabled={isLoading}
                className="message-input"
              />
              <button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        </div>
      ) : activeTab === 'invoice-v2' ? (
        <InvoiceAnalyzerV2 
          selectedFile={invoiceV2File}
          isAnalyzing={invoiceV2Analyzing}
          analysisResult={invoiceV2Analysis}
          onFileSelect={handleInvoiceV2File}
          onAnalyze={analyzeInvoiceV2}
          onReset={resetInvoiceV2Analysis}
          methodology={invoiceV2Methodology}
          onMethodologyChange={setInvoiceV2Methodology}
        />
      ) : (
        <InvoiceAnalyzer 
          selectedFile={invoiceFile}
          isAnalyzing={invoiceAnalyzing}
          analysisResult={invoiceAnalysis}
          onFileSelect={handleInvoiceFile}
          onAnalyze={analyzeInvoice}
          onReset={resetInvoiceAnalysis}
          methodology={invoiceMethodology}
          onMethodologyChange={setInvoiceMethodology}
        />
      )}
    </div>
  )
}

export default App
