import { get, post, put, del } from './baseService'

export const getCategories = (type) => 
  get('/patrimoine/categories', { params: { type } })

export const getSubCategories = (categoryId) => 
  get(`/patrimoine/subcategories/${categoryId}`)
    .then(data => ({
      ...data,
      fields: data.fields || []
    }))

export const createCategory = (categoryData) => 
  post('/patrimoine/categories', categoryData)

export const createSubCategory = (categoryId, subcategoryData) => 
  post(`/patrimoine/categories/${categoryId}/subcategories`, subcategoryData)

export const updateCategory = (categoryId, categoryData) => 
  put(`/patrimoine/categories/${categoryId}`, categoryData)

export const updateSubCategory = (categoryId, subcategoryId, subcategoryData) => 
  put(`/patrimoine/categories/${categoryId}/subcategories/${subcategoryId}`, subcategoryData)

export const deleteCategory = (categoryId) => 
  del(`/patrimoine/categories/${categoryId}`)

export const deleteSubCategory = (categoryId, subcategoryId) => 
  del(`/patrimoine/categories/${categoryId}/subcategories/${subcategoryId}`)

// Suppression des fonctions redondantes avec materialService.js
