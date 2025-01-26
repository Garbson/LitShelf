import axios from 'axios'

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

export const searchBooks = async (query: string) => {
  try {
    const response = await axios.get(`${BASE_URL}?q=${query}&key=${API_KEY}`)
    return response.data.items || []
  } catch (error) {
    console.error('Erro ao buscar livros:', error)
    return []
  }
}
