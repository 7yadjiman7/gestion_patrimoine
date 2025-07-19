import api from './apiConfig'

export const saveFieldValues = async (subcategoryId, values, itemId = null) => {
  try {
    const response = await api.post('/api/patrimoine/fields/values', {
      subcategoryId,
      values,
      itemId
    })
    return response.data;
  } catch (error) {
    console.error('Error saving field values:', error);
    throw error;
  }
};

export const getFields = async (subcategoryId) => {
  try {
    const response = await api.get(
      `/api/patrimoine/subcategories/${subcategoryId}/fields`
    )
    return response.data;
  } catch (error) {
    console.error('Error fetching fields:', error);
    throw error;
  }
};

export const getFieldValues = async (itemId) => {
  try {
    const response = await api.get(
      `/api/patrimoine/items/${itemId}/field-values`
    )
    return response.data;
  } catch (error) {
    console.error('Error fetching field values:', error);
    throw error;
  }
};

export const createField = async (subcategoryId, fieldData) => {
  try {
    const response = await api.post(
      `/api/patrimoine/subcategories/${subcategoryId}/fields`,
      fieldData
    )
    return response.data;
  } catch (error) {
    console.error('Error creating field:', error);
    throw error;
  }
};

export const updateField = async (subcategoryId, fieldId, fieldData) => {
  try {
    const response = await api.put(
      `/api/patrimoine/subcategories/${subcategoryId}/fields/${fieldId}`,
      fieldData
    )
    return response.data;
  } catch (error) {
    console.error('Error updating field:', error);
    throw error;
  }
};

export const deleteField = async (subcategoryId, fieldId) => {
  try {
    await api.delete(
      `/api/patrimoine/subcategories/${subcategoryId}/fields/${fieldId}`
    )
  } catch (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
};
