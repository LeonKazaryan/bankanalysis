import { useRef, useState, type DragEvent } from 'react'
import { BookOpen, FileText, LockKeyhole, Search, Shield, Upload, UserRound, Video, type LucideIcon } from 'lucide-react'
import './App.css'

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024

const icons = {
  video: Video,
  investigation: FileText,
  employees: UserRound,
  file: FileText,
  search: Search,
  shield: Shield,
  book: BookOpen,
  upload: Upload,
  lock: LockKeyhole,
} satisfies Record<string, LucideIcon>

function Icon({ name, size = 20, className = '' }: { name: keyof typeof icons; size?: number; className?: string }) {
  const IconComponent = icons[name]
  return <IconComponent className={className} size={size} strokeWidth={1.8} aria-hidden="true" />
}

function formatSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  function acceptFile(candidate?: File) {
    if (!candidate) return
    if (!candidate.name.toLowerCase().endsWith('.mov')) {
      setFile(null)
      setError('Choose a .mov video file to continue.')
      return
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null)
      setError('The selected file is larger than 2 GB.')
      return
    }
    setError('')
    setFile(candidate)
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files[0])
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#video-analysis" aria-label="ForteBank home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>ForteBank</span>
        </a>

        <nav className="primary-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#video-analysis" aria-current="page">
            <Icon name="video" /><span>Video Analysis</span>
          </a>
          <span className="nav-item unavailable" aria-disabled="true" title="Available in a later version">
            <Icon name="investigation" /><span>Investigations</span><span className="nav-soon">Later</span>
          </span>
          <span className="nav-item unavailable" aria-disabled="true" title="Available in a later version">
            <Icon name="employees" /><span>Employees</span><span className="nav-soon">Later</span>
          </span>
        </nav>

        <div className="sidebar-foot">
          <span className="status-dot" />
          <div><strong>Frontend prototype</strong><span>Analysis is not connected</span></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">Compliance Intelligence <span>/</span> <strong>Video Analysis</strong></div>
          <div className="topbar-label">Internal workspace</div>
        </header>

        <main className="page-content" id="video-analysis">
          <div className="page-heading">
            <div>
              <div className="eyebrow">VIDEO REVIEW</div>
              <h1>Video Analysis</h1>
              <p>Upload a cashier operation video to prepare it for compliance review.</p>
            </div>
          </div>

          <div className="workspace-grid">
            <section className="upload-panel" aria-labelledby="upload-title">
              <div
                className={`dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  className="visually-hidden"
                  type="file"
                  accept=".mov,video/quicktime"
                  onChange={(event) => { acceptFile(event.target.files?.[0]); event.target.value = '' }}
                  aria-label="Choose a .mov video file"
                />
                {file ? (
                  <div className="selected-file">
                    <div className="upload-symbol"><Icon name="file" size={28} /></div>
                    <span className="file-label">VIDEO SELECTED</span>
                    <h2 id="upload-title" className="selected-name">{file.name}</h2>
                    <p className="file-size">{formatSize(file.size)} <span>·</span> .mov</p>
                    <button type="button" className="button-secondary" onClick={openFilePicker}>Choose another file</button>
                    <p className="prototype-note">Analysis will be available when the backend is connected.</p>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <div className="upload-symbol"><Icon name="video" size={30} /></div>
                    <span className="file-label">SECURE VIDEO INTAKE</span>
                    <h2 id="upload-title">Upload a video to get started</h2>
                    <p>Drag and drop a .mov file here, or browse your device.</p>
                    <button type="button" className="button-primary" onClick={openFilePicker}>
                      <Icon name="upload" size={17} /> Choose video file
                    </button>
                    <div className="file-requirements"><span>Format <b>.mov</b></span><i /> <span>Maximum size <b>2 GB</b></span></div>
                    {error && <p className="upload-error" role="alert">{error}</p>}
                  </div>
                )}
              </div>

              <div className="benefits" aria-label="Review capabilities">
                <div className="benefit">
                  <span className="benefit-icon mint"><Icon name="search" /></span>
                  <div><h3>Detect potential violations</h3><p>Identify moments that may need a closer look.</p></div>
                </div>
                <div className="benefit">
                  <span className="benefit-icon rose"><Icon name="file" /></span>
                  <div><h3>Review visual evidence</h3><p>Inspect relevant frames and timestamps.</p></div>
                </div>
                <div className="benefit">
                  <span className="benefit-icon blue"><Icon name="shield" /></span>
                  <div><h3>Assess with regulations</h3><p>Keep findings grounded in applicable guidance.</p></div>
                </div>
              </div>
            </section>

            <aside className="info-column" aria-label="Upload information">
              <section className="info-panel process-panel">
                <div className="panel-title"><span className="panel-icon"><Icon name="book" /></span><h2>How it works</h2></div>
                <ol className="steps">
                  <li><span className="step-number">1</span><div><h3>Upload a .mov video</h3><p>Select a file from your device. It stays in this browser for now.</p></div></li>
                  <li><span className="step-number">2</span><div><h3>Analysis connection</h3><p>Backend processing will be added in a later project stage.</p></div></li>
                  <li><span className="step-number">3</span><div><h3>Review findings</h3><p>When connected, inspect detected events and their evidence.</p></div></li>
                </ol>
              </section>

              <section className="info-panel requirements-panel">
                <div className="panel-title"><span className="panel-icon"><Icon name="file" /></span><h2>Video requirements</h2></div>
                <dl className="requirements-list">
                  <div><dt>Format</dt><dd>.mov</dd></div>
                  <div><dt>Maximum size</dt><dd>2 GB</dd></div>
                  <div><dt>Duration</dt><dd>Any</dd></div>
                  <div><dt>Resolution</dt><dd>Any</dd></div>
                </dl>
              </section>

              <section className="privacy-note">
                <span className="privacy-icon"><Icon name="lock" /></span>
                <div><h2>Local file selection</h2><p>This prototype does not upload or process your video. Backend handling will be defined separately.</p></div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
