import { useRef, useState, type DragEvent } from 'react'
import { BookOpen, FileText, LockKeyhole, Search, Shield, Upload, UserRound, Video, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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
  const reduceMotion = useReducedMotion()
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
      <motion.aside
        className="sidebar"
        initial={reduceMotion ? false : { opacity: 0, x: -7 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
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
      </motion.aside>

      <div className="main-column">
        <motion.header
          className="topbar"
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04, ease: 'easeOut' }}
        >
          <div className="breadcrumb">Compliance Intelligence <span>/</span> <strong>Video Analysis</strong></div>
          <div className="topbar-label">Internal workspace</div>
        </motion.header>

        <main className="page-content" id="video-analysis">
          <motion.div
            className="page-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.07, ease: 'easeOut' }}
          >
            <div>
              <div className="eyebrow">VIDEO REVIEW</div>
              <h1>Video Analysis</h1>
              <p>Upload a cashier operation video to prepare it for compliance review.</p>
            </div>
          </motion.div>

          <div className="workspace-grid">
            <motion.section
              className="upload-panel"
              aria-labelledby="upload-title"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.11, ease: 'easeOut' }}
            >
              <motion.div
                className={`dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
                animate={{
                  borderColor: error ? '#d98989' : dragging ? '#218365' : '#cbd2db',
                  backgroundColor: dragging ? '#f4faf7' : '#fcfcfd',
                  scale: dragging ? 1.006 : 1,
                }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
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
                <AnimatePresence mode="wait" initial={false}>
                  {file ? (
                    <motion.div
                      key={`${file.name}-${file.lastModified}`}
                      className="selected-file"
                      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <motion.div
                        className="upload-symbol"
                        initial={reduceMotion ? false : { scale: 0.92, rotate: -3 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      ><Icon name="file" size={28} /></motion.div>
                      <span className="file-label">VIDEO SELECTED</span>
                      <h2 id="upload-title" className="selected-name">{file.name}</h2>
                      <p className="file-size">{formatSize(file.size)} <span>·</span> .mov</p>
                      <motion.button type="button" className="button-secondary" onClick={openFilePicker} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>Choose another file</motion.button>
                      <p className="prototype-note">Analysis will be available when the backend is connected.</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-upload"
                      className="dropzone-content"
                      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <motion.div
                        className="upload-symbol"
                        initial={reduceMotion ? false : { scale: 0.92, rotate: -3 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      ><Icon name="video" size={30} /></motion.div>
                      <span className="file-label">SECURE VIDEO INTAKE</span>
                      <h2 id="upload-title">Upload a video to get started</h2>
                      <p>Drag and drop a .mov file here, or browse your device.</p>
                      <motion.button type="button" className="button-primary" onClick={openFilePicker} whileHover={reduceMotion ? undefined : { y: -1 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                        <Icon name="upload" size={17} /> Choose video file
                      </motion.button>
                      <div className="file-requirements"><span>Format <b>.mov</b></span><i /> <span>Maximum size <b>2 GB</b></span></div>
                      {error && <p className="upload-error" role="alert">{error}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="benefits" aria-label="Review capabilities">
                <motion.div className="benefit" initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.18, ease: 'easeOut' }}>
                  <span className="benefit-icon mint"><Icon name="search" /></span>
                  <div><h3>Detect potential violations</h3><p>Identify moments that may need a closer look.</p></div>
                </motion.div>
                <motion.div className="benefit" initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.23, ease: 'easeOut' }}>
                  <span className="benefit-icon rose"><Icon name="file" /></span>
                  <div><h3>Review visual evidence</h3><p>Inspect relevant frames and timestamps.</p></div>
                </motion.div>
                <motion.div className="benefit" initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.28, ease: 'easeOut' }}>
                  <span className="benefit-icon blue"><Icon name="shield" /></span>
                  <div><h3>Assess with regulations</h3><p>Keep findings grounded in applicable guidance.</p></div>
                </motion.div>
              </div>
            </motion.section>

            <motion.aside
              className="info-column"
              aria-label="Upload information"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.17, ease: 'easeOut' }}
            >
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
            </motion.aside>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
