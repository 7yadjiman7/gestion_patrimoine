import axios from 'axios'
import { API_BASE_URL } from '@/config/api'

export const fetchDepartments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/hr/departments`)
    return response.data
  } catch (error) {
    console.error('Error fetching departments:', error)
    return []
  }
}

export const fetchLocations = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/patrimoine/locations`)
    return response.data
  } catch (error) {
    console.error('Error fetching locations:', error)
    return []
  }
}

export const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/hr/employees`)
    return response.data
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

export const fetchDemandes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/patrimoine/demandes`)
    return response.data
  } catch (error) {
    console.error('Error fetching demandes:', error)
    return []
  }
}

export const createDemande = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/patrimoine/demandes`, data)
    return response.data
  } catch (error) {
    console.error('Error creating demande:', error)
    throw error
  }
}

export const declareEntretien = async (demandeId, data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/patrimoine/demandes/${demandeId}/entretien`,
      data
    )
    return response.data
  } catch (error) {
    console.error('Error declaring entretien:', error)
    throw error
  }
}
