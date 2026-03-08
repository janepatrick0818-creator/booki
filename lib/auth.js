import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'booki-secret-key-2024'
const JWT_EXPIRES_IN = '7d'

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check cookies
  const cookies = request.headers.get('cookie')
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='))
    if (tokenCookie) {
      return tokenCookie.split('=')[1]
    }
  }
  
  return null
}

export async function authenticateRequest(request, db) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }
  
  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }
  
  const user = await db.collection('users').findOne({ id: decoded.userId })
  return user
}
