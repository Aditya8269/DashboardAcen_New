import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from './config/navigation'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { ThemeProvider, alpha, createTheme, keyframes } from '@mui/material/styles'
import ArrowBack from '@mui/icons-material/ArrowBack'
import CheckCircle from '@mui/icons-material/CheckCircle'
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined'
import Close from '@mui/icons-material/Close'
import ContentCopy from '@mui/icons-material/ContentCopy'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import DirectionsCar from '@mui/icons-material/DirectionsCar'
import DocumentScanner from '@mui/icons-material/DocumentScanner'
import ErrorOutlined from '@mui/icons-material/ErrorOutlined'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ImageSearch from '@mui/icons-material/ImageSearch'
import Lock from '@mui/icons-material/Lock'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import Refresh from '@mui/icons-material/Refresh'
import RotateRight from '@mui/icons-material/RotateRight'
import WarningAmber from '@mui/icons-material/WarningAmber'
import ZoomIn from '@mui/icons-material/ZoomIn'
import ZoomOut from '@mui/icons-material/ZoomOut'
import { ACCEPTED_TYPES, LOW_CONFIDENCE, MAX_FILE_SIZE_MB, scanNumberPlate, warmUpOcr } from './ocrService.js'

const theme = createTheme({
  palette: {
    primary: { main: '#195d49' },
    secondary: { main: '#f47b4b' },
    success: { main: '#2f9e6b' },
    warning: { main: '#e09a10' },
    error: { main: '#d64545' },
    background: { default: '#f5f7f4', paper: '#ffffff' },
    text: { primary: '#17221d', secondary: '#66736c' },
    divider: '#dce3dc',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Segoe UI", "Trebuchet MS", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 650 },
    subtitle2: { fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: '#dce3dc' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
  },
})

const MONO = '"Consolas", "Courier New", monospace'

const WORKFLOW = {
  scanning: { label: 'Scanning', color: 'info' },
  read: { label: 'Read', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'success' },
  error: { label: 'Not read', color: 'error' },
}

const sweep = keyframes`
  0% { top: 3%; }
  100% { top: 97%; }
`

// Keeps the phone keyboard from capitalising, completing or "correcting" plate text
const PLATE_INPUT_PROPS = {
  autoCapitalize: 'characters',
  autoComplete: 'off',
  autoCorrect: 'off',
  spellCheck: false,
  style: { textTransform: 'uppercase', letterSpacing: '0.08em' },
}

// The OCR engine reports its own stage names; show them in plain words
function stageLabel(progress) {
  const status = progress?.status || ''
  if (status === 'locating') return 'Locating the number plate'
  if (status === 'reading') return `Reading ${progress.attempt}`
  if (/language/.test(status)) return 'Downloading language data (first scan only)'
  if (/loading|initializ/.test(status)) return 'Loading the OCR engine'
  if (/recogniz/.test(status)) return 'Reading the plate'
  return 'Preparing the image'
}

const formatTimestamp = (ts) => new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const isLowConfidence = (record) => !record.edited && record.confidence != null && record.confidence < LOW_CONFIDENCE

function Corner({ pos }) {
  const [v, h] = pos
  return (
    <Box
      sx={{
        position: 'absolute',
        [v === 't' ? 'top' : 'bottom']: 14,
        [h === 'l' ? 'left' : 'right']: 14,
        width: 28,
        height: 28,
        borderColor: 'common.white',
        borderStyle: 'solid',
        borderWidth: 0,
        [`border${v === 't' ? 'Top' : 'Bottom'}Width`]: 3,
        [`border${h === 'l' ? 'Left' : 'Right'}Width`]: 3,
        borderRadius: 1,
        opacity: 0.9,
      }}
    />
  )
}

// Live camera view. Mounted only while the dialog is open so the stream is always released on close.
function CameraView({ onCapture, onError }) {
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    let active = true
    let acquired = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((s) => {
        if (!active) return s.getTracks().forEach((t) => t.stop())
        acquired = s
        setStream(s)
      })
      .catch((err) => {
        if (active) onError(err.name === 'NotAllowedError' ? 'Camera permission was denied. Allow it in the browser settings and try again.' : 'No camera could be started on this device.')
      })
    return () => {
      active = false
      acquired?.getTracks().forEach((t) => t.stop())
    }
  }, [onError])

  useEffect(() => {
    if (stream) videoRef.current.srcObject = stream
  }, [stream])

  const capture = () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => blob && onCapture(new File([blob], `plate-${Date.now()}.jpg`, { type: 'image/jpeg' })), 'image/jpeg', 0.95)
  }

  return (
    <>
      <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', px: { xs: 2, sm: 3 } }}>
        {/* Fixed 16:10 on wide screens; fills the space left on a full-screen phone dialog, whatever the stream's shape */}
        <Box
          sx={{
            position: 'relative',
            bgcolor: '#101814',
            borderRadius: 3,
            overflow: 'hidden',
            flex: { xs: 1, sm: 'none' },
            minHeight: { xs: 240, sm: 0 },
            aspectRatio: { xs: 'auto', sm: '16 / 10' },
          }}
        >
          <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          {stream && ['tl', 'tr', 'bl', 'br'].map((pos) => <Corner key={pos} pos={pos} />)}
          {!stream && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, height: '100%', bgcolor: 'transparent' }} animation="wave" />}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Keep the number plate in view and sharp. The whole front or rear of the car is fine, the plate is found automatically.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
        <Button variant="contained" size="large" startIcon={<PhotoCamera />} disabled={!stream} onClick={capture} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Capture
        </Button>
      </DialogActions>
    </>
  )
}

function CameraDialog({ open, onClose, onCapture }) {
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [error, setError] = useState('')
  const close = () => { setError(''); onClose() }
  return (
    <Dialog open={open} onClose={close} fullScreen={fullScreen} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Capture number plate
        <IconButton aria-label="Close camera" onClick={close}><Close /></IconButton>
      </DialogTitle>
      {error ? (
        <DialogContent><Alert severity="error">{error}</Alert></DialogContent>
      ) : (
        <CameraView onCapture={(file) => { setError(''); onCapture(file) }} onError={setError} />
      )}
    </Dialog>
  )
}

function Dropzone({ onFile }) {
  const [dragging, setDragging] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const fileInput = useRef(null)
  const cameraInput = useRef(null)
  // A phone or tablet has no use for drag and drop, and its own camera app gives a sharper photo (autofocus, full
  // resolution) than a live video frame in the page. Use the in-page camera only where there is a mouse.
  const touch = useMediaQuery('(pointer: coarse)')
  const hasLiveCamera = Boolean(navigator.mediaDevices?.getUserMedia) && !touch

  const handleChange = (e) => {
    if (e.target.files?.length) onFile(e.target.files[0])
    e.target.value = ''
  }

  const camera = (
    <Button key="camera" variant={touch ? 'contained' : 'outlined'} startIcon={<PhotoCamera />} onClick={() => (hasLiveCamera ? setCameraOpen(true) : cameraInput.current?.click())}>
      {touch ? 'Take a photo' : 'Use camera'}
    </Button>
  )
  const browse = (
    <Button key="browse" variant={touch ? 'outlined' : 'contained'} startIcon={<ImageSearch />} onClick={() => fileInput.current?.click()}>
      {touch ? 'Choose from gallery' : 'Browse files'}
    </Button>
  )

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files?.length) onFile(e.dataTransfer.files[0])
      }}
      sx={{
        border: '2px dashed',
        borderColor: dragging ? 'primary.main' : 'divider',
        bgcolor: dragging ? (t) => alpha(t.palette.primary.main, 0.06) : '#fafbf9',
        borderRadius: 3,
        py: { xs: 4, md: 7 },
        px: { xs: 2, sm: 3 },
        textAlign: 'center',
        transition: 'all .15s ease',
      }}
    >
      <Avatar sx={{ mx: 'auto', mb: 1.5, width: 64, height: 64, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: 'primary.main' }}>
        {touch ? <PhotoCamera fontSize="large" /> : <CloudUploadOutlined fontSize="large" />}
      </Avatar>
      <Typography variant="h6">{touch ? 'Photograph the number plate' : 'Drop a photo of the number plate here'}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5, maxWidth: 440, mx: 'auto' }}>
        {touch
          ? `Keep the plate sharp and in even light. The whole front or rear of the car is fine. JPG, PNG or WebP, up to ${MAX_FILE_SIZE_MB} MB.`
          : `A close-up works best, but the whole front or rear of the car is fine. You can also paste from the clipboard. JPG, PNG or WebP, up to ${MAX_FILE_SIZE_MB} MB.`}
      </Typography>
      {/* Full-width, thumb-sized buttons on a phone; the main action for the device comes first */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ '& .MuiButton-root': { minHeight: 48 } }}>
        {touch ? [camera, browse] : [browse, camera]}
      </Stack>
      <CameraDialog open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(file) => { setCameraOpen(false); onFile(file) }} />
      <input ref={fileInput} type="file" hidden accept={ACCEPTED_TYPES.join(',')} onChange={handleChange} />
      <input ref={cameraInput} type="file" hidden accept="image/*" capture="environment" onChange={handleChange} />
    </Box>
  )
}

function ScanPreview({ record }) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const scanning = record.status === 'scanning'

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          height: { xs: 240, sm: 320, md: 380 },
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#101814',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box
          component="img"
          src={record.previewUrl}
          alt={`Uploaded ${record.fileName}`}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform .2s ease',
            filter: scanning ? 'brightness(.8)' : 'none',
          }}
        />
        {scanning && (
          <>
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 3,
                bgcolor: 'secondary.main',
                boxShadow: (t) => `0 0 18px 6px ${alpha(t.palette.secondary.main, 0.55)}`,
                animation: `${sweep} 1.6s ease-in-out infinite alternate`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none', top: '50%' },
              }}
            />
            {['tl', 'tr', 'bl', 'br'].map((pos) => <Corner key={pos} pos={pos} />)}
            <Chip
              icon={<DocumentScanner />}
              label={`${stageLabel(record.progress)}...`}
              color="primary"
              sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', maxWidth: 'calc(100% - 32px)' }}
            />
          </>
        )}
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
        {/* The file name means little on a phone (camera-1730.jpg), so only wider screens get it */}
        <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0, mr: 2, display: { xs: 'none', sm: 'block' } }}>
          {record.fileName}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-end' } }}>
          <Tooltip title="Zoom out"><span><IconButton aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}><ZoomOut /></IconButton></span></Tooltip>
          <Typography variant="body2" sx={{ minWidth: 48, textAlign: 'center' }}>{Math.round(zoom * 100)}%</Typography>
          <Tooltip title="Zoom in"><span><IconButton aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}><ZoomIn /></IconButton></span></Tooltip>
          <Tooltip title="Rotate"><IconButton aria-label="Rotate" onClick={() => setRotation((r) => (r + 90) % 360)}><RotateRight /></IconButton></Tooltip>
        </Stack>
      </Stack>
    </Box>
  )
}

// The plate as it would look on the car, so the reading is easy to compare with the photo
function PlateDisplay({ value }) {
  return (
    <Box
      sx={{
        mx: 'auto',
        maxWidth: 360,
        px: { xs: 1.5, sm: 2 },
        py: 1.75,
        textAlign: 'center',
        bgcolor: '#fff',
        border: '4px solid #17221d',
        borderRadius: 2,
        boxShadow: '0 2px 0 rgba(23,34,29,.08), inset 0 0 0 2px #fff, inset 0 0 0 3px #17221d33',
      }}
    >
      {/* Scales with the screen so a 10 to 12 character plate stays on one line on a narrow phone */}
      <Typography
        component="div"
        sx={{
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: { xs: 'clamp(20px, 6.4vw, 30px)', sm: 34 },
          letterSpacing: { xs: '0.1em', sm: '0.14em' },
          lineHeight: 1.1,
          color: value ? '#17221d' : 'text.disabled',
          wordBreak: 'break-all',
        }}
      >
        {value || '- - - -'}
      </Typography>
    </Box>
  )
}

function RawTextPanel({ log, attempt }) {
  const [copied, setCopied] = useState(false)
  return (
    <Accordion disableGutters elevation={0} variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle2">Raw OCR output</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Result: {attempt}. Every pass the engine made, for checking when a reading looks wrong.
        </Typography>
        <Box component="pre" sx={{ m: 0, mb: 1.5, p: 1.5, bgcolor: '#f3f5f1', borderRadius: 2, fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 260, overflow: 'auto' }}>{log}</Box>
        <Button size="small" startIcon={<ContentCopy />} onClick={() => navigator.clipboard?.writeText(log).then(() => setCopied(true))}>{copied ? 'Copied' : 'Copy'}</Button>
      </AccordionDetails>
    </Accordion>
  )
}

function ResultPanel({ record, onChange, onConfirm, onRescan, onNext }) {
  if (record.status === 'scanning') {
    const percent = Math.round((record.progress?.progress || 0) * 100)
    return (
      <Stack spacing={2.5}>
        <Box>
          <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">{stageLabel(record.progress)}</Typography>
            <Typography variant="body2" color="text.secondary">{percent}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={percent} />
        </Box>
        <Skeleton variant="rounded" height={84} />
        <Skeleton variant="rounded" height={56} />
      </Stack>
    )
  }

  // The main action first on a phone (it is stacked and thumb-sized there), the secondary one first on desktop
  const actions = { direction: { xs: 'column-reverse', sm: 'row' }, spacing: 1.5, justifyContent: 'space-between', sx: { '& .MuiButton-root': { minHeight: 44 } } }

  if (record.status === 'error') {
    return (
      <Stack spacing={2}>
        <Alert severity="error" icon={<ErrorOutlined />}>
          <Typography variant="subtitle2">{record.error}</Typography>
          <Typography variant="body2">
            Retake the photo with the plate sharp and in even light, without glare or heavy shadow, or type the plate below.
          </Typography>
        </Alert>
        <TextField
          fullWidth
          size="small"
          label="Number plate"
          value={record.plate}
          onChange={(e) => onChange(record.id, e.target.value)}
          placeholder="Type the plate manually"
          slotProps={{ htmlInput: PLATE_INPUT_PROPS }}
        />
        <Stack {...actions}>
          <Button color="inherit" startIcon={<Refresh />} onClick={() => onRescan(record.id)}>Try again</Button>
          <Button variant="contained" startIcon={<CheckCircle />} disabled={!record.plate.trim()} onClick={() => onConfirm(record.id)}>Confirm plate</Button>
        </Stack>
        {record.log && <RawTextPanel log={record.log} attempt={record.attempt} />}
      </Stack>
    )
  }

  const confirmed = record.status === 'confirmed'
  const low = isLowConfidence(record)

  return (
    <Stack spacing={2.5}>
      <PlateDisplay value={record.plate} />

      {record.changes.length > 0 && !record.edited && (
        <Alert severity="info">
          <Typography variant="subtitle2">
            {record.changes.length === 1 ? '1 character' : `${record.changes.length} characters`} corrected using the {record.format} layout
          </Typography>
          <Typography variant="body2">
            {record.changes.map((c) => `${c.from} to ${c.to} at position ${c.index + 1}`).join(', ')}. The engine read {record.raw}. Check it against the photo.
          </Typography>
        </Alert>
      )}

      {confirmed ? (
        <Alert severity="success" icon={<CheckCircle />}>Plate confirmed.</Alert>
      ) : low ? (
        <Alert severity="warning" icon={<WarningAmber />}>
          Some characters were hard to read. Compare with the photo and correct anything that looks off.
        </Alert>
      ) : null}

      <TextField
        fullWidth
        size="small"
        label="Number plate"
        value={record.plate}
        color={low && !confirmed ? 'warning' : 'primary'}
        focused={(low && !confirmed) || undefined}
        onChange={(e) => onChange(record.id, e.target.value)}
        helperText="Edit if the reading is not exact."
        slotProps={{
          htmlInput: PLATE_INPUT_PROPS,
          input: {
            endAdornment: record.edited
              ? <Chip size="small" variant="outlined" label="Edited" />
              : record.confidence != null && (
                <Tooltip title="How closely the separate readings of the plate agree">
                  <Chip size="small" variant="outlined" color={low ? 'warning' : 'success'} label={`${Math.round(record.confidence * 100)}%`} />
                </Tooltip>
              ),
          },
        }}
      />

      <Divider />

      <Stack {...actions}>
        <Button startIcon={<Refresh />} color="inherit" onClick={() => onRescan(record.id)}>Rescan</Button>
        {confirmed ? (
          <Button variant="outlined" startIcon={<DocumentScanner />} onClick={onNext}>Scan another plate</Button>
        ) : (
          <Button variant="contained" startIcon={<CheckCircle />} disabled={!record.plate.trim()} onClick={() => onConfirm(record.id)}>
            Confirm plate
          </Button>
        )}
      </Stack>

      {/* Below the actions so the debug output never pushes the main buttons off a small screen */}
      <RawTextPanel log={record.log} attempt={record.attempt} />
    </Stack>
  )
}

function RecentScans({ records, activeId, onSelect, onDelete }) {
  // Six table columns do not fit a phone, so below the md breakpoint each scan becomes one tappable row
  const compact = useMediaQuery(theme.breakpoints.down('md'))

  let body
  if (records.length === 0) {
    body = (
      <Stack alignItems="center" spacing={1} sx={{ py: 6, px: 2, textAlign: 'center', color: 'text.secondary' }}>
        <DirectionsCar sx={{ fontSize: 40, opacity: 0.5 }} />
        <Typography variant="body2">Nothing scanned yet. Plates you scan will be listed here.</Typography>
      </Stack>
    )
  } else if (compact) {
    body = (
      <Box>
        {records.map((r) => {
          const wf = WORKFLOW[r.status]
          return (
            <Stack
              key={r.id}
              direction="row"
              alignItems="center"
              sx={{ borderTop: 1, borderColor: 'divider', bgcolor: r.id === activeId ? (t) => alpha(t.palette.primary.main, 0.07) : 'transparent' }}
            >
              <ButtonBase
                onClick={() => onSelect(r.id)}
                aria-label={`Open scan of ${r.plate || 'unreadable plate'}`}
                sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', textAlign: 'left', gap: 1.5, py: 1.25, pl: 2, pr: 1 }}
              >
                <Avatar variant="rounded" src={r.previewUrl} alt="" sx={{ width: 52, height: 52, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', fontSize: 17 }}>{r.plate || '-'}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
                    <Chip size="small" color={wf.color} label={wf.label} />
                    <Typography variant="caption" color="text.secondary">{formatTimestamp(r.createdAt)}</Typography>
                  </Stack>
                </Box>
              </ButtonBase>
              <IconButton aria-label={`Remove ${r.fileName}`} onClick={() => onDelete(r.id)} sx={{ mr: 1 }}>
                <DeleteOutlined />
              </IconButton>
            </Stack>
          )
        })}
      </Box>
    )
  } else {
    body = (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 600, bgcolor: '#fafbf9' } }}>
              <TableCell>Photo</TableCell>
              <TableCell>Number plate</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Scanned</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((r) => {
              const wf = WORKFLOW[r.status]
              return (
                <TableRow
                  key={r.id}
                  hover
                  selected={r.id === activeId}
                  onClick={() => onSelect(r.id)}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell><Avatar variant="rounded" src={r.previewUrl} alt="" sx={{ width: 44, height: 44 }} /></TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em' }}>{r.plate || '-'}</TableCell>
                  <TableCell>{r.confidence != null && !r.edited ? `${Math.round(r.confidence * 100)}%` : '-'}</TableCell>
                  <TableCell><Chip size="small" color={wf.color} label={wf.label} /></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTimestamp(r.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove">
                      <IconButton aria-label={`Remove ${r.fileName}`} onClick={(e) => { e.stopPropagation(); onDelete(r.id) }}>
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <Card>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ p: { xs: 2, md: 2.5 }, pb: 1.5 }}>
        <Box>
          <Typography variant="h6">Recent scans</Typography>
          <Typography variant="body2" color="text.secondary">{compact ? 'Tap a scan to review or correct it.' : 'Select a row to review or correct it.'}</Typography>
        </Box>
        <Chip label={`${records.length} total`} />
      </Stack>
      {body}
    </Card>
  )
}

export default function Compliance() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [toast, setToast] = useState(null)

  const nextId = useRef(1)
  const controllers = useRef(new Map())
  const objectUrls = useRef(new Set())
  const resultRef = useRef(null)
  // Below lg the photo and the reading are stacked, so the reading can end up off screen
  const stacked = useMediaQuery(theme.breakpoints.down('lg'))

  const patchRecord = useCallback((id, patch) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)))
  }, [])

  const runScan = useCallback(async (id, file) => {
    controllers.current.get(id)?.abort()
    const controller = new AbortController()
    controllers.current.set(id, controller)
    patchRecord(id, { status: 'scanning', error: null, progress: null, edited: false })
    // The OCR engine reports many events per percent; only re-render when something visible changes
    let lastPercent = -1
    let lastStatus = ''
    const onProgress = (p) => {
      const percent = Math.round((p.progress || 0) * 100)
      if (percent === lastPercent && p.status === lastStatus) return
      lastPercent = percent
      lastStatus = p.status
      patchRecord(id, { progress: p })
    }
    try {
      const { value, raw, changes, format, confidence, attempt, log } = await scanNumberPlate(file, { signal: controller.signal, onProgress })
      if (value) {
        console.log('[Number plate] read:', value, changes.length ? `(the engine read ${raw}; corrected using the ${format} layout)` : '')
        patchRecord(id, { status: 'read', plate: value, raw, changes, format, confidence, attempt, log, progress: null })
      } else {
        console.log('[Number plate] nothing could be read')
        patchRecord(id, { status: 'error', plate: '', raw: '', changes: [], confidence: null, attempt, log, error: 'No number plate could be read from this image.', progress: null })
      }
    } catch (err) {
      if (err.name !== 'AbortError') patchRecord(id, { status: 'error', plate: '', raw: '', changes: [], confidence: null, log: '', error: `The image could not be processed. ${err.message}`, progress: null })
    } finally {
      if (controllers.current.get(id) === controller) controllers.current.delete(id)
    }
  }, [patchRecord])

  const addFile = useCallback((file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return setToast({ severity: 'error', message: `${file.name || 'That file'} is not a JPG, PNG or WebP image` })
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return setToast({ severity: 'error', message: `${file.name} is larger than ${MAX_FILE_SIZE_MB} MB` })
    const previewUrl = URL.createObjectURL(file)
    objectUrls.current.add(previewUrl)
    const id = nextId.current++
    setRecords((prev) => [
      { id, file, fileName: file.name || 'camera-capture.jpg', previewUrl, status: 'scanning', plate: '', raw: '', changes: [], confidence: null, edited: false, attempt: '', log: '', error: null, progress: null, createdAt: Date.now() },
      ...prev,
    ])
    setActiveId(id)
    runScan(id, file)
  }, [runScan])

  useEffect(() => {
    warmUpOcr()
  }, [])

  useEffect(() => {
    const onPaste = (e) => {
      const file = Array.from(e.clipboardData?.files || []).find((f) => f.type.startsWith('image/'))
      if (file) addFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFile])

  useEffect(() => {
    const pending = controllers.current
    const urls = objectUrls.current
    return () => {
      pending.forEach((c) => c.abort())
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [])

  const setPlate = (id, value) => {
    patchRecord(id, (r) => ({ plate: value.toUpperCase(), edited: true, status: r.status === 'confirmed' ? 'read' : r.status }))
  }

  const confirmPlate = (id) => {
    const record = records.find((r) => r.id === id)
    const plate = record.plate.trim()
    console.log('[Number plate] confirmed:', plate)
    // The backend API call goes here, using `plate`.
    patchRecord(id, { plate, status: 'confirmed' })
    setToast({ severity: 'success', message: `Plate ${plate} confirmed` })
  }

  const rescan = (id) => runScan(id, records.find((r) => r.id === id).file)

  const deleteRecord = (id) => {
    const r = records.find((x) => x.id === id)
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    URL.revokeObjectURL(r.previewUrl)
    objectUrls.current.delete(r.previewUrl)
    setRecords((prev) => prev.filter((x) => x.id !== id))
    setActiveId((cur) => (cur === id ? null : cur))
  }

  const active = records.find((r) => r.id === activeId) || null
  const activeStatus = active?.status

  // When a scan finishes, or an earlier one is opened from the list, bring the reading into view on stacked layouts
  useEffect(() => {
    if (!stacked || (activeStatus !== 'read' && activeStatus !== 'error')) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [stacked, activeId, activeStatus])

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100svh', bgcolor: 'background.default', color: 'text.primary' }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ gap: { xs: 1, sm: 1.5 }, minHeight: { xs: 56 } }}>
            <Tooltip title="Back to dashboard">
              <IconButton edge="start" aria-label="Back to dashboard" onClick={() => navigate(ROUTES.admin)}><ArrowBack /></IconButton>
            </Tooltip>
            <Avatar variant="rounded" sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontWeight: 800 }}>E</Avatar>
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flexGrow: 1, minWidth: 0 }}>ETMS Drive</Typography>
            <Tooltip title="The plate is read inside your browser. Images are never uploaded.">
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                icon={<Lock />}
                label={
                  <>
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>On-device OCR</Box>
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>On-device</Box>
                  </>
                }
              />
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
          <Typography variant="overline" color="text.secondary">Transport / Compliance</Typography>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.6rem', md: '2.125rem' } }}>Number plate scan</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: { xs: 2.5, md: 3 }, maxWidth: 680 }}>
            Scan a vehicle's number plate. The plate is read from the photo on this device, so you only need to check the characters and confirm.
          </Typography>

          <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="flex-start">
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ p: { xs: 2, md: 3 } }}>
                {active ? (
                  <Stack spacing={2.5}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={650} lineHeight={1.2}>Scanned photo</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>Compare the reading with the plate in the image.</Typography>
                      </Box>
                      <Button startIcon={<Close />} color="inherit" onClick={() => setActiveId(null)} sx={{ flexShrink: 0, minHeight: 40 }}>Scan another</Button>
                    </Stack>
                    <ScanPreview key={active.id} record={active} />
                  </Stack>
                ) : (
                  <Dropzone onFile={addFile} />
                )}
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
              {/* scrollMarginTop keeps the heading clear of the sticky app bar when scrolled into view */}
              <Card ref={resultRef} sx={{ p: { xs: 2, md: 3 }, scrollMarginTop: 72 }}>
                <Typography variant="h6">Plate reading</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  {active ? 'Review the characters read from the image.' : 'The number read from the plate appears here.'}
                </Typography>
                {active ? (
                  <ResultPanel
                    key={active.id}
                    record={active}
                    onChange={setPlate}
                    onConfirm={confirmPlate}
                    onRescan={rescan}
                    onNext={() => setActiveId(null)}
                  />
                ) : (
                  <Stack alignItems="center" spacing={2} sx={{ py: { xs: 2, md: 4 }, textAlign: 'center', color: 'text.secondary' }}>
                    <PlateDisplay value="" />
                    <Typography variant="body2" sx={{ maxWidth: 280 }}>
                      Upload or capture a photo of a number plate to read its characters.
                    </Typography>
                  </Stack>
                )}
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: { xs: 2, md: 3 } }}>
            <RecentScans records={records} activeId={activeId} onSelect={setActiveId} onDelete={deleteRecord} />
          </Box>
        </Container>

        <Snackbar
          open={Boolean(toast)}
          autoHideDuration={5000}
          onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.message}</Alert> : undefined}
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}
