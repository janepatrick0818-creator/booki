'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Book, Headphones, Library, Play, Plus, ChevronLeft, ChevronRight,
  X, Volume2, VolumeX, Pause, SkipBack, SkipForward, Download,
  Home, User, Menu, Star, Loader2, BookOpen, Mic, Settings, Globe, 
  LogIn, LogOut, Upload, FileText, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { translations, categoryTranslations } from '@/lib/translations'
import { ScrollArea } from '@/components/ui/scroll-area'

// ==================== TRANSLATIONS HOOK ====================

function useTranslation(lang = 'pt') {
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key
  const translateCategory = (category) => categoryTranslations[lang]?.[category] || category
  return { t, translateCategory }
}

// ==================== AUTH MODAL ====================

function AuthModal({ isOpen, onClose, onSuccess, t }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', name: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem')
          setLoading(false)
          return
        }
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password, name: formData.name })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onSuccess(data.user)
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onSuccess(data.user)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#1a1a1a] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {mode === 'login' ? t('login') : t('register')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === 'register' && (
            <div>
              <Label className="text-[#B3B3B3]">{t('name')}</Label>
              <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#222] border-[#444] text-white mt-1" required />
            </div>
          )}
          <div>
            <Label className="text-[#B3B3B3]">{t('email')}</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-[#222] border-[#444] text-white mt-1" required />
          </div>
          <div>
            <Label className="text-[#B3B3B3]">{t('password')}</Label>
            <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-[#222] border-[#444] text-white mt-1" required />
          </div>
          {mode === 'register' && (
            <div>
              <Label className="text-[#B3B3B3]">{t('confirmPassword')}</Label>
              <Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="bg-[#222] border-[#444] text-white mt-1" required />
            </div>
          )}
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-400 text-sm">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? t('login') : t('register')}
          </Button>
          <p className="text-center text-[#B3B3B3] text-sm">
            {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-[#00D26A] hover:underline">
              {mode === 'login' ? t('register') : t('login')}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== SETTINGS MODAL ====================

function SettingsModal({ isOpen, onClose, language, setLanguage, user, onLogout, t }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#1a1a1a] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />{t('settings')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#B3B3B3] flex items-center gap-2"><Globe className="w-4 h-4" />{t('languageSettings')}</h3>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-[#222] border-[#444] text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#222] border-[#444]">
                <SelectItem value="pt" className="text-white">🇧🇷 {t('portuguese')}</SelectItem>
                <SelectItem value="en" className="text-white">🇺🇸 {t('english')}</SelectItem>
                <SelectItem value="es" className="text-white">🇪🇸 {t('spanish')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user && (
            <div className="space-y-3 pt-4 border-t border-[#333]">
              <h3 className="text-sm font-medium text-[#B3B3B3] flex items-center gap-2"><User className="w-4 h-4" />{t('account')}</h3>
              <div className="bg-[#222] rounded-lg p-4">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-[#666]">{user.email}</p>
              </div>
              <Button variant="outline" onClick={onLogout} className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">
                <LogOut className="w-4 h-4 mr-2" />{t('logout')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==================== UPLOAD MODAL ====================

const SUPPORTED_FORMATS = ['epub', 'pdf', 'doc', 'docx', 'txt', 'rtf', 'htm', 'html']

function UploadModal({ isOpen, onClose, onUploadSuccess, t }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const name = selectedFile.name.replace(/\.(epub|pdf|doc|docx|txt|rtf|htm|html)$/i, '')
      setTitle(name)
    }
  }

  const handleUpload = async () => {
    if (!file || !title) return
    setLoading(true)
    
    try {
      const fileData = await file.arrayBuffer()
      const format = file.name.split('.').pop().toLowerCase()
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, author: author || 'Desconhecido', format, fileSize: file.size })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const db = await openDatabase()
        const tx = db.transaction('books', 'readwrite')
        const store = tx.objectStore('books')
        await store.put({ id: data.book.id, data: fileData, format })
        onUploadSuccess(data.book)
        onClose()
        setFile(null)
        setTitle('')
        setAuthor('')
      }
    } catch (error) {
      console.error('Upload error:', error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#1a1a1a] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-[#00D26A]" />{t('uploadBook')}</DialogTitle>
          <DialogDescription className="text-[#666]">
            Formatos suportados: {SUPPORTED_FORMATS.map(f => f.toUpperCase()).join(', ')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#444] rounded-lg p-8 text-center cursor-pointer hover:border-[#00D26A] transition-colors">
            <input ref={fileInputRef} type="file" accept={SUPPORTED_FORMATS.map(f => `.${f}`).join(',')} onChange={handleFileSelect} className="hidden" />
            {file ? (
              <div>
                <FileText className="w-12 h-12 mx-auto text-[#00D26A] mb-2" />
                <p className="text-white">{file.name}</p>
                <p className="text-sm text-[#666]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto text-[#444] mb-2" />
                <p className="text-[#B3B3B3]">{t('selectFile')}</p>
              </div>
            )}
          </div>
          {file && (
            <>
              <div>
                <Label className="text-[#B3B3B3]">Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#222] border-[#444] text-white mt-1" />
              </div>
              <div>
                <Label className="text-[#B3B3B3]">Autor</Label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Opcional" className="bg-[#222] border-[#444] text-white mt-1" />
              </div>
            </>
          )}
          <Button onClick={handleUpload} disabled={!file || !title || loading} className="w-full bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('uploading')}</> : <><Upload className="w-4 h-4 mr-2" />{t('uploadBook')}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BookiDB', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('audiobooks')) db.createObjectStore('audiobooks', { keyPath: 'id' })
    }
  })
}

// ==================== TTS MODAL (IMPROVED) ====================

function TTSModal({ book, isOpen, onClose, onAudioGenerated, t }) {
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [playingPreview, setPlayingPreview] = useState(null)
  const [pageStart, setPageStart] = useState(1)
  const [pageEnd, setPageEnd] = useState(10)
  const audioRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      fetchVoices()
      if (book?.totalPages) {
        setPageEnd(Math.min(book.totalPages, 10))
      }
    }
  }, [isOpen, book])

  const fetchVoices = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tts/voices')
      const data = await response.json()
      if (data.voices?.length > 0) {
        setVoices(data.voices)
        setSelectedVoice(data.voices[0].id)
      }
    } catch (err) {
      setError('Falha ao carregar vozes')
    }
    setLoading(false)
  }

  const playPreview = (voice) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (playingPreview === voice.id) {
      setPlayingPreview(null)
      return
    }
    if (voice.previewUrl) {
      audioRef.current = new Audio(voice.previewUrl)
      audioRef.current.play()
      audioRef.current.onended = () => setPlayingPreview(null)
      setPlayingPreview(voice.id)
    }
  }

  const generateAudio = async () => {
    if (!selectedVoice || !book) {
      setError('Por favor, selecione uma voz')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // Get book text from IndexedDB or generate sample
      let text = `Este é o livro "${book.title}" de ${book.author}. `
      text += `Convertendo páginas ${pageStart} a ${pageEnd}. `
      text += `Esta é uma demonstração da conversão de texto para áudio usando inteligência artificial.`
      
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          settings: 'audiobook',
          bookId: book.id || book.key,
          pageStart,
          pageEnd
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao gerar áudio')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Save to IndexedDB for offline
      try {
        const db = await openDatabase()
        const tx = db.transaction('audiobooks', 'readwrite')
        const store = tx.objectStore('audiobooks')
        const arrayBuffer = await audioBlob.arrayBuffer()
        await store.put({
          id: `${book.id || book.key}_${pageStart}_${pageEnd}`,
          bookId: book.id || book.key,
          title: book.title,
          data: arrayBuffer,
          pageStart,
          pageEnd,
          createdAt: new Date()
        })
      } catch (e) {
        console.log('Failed to save offline:', e)
      }
      
      onAudioGenerated(audioUrl)
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#1a1a1a] border-[#333] text-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#00D26A]" />
            {t('generateAudiobook')}
          </DialogTitle>
          {book && (
            <DialogDescription className="text-[#888]">
              {book.title} - {book.author}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#00D26A]" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Voice Selection */}
            <div className="flex-shrink-0">
              <label className="text-sm text-[#B3B3B3] mb-2 block">{t('selectVoice')}</label>
              <ScrollArea className="h-48 rounded-md border border-[#333]">
                <div className="p-2 space-y-1">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedVoice === voice.id 
                          ? 'bg-[#00D26A]/20 border border-[#00D26A]' 
                          : 'bg-[#222] hover:bg-[#333] border border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{voice.name}</p>
                        {voice.labels?.accent && (
                          <p className="text-xs text-[#666] truncate">{voice.labels.accent}</p>
                        )}
                      </div>
                      {voice.previewUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            playPreview(voice)
                          }}
                          className="ml-2 flex-shrink-0"
                        >
                          {playingPreview === voice.id ? (
                            <Pause className="w-4 h-4 text-[#00D26A]" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Page Selection */}
            <div className="flex-shrink-0 space-y-3">
              <label className="text-sm text-[#B3B3B3] block">Páginas para converter</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-[#666]">De</Label>
                  <Input
                    type="number"
                    min={1}
                    max={pageEnd}
                    value={pageStart}
                    onChange={(e) => setPageStart(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-[#222] border-[#444] text-white mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-[#666]">Até</Label>
                  <Input
                    type="number"
                    min={pageStart}
                    value={pageEnd}
                    onChange={(e) => setPageEnd(Math.max(pageStart, parseInt(e.target.value) || pageStart))}
                    className="bg-[#222] border-[#444] text-white mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-[#666]">
                {pageEnd - pageStart + 1} página(s) selecionada(s)
              </p>
            </div>

            {error && (
              <div className="flex-shrink-0 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex-shrink-0 flex gap-3 pt-2">
              <Button
                onClick={generateAudio}
                disabled={generating || !selectedVoice}
                className="flex-1 bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('generating')}</>
                ) : (
                  <><Headphones className="w-4 h-4 mr-2" />{t('generateAudiobook')}</>
                )}
              </Button>
              <Button variant="outline" onClick={onClose} className="border-[#444]">
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==================== EBOOK READER ====================

function EbookReader({ book, onClose, t }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toc, setToc] = useState([])
  const [showToc, setShowToc] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [theme, setTheme] = useState('dark')
  const containerRef = useRef(null)
  const renditionRef = useRef(null)
  const bookRef = useRef(null)

  useEffect(() => {
    if (!book) return
    loadBook()
    return () => {
      if (renditionRef.current) renditionRef.current.destroy()
    }
  }, [book])

  const loadBook = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check if it's an uploaded book (stored in IndexedDB)
      if (book.isUploaded || book.format) {
        const db = await openDatabase()
        const tx = db.transaction('books', 'readonly')
        const store = tx.objectStore('books')
        const bookData = await new Promise((resolve, reject) => {
          const request = store.get(book.id)
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        
        if (!bookData) {
          setError('Livro não encontrado no armazenamento local')
          setLoading(false)
          return
        }
        
        if (bookData.format === 'epub') {
          await loadEpub(bookData.data)
        } else {
          setError(`Formato ${bookData.format} ainda não suportado no leitor. Formatos suportados: EPUB`)
        }
      } else if (book.hasEbook && book.ebookEditions?.length > 0) {
        // Open Library book - redirect to Internet Archive
        const edition = book.ebookEditions[0]
        if (edition.readUrl) {
          window.open(edition.readUrl, '_blank')
          onClose()
          return
        }
      } else {
        setError('Este livro não possui versão digital disponível')
      }
    } catch (err) {
      console.error('Error loading book:', err)
      setError('Erro ao carregar o livro: ' + err.message)
    }
    setLoading(false)
  }

  const loadEpub = async (data) => {
    const ePub = (await import('epubjs')).default
    const bookInstance = ePub(data)
    bookRef.current = bookInstance
    
    const rendition = bookInstance.renderTo(containerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none'
    })
    
    renditionRef.current = rendition
    applyTheme(theme)
    
    bookInstance.loaded.navigation.then(nav => setToc(nav.toc))
    rendition.display()
  }

  const applyTheme = (themeName) => {
    if (!renditionRef.current) return
    const themes = {
      light: { body: { background: '#fff', color: '#000' } },
      dark: { body: { background: '#1a1a1a', color: '#E5E5E5' } },
      sepia: { body: { background: '#f4ecd8', color: '#5c4b37' } }
    }
    renditionRef.current.themes.register(themeName, themes[themeName])
    renditionRef.current.themes.select(themeName)
  }

  const changeFontSize = (size) => {
    setFontSize(size)
    if (renditionRef.current) renditionRef.current.themes.fontSize(`${size}%`)
  }

  const goToChapter = (href) => {
    if (renditionRef.current) {
      renditionRef.current.display(href)
      setShowToc(false)
    }
  }

  const goNext = () => renditionRef.current?.next()
  const goPrev = () => renditionRef.current?.prev()

  useEffect(() => { applyTheme(theme) }, [theme])

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1a1a] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-b border-[#333]">
        <button onClick={onClose} className="text-[#B3B3B3] hover:text-white"><X className="w-6 h-6" /></button>
        <h1 className="text-lg font-medium text-white truncate max-w-md">{book?.title}</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowToc(!showToc)} className="text-[#B3B3B3] hover:text-white">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <AnimatePresence>
          {showToc && (
            <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="absolute left-0 top-0 bottom-0 w-80 bg-[#222] z-10 overflow-y-auto border-r border-[#333]">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">{t('tableOfContents')}</h2>
                <div className="space-y-1">
                  {toc.map((item, index) => (
                    <button key={index} onClick={() => goToChapter(item.href)} className="w-full text-left px-3 py-2 rounded hover:bg-[#333] text-[#B3B3B3] hover:text-white transition-colors">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex items-center justify-center">
          <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
            <ChevronLeft className="w-6 h-6" />
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#00D26A]" />
              <p className="text-[#666]">Carregando livro...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <Book className="w-16 h-16 text-[#444]" />
              <p className="text-[#B3B3B3]">{error}</p>
              {book?.hasEbook && book?.ebookEditions?.[0]?.readUrl && (
                <Button onClick={() => window.open(book.ebookEditions[0].readUrl, '_blank')} className="bg-[#00D26A] hover:bg-[#00B85C] text-black">
                  <ExternalLink className="w-4 h-4 mr-2" /> Abrir no Internet Archive
                </Button>
              )}
              <Button variant="outline" onClick={onClose} className="border-[#444]">Fechar</Button>
            </div>
          ) : (
            <div ref={containerRef} className={`w-full h-full max-w-4xl mx-auto ${theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'sepia' ? 'bg-[#f4ecd8]' : 'bg-white'}`} />
          )}

          <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 z-10">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {!loading && !error && (
        <div className="px-4 py-3 bg-[#141414] border-t border-[#333]">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#666]">{t('theme')}:</span>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-24 h-8 bg-[#222] border-[#444] text-white text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#222] border-[#444]">
                  <SelectItem value="dark" className="text-white text-xs">{t('darkTheme')}</SelectItem>
                  <SelectItem value="light" className="text-white text-xs">{t('lightTheme')}</SelectItem>
                  <SelectItem value="sepia" className="text-white text-xs">{t('sepiaTheme')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#666]">{t('fontSize')}:</span>
              <Slider value={[fontSize]} min={75} max={150} step={5} onValueChange={([v]) => changeFontSize(v)} className="w-24" />
              <span className="text-xs text-white w-10">{fontSize}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== NAVBAR ====================

function Navbar({ onSearch, activeTab, setActiveTab, user, onAuthClick, onSettingsClick, t }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) onSearch(searchQuery)
  }

  return (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#141414]/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-[#141414] to-transparent'}`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#00D26A]">Booki</h1>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setActiveTab('home')} className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-white' : 'text-[#B3B3B3] hover:text-white'}`}>{t('home')}</button>
            <button onClick={() => setActiveTab('library')} className={`text-sm font-medium transition-colors ${activeTab === 'library' ? 'text-white' : 'text-[#B3B3B3] hover:text-white'}`}>{t('myLibrary')}</button>
            <button onClick={() => setActiveTab('audiobooks')} className={`text-sm font-medium transition-colors ${activeTab === 'audiobooks' ? 'text-white' : 'text-[#B3B3B3] hover:text-white'}`}>{t('audiobooks')}</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3B3B3]" />
            <Input type="text" placeholder={t('searchBooks')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-48 md:w-64 bg-[#333] border-[#444] text-white placeholder:text-[#666] focus:border-[#00D26A]" />
          </form>
          <Button variant="ghost" size="icon" onClick={onSettingsClick} className="text-[#B3B3B3] hover:text-white"><Settings className="w-5 h-5" /></Button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#B3B3B3] hidden md:block">{user.name}</span>
              <div className="w-8 h-8 rounded-full bg-[#00D26A] flex items-center justify-center">
                <span className="text-black font-medium">{user.name?.[0]?.toUpperCase()}</span>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={onAuthClick} className="border-[#00D26A] text-[#00D26A] hover:bg-[#00D26A]/10">
              <LogIn className="w-4 h-4 mr-2" />{t('login')}
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild className="md:hidden"><Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="bg-[#1a1a1a] border-[#333]">
              <SheetHeader><SheetTitle className="text-[#00D26A]">Booki</SheetTitle></SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3B3B3]" />
                  <Input type="text" placeholder={t('searchBooks')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-[#333] border-[#444] text-white" />
                </form>
                <button onClick={() => setActiveTab('home')} className={`text-left py-2 ${activeTab === 'home' ? 'text-[#00D26A]' : 'text-[#B3B3B3]'}`}><Home className="inline w-5 h-5 mr-3" /> {t('home')}</button>
                <button onClick={() => setActiveTab('library')} className={`text-left py-2 ${activeTab === 'library' ? 'text-[#00D26A]' : 'text-[#B3B3B3]'}`}><Library className="inline w-5 h-5 mr-3" /> {t('myLibrary')}</button>
                <button onClick={() => setActiveTab('audiobooks')} className={`text-left py-2 ${activeTab === 'audiobooks' ? 'text-[#00D26A]' : 'text-[#B3B3B3]'}`}><Headphones className="inline w-5 h-5 mr-3" /> {t('audiobooks')}</button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  )
}

// ==================== HERO SECTION ====================

function HeroSection({ book, onReadClick, onListenClick, onAddToLibrary, t }) {
  const [bgColor, setBgColor] = useState('#141414')
  
  useEffect(() => {
    if (book?.coverUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = book.coverUrl
      img.onload = async () => {
        try {
          const FastAverageColor = (await import('fast-average-color')).default
          const fac = new FastAverageColor()
          const color = fac.getColor(img)
          setBgColor(color.hex)
        } catch (e) {}
      }
    }
  }, [book])

  if (!book) return null

  return (
    <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: bgColor }} />
      <div className="absolute inset-0">{book.coverUrl && <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover opacity-30" />}</div>
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute bottom-0 left-0 right-0 h-32 hero-gradient-bottom" />
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-display">{book.title}</h1>
          <p className="text-lg md:text-xl text-[#B3B3B3] mb-2">{book.author}</p>
          {book.ratingsAverage > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400">{book.ratingsAverage?.toFixed(1)}</span>
              <span className="text-[#666]">({book.ratingsCount || 0} {t('ratings')})</span>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold" onClick={() => onReadClick(book)}>
              <BookOpen className="w-5 h-5 mr-2" /> {t('readNow')}
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-white/10 hover:bg-white/20 text-white" onClick={() => onListenClick(book)}>
              <Headphones className="w-5 h-5 mr-2" /> {t('listen')}
            </Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => onAddToLibrary(book)}>
              <Plus className="w-5 h-5 mr-2" /> {t('addToLibrary')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ==================== BOOK CARD ====================

function BookCard({ book, onClick, onAddToLibrary, index = 0 }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }} className="flex-shrink-0 w-36 md:w-44 book-card cursor-pointer" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={() => onClick(book)}>
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#222] shadow-lg">
        {book.coverUrl && !imageError ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#1a1a1a]"><Book className="w-12 h-12 text-[#444]" /></div>
        )}
        <AnimatePresence>
          {isHovered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2">
              <Button size="sm" className="w-full bg-[#00D26A] hover:bg-[#00B85C] text-black text-xs"><Play className="w-3 h-3 mr-1" /> Ler</Button>
              <Button size="sm" variant="outline" className="w-full border-white/30 text-white text-xs" onClick={(e) => { e.stopPropagation(); onAddToLibrary(book) }}><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium text-white truncate">{book.title}</h3>
        <p className="text-xs text-[#B3B3B3] truncate">{book.author}</p>
      </div>
    </motion.div>
  )
}

// ==================== BOOK CAROUSEL ====================

function BookCarousel({ title, books, onBookClick, onAddToLibrary, loading }) {
  const scrollRef = useRef(null)
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white">{title}</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-[#B3B3B3] hover:text-white hover:bg-white/10" onClick={() => scroll('left')}><ChevronLeft className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="text-[#B3B3B3] hover:text-white hover:bg-white/10" onClick={() => scroll('right')}><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>
      <div ref={scrollRef} className="carousel-container flex gap-3 px-4 pb-4">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 md:w-44">
              <div className="aspect-[2/3] rounded-lg bg-[#333] animate-pulse" />
              <div className="mt-2 h-4 bg-[#333] rounded animate-pulse" />
              <div className="mt-1 h-3 w-2/3 bg-[#333] rounded animate-pulse" />
            </div>
          ))
        ) : books?.length > 0 ? (
          books.map((book, index) => <BookCard key={book.key || index} book={book} index={index} onClick={onBookClick} onAddToLibrary={onAddToLibrary} />)
        ) : (
          <p className="text-[#666] py-8">Nenhum livro encontrado</p>
        )}
      </div>
    </div>
  )
}

// ==================== BOOK DETAILS MODAL ====================

function BookDetailsModal({ book, isOpen, onClose, onRead, onListen, onAddToLibrary, t }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (book && isOpen) fetchBookDetails()
  }, [book, isOpen])

  const fetchBookDetails = async () => {
    if (!book?.key) return
    setLoading(true)
    try {
      const workId = book.key.replace('/works/', '')
      const response = await fetch(`/api/books/work/${workId}`)
      const data = await response.json()
      setDetails(data)
    } catch (error) {}
    setLoading(false)
  }

  if (!book) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#1a1a1a] border-[#333] text-white max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#00D26A]" /></div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-48 mx-auto md:mx-0">
                {(details?.coverUrl || book.coverUrl) ? (
                  <img src={details?.coverUrl || book.coverUrl} alt={book.title} className="w-full rounded-lg shadow-2xl" />
                ) : (
                  <div className="aspect-[2/3] rounded-lg bg-[#333] flex items-center justify-center"><Book className="w-16 h-16 text-[#444]" /></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <DialogHeader><DialogTitle className="text-2xl md:text-3xl font-display">{book.title}</DialogTitle></DialogHeader>
              <p className="text-[#B3B3B3] mt-2">{t('by')} {details?.authors?.[0]?.name || book.author}</p>
              {details?.ratings?.average > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-medium">{details.ratings.average.toFixed(1)}</span>
                  <span className="text-[#666]">({details.ratings.count} {t('ratings')})</span>
                </div>
              )}
              {details?.hasEbook && <Badge className="mt-2 bg-[#00D26A]/20 text-[#00D26A] border-[#00D26A]">📖 eBook disponível</Badge>}
              {details?.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {details.subjects.slice(0, 5).map((subject, i) => <Badge key={i} variant="outline" className="border-[#444] text-[#B3B3B3]">{subject}</Badge>)}
                </div>
              )}
              {details?.description && <p className="mt-4 text-[#B3B3B3] text-sm leading-relaxed line-clamp-6">{details.description}</p>}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button className="bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold" onClick={() => onRead({ ...book, ...details })}><BookOpen className="w-4 h-4 mr-2" /> {t('readNow')}</Button>
                <Button variant="outline" className="border-[#FF9900] text-[#FF9900] hover:bg-[#FF9900]/10" onClick={() => onListen({ ...book, ...details })}><Headphones className="w-4 h-4 mr-2" /> {t('listen')}</Button>
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => onAddToLibrary(book)}><Plus className="w-4 h-4 mr-2" /> {t('addToLibrary')}</Button>
              </div>
              {details?.firstPublishDate && <p className="mt-4 text-xs text-[#666]">{t('firstPublished')}: {details.firstPublishDate}</p>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==================== AUDIO PLAYER ====================

function AudioPlayer({ book, audioUrl, onClose, onDownload, t }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (isPlaying) audio.pause()
    else audio.play()
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value) => { audioRef.current.currentTime = value[0]; setCurrentTime(value[0]) }
  const handleVolumeChange = (value) => { audioRef.current.volume = value[0]; setVolume(value[0]); setIsMuted(value[0] === 0) }
  const toggleMute = () => { if (isMuted) { audioRef.current.volume = volume || 1; setIsMuted(false) } else { audioRef.current.volume = 0; setIsMuted(true) } }
  const changeSpeed = (speed) => { audioRef.current.playbackRate = speed; setPlaybackRate(speed) }
  const skip = (seconds) => { audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds)) }
  const formatTime = (time) => { if (!time || isNaN(time)) return '0:00'; const minutes = Math.floor(time / 60); const seconds = Math.floor(time % 60); return `${minutes}:${seconds.toString().padStart(2, '0')}` }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `${book?.title || 'audiobook'}.mp3`
    a.click()
  }

  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4 z-50">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {book?.coverUrl && <img src={book.coverUrl} alt={book.title} className="w-12 h-12 rounded object-cover" />}
          <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{book?.title}</p><p className="text-xs text-[#B3B3B3] truncate">{book?.author}</p></div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:text-[#00D26A]"><SkipBack className="w-5 h-5" /></Button>
            <Button size="icon" className="bg-[#00D26A] hover:bg-[#00B85C] text-black w-12 h-12 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:text-[#00D26A]"><SkipForward className="w-5 h-5" /></Button>
          </div>
          <div className="flex items-center gap-3 w-full max-w-xl">
            <span className="text-xs text-[#B3B3B3] w-10 text-right">{formatTime(currentTime)}</span>
            <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="flex-1" />
            <span className="text-xs text-[#B3B3B3] w-10">{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select value={playbackRate.toString()} onValueChange={(v) => changeSpeed(parseFloat(v))}>
            <SelectTrigger className="w-20 bg-transparent border-[#444] text-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#222] border-[#444]">
              {[0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3].map((speed) => <SelectItem key={speed} value={speed.toString()} className="text-white">{speed}x</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:text-[#00D26A]">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</Button>
            <Slider value={[isMuted ? 0 : volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-20" />
          </div>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="text-[#00D26A] hover:text-white" title="Download offline"><Download className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#666] hover:text-white"><X className="w-5 h-5" /></Button>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== LIBRARY VIEW ====================

function LibraryView({ onBookClick, onUploadClick, t }) {
  const [library, setLibrary] = useState([])
  const [uploadedBooks, setUploadedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')

  useEffect(() => { fetchLibrary(); fetchUploadedBooks() }, [])

  const fetchLibrary = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/library?userId=guest', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const data = await response.json()
      setLibrary(data.books || [])
    } catch (error) {}
    setLoading(false)
  }

  const fetchUploadedBooks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/uploads?userId=guest', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const data = await response.json()
      setUploadedBooks(data.books || [])
    } catch (error) {}
  }

  const filteredLibrary = activeStatus === 'all' ? library : activeStatus === 'uploaded' ? [] : library.filter(item => item.status === activeStatus)
  const statuses = [
    { value: 'all', label: t('allBooks') },
    { value: 'reading', label: t('reading') },
    { value: 'finished', label: t('finished') },
    { value: 'want_to_read', label: t('wantToRead') },
    { value: 'uploaded', label: t('uploadedBooks') },
  ]

  return (
    <div className="pt-24 pb-8 px-4 container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('myLibrary')}</h1>
        <Button onClick={onUploadClick} className="bg-[#00D26A] hover:bg-[#00B85C] text-black"><Upload className="w-4 h-4 mr-2" />{t('uploadBook')}</Button>
      </div>
      <Tabs value={activeStatus} onValueChange={setActiveStatus} className="mb-6">
        <TabsList className="bg-[#222] flex-wrap h-auto">
          {statuses.map(status => <TabsTrigger key={status.value} value={status.value} className="data-[state=active]:bg-[#00D26A] data-[state=active]:text-black">{status.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => <div key={i}><div className="aspect-[2/3] rounded-lg bg-[#333] animate-pulse" /><div className="mt-2 h-4 bg-[#333] rounded animate-pulse" /></div>)}
        </div>
      ) : activeStatus === 'uploaded' ? (
        uploadedBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedBooks.map((book, index) => (
              <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="cursor-pointer" onClick={() => onBookClick({ ...book, isUploaded: true })}>
                <div className="aspect-[2/3] rounded-lg bg-gradient-to-br from-[#333] to-[#1a1a1a] flex items-center justify-center"><FileText className="w-12 h-12 text-[#444]" /></div>
                <div className="mt-2"><h3 className="text-sm font-medium text-white truncate">{book.title}</h3><p className="text-xs text-[#B3B3B3] truncate">{book.author}</p><Badge variant="outline" className="mt-1 text-xs border-[#444]">{book.format?.toUpperCase()}</Badge></div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20"><Upload className="w-16 h-16 mx-auto text-[#444] mb-4" /><p className="text-[#666] text-lg">{t('emptyLibrary')}</p><p className="text-[#444] text-sm mt-2">{t('startAdding')}</p></div>
        )
      ) : filteredLibrary.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredLibrary.map((item, index) => <BookCard key={item.id} book={item.book} index={index} onClick={onBookClick} onAddToLibrary={() => {}} />)}
        </div>
      ) : (
        <div className="text-center py-20"><Library className="w-16 h-16 mx-auto text-[#444] mb-4" /><p className="text-[#666] text-lg">{t('emptyLibrary')}</p><p className="text-[#444] text-sm mt-2">{t('startAdding')}</p></div>
      )}
    </div>
  )
}

// ==================== SEARCH RESULTS ====================

function SearchResults({ query, onBookClick, onAddToLibrary, onBack, t }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { searchBooks() }, [query])

  const searchBooks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}&limit=40`)
      const data = await response.json()
      setResults(data.books || [])
    } catch (error) {}
    setLoading(false)
  }

  return (
    <div className="pt-24 pb-8 px-4 container mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-[#B3B3B3] hover:text-white mb-4"><ChevronLeft className="w-5 h-5" /> {t('back')}</button>
      <h1 className="text-2xl font-bold mb-6">{t('searchResults')} "{query}"</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => <div key={i}><div className="aspect-[2/3] rounded-lg bg-[#333] animate-pulse" /><div className="mt-2 h-4 bg-[#333] rounded animate-pulse" /></div>)}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((book, index) => <BookCard key={book.key || index} book={book} index={index} onClick={onBookClick} onAddToLibrary={onAddToLibrary} />)}
        </div>
      ) : (
        <div className="text-center py-20"><Search className="w-16 h-16 mx-auto text-[#444] mb-4" /><p className="text-[#666] text-lg">{t('noResults')}</p></div>
      )}
    </div>
  )
}

// ==================== AUDIOBOOKS VIEW ====================

function AudiobooksView({ onBookClick, t }) {
  const [audiobooks, setAudiobooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAudiobooks() }, [])

  const fetchAudiobooks = async () => {
    setLoading(true)
    try {
      // Also fetch from IndexedDB
      const db = await openDatabase()
      const tx = db.transaction('audiobooks', 'readonly')
      const store = tx.objectStore('audiobooks')
      const allAudiobooks = await new Promise((resolve) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => resolve([])
      })
      setAudiobooks(allAudiobooks)
    } catch (error) {}
    setLoading(false)
  }

  return (
    <div className="pt-24 pb-8 px-4 container mx-auto">
      <h1 className="text-3xl font-bold mb-4">{t('audiobooks')}</h1>
      <p className="text-[#B3B3B3] mb-8">Gere audiolivros de qualquer livro usando síntese de voz com IA. Disponíveis offline após download.</p>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i}><div className="aspect-[2/3] rounded-lg bg-[#333] animate-pulse" /></div>)}
        </div>
      ) : audiobooks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {audiobooks.map((audiobook, index) => (
            <motion.div key={audiobook.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="cursor-pointer" onClick={() => {
              const audioUrl = URL.createObjectURL(new Blob([audiobook.data], { type: 'audio/mpeg' }))
              onBookClick({ title: audiobook.title, audioUrl })
            }}>
              <div className="aspect-[2/3] rounded-lg bg-gradient-to-br from-[#FF9900]/20 to-[#FF9900]/5 flex items-center justify-center border border-[#FF9900]/30">
                <Headphones className="w-12 h-12 text-[#FF9900]" />
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium text-white truncate">{audiobook.title}</h3>
                <p className="text-xs text-[#666]">Páginas {audiobook.pageStart}-{audiobook.pageEnd}</p>
                <Badge className="mt-1 bg-green-500/20 text-green-400 text-xs">Offline</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#1a1a1a] rounded-lg">
          <Headphones className="w-16 h-16 mx-auto text-[#444] mb-4" />
          <p className="text-[#666] text-lg mb-4">{t('noAudiobooks')}</p>
          <p className="text-[#444] text-sm mb-6">Selecione qualquer livro e clique em "Ouvir" para gerar um audiolivro</p>
        </div>
      )}
    </div>
  )
}

// ==================== MAIN APP ====================

export default function BookiApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [featuredBook, setFeaturedBook] = useState(null)
  const [language, setLanguage] = useState('pt')
  const [user, setUser] = useState(null)
  
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDetailsOpen, setBookDetailsOpen] = useState(false)
  const [ttsModalOpen, setTtsModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [readerOpen, setReaderOpen] = useState(false)
  const [readerBook, setReaderBook] = useState(null)
  
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBook, setAudioBook] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const { t, translateCategory } = useTranslation(language)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedLang = localStorage.getItem('language')
    if (savedUser) setUser(JSON.parse(savedUser))
    if (savedLang) setLanguage(savedLang)
  }, [])

  useEffect(() => {
    localStorage.setItem('language', language)
    if (user) {
      fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ language })
      }).catch(() => {})
    }
  }, [language])

  useEffect(() => { fetchTrendingBooks() }, [language])

  const fetchTrendingBooks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/books/trending?lang=${language}`)
      const data = await response.json()
      if (data.categories?.length > 0) {
        setCategories(data.categories)
        const firstCategoryWithBooks = data.categories.find(c => c.books?.length > 0)
        if (firstCategoryWithBooks?.books?.[0]) setFeaturedBook(firstCategoryWithBooks.books[0])
      }
    } catch (error) {}
    setLoading(false)
  }

  const handleBookClick = (book) => {
    if (book.isUploaded || book.format) {
      setReaderBook(book)
      setReaderOpen(true)
    } else {
      setSelectedBook(book)
      setBookDetailsOpen(true)
    }
  }

  const handleAddToLibrary = async (book) => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user?.id || 'guest', book, status: 'want_to_read' })
      })
    } catch (error) {}
  }

  const handleReadClick = (book) => {
    setSelectedBook(book)
    setBookDetailsOpen(false)
    setReaderBook(book)
    setReaderOpen(true)
  }

  const handleListenClick = (book) => {
    setSelectedBook(book)
    setBookDetailsOpen(false)
    setTtsModalOpen(true)
  }

  const handleAudioGenerated = (url) => {
    setAudioUrl(url)
    setAudioBook(selectedBook)
  }

  const handleSearch = (query) => { setSearchQuery(query); setIsSearching(true) }
  const handleBackFromSearch = () => { setIsSearching(false); setSearchQuery('') }
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); setSettingsOpen(false) }
  const handleUploadSuccess = (book) => { if (activeTab === 'library') { setActiveTab('home'); setTimeout(() => setActiveTab('library'), 100) } }

  const handleAudiobookClick = (audiobook) => {
    if (audiobook.audioUrl) {
      setAudioUrl(audiobook.audioUrl)
      setAudioBook(audiobook)
    }
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar onSearch={handleSearch} activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsSearching(false) }} user={user} onAuthClick={() => setAuthModalOpen(true)} onSettingsClick={() => setSettingsOpen(true)} t={t} />

      {isSearching ? (
        <SearchResults query={searchQuery} onBookClick={handleBookClick} onAddToLibrary={handleAddToLibrary} onBack={handleBackFromSearch} t={t} />
      ) : activeTab === 'library' ? (
        <LibraryView onBookClick={handleBookClick} onUploadClick={() => setUploadModalOpen(true)} t={t} />
      ) : activeTab === 'audiobooks' ? (
        <AudiobooksView onBookClick={handleAudiobookClick} t={t} />
      ) : (
        <main>
          {featuredBook && <HeroSection book={featuredBook} onReadClick={handleReadClick} onListenClick={handleListenClick} onAddToLibrary={handleAddToLibrary} t={t} />}
          <div className="relative -mt-20 pb-20">
            {categories.map((category, index) => <BookCarousel key={category.subject || index} title={category.category} books={category.books} loading={loading} onBookClick={handleBookClick} onAddToLibrary={handleAddToLibrary} />)}
          </div>
        </main>
      )}

      <BookDetailsModal book={selectedBook} isOpen={bookDetailsOpen} onClose={() => setBookDetailsOpen(false)} onRead={handleReadClick} onListen={handleListenClick} onAddToLibrary={handleAddToLibrary} t={t} />
      <TTSModal book={selectedBook} isOpen={ttsModalOpen} onClose={() => setTtsModalOpen(false)} onAudioGenerated={handleAudioGenerated} t={t} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={setUser} t={t} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} language={language} setLanguage={setLanguage} user={user} onLogout={handleLogout} t={t} />
      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} t={t} />

      {readerOpen && readerBook && <EbookReader book={readerBook} onClose={() => { setReaderOpen(false); setReaderBook(null) }} t={t} />}

      <AnimatePresence>
        {audioUrl && <AudioPlayer book={audioBook} audioUrl={audioUrl} onClose={() => { setAudioUrl(null); setAudioBook(null) }} t={t} />}
      </AnimatePresence>
    </div>
  )
}
