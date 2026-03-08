import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getVoices, generateSpeech, chunkText, VOICE_SETTINGS } from '@/lib/elevenlabs'
import { hashPassword, verifyPassword, generateToken, authenticateRequest } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Open Library API proxy
const OPEN_LIBRARY_BASE = 'https://openlibrary.org'
const COVERS_BASE = 'https://covers.openlibrary.org'

// Categories with translations
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

// Route handler function
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
    
    // Register
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { email, password, name } = body
      
      if (!email || !password || !name) {
        return handleCORS(NextResponse.json(
          { error: 'Email, password and name are required' },
          { status: 400 }
        ))
      }
      
      // Check if user exists
      const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        ))
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
      
      const response = handleCORS(NextResponse.json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        token
      }))
      
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return response
    }

    // Login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      
      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        ))
      }
      
      const user = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        ))
      }
      
      const isValid = await verifyPassword(password, user.password)
      if (!isValid) {
        return handleCORS(NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        ))
      }
      
      const token = generateToken(user.id, user.email)
      const { password: _, ...userWithoutPassword } = user
      
      const response = handleCORS(NextResponse.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token
      }))
      
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })
      
      return response
    }

    // Get current user
    if (route === '/auth/me' && method === 'GET') {
      const user = await authenticateRequest(request, db)
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ))
      }
      
      const { password: _, ...userWithoutPassword } = user
      return handleCORS(NextResponse.json({ user: userWithoutPassword }))
    }

    // Update user settings
    if (route === '/auth/settings' && method === 'PUT') {
      const user = await authenticateRequest(request, db)
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ))
      }
      
      const body = await request.json()
      const { language, name } = body
      
      const updateData = { updatedAt: new Date() }
      if (language) updateData.language = language
      if (name) updateData.name = name
      
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: updateData }
      )
      
      return handleCORS(NextResponse.json({ message: 'Settings updated' }))
    }

    // Logout
    if (route === '/auth/logout' && method === 'POST') {
      const response = handleCORS(NextResponse.json({ message: 'Logged out successfully' }))
      response.cookies.delete('token')
      return response
    }

    // ==================== OPEN LIBRARY PROXY ====================
    
    // Search books
    if (route === '/books/search' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q') || ''
      const page = searchParams.get('page') || 1
      const limit = searchParams.get('limit') || 20
      const lang = searchParams.get('lang') || 'pt'
      
      // Add language filter for Portuguese books if requested
      let searchUrl = `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      if (lang === 'pt') {
        searchUrl += '&language=por'
      } else if (lang === 'es') {
        searchUrl += '&language=spa'
      }
      
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
      }))
      
      return handleCORS(NextResponse.json({
        numFound: data.numFound,
        page: parseInt(page),
        books
      }))
    }

    // Get books by subject/category
    if (route.startsWith('/books/subject/') && method === 'GET') {
      const subject = path[2]
      const { searchParams } = new URL(request.url)
      const limit = searchParams.get('limit') || 20
      const lang = searchParams.get('lang') || 'pt'
      
      let fetchUrl = `${OPEN_LIBRARY_BASE}/subjects/${subject}.json?limit=${limit}`
      
      const response = await fetch(fetchUrl)
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
      }))
      
      return handleCORS(NextResponse.json({
        name: data.name,
        workCount: data.work_count,
        books
      }))
    }

    // Get work details
    if (route.startsWith('/books/work/') && method === 'GET') {
      const workId = path[2]
      
      const [workResponse, ratingsResponse] = await Promise.all([
        fetch(`${OPEN_LIBRARY_BASE}/works/${workId}.json`),
        fetch(`${OPEN_LIBRARY_BASE}/works/${workId}/ratings.json`).catch(() => null)
      ])
      
      const work = await workResponse.json()
      const ratings = ratingsResponse ? await ratingsResponse.json().catch(() => ({})) : {}
      
      // Get author details if available
      let authorDetails = null
      if (work.authors?.[0]?.author?.key) {
        try {
          const authorResponse = await fetch(`${OPEN_LIBRARY_BASE}${work.authors[0].author.key}.json`)
          authorDetails = await authorResponse.json()
        } catch (e) {
          console.error('Author fetch error:', e)
        }
      }
      
      const description = typeof work.description === 'string' 
        ? work.description 
        : work.description?.value || ''
      
      return handleCORS(NextResponse.json({
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
        created: work.created?.value,
        lastModified: work.last_modified?.value,
        ratings: {
          average: ratings.summary?.average || 0,
          count: ratings.summary?.count || 0
        }
      }))
    }

    // Get trending/featured books
    if (route === '/books/trending' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const lang = searchParams.get('lang') || 'pt'
      
      // Fetch sequentially to reduce memory usage
      const results = []
      for (const cat of CATEGORIES) {
        try {
          const response = await fetch(`${OPEN_LIBRARY_BASE}/subjects/${cat.subject}.json?limit=12`)
          const data = await response.json()
          
          // Get translated category name
          let categoryName = cat.name
          if (lang === 'pt') categoryName = cat.namePt
          else if (lang === 'es') categoryName = cat.nameEs
          
          results.push({
            category: categoryName,
            subject: cat.subject,
            books: (data.works || []).slice(0, 12).map(book => ({
              key: book.key,
              title: book.title,
              author: book.authors?.[0]?.name || 'Autor Desconhecido',
              coverId: book.cover_id,
              coverUrl: book.cover_id ? `${COVERS_BASE}/b/id/${book.cover_id}-L.jpg` : null,
              firstPublishYear: book.first_publish_year,
            }))
          })
        } catch (e) {
          results.push({ category: cat.name, subject: cat.subject, books: [] })
        }
      }
      
      return handleCORS(NextResponse.json({ categories: results }))
    }

    // ==================== ELEVENLABS TTS ====================
    
    // Get available voices
    if (route === '/tts/voices' && method === 'GET') {
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
        return handleCORS(NextResponse.json({ voices: formattedVoices }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: 'Failed to fetch voices', details: error.message },
          { status: 500 }
        ))
      }
    }

    // Generate speech from text
    if (route === '/tts/generate' && method === 'POST') {
      try {
        const body = await request.json()
        const { text, voiceId, settings = 'default' } = body
        
        if (!text || !voiceId) {
          return handleCORS(NextResponse.json(
            { error: 'Text and voiceId are required' },
            { status: 400 }
          ))
        }
        
        if (text.length > 5000) {
          return handleCORS(NextResponse.json(
            { error: 'Text exceeds maximum length of 5000 characters' },
            { status: 400 }
          ))
        }
        
        const voiceSettings = VOICE_SETTINGS[settings] || VOICE_SETTINGS.default
        const audioStream = await generateSpeech(text, voiceId, voiceSettings)
        
        // Convert stream to buffer
        const chunks = []
        for await (const chunk of audioStream) {
          chunks.push(chunk)
        }
        const audioBuffer = Buffer.concat(chunks)
        
        // Save to database
        const audioId = uuidv4()
        await db.collection('generated_audio').insertOne({
          id: audioId,
          text: text.substring(0, 500),
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
        return handleCORS(NextResponse.json(
          { error: 'Failed to generate speech', details: error.message },
          { status: 500 }
        ))
      }
    }

    // ==================== USER LIBRARY ====================
    
    // Get user library
    if (route === '/library' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      let userId = searchParams.get('userId') || 'guest'
      
      // Try to get authenticated user
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      const library = await db.collection('user_library')
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray()
      
      const cleanedLibrary = library.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json({ books: cleanedLibrary }))
    }

    // Add book to library
    if (route === '/library' && method === 'POST') {
      const body = await request.json()
      let { userId = 'guest', book, status = 'want_to_read' } = body
      
      // Try to get authenticated user
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      if (!book || !book.key) {
        return handleCORS(NextResponse.json(
          { error: 'Book data with key is required' },
          { status: 400 }
        ))
      }
      
      const libraryEntry = {
        id: uuidv4(),
        userId,
        bookKey: book.key,
        book,
        status,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Check if already exists
      const existing = await db.collection('user_library').findOne({
        userId,
        bookKey: book.key
      })
      
      if (existing) {
        await db.collection('user_library').updateOne(
          { userId, bookKey: book.key },
          { $set: { status, updatedAt: new Date() } }
        )
        return handleCORS(NextResponse.json({ message: 'Book updated in library', id: existing.id }))
      }
      
      await db.collection('user_library').insertOne(libraryEntry)
      return handleCORS(NextResponse.json({ message: 'Book added to library', id: libraryEntry.id }))
    }

    // Update book in library
    if (route.startsWith('/library/') && method === 'PUT') {
      const bookId = path[1]
      const body = await request.json()
      const { status, progress } = body
      
      const updateData = { updatedAt: new Date() }
      if (status) updateData.status = status
      if (progress !== undefined) updateData.progress = progress
      
      await db.collection('user_library').updateOne(
        { id: bookId },
        { $set: updateData }
      )
      
      return handleCORS(NextResponse.json({ message: 'Book updated' }))
    }

    // Remove book from library
    if (route.startsWith('/library/') && method === 'DELETE') {
      const bookId = path[1]
      await db.collection('user_library').deleteOne({ id: bookId })
      return handleCORS(NextResponse.json({ message: 'Book removed from library' }))
    }

    // ==================== UPLOADED BOOKS ====================
    
    // Get uploaded books
    if (route === '/uploads' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      let userId = searchParams.get('userId') || 'guest'
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      const uploads = await db.collection('uploaded_books')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray()
      
      const cleaned = uploads.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json({ books: cleaned }))
    }

    // Upload book (metadata only - file stored on client side using IndexedDB)
    if (route === '/uploads' && method === 'POST') {
      const body = await request.json()
      let { userId = 'guest', title, author, format, fileSize, chapters } = body
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      if (!title || !format) {
        return handleCORS(NextResponse.json(
          { error: 'Title and format are required' },
          { status: 400 }
        ))
      }
      
      const uploadedBook = {
        id: uuidv4(),
        userId,
        title,
        author: author || 'Desconhecido',
        format,
        fileSize,
        chapters: chapters || [],
        status: 'ready',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('uploaded_books').insertOne(uploadedBook)
      return handleCORS(NextResponse.json({ 
        message: 'Book uploaded successfully', 
        book: uploadedBook 
      }))
    }

    // Delete uploaded book
    if (route.startsWith('/uploads/') && method === 'DELETE') {
      const bookId = path[1]
      await db.collection('uploaded_books').deleteOne({ id: bookId })
      return handleCORS(NextResponse.json({ message: 'Book deleted' }))
    }

    // ==================== AUDIOBOOKS ====================
    
    // Get user's audiobooks
    if (route === '/audiobooks' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      let userId = searchParams.get('userId') || 'guest'
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      const audiobooks = await db.collection('audiobooks')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray()
      
      const cleaned = audiobooks.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json({ audiobooks: cleaned }))
    }

    // Create audiobook from text
    if (route === '/audiobooks' && method === 'POST') {
      const body = await request.json()
      let { userId = 'guest', bookKey, title, chapters, voiceId } = body
      
      const user = await authenticateRequest(request, db)
      if (user) userId = user.id
      
      if (!title || !chapters || !chapters.length || !voiceId) {
        return handleCORS(NextResponse.json(
          { error: 'Title, chapters array, and voiceId are required' },
          { status: 400 }
        ))
      }
      
      const audiobook = {
        id: uuidv4(),
        userId,
        bookKey,
        title,
        voiceId,
        chapters: chapters.map((ch, idx) => ({
          id: uuidv4(),
          index: idx,
          title: ch.title || `Capítulo ${idx + 1}`,
          text: ch.text,
          status: 'pending',
          audioUrl: null,
          duration: null
        })),
        totalDuration: null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('audiobooks').insertOne(audiobook)
      return handleCORS(NextResponse.json({ 
        message: 'Audiobook created', 
        audiobook: { id: audiobook.id, title: audiobook.title, status: audiobook.status }
      }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
