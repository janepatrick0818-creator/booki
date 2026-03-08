'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Book, Headphones, Library, Play, Plus, ChevronLeft, ChevronRight,
  X, Volume2, VolumeX, Pause, SkipBack, SkipForward, Clock, Bookmark,
  Home, User, Menu, Star, Heart, Share2, Loader2, BookOpen, Mic
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ==================== COMPONENTS ====================

// Navbar Component
function Navbar({ onSearch, onOpenLibrary, activeTab, setActiveTab }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch(searchQuery)
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#141414]/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-[#141414] to-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#00D26A]">Booki</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('home')}
              className={`text-sm font-medium transition-colors ${activeTab === 'home' ? 'text-white' : 'text-[#B3B3B3] hover:text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`text-sm font-medium transition-colors ${activeTab === 'library' ? 'text-white' : 'text-[#B3B3B3] hover:text-white'}`}
            >
              My Library
            </button>
            <button 
              onClick={() => setActiveTab('audiobooks')}
              className={`text-sm font-medium transition-colors ${activeTab === 'audiobooks' ? 'text-white' : 'text-[#B3B3B3] hover:text-white'}`}
            >
              Audiobooks
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3B3B3]" />
            <Input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-48 md:w-64 bg-[#333] border-[#444] text-white placeholder:text-[#666] focus:border-[#00D26A]"
            />
          </form>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#1a1a1a] border-[#333]">
              <SheetHeader>
                <SheetTitle className="text-[#00D26A]">Booki</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3B3B3]" />
                  <Input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#333] border-[#444] text-white"
                  />
                </form>
                <button 
                  onClick={() => setActiveTab('home')}
                  className={`text-left py-2 ${activeTab === 'home' ? 'text-[#00D26A]' : 'text-[#B3B3B3]'}`}
                >
                  <Home className="inline w-5 h-5 mr-3" /> Home
                </button>
                <button 
                  onClick={() => setActiveTab('library')}
                  className={`text-left py-2 ${activeTab === 'library' ? 'text-[#00D26A]' : 'text-[#B3B3B3]'}`}
                >
                  <Library className="inline w-5 h-5 mr-3" /> My Library
                </button>
                <button 
                  onClick={() => setActiveTab('audiobooks')}
                  className={`text-left py-2 ${activeTab === 'audiobooks' ? 'text-[#00D26A]' : 'text-[#B3B3B3]'}`}
                >
                  <Headphones className="inline w-5 h-5 mr-3" /> Audiobooks
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  )
}

// Hero Section Component
function HeroSection({ book, onReadClick, onListenClick, onAddToLibrary }) {
  const [bgColor, setBgColor] = useState('#141414')
  
  useEffect(() => {
    if (book?.coverUrl) {
      // Extract dominant color from cover
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = book.coverUrl
      img.onload = async () => {
        try {
          const FastAverageColor = (await import('fast-average-color')).default
          const fac = new FastAverageColor()
          const color = fac.getColor(img)
          setBgColor(color.hex)
        } catch (e) {
          console.log('Color extraction failed')
        }
      }
    }
  }, [book])

  if (!book) return null

  return (
    <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Background with color overlay */}
      <div 
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: bgColor }}
      />
      
      {/* Cover Image */}
      <div className="absolute inset-0">
        {book.coverUrl && (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover opacity-30"
          />
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute bottom-0 left-0 right-0 h-32 hero-gradient-bottom" />

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-display">{book.title}</h1>
          <p className="text-lg md:text-xl text-[#B3B3B3] mb-2">{book.author}</p>
          
          {book.ratingsAverage > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400">{book.ratingsAverage?.toFixed(1)}</span>
              <span className="text-[#666]">({book.ratingsCount || 0} ratings)</span>
            </div>
          )}

          {book.subjects && book.subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {book.subjects.slice(0, 3).map((subject, i) => (
                <Badge key={i} variant="secondary" className="bg-white/10 text-white/80">
                  {subject}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button 
              size="lg" 
              className="bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold"
              onClick={() => onReadClick(book)}
            >
              <BookOpen className="w-5 h-5 mr-2" /> Read Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => onListenClick(book)}
            >
              <Headphones className="w-5 h-5 mr-2" /> Listen
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => onAddToLibrary(book)}
            >
              <Plus className="w-5 h-5 mr-2" /> My Library
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Book Card Component
function BookCard({ book, onClick, onAddToLibrary, index = 0 }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex-shrink-0 w-36 md:w-44 book-card cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(book)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#222] shadow-lg">
        {book.coverUrl && !imageError ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#1a1a1a]">
            <Book className="w-12 h-12 text-[#444]" />
          </div>
        )}

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2"
            >
              <Button size="sm" className="w-full bg-[#00D26A] hover:bg-[#00B85C] text-black text-xs">
                <Play className="w-3 h-3 mr-1" /> Read
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-white/30 text-white text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToLibrary(book)
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
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

// Carousel Component
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#B3B3B3] hover:text-white hover:bg-white/10"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#B3B3B3] hover:text-white hover:bg-white/10"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="carousel-container flex gap-3 px-4 pb-4"
      >
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 md:w-44">
              <div className="aspect-[2/3] rounded-lg bg-[#333] animate-pulse" />
              <div className="mt-2 h-4 bg-[#333] rounded animate-pulse" />
              <div className="mt-1 h-3 w-2/3 bg-[#333] rounded animate-pulse" />
            </div>
          ))
        ) : books?.length > 0 ? (
          books.map((book, index) => (
            <BookCard
              key={book.key || index}
              book={book}
              index={index}
              onClick={onBookClick}
              onAddToLibrary={onAddToLibrary}
            />
          ))
        ) : (
          <p className="text-[#666] py-8">No books found</p>
        )}
      </div>
    </div>
  )
}

// Book Details Modal
function BookDetailsModal({ book, isOpen, onClose, onRead, onListen, onAddToLibrary }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (book && isOpen) {
      fetchBookDetails()
    }
  }, [book, isOpen])

  const fetchBookDetails = async () => {
    if (!book?.key) return
    setLoading(true)
    try {
      const workId = book.key.replace('/works/', '')
      const response = await fetch(`/api/books/work/${workId}`)
      const data = await response.json()
      setDetails(data)
    } catch (error) {
      console.error('Failed to fetch book details:', error)
    }
    setLoading(false)
  }

  if (!book) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#1a1a1a] border-[#333] text-white max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D26A]" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-48 mx-auto md:mx-0">
                {(details?.coverUrl || book.coverUrl) ? (
                  <img
                    src={details?.coverUrl || book.coverUrl}
                    alt={book.title}
                    className="w-full rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="aspect-[2/3] rounded-lg bg-[#333] flex items-center justify-center">
                    <Book className="w-16 h-16 text-[#444]" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-display">{book.title}</DialogTitle>
              </DialogHeader>

              <p className="text-[#B3B3B3] mt-2">
                by {details?.authors?.[0]?.name || book.author}
              </p>

              {details?.ratings?.average > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-medium">
                    {details.ratings.average.toFixed(1)}
                  </span>
                  <span className="text-[#666]">
                    ({details.ratings.count} ratings)
                  </span>
                </div>
              )}

              {details?.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {details.subjects.slice(0, 5).map((subject, i) => (
                    <Badge key={i} variant="outline" className="border-[#444] text-[#B3B3B3]">
                      {subject}
                    </Badge>
                  ))}
                </div>
              )}

              {details?.description && (
                <p className="mt-4 text-[#B3B3B3] text-sm leading-relaxed line-clamp-6">
                  {details.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <Button 
                  className="bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold"
                  onClick={() => onRead(book)}
                >
                  <BookOpen className="w-4 h-4 mr-2" /> Read Now
                </Button>
                <Button 
                  variant="outline"
                  className="border-[#FF9900] text-[#FF9900] hover:bg-[#FF9900]/10"
                  onClick={() => onListen(book)}
                >
                  <Headphones className="w-4 h-4 mr-2" /> Listen
                </Button>
                <Button 
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => onAddToLibrary(book)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add to Library
                </Button>
              </div>

              {details?.firstPublishDate && (
                <p className="mt-4 text-xs text-[#666]">
                  First published: {details.firstPublishDate}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Audio Player Component
function AudioPlayer({ book, audioUrl, onClose }) {
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
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value) => {
    const audio = audioRef.current
    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value) => {
    const audio = audioRef.current
    audio.volume = value[0]
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (isMuted) {
      audio.volume = volume || 1
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const changeSpeed = (speed) => {
    const audio = audioRef.current
    audio.playbackRate = speed
    setPlaybackRate(speed)
  }

  const skip = (seconds) => {
    const audio = audioRef.current
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4 z-50"
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-4">
        {/* Book Info */}
        <div className="flex items-center gap-3 min-w-0">
          {book?.coverUrl && (
            <img src={book.coverUrl} alt={book.title} className="w-12 h-12 rounded object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{book?.title}</p>
            <p className="text-xs text-[#B3B3B3] truncate">{book?.author}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:text-[#00D26A]">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button 
              size="icon" 
              className="bg-[#00D26A] hover:bg-[#00B85C] text-black w-12 h-12 rounded-full"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:text-[#00D26A]">
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 w-full max-w-xl">
            <span className="text-xs text-[#B3B3B3] w-10 text-right">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-[#B3B3B3] w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Speed */}
        <div className="flex items-center gap-4">
          <Select value={playbackRate.toString()} onValueChange={(v) => changeSpeed(parseFloat(v))}>
            <SelectTrigger className="w-20 bg-transparent border-[#444] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#222] border-[#444]">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <SelectItem key={speed} value={speed.toString()} className="text-white">
                  {speed}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:text-[#00D26A]">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#666] hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// TTS Generator Modal
function TTSGeneratorModal({ book, isOpen, onClose, onAudioGenerated }) {
  const [text, setText] = useState('')
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchVoices()
      if (book?.title) {
        setText(`This is "${book.title}" by ${book.author}. Let me read this book for you.`)
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
      setError('Failed to load voices')
    }
    setLoading(false)
  }

  const generateAudio = async () => {
    if (!text.trim() || !selectedVoice) {
      setError('Please enter text and select a voice')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceId: selectedVoice,
          settings: 'audiobook'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate audio')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      onAudioGenerated(audioUrl)
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#1a1a1a] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#00D26A]" />
            Generate Audiobook
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#00D26A]" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#B3B3B3] mb-2 block">Select Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-[#222] border-[#444] text-white">
                  <SelectValue placeholder="Choose a voice" />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-[#444]">
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id} className="text-white">
                      {voice.name} {voice.category && `(${voice.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#B3B3B3] mb-2 block">
                Text to convert (max 5000 characters)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                maxLength={5000}
                rows={6}
                className="w-full bg-[#222] border border-[#444] rounded-md p-3 text-white placeholder:text-[#666] resize-none focus:outline-none focus:border-[#00D26A]"
              />
              <p className="text-xs text-[#666] mt-1">{text.length} / 5000 characters</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={generateAudio}
                disabled={generating || !text.trim() || !selectedVoice}
                className="flex-1 bg-[#00D26A] hover:bg-[#00B85C] text-black font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4 mr-2" />
                    Generate Audio
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose} className="border-[#444]">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Library View
function LibraryView({ onBookClick }) {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')

  useEffect(() => {
    fetchLibrary()
  }, [])

  const fetchLibrary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/library?userId=guest')
      const data = await response.json()
      setLibrary(data.books || [])
    } catch (error) {
      console.error('Failed to fetch library:', error)
    }
    setLoading(false)
  }

  const filteredLibrary = activeStatus === 'all' 
    ? library 
    : library.filter(item => item.status === activeStatus)

  const statuses = [
    { value: 'all', label: 'All Books' },
    { value: 'reading', label: 'Reading' },
    { value: 'finished', label: 'Finished' },
    { value: 'want_to_read', label: 'Want to Read' },
  ]

  return (
    <div className="pt-24 pb-8 px-4 container mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Library</h1>

      <Tabs value={activeStatus} onValueChange={setActiveStatus} className="mb-6">
        <TabsList className="bg-[#222]">
          {statuses.map(status => (
            <TabsTrigger 
              key={status.value} 
              value={status.value}
              className="data-[state=active]:bg-[#00D26A] data-[state=active]:text-black"
            >
              {status.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] rounded-lg bg-[#333] animate-pulse" />
              <div className="mt-2 h-4 bg-[#333] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredLibrary.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredLibrary.map((item, index) => (
            <BookCard 
              key={item.id} 
              book={item.book} 
              index={index}
              onClick={onBookClick}
              onAddToLibrary={() => {}}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Library className="w-16 h-16 mx-auto text-[#444] mb-4" />
          <p className="text-[#666] text-lg">Your library is empty</p>
          <p className="text-[#444] text-sm mt-2">Start adding books to your library!</p>
        </div>
      )}
    </div>
  )
}

// Search Results View
function SearchResults({ query, onBookClick, onAddToLibrary, onBack }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    searchBooks()
  }, [query])

  const searchBooks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}&limit=40`)
      const data = await response.json()
      setResults(data.books || [])
    } catch (error) {
      console.error('Search failed:', error)
    }
    setLoading(false)
  }

  return (
    <div className="pt-24 pb-8 px-4 container mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[#B3B3B3] hover:text-white mb-4"
      >
        <ChevronLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Results for "{query}"</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] rounded-lg bg-[#333] animate-pulse" />
              <div className="mt-2 h-4 bg-[#333] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((book, index) => (
            <BookCard 
              key={book.key || index} 
              book={book} 
              index={index}
              onClick={onBookClick}
              onAddToLibrary={onAddToLibrary}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="w-16 h-16 mx-auto text-[#444] mb-4" />
          <p className="text-[#666] text-lg">No books found</p>
          <p className="text-[#444] text-sm mt-2">Try a different search term</p>
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
  
  // Modals
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookDetailsOpen, setBookDetailsOpen] = useState(false)
  const [ttsModalOpen, setTtsModalOpen] = useState(false)
  
  // Audio Player
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBook, setAudioBook] = useState(null)
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchTrendingBooks()
  }, [])

  const fetchTrendingBooks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/books/trending')
      const data = await response.json()
      
      if (data.categories?.length > 0) {
        setCategories(data.categories)
        
        // Set featured book from first category with books
        const firstCategoryWithBooks = data.categories.find(c => c.books?.length > 0)
        if (firstCategoryWithBooks?.books?.[0]) {
          setFeaturedBook(firstCategoryWithBooks.books[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch trending books:', error)
    }
    setLoading(false)
  }

  const handleBookClick = (book) => {
    setSelectedBook(book)
    setBookDetailsOpen(true)
  }

  const handleAddToLibrary = async (book) => {
    try {
      await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest', book, status: 'want_to_read' })
      })
      // Show success toast or notification
    } catch (error) {
      console.error('Failed to add to library:', error)
    }
  }

  const handleReadClick = (book) => {
    // For now, open TTS generator as a demo
    setSelectedBook(book)
    setBookDetailsOpen(false)
    alert('eBook reader coming soon! For now, try the Listen feature to generate an audiobook.')
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

  const handleSearch = (query) => {
    setSearchQuery(query)
    setIsSearching(true)
  }

  const handleBackFromSearch = () => {
    setIsSearching(false)
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      <Navbar 
        onSearch={handleSearch}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab)
          setIsSearching(false)
        }}
      />

      {/* Main Content */}
      {isSearching ? (
        <SearchResults 
          query={searchQuery}
          onBookClick={handleBookClick}
          onAddToLibrary={handleAddToLibrary}
          onBack={handleBackFromSearch}
        />
      ) : activeTab === 'library' ? (
        <LibraryView onBookClick={handleBookClick} />
      ) : activeTab === 'audiobooks' ? (
        <div className="pt-24 pb-8 px-4 container mx-auto">
          <h1 className="text-3xl font-bold mb-4">Audiobooks</h1>
          <p className="text-[#B3B3B3] mb-8">
            Generate audiobooks from any book using AI voice synthesis.
          </p>
          <div className="text-center py-16 bg-[#1a1a1a] rounded-lg">
            <Headphones className="w-16 h-16 mx-auto text-[#444] mb-4" />
            <p className="text-[#666] text-lg mb-4">No audiobooks yet</p>
            <p className="text-[#444] text-sm mb-6">
              Select any book and click "Listen" to generate an audiobook
            </p>
            <Button 
              onClick={() => setActiveTab('home')}
              className="bg-[#00D26A] hover:bg-[#00B85C] text-black"
            >
              Browse Books
            </Button>
          </div>
        </div>
      ) : (
        // Home View
        <main>
          {/* Hero Section */}
          {featuredBook && (
            <HeroSection 
              book={featuredBook}
              onReadClick={handleReadClick}
              onListenClick={handleListenClick}
              onAddToLibrary={handleAddToLibrary}
            />
          )}

          {/* Book Carousels */}
          <div className="relative -mt-20 pb-20">
            {categories.map((category, index) => (
              <BookCarousel
                key={category.subject || index}
                title={category.category}
                books={category.books}
                loading={loading}
                onBookClick={handleBookClick}
                onAddToLibrary={handleAddToLibrary}
              />
            ))}
          </div>
        </main>
      )}

      {/* Book Details Modal */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={bookDetailsOpen}
        onClose={() => setBookDetailsOpen(false)}
        onRead={handleReadClick}
        onListen={handleListenClick}
        onAddToLibrary={handleAddToLibrary}
      />

      {/* TTS Generator Modal */}
      <TTSGeneratorModal
        book={selectedBook}
        isOpen={ttsModalOpen}
        onClose={() => setTtsModalOpen(false)}
        onAudioGenerated={handleAudioGenerated}
      />

      {/* Audio Player */}
      <AnimatePresence>
        {audioUrl && (
          <AudioPlayer
            book={audioBook}
            audioUrl={audioUrl}
            onClose={() => {
              setAudioUrl(null)
              setAudioBook(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
