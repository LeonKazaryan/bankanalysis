import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileVideo2,
  Film,
  FolderSearch,
  Fullscreen,
  Info,
  Minus,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
  UserRound,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import './App.css'

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024
const SAMPLE_DURATION = 94

type Section = 'video' | 'investigations' | 'employees'
type ReviewStatus = 'Awaiting review' | 'Confirmed' | 'Dismissed' | 'Inconclusive'
type SampleEvent = {
  id: string
  timestamp: number
  title: string
  category: string
  description: string
}
type Toast = { id: number; message: string } | null

const sampleEvents: SampleEvent[] = [
  {
    id: 'A',
    timestamp: 14,
    title: 'Cash-handling activity',
    category: 'Cash handling',
    description: 'Illustrative example of a cash-handling moment that a reviewer might inspect more closely.',
  },
  {
    id: 'B',
    timestamp: 37,
    title: 'Transaction-area movement',
    category: 'Transaction area',
    description: 'Illustrative movement near a transaction area. Context and the full recording would be needed for review.',
  },
  {
    id: 'C',
    timestamp: 72,
    title: 'Unusual interaction',
    category: 'Customer interaction',
    description: 'Illustrative interaction for demonstrating the review controls. This is not a real detection.',
  },
]

const navItems: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'video', label: 'Video Analysis', icon: Video },
  { id: 'investigations', label: 'Investigations', icon: FolderSearch },
  { id: 'employees', label: 'Employees', icon: UserRound },
]

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} bytes`
}

function IconButton({
  label,
  onClick,
  children,
  className = '',
  disabled = false,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button className={`icon-button ${className}`} type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const className = status === 'Confirmed' ? 'confirmed' : status === 'Dismissed' ? 'dismissed' : status === 'Inconclusive' ? 'inconclusive' : 'pending'
  return <span className={`status-badge ${className}`}><i aria-hidden="true" />{status}</span>
}

function ForteLogo() {
  return (
    <a className="brand" href="#video-analysis" aria-label="ForteBank Compliance Intelligence" title="ForteBank Compliance Intelligence">
      <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
      <span className="brand-name">ForteBank</span>
    </a>
  )
}

function App() {
  const reduceMotion = useReducedMotion()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const toastIdRef = useRef(0)
  const sampleTimeRef = useRef(0)
  const [section, setSection] = useState<Section>('video')
  const [fileSelection, setFileSelection] = useState<{ file: File; url: string } | null>(null)
  const [fileDuration, setFileDuration] = useState<number | null>(null)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [sampleMode, setSampleMode] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState(sampleEvents[0].id)
  const [sampleStatuses, setSampleStatuses] = useState<Record<string, ReviewStatus>>({})
  const [sampleTime, setSampleTime] = useState(0)
  const [samplePlaying, setSamplePlaying] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const file = fileSelection?.file ?? null
  const fileUrl = fileSelection?.url ?? ''

  useEffect(() => {
    if (!fileSelection) return
    const objectUrl = fileSelection.url
    return () => URL.revokeObjectURL(objectUrl)
  }, [fileSelection])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!sampleMode || !samplePlaying) return
    const interval = window.setInterval(() => {
      const next = Math.min(SAMPLE_DURATION, sampleTimeRef.current + 0.5)
      sampleTimeRef.current = next
      setSampleTime(next)
      if (next >= SAMPLE_DURATION) setSamplePlaying(false)
    }, 500)
    return () => window.clearInterval(interval)
  }, [sampleMode, samplePlaying])

  useEffect(() => {
    sampleTimeRef.current = sampleTime
  }, [sampleTime])

  const selectedEvent = sampleEvents.find((event) => event.id === selectedEventId) ?? sampleEvents[0]
  const selectedStatus = sampleStatuses[selectedEvent.id] ?? 'Awaiting review'
  const reviewedCount = Object.values(sampleStatuses).filter((status) => status !== 'Awaiting review').length
  const previewFailed = fileError.startsWith('This .mov file could not be previewed')
  const pageTitle = section === 'video' ? 'Video Analysis' : section === 'investigations' ? 'Investigations' : 'Employees'

  function showToast(message: string) {
    toastIdRef.current += 1
    setToast({ id: toastIdRef.current, message })
  }

  function handleFile(candidate?: File) {
    if (!candidate) return
    if (!candidate.name.toLowerCase().endsWith('.mov')) {
      setFileError('This file type is not supported. Choose a .mov recording.')
      return
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFileError('This recording is larger than the 2 GB limit.')
      return
    }
    setFileError('')
    setFileSelection({ file: candidate, url: URL.createObjectURL(candidate) })
    setFileDuration(null)
    showToast('File selected · stays in this browser')
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0])
    event.target.value = ''
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
    handleFile(event.dataTransfer.files[0])
  }

  function removeFile() {
    setFileSelection(null)
    setFileError('')
    setFileDuration(null)
    showToast('Selected file removed')
  }

  function openSample() {
    setSection('video')
    setSampleMode(true)
    setSamplePlaying(false)
    setSampleTime(0)
    setSelectedEventId(sampleEvents[0].id)
  }

  function resetSample() {
    setSampleStatuses({})
    setSelectedEventId(sampleEvents[0].id)
    setSampleTime(0)
    setSamplePlaying(false)
    showToast('Sample mode reset')
  }

  function selectEvent(event: SampleEvent) {
    setSelectedEventId(event.id)
    setSampleTime(event.timestamp)
    setSamplePlaying(false)
  }

  function decideEvent(status: Exclude<ReviewStatus, 'Awaiting review'>) {
    setSampleStatuses((current) => ({ ...current, [selectedEvent.id]: status }))
    showToast(`Sample event ${selectedEvent.id} marked ${status.toLowerCase()}`)
  }

  function toggleSamplePlayback() {
    if (sampleTime >= SAMPLE_DURATION) setSampleTime(0)
    setSamplePlaying((playing) => !playing)
  }

  function toggleFullscreen() {
    const player = document.querySelector('.sample-player')
    if (!player) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else if (player instanceof HTMLElement) void player.requestFullscreen?.()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <ForteLogo />
        <div className="workspace-switcher">
          <div className="workspace-mark"><ShieldCheck size={15} strokeWidth={1.8} /></div>
          <div className="workspace-switcher-copy"><span>Compliance</span><small>Operations</small></div>
          <ChevronDown size={14} className="switcher-chevron" aria-hidden="true" />
        </div>

        <nav className="primary-nav" aria-label="Main navigation">
          <div className="nav-label">Workspace</div>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item${section === id ? ' active' : ''}`}
              onClick={() => { setSection(id); setSampleMode(false); setSamplePlaying(false) }}
              aria-current={section === id ? 'page' : undefined}
            >
              <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
              {id !== 'video' && <span className="nav-soon">Soon</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="status-dot" aria-hidden="true" />
          <div><strong>Local prototype</strong><span>No backend connected</span></div>
          <CircleHelp size={15} aria-hidden="true" />
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span>Compliance Intelligence</span><span className="breadcrumb-separator">/</span><strong>{pageTitle}</strong></div>
          <div className="environment-label"><span className="environment-dot" />LOCAL PROTOTYPE</div>
        </header>

        <main className={`page-content${sampleMode ? ' sample-page' : ''}`} id="video-analysis">
          <AnimatePresence mode="wait" initial={false}>
            {section !== 'video' ? (
              <motion.section
                key={section}
                className="coming-soon-view"
                initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="placeholder-icon">{section === 'investigations' ? <FolderSearch size={20} /> : <UserRound size={20} />}</div>
                <span className="micro-label">WORKSPACE / IN DEVELOPMENT</span>
                <h1>{pageTitle}</h1>
                <p>This area is reserved for a future prototype stage.</p>
                <button className="button-secondary" type="button" onClick={() => setSection('video')}><ArrowLeft size={15} /> Back to Video Analysis</button>
              </motion.section>
            ) : (
              <motion.div
                key={sampleMode ? 'sample' : file ? 'file' : 'intake'}
                className="video-page"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="page-heading">
                  <div>
                    <h1>Video Analysis</h1>
                    <p>Review teller-operation recordings and inspect potentially irregular events.</p>
                  </div>
                  {sampleMode ? (
                    <div className="heading-actions">
                      <span className="sample-chip"><i /> Sample data</span>
                      <button className="button-secondary reset-button" type="button" onClick={resetSample}><RotateCcw size={14} /> Reset sample</button>
                    </div>
                  ) : (
                    <button className="button-secondary sample-link" type="button" onClick={openSample}><Film size={15} /> Explore sample analysis</button>
                  )}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {sampleMode ? (
                    <motion.section
                      key="sample-workspace"
                      className="review-workspace"
                      aria-label="Sample analysis review workspace"
                      initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <section className="event-pane" aria-labelledby="events-title">
                        <div className="pane-header">
                          <div><h2 id="events-title">Events</h2><span className="pane-subtitle">Illustrative review queue</span></div>
                          <span className="count-label">{sampleEvents.length.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="event-list" role="list">
                          {sampleEvents.map((event, index) => {
                            const status = sampleStatuses[event.id] ?? 'Awaiting review'
                            return (
                              <motion.button
                                key={event.id}
                                type="button"
                                role="listitem"
                                className={`event-row${selectedEventId === event.id ? ' selected' : ''}`}
                                onClick={() => selectEvent(event)}
                                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.16, delay: reduceMotion ? 0 : index * 0.025, ease: 'easeOut' }}
                                aria-pressed={selectedEventId === event.id}
                              >
                                <span className={`event-marker marker-${event.id.toLowerCase()}`}><span>{event.id}</span></span>
                                <span className="event-row-copy">
                                  <span className="event-row-top"><time>{formatTime(event.timestamp)}</time><span className={`event-priority priority-${event.id.toLowerCase()}`}><i />Review</span></span>
                                  <strong>{event.title}</strong>
                                  <small>{event.category}</small>
                                </span>
                                {status !== 'Awaiting review' && <Check className="event-reviewed-check" size={14} aria-label={status} />}
                              </motion.button>
                            )
                          })}
                        </div>
                        <div className="event-pane-foot"><Info size={14} /><span>Examples only · no real findings</span></div>
                      </section>

                      <section className="player-pane" aria-labelledby="recording-title">
                        <div className="pane-header recording-header">
                          <div className="recording-title-wrap"><span className="recording-icon"><FileVideo2 size={15} /></span><div><h2 id="recording-title">Sample recording 001</h2><span className="pane-subtitle">Illustrative timeline · 01:34</span></div></div>
                          <span className="sample-chip compact"><i /> DEMO</span>
                        </div>

                        <div className="sample-player" aria-label="Illustrative sample video placeholder">
                          <div className="schematic-frame" aria-hidden="true">
                            <span className="frame-corner corner-tl" /><span className="frame-corner corner-tr" />
                            <span className="frame-corner corner-bl" /><span className="frame-corner corner-br" />
                            <div className="schematic-topline"><span>ILLUSTRATIVE FRAME</span><span>NO FOOTAGE ATTACHED</span></div>
                            <svg className="scene-schematic" viewBox="0 0 720 300" role="presentation">
                              <path d="M38 54h644M38 246h644M72 76v147m576-147v147" />
                              <path d="M108 91h504v62H108zM108 177h197v42H108zM415 177h197v42H415z" />
                              <path d="M335 91v62m50-62v62M305 177h110m-55-24v24" />
                              <path d="M122 108h156m-156 14h102m215-14h102m-102 14h78" />
                              <circle cx="360" cy="204" r="8" /><circle cx="201" cy="198" r="5" /><circle cx="519" cy="198" r="5" />
                              <path d="M360 55v19m-3-8h6M54 150h18m-8-3v6m590-3h18m-8-3v6" />
                            </svg>
                            <div className="schematic-caption"><span>REVIEW EXAMPLE</span><strong>No sample video included</strong></div>
                          </div>
                          <div className="player-overlay-label"><span>Sample mode</span><span className="tabular">{formatTime(sampleTime)} / {formatTime(SAMPLE_DURATION)}</span></div>
                        </div>

                        <div className="timeline-controls">
                          <div className="playback-row">
                            <IconButton label={samplePlaying ? 'Pause sample timeline' : 'Play sample timeline'} onClick={toggleSamplePlayback} className="play-button">
                              {samplePlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                            </IconButton>
                            <span className="timecode"><strong>{formatTime(sampleTime)}</strong><span>/</span>{formatTime(SAMPLE_DURATION)}</span>
                            <div className="playback-spacer" />
                            <span className="timeline-speed">1×</span>
                            <IconButton label="Fullscreen placeholder" onClick={toggleFullscreen}><Fullscreen size={15} /></IconButton>
                          </div>
                          <div className="timeline-track-wrap">
                            <div className="timeline-marker-layer" aria-label="Sample event markers">
                              {sampleEvents.map((event) => (
                                <button
                                  key={event.id}
                                  className={`timeline-marker marker-${event.id.toLowerCase()}${selectedEventId === event.id ? ' active' : ''}`}
                                  style={{ left: `${(event.timestamp / SAMPLE_DURATION) * 100}%` }}
                                  type="button"
                                  aria-label={`Select sample event ${event.id} at ${formatTime(event.timestamp)}`}
                                  title={`Event ${event.id} · ${formatTime(event.timestamp)}`}
                                  onClick={() => selectEvent(event)}
                                ><span>{event.id}</span></button>
                              ))}
                            </div>
                            <input
                              className="timeline-range"
                              type="range"
                              min="0"
                              max={SAMPLE_DURATION}
                              step="0.5"
                              value={sampleTime}
                              onChange={(event) => setSampleTime(Number(event.target.value))}
                              aria-label="Seek sample timeline"
                              style={{ '--progress': `${(sampleTime / SAMPLE_DURATION) * 100}%` } as CSSProperties}
                            />
                          </div>
                          <div className="timeline-axis"><span>00:00</span><span>00:30</span><span>01:00</span><span>01:34</span></div>
                        </div>
                        <div className="sample-footnote"><Info size={13} /><span>Simulated playback controls; timestamps are illustrative and do not map to footage.</span></div>
                      </section>

                      <section className="details-pane" aria-labelledby="event-details-title">
                        <div className="pane-header details-header">
                          <div><h2 id="event-details-title">Event details</h2><span className="pane-subtitle">Human review required</span></div>
                          <span className="event-id">SAMPLE {selectedEvent.id}</span>
                        </div>
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            className="event-details-body"
                            key={selectedEvent.id}
                            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                          >
                            <StatusBadge status={selectedStatus} />
                            <h3>{selectedEvent.title}</h3>
                            <p className="details-description">{selectedEvent.description}</p>
                            <dl className="event-metadata">
                              <div><dt>Timestamp</dt><dd className="tabular">{formatTime(selectedEvent.timestamp)}</dd></div>
                              <div><dt>Category</dt><dd>{selectedEvent.category}</dd></div>
                              <div><dt>Review status</dt><dd><StatusBadge status={selectedStatus} /></dd></div>
                            </dl>
                            <div className="review-note"><ShieldCheck size={14} /><p>A visual cue is not a confirmed violation. Use the recording and applicable guidance to assess context.</p></div>
                            <div className="decision-label">REVIEW DECISION</div>
                            <div className="decision-actions">
                              <button type="button" className="decision-button confirm" onClick={() => decideEvent('Confirmed')}><Check size={14} /> Confirm finding</button>
                              <button type="button" className="decision-button dismiss" onClick={() => decideEvent('Dismissed')}><X size={14} /> Dismiss finding</button>
                              <button type="button" className="decision-button inconclusive" onClick={() => decideEvent('Inconclusive')}><Minus size={14} /> Mark inconclusive</button>
                            </div>
                            <p className="local-only-note">Decisions are saved in this page only.</p>
                          </motion.div>
                        </AnimatePresence>
                        <div className="review-progress">
                          <div><span>Reviewed in this demo</span><strong>{reviewedCount} / {sampleEvents.length}</strong></div>
                          <div className="review-progress-track"><i style={{ width: `${(reviewedCount / sampleEvents.length) * 100}%` }} /></div>
                        </div>
                      </section>
                    </motion.section>
                  ) : (
                    <motion.section
                      key={file ? 'selected-file' : 'upload-intake'}
                      className="intake-layout"
                      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <section className={`intake-panel${file ? ' has-file' : ''}`} aria-label={file ? 'Selected video' : 'Video upload'}>
                        {file ? (
                          <>
                            <div className="intake-panel-heading">
                              <div><span className="micro-label">LOCAL RECORDING</span><h2>Selected video</h2></div>
                              <div className="file-actions">
                                <button className="button-secondary compact-button" type="button" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Replace</button>
                                <IconButton label="Remove selected video" onClick={removeFile}><X size={16} /></IconButton>
                              </div>
                            </div>
                            <div className="video-preview-wrap">
                              {fileUrl && !previewFailed && <video ref={videoRef} className="local-video" src={fileUrl} controls playsInline onLoadedMetadata={(event) => setFileDuration(event.currentTarget.duration)} onError={() => setFileError('This .mov file could not be previewed by this browser. You can still replace or remove it.')} />}
                              {previewFailed && <div className="video-unavailable"><AlertTriangle size={18} /><span>Video preview unavailable</span></div>}
                              {!fileUrl && <div className="video-unavailable"><AlertTriangle size={18} /><span>Preparing local preview…</span></div>}
                            </div>
                            <div className="selected-file-meta">
                              <div className="selected-file-name"><span className="file-type-icon"><FileVideo2 size={17} /></span><div><strong title={file.name}>{file.name}</strong><span>{formatFileSize(file.size)} <i /> MOV video</span></div></div>
                              <div className="duration-meta"><Clock3 size={14} /><span>{fileDuration === null ? 'Duration unavailable' : formatTime(fileDuration)}</span></div>
                            </div>
                            {fileError && <p className="inline-file-error" role="alert"><AlertTriangle size={14} />{fileError}</p>}
                            <div className="prototype-message"><Info size={15} /><span>This file stays in your browser. Analysis is not connected in this prototype.</span></div>
                          </>
                        ) : (
                          <>
                            <div className="intake-panel-heading">
                              <div><span className="micro-label">NEW REVIEW</span><h2>Start a video review</h2><p>Choose a teller-operation recording to inspect.</p></div>
                              <span className="intake-step">01 <i>/ 03</i></span>
                            </div>
                            <div
                              className={`drop-target${dragging ? ' is-dragging' : ''}${fileError ? ' has-error' : ''}`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              <input ref={fileInputRef} className="visually-hidden" type="file" accept=".mov,video/quicktime" onChange={handleFileChange} aria-label="Choose a .mov recording" />
                              <div className="drop-target-content">
                                <div className="upload-glyph"><Upload size={19} strokeWidth={1.7} /></div>
                                <h3>{dragging ? 'Release to add recording' : 'Drop a recording here'}</h3>
                                <p>Drag a .mov file into this area or choose one from your device.</p>
                                <button className="button-primary" type="button" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Choose video</button>
                                <div className="upload-specs"><span>MOV</span><i /><span>Up to 2 GB</span><i /><span>Local preview</span></div>
                              </div>
                              <div className="drop-corner drop-corner-tl" /><div className="drop-corner drop-corner-tr" /><div className="drop-corner drop-corner-bl" /><div className="drop-corner drop-corner-br" />
                            </div>
                            {fileError && <p className="upload-error" role="alert"><AlertTriangle size={14} />{fileError}</p>}
                            <div className="intake-privacy"><ShieldCheck size={15} /><span>File selection is local. Nothing is uploaded or analyzed.</span></div>
                          </>
                        )}
                      </section>

                      <aside className="intake-aside">
                        <section className="guide-section">
                          <span className="micro-label">REVIEW WORKFLOW</span>
                          <h2>A considered review, from intake to decision.</h2>
                          <ol className="workflow-list">
                            <li className="current"><span className="workflow-number">01</span><div><strong>Select a recording</strong><p>Choose a local .mov video for preview.</p></div></li>
                            <li><span className="workflow-number">02</span><div><strong>Inspect notable moments</strong><p>Analysis results will appear when a service is connected.</p></div></li>
                            <li><span className="workflow-number">03</span><div><strong>Record a review decision</strong><p>Human judgment stays separate from detection.</p></div></li>
                          </ol>
                        </section>
                        <section className="requirements-section">
                          <div className="requirements-heading"><h3>Recording requirements</h3><Info size={14} aria-hidden="true" /></div>
                          <dl><div><dt>Format</dt><dd>.mov</dd></div><div><dt>Maximum size</dt><dd>2 GB</dd></div><div><dt>Storage</dt><dd>This browser only</dd></div></dl>
                        </section>
                        <div className="prototype-callout"><span className="callout-mark"><Info size={14} /></span><p><strong>Prototype environment</strong><br />No backend or video analysis service is connected.</p></div>
                      </aside>
                    </motion.section>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            role="status"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <span className="toast-check"><Check size={13} /></span><span>{toast.message}</span>
            <IconButton label="Dismiss notification" onClick={() => setToast(null)}><X size={14} /></IconButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
