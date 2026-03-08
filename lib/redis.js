import { createClient } from 'redis'

let client = null
let isConnected = false

// Cache TTL in seconds
const CACHE_TTL = {
  TRENDING: 60 * 30, // 30 minutes
  SUBJECT: 60 * 60, // 1 hour
  SEARCH: 60 * 15, // 15 minutes
  BOOK_DETAILS: 60 * 60 * 24, // 24 hours
  VOICES: 60 * 60 * 2, // 2 hours
}

export async function getRedisClient() {
  if (client && isConnected) {
    return client
  }

  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) return false
          return Math.min(retries * 100, 3000)
        }
      }
    })

    client.on('error', (err) => {
      console.error('Redis Client Error:', err)
      isConnected = false
    })

    client.on('connect', () => {
      console.log('Redis connected')
      isConnected = true
    })

    await client.connect()
    isConnected = true
    return client
  } catch (error) {
    console.error('Redis connection failed:', error)
    isConnected = false
    return null
  }
}

// Get cached data
export async function getCached(key) {
  try {
    const redis = await getRedisClient()
    if (!redis) return null
    
    const data = await redis.get(key)
    if (data) {
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

// Set cached data
export async function setCached(key, data, ttl = 3600) {
  try {
    const redis = await getRedisClient()
    if (!redis) return false
    
    await redis.setEx(key, ttl, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Cache set error:', error)
    return false
  }
}

// Delete cached data
export async function deleteCached(key) {
  try {
    const redis = await getRedisClient()
    if (!redis) return false
    
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Cache delete error:', error)
    return false
  }
}

// Cache keys generators
export function getCacheKey(type, identifier) {
  return `booki:${type}:${identifier}`
}

export { CACHE_TTL }
