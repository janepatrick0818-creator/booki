import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getVoices, generateSpeech, chunkText, VOICE_SETTINGS } from '@/lib/elevenlabs'
import { hashPassword, verifyPassword, generateToken, authenticateRequest } from '@/lib/auth'
import { getCached, setCached, getCacheKey, CACHE_TTL } from '@/lib/redis'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

const OPEN_LIBRARY_BASE = 'https://openlibrary.org'
const COVERS_BASE = 'https://covers.openlibrary.org'

const CATEGORIES = [
  { name: 'Science Fiction', nameEs: 'Ciencia Ficción', namePt: 'Ficção Científica', subject: 'science_fiction' },
  { name: 'Fantasy', nameEs: 'Fantasía', namePt: 'Fantasia', subject: 'fantasy' },
  { name: 'Romance', nameEs: 'Romance', namePt: 'Romance', subject: 'romance' },
  { name: 'Mystery', nameEs: 'Misterio', namePt: 'Mistério', subject: 'mystery' },
  { name: 'Self Help', nameEs: 'Autoayuda', namePt: 'Autoajuda', subject: 'self-help' },
  { name: 'Philosophy', nameEs: 'Filosofía', namePt: 'Filosofia', subject: 'philosophy' },
  { name: 'Psychology', nameEs: 'Psicología', namePt: 'Psicologia', subject: 'psychology' },
  { name: 'Biography', nameEs: 'Biografía', namePt: 'Biografia', subject: 'biography' },
  { name: 'History', nameEs: 'Historia', namePt: 'História', subject: 'history' },
]

// Supported upload formats
const SUPPORTED_FORMATS = ['epub', 'pdf', 'doc', 'docx', 'txt', 'rtf', 'htm', 'html']

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Booki API v1.0", status: "running" }))
    }

    // ==================== AUTHENTICATION ====================
    
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { email, password, name } = body
      
      if (!email || !password || !name) {
        return handleCORS(NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 }))
      }
      
      const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }))
      }
      
      const hashedPassword = await hashPassword(password)
      const user = {
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        language: 'pt',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('users').insertOne(user)
      const token = generateToken(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user
      
      const response = handleCORS(NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword, token }))
      response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })
      return response
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      
      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password are required' }, { status: 400 }))
      }
      
      const user = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }
      
      const isValid = await verifyPassword(password, user.password)
      if (!isValid) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }
      
      const token = generateToken(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user
      
      const response = handleCORS(NextResponse.json({ message: 'Login successful', user: userWithoutPassword, token }))
      response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 })
      return response
    }

    if (route === '/auth/me' && method === 'GET') {
      const user = await authenticateRequest(request, db)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const { password: _, ...userWithoutPassword } = user
      return handleCORS(NextResponse.json({ user: userWithoutPassword }))
    }

    if (route === '/auth/settings' && method === 'PUT') {
      const user = await authenticateRequest(request, db)
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      
      const body = await request.json()
      const { language, name } = body
      
      const updateData = { updatedAt: new Date() }
      if (language) updateData.language = language
      if (name) updateData.name = name
      
      await db.collection('users').updateOne({ id: user.id }, { $set: updateData })
      return handleCORS(NextResponse.json({ message: 'Settings updated' }))
    }

    if (route === '/auth/logout' && method === 'POST') {
      const response = handleCORS(NextResponse.json({ message: 'Logged out successfully' }))
      response.cookies.delete('token')
      return response
    }

    // ==================== OPEN LIBRARY WITH CACHE ====================
    
    if (route === '/books/search' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q') || ''
      const page = searchParams.get('page') || 1
      const limit = searchParams.get('limit') || 20
      const lang = searchParams.get('lang') || 'pt'
      
      // Try cache first
      const cacheKey = getCacheKey('search', `${query}_${page}_${limit}_${lang}`)
      const cached = await getCached(cacheKey)
      if (cached) {
        return handleCORS(NextResponse.json(cached))
      }
      
      let searchUrl = `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      if (lang === 'pt') searchUrl += '&language=por'
      else if (lang === 'es') searchUrl += '&language=spa'
      
      const response = await fetch(searchUrl)
      const data = await response.json()
      
      const books = (data.docs || []).map(book => ({
        key: book.key,
        title: book.title,
        author: book.author_name?.[0] || 'Autor Desconhecido',
        authorKey: book.author_key?.[0],
        coverId: book.cover_i,
        coverUrl: book.cover_i ? `${COVERS_BASE}/b/id/${book.cover_i}-L.jpg` : null,
        firstPublishYear: book.first_publish_year,
        language: book.language?.[0],
        subjects: book.subject?.slice(0, 5) || [],
        isbn: book.isbn?.[0],
        editionCount: book.edition_count,
        ratingsAverage: book.ratings_average,
        ratingsCount: book.ratings_count,
        hasFullText: book.has_fulltext || false,
        iaCollection: book.ia || [],
      }))
      
      const result = { numFound: data.numFound, page: parseInt(page), books }
      
      // Cache result
      await setCached(cacheKey, result, CACHE_TTL.SEARCH)
      
      return handleCORS(NextResponse.json(result))
    }

    if (route.startsWith('/books/subject/') && method === 'GET') {
      const subject = path[2]
      const { searchParams } = new URL(request.url)
      const limit = searchParams.get('limit') || 20
      
      // Try cache
      const cacheKey = getCacheKey('subject', `${subject}_${limit}`)
      const cached = await getCached(cacheKey)
      if (cached) {
        return handleCORS(NextResponse.json(cached))
      }
      
      const response = await fetch(`${OPEN_LIBRARY_BASE}/subjects/${subject}.json?limit=${limit}`)
      const data = await response.json()
      
      const books = (data.works || []).map(book => ({
        key: book.key,
        title: book.title,
        author: book.authors?.[0]?.name || 'Autor Desconhecido',
        authorKey: book.authors?.[0]?.key?.replace('/authors/', ''),
        coverId: book.cover_id,
        coverUrl: book.cover_id ? `${COVERS_BASE}/b/id/${book.cover_id}-L.jpg` : null,
        firstPublishYear: book.first_publish_year,
        subjects: book.subject?.slice(0, 5) || [],
        editionCount: book.edition_count,
        hasFullText: book.has_fulltext || false,
        iaCollection: book.ia || [],
      }))
      
      const result = { name: data.name, workCount: data.work_count, books }
      await setCached(cacheKey, result, CACHE_TTL.SUBJECT)
      
      return handleCORS(NextResponse.json(result))
    }

    if (route.startsWith('/books/work/') && method === 'GET') {
      const workId = path[2]
      
      // Try cache
      const cacheKey = getCacheKey('work', workId)
      const cached = await getCached(cacheKey)
      if (cached) {
        return handleCORS(NextResponse.json(cached))
      }
      
      const [workResponse, ratingsResponse, editionsResponse] = await Promise.all([
        fetch(`${OPEN_LIBRARY_BASE}/works/${workId}.json`),
        fetch(`${OPEN_LIBRARY_BASE}/works/${workId}/ratings.json`).catch(() => null),
        fetch(`${OPEN_LIBRARY_BASE}/works/${workId}/editions.json?limit=5`).catch(() => null)
      ])
      
      const work = await workResponse.json()
      const ratings = ratingsResponse ? await ratingsResponse.json().catch(() => ({})) : {}
      const editions = editionsResponse ? await editionsResponse.json().catch(() => ({ entries: [] })) : { entries: [] }
      
      let authorDetails = null
      if (work.authors?.[0]?.author?.key) {
        try {
          const authorResponse = await fetch(`${OPEN_LIBRARY_BASE}${work.authors[0].author.key}.json`)
          authorDetails = await authorResponse.json()
        } catch (e) {}
      }
      
      const description = typeof work.description === 'string' ? work.description : work.description?.value || ''
      
      // Check for available ebooks
      const availableEditions = editions.entries?.filter(e => e.ocaid || e.ia_box_id) || []
      
      const result = {
        key: work.key,
        title: work.title,
        description,
        covers: work.covers || [],
        coverUrl: work.covers?.[0] ? `${COVERS_BASE}/b/id/${work.covers[0]}-L.jpg` : null,
        subjects: work.subjects?.slice(0, 10) || [],
        authors: work.authors?.map(a => ({
          key: a.author?.key?.replace('/authors/', ''),
          name: authorDetails?.name || 'Desconhecido',
          bio: authorDetails?.bio?.value || authorDetails?.bio || ''
        })) || [],
        firstPublishDate: work.first_publish_date,
        ratings: { average: ratings.summary?.average || 0, count: ratings.summary?.count || 0 },
        // eBook availability
        hasEbook: availableEditions.length > 0,
        ebookEditions: availableEditions.map(e => ({
          key: e.key,
          title: e.title,
          ocaid: e.ocaid,
          format: e.ocaid ? 'ia' : null,
          readUrl: e.ocaid ? `https://archive.org/details/${e.ocaid}` : null,
          borrowUrl: e.ocaid ? `https://archive.org/stream/${e.ocaid}` : null,
        }))
      }
      
      await setCached(cacheKey, result, CACHE_TTL.BOOK_DETAILS)
      return handleCORS(NextResponse.json(result))
    }

    // Get trending books with cache
    if (route === '/books/trending' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const lang = searchParams.get('lang') || 'pt'
      
      // Try cache
      const cacheKey = getCacheKey('trending', lang)
      const cached = await getCached(cacheKey)
      if (cached) {
        return handleCORS(NextResponse.json(cached))
      }
      
      const results = []
      for (const cat of CATEGORIES.slice(0, 6)) { // Limit to 6 categories to reduce memory
        try {
          const response = await fetch(`${OPEN_LIBRARY_BASE}/subjects/${cat.subject}.json?limit=10`)
          const data = await response.json()
          
          let categoryName = cat.name
          if (lang === 'pt') categoryName = cat.namePt
          else if (lang === 'es') categoryName = cat.nameEs
          
          results.push({
            category: categoryName,
            subject: cat.subject,
            books: (data.works || []).slice(0, 10).map(book => ({
              key: book.key,
              title: book.title,
              author: book.authors?.[0]?.name || 'Autor Desconhecido',
              coverId: book.cover_id,
              coverUrl: book.cover_id ? `${COVERS_BASE}/b/id/${book.cover_id}-L.jpg` : null,
              firstPublishYear: book.first_publish_year,
              hasFullText: book.has_fulltext || false,
            }))
          })
        } catch (e) {
          results.push({ category: cat.name, subject: cat.subject, books: [] })
        }
      }
      
      const result = { categories: results }
      await setCached(cacheKey, result, CACHE_TTL.TRENDING)
      
      return handleCORS(NextResponse.json(result))
    }

    // ==================== ELEVENLABS TTS ====================
    
    if (route === '/tts/voices' && method === 'GET') {
      // Try cache
      const cacheKey = getCacheKey('voices', 'all')
      const cached = await getCached(cacheKey)
      if (cached) {
        return handleCORS(NextResponse.json(cached))
      }
      
      try {
        const voices = await getVoices()
        const formattedVoices = voices.map(voice => ({
          id: voice.voice_id,
          name: voice.name,
          category: voice.category,
          description: voice.description,
          previewUrl: voice.preview_url,
          labels: voice.labels,
        }))
        
        const result = { voices: formattedVoices }
        await setCached(cacheKey, result, CACHE_TTL.VOICES)
        
        return handleCORS(NextResponse.json(result))
      } catch (error) {
        return handleCORS(NextResponse.json({ error: 'Failed to fetch voices', details: error.message }, { status: 500 }))
      }
    }

    // Generate speech from text (for selected pages)
    if (route === '/tts/generate' && method === 'POST') {
      try {
        const body = await request.json()
        const { text, voiceId, settings = 'audiobook', bookId, pageStart, pageEnd } = body
        
        if (!text || !voiceId) {
          return handleCORS(NextResponse.json({ error: 'Text and voiceId are required' }, { status: 400 }))
        }
        
        // Chunk long text
        const chunks = chunkText(text, 4500)
        const audioChunks = []
        
        for (const chunk of chunks) {
          const voiceSettings = VOICE_SETTINGS[settings] || VOICE_SETTINGS.audiobook
          const audioStream = await generateSpeech(chunk, voiceId, voiceSettings)
          
          const parts = []
          for await (const part of audioStream) {
            parts.push(part)
          }
          audioChunks.push(Buffer.concat(parts))
        }
        
        const audioBuffer = Buffer.concat(audioChunks)
        
        // Save to database
        const audioId = uuidv4()
        await db.collection('generated_audio').insertOne({
          id: audioId,
          bookId,
          pageStart,
          pageEnd,
          voiceId,
          settings,
          size: audioBuffer.length,
          createdAt: new Date()
        })
        
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length.toString(),
            'X-Audio-Id': audioId,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'X-Audio-Id'
          }
        })
      } catch (error) {
        console.error('TTS generation error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to generate speech', details: error.message }, { status: 500 }))
      }
    }

    // ==================== USER LIBRARY ====================
    
    if (route === '/library' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      let userId = searchParams.get('userId') || 'guest'
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      const library = await db.collection('user_library').find({ userId }).sort({ updatedAt: -1 }).toArray()
      const cleanedLibrary = library.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json({ books: cleanedLibrary }))
    }

    if (route === '/library' && method === 'POST') {
      const body = await request.json()
      let { userId = 'guest', book, status = 'want_to_read' } = body
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      if (!book || !book.key) {
        return handleCORS(NextResponse.json({ error: 'Book data with key is required' }, { status: 400 }))
      }
      
      const libraryEntry = {
        id: uuidv4(),
        userId,
        bookKey: book.key,
        book,
        status,
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const existing = await db.collection('user_library').findOne({ userId, bookKey: book.key })
      
      if (existing) {
        await db.collection('user_library').updateOne({ userId, bookKey: book.key }, { $set: { status, updatedAt: new Date() } })
        return handleCORS(NextResponse.json({ message: 'Book updated in library', id: existing.id }))
      }
      
      await db.collection('user_library').insertOne(libraryEntry)
      return handleCORS(NextResponse.json({ message: 'Book added to library', id: libraryEntry.id }))
    }

    if (route.startsWith('/library/') && method === 'PUT') {
      const bookId = path[1]
      const body = await request.json()
      const { status, progress, currentPage, totalPages } = body
      
      const updateData = { updatedAt: new Date() }
      if (status) updateData.status = status
      if (progress !== undefined) updateData.progress = progress
      if (currentPage !== undefined) updateData.currentPage = currentPage
      if (totalPages !== undefined) updateData.totalPages = totalPages
      
      await db.collection('user_library').updateOne({ id: bookId }, { $set: updateData })
      return handleCORS(NextResponse.json({ message: 'Book updated' }))
    }

    if (route.startsWith('/library/') && method === 'DELETE') {
      const bookId = path[1]
      await db.collection('user_library').deleteOne({ id: bookId })
      return handleCORS(NextResponse.json({ message: 'Book removed from library' }))
    }

    // ==================== UPLOADED BOOKS ====================
    
    if (route === '/uploads' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      let userId = searchParams.get('userId') || 'guest'
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      const uploads = await db.collection('uploaded_books').find({ userId }).sort({ createdAt: -1 }).toArray()
      const cleaned = uploads.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json({ books: cleaned }))
    }

    if (route === '/uploads' && method === 'POST') {
      const body = await request.json()
      let { userId = 'guest', title, author, format, fileSize, chapters, totalPages } = body
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      if (!title || !format) {
        return handleCORS(NextResponse.json({ error: 'Title and format are required' }, { status: 400 }))
      }
      
      if (!SUPPORTED_FORMATS.includes(format.toLowerCase())) {
        return handleCORS(NextResponse.json({ 
          error: `Format not supported. Supported: ${SUPPORTED_FORMATS.join(', ')}` 
        }, { status: 400 }))
      }
      
      const uploadedBook = {
        id: uuidv4(),
        userId,
        title,
        author: author || 'Desconhecido',
        format: format.toLowerCase(),
        fileSize,
        chapters: chapters || [],
        totalPages: totalPages || 0,
        status: 'ready',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('uploaded_books').insertOne(uploadedBook)
      return handleCORS(NextResponse.json({ message: 'Book uploaded successfully', book: uploadedBook }))
    }

    if (route.startsWith('/uploads/') && method === 'DELETE') {
      const bookId = path[1]
      await db.collection('uploaded_books').deleteOne({ id: bookId })
      return handleCORS(NextResponse.json({ message: 'Book deleted' }))
    }

    // ==================== AUDIOBOOKS (OFFLINE SUPPORT) ====================
    
    if (route === '/audiobooks' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      let userId = searchParams.get('userId') || 'guest'
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      const audiobooks = await db.collection('audiobooks').find({ userId }).sort({ createdAt: -1 }).toArray()
      const cleaned = audiobooks.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json({ audiobooks: cleaned }))
    }

    if (route === '/audiobooks' && method === 'POST') {
      const body = await request.json()
      let { userId = 'guest', bookKey, bookId, title, voiceId, pageStart, pageEnd, totalPages } = body
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      if (!title || !voiceId) {
        return handleCORS(NextResponse.json({ error: 'Title and voiceId are required' }, { status: 400 }))
      }
      
      const audiobook = {
        id: uuidv4(),
        userId,
        bookKey,
        bookId,
        title,
        voiceId,
        pageStart: pageStart || 1,
        pageEnd: pageEnd || totalPages || 0,
        totalPages: totalPages || 0,
        status: 'pending', // pending, processing, completed, error
        audioUrl: null,
        duration: null,
        offlineAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('audiobooks').insertOne(audiobook)
      return handleCORS(NextResponse.json({ message: 'Audiobook created', audiobook: { id: audiobook.id, title: audiobook.title, status: audiobook.status } }))
    }

    // Update audiobook (mark as offline available)
    if (route.startsWith('/audiobooks/') && method === 'PUT') {
      const audiobookId = path[1]
      const body = await request.json()
      const { status, audioUrl, duration, offlineAvailable } = body
      
      const updateData = { updatedAt: new Date() }
      if (status) updateData.status = status
      if (audioUrl) updateData.audioUrl = audioUrl
      if (duration) updateData.duration = duration
      if (offlineAvailable !== undefined) updateData.offlineAvailable = offlineAvailable
      
      await db.collection('audiobooks').updateOne({ id: audiobookId }, { $set: updateData })
      return handleCORS(NextResponse.json({ message: 'Audiobook updated' }))
    }

    if (route.startsWith('/audiobooks/') && method === 'DELETE') {
      const audiobookId = path[1]
      await db.collection('audiobooks').deleteOne({ id: audiobookId })
      return handleCORS(NextResponse.json({ message: 'Audiobook deleted' }))
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
