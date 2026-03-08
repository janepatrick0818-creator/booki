// Open Library API Helper Functions

const BASE_URL = "https://openlibrary.org";
const COVERS_URL = "https://covers.openlibrary.org";

// Search books
export async function searchBooks(query, page = 1, limit = 20) {
  try {
    const response = await fetch(
      `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error("Failed to search books");
    return await response.json();
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

// Get books by subject/category
export async function getBooksBySubject(subject, limit = 20) {
  try {
    const response = await fetch(
      `${BASE_URL}/subjects/${encodeURIComponent(subject.toLowerCase().replace(/ /g, "_"))}.json?limit=${limit}`
    );
    if (!response.ok) throw new Error(`Failed to get books for subject: ${subject}`);
    return await response.json();
  } catch (error) {
    console.error("Subject fetch error:", error);
    throw error;
  }
}

// Get work details
export async function getWorkDetails(workId) {
  try {
    const response = await fetch(`${BASE_URL}/works/${workId}.json`);
    if (!response.ok) throw new Error("Failed to get work details");
    return await response.json();
  } catch (error) {
    console.error("Work details error:", error);
    throw error;
  }
}

// Get book edition details
export async function getEditionDetails(editionId) {
  try {
    const response = await fetch(`${BASE_URL}/books/${editionId}.json`);
    if (!response.ok) throw new Error("Failed to get edition details");
    return await response.json();
  } catch (error) {
    console.error("Edition details error:", error);
    throw error;
  }
}

// Get author details
export async function getAuthorDetails(authorId) {
  try {
    const response = await fetch(`${BASE_URL}/authors/${authorId}.json`);
    if (!response.ok) throw new Error("Failed to get author details");
    return await response.json();
  } catch (error) {
    console.error("Author details error:", error);
    throw error;
  }
}

// Get cover URL
export function getCoverUrl(coverId, size = "L") {
  if (!coverId) return null;
  return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`;
}

// Get cover URL by ISBN
export function getCoverUrlByIsbn(isbn, size = "L") {
  if (!isbn) return null;
  return `${COVERS_URL}/b/isbn/${isbn}-${size}.jpg`;
}

// Get cover URL by OLID
export function getCoverUrlByOlid(olid, size = "L") {
  if (!olid) return null;
  return `${COVERS_URL}/b/olid/${olid}-${size}.jpg`;
}

// Trending/Popular categories
export const CATEGORIES = [
  { name: "Trending", subject: "popular" },
  { name: "Science Fiction", subject: "science_fiction" },
  { name: "Fantasy", subject: "fantasy" },
  { name: "Romance", subject: "romance" },
  { name: "Mystery", subject: "mystery" },
  { name: "Thriller", subject: "thriller" },
  { name: "Business", subject: "business" },
  { name: "Technology", subject: "technology" },
  { name: "Self Help", subject: "self_help" },
  { name: "Philosophy", subject: "philosophy" },
  { name: "Psychology", subject: "psychology" },
  { name: "Biography", subject: "biography" },
  { name: "History", subject: "history" },
  { name: "Science", subject: "science" },
];

// Format book data for UI
export function formatBookData(book, source = "search") {
  if (source === "search") {
    return {
      key: book.key,
      title: book.title,
      author: book.author_name?.[0] || "Unknown Author",
      authorKey: book.author_key?.[0],
      coverId: book.cover_i,
      coverUrl: getCoverUrl(book.cover_i),
      firstPublishYear: book.first_publish_year,
      language: book.language?.[0],
      subject: book.subject?.slice(0, 5) || [],
      isbn: book.isbn?.[0],
      editionCount: book.edition_count,
      ratingsAverage: book.ratings_average,
      ratingsCount: book.ratings_count,
    };
  } else if (source === "subject") {
    return {
      key: book.key,
      title: book.title,
      author: book.authors?.[0]?.name || "Unknown Author",
      authorKey: book.authors?.[0]?.key?.replace("/authors/", ""),
      coverId: book.cover_id,
      coverUrl: getCoverUrl(book.cover_id),
      firstPublishYear: book.first_publish_year,
      subject: book.subject?.slice(0, 5) || [],
      editionCount: book.edition_count,
    };
  }
  return book;
}
