import api from './apiConfig'

export const getItemsByCategory = async (type, category) => {
  try {
    const response = await api.get(`/api/patrimoine/items`, {
      params: { 
        type: type.toLowerCase(), 
        category: category.toLowerCase() 
      }
    })
    return response.data
  } catch (error) {
    console.error(`Error fetching items for ${type}/${category}:`, error)
    throw error
  }
}

export const createItem = async (itemData) => {
  try {
    const response = await api.post('/api/patrimoine/items', itemData)
    return response.data
  } catch (error) {
    throw error
  }
}

export const updateItem = async (id, itemData) => {
  try {
    const response = await api.put(`/api/patrimoine/items/${id}`, itemData)
    return response.data
  } catch (error) {
    throw error
  }
}

export const deleteItem = async (id) => {
  try {
    const response = await api.delete(`/api/patrimoine/items/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const getItemById = async (id) => {
  try {
    const response = await api.get(`/api/patrimoine/items/${id}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// Alias pour compatibilité
export const getItem = getItemById;

export const getItems = async () => {
  try {
    const response = await api.get('/api/patrimoine/items')
    return response.data
  } catch (error) {
    throw error
  }
}
