import { MeiliSearch } from 'meilisearch'

let client = null
let isConnected = false

export async function getMeiliClient() {
  if (client && isConnected) {
    return client
  }

  try {
    client = new MeiliSearch({
      host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_KEY || '',
    })

    // Test connection
    await client.health()
    isConnected = true
    console.log('MeiliSearch connected')
    return client
  } catch (error) {
    console.error('MeiliSearch connection failed:', error)
    isConnected = false
    return null
  }
}

// Initialize books index
export async function initBooksIndex() {
  try {
    const meili = await getMeiliClient()
    if (!meili) return false

    const index = meili.index('books')
    
    // Set searchable attributes
    await index.updateSearchableAttributes([
      'title',
      'author',
      'description',
      'subjects',
      'isbn'
    ])

    // Set filterable attributes
    await index.updateFilterableAttributes([
      'language',
      'subjects',
      'firstPublishYear',
      'category'
    ])

    // Set sortable attributes
    await index.updateSortableAttributes([
      'firstPublishYear',
      'ratingsAverage',
      'ratingsCount'
    ])

    return true
  } catch (error) {
    console.error('MeiliSearch index init error:', error)
    return false
  }
}

// Add/update books to index
export async function indexBooks(books) {
  try {
    const meili = await getMeiliClient()
    if (!meili) return false

    const index = meili.index('books')
    await index.addDocuments(books, { primaryKey: 'key' })
    return true
  } catch (error) {
    console.error('MeiliSearch indexing error:', error)
    return false
  }
}

// Search books
export async function searchBooks(query, options = {}) {
  try {
    const meili = await getMeiliClient()
    if (!meili) return null

    const index = meili.index('books')
    const results = await index.search(query, {
      limit: options.limit || 20,
      offset: options.offset || 0,
      filter: options.filter || [],
      sort: options.sort || [],
      facets: ['subjects', 'language'],
    })

    return results
  } catch (error) {
    console.error('MeiliSearch search error:', error)
    return null
  }
}

// Delete book from index
export async function deleteBook(key) {
  try {
    const meili = await getMeiliClient()
    if (!meili) return false

    const index = meili.index('books')
    await index.deleteDocument(key)
    return true
  } catch (error) {
    console.error('MeiliSearch delete error:', error)
    return false
  }
}
