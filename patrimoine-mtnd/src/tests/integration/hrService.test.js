import axios from 'axios'
import { fetchEmployees, fetchDepartments } from '../../services/demandeService'

jest.mock('axios')

describe('HR Service fetches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('fetchEmployees should return employees list', async () => {
    const mockData = [{ id: 1, name: 'John' }]
    axios.get.mockResolvedValue({ data: mockData })

    const result = await fetchEmployees()

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/patrimoine/employees'))
    expect(result).toEqual(mockData)
  })

  test('fetchDepartments should return departments list', async () => {
    const mockData = [{ id: 2, name: 'IT' }]
    axios.get.mockResolvedValue({ data: mockData })

    const result = await fetchDepartments()

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/patrimoine/departments'))
    expect(result).toEqual(mockData)
  })
})
