import axios from 'axios';
import { getApiUrl } from './apiConfig';

export const saveFieldValues = async (subcategoryId, values, itemId = null) => {
  try {
    const response = await axios.post(`${getApiUrl()}/patrimoine/fields/values`, {
      subcategoryId,
      values,
      itemId
    });
    return response.data;
  } catch (error) {
    console.error('Error saving field values:', error);
    throw error;
  }
};

export const getFields = async (subcategoryId) => {
  try {
    const response = await axios.get(
      `${getApiUrl()}/patrimoine/subcategories/${subcategoryId}/fields`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching fields:', error);
    throw error;
  }
};

export const getFieldValues = async (itemId) => {
  try {
    const response = await axios.get(
      `${getApiUrl()}/patrimoine/items/${itemId}/field-values`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching field values:', error);
    throw error;
  }
};

export const createField = async (subcategoryId, fieldData) => {
  try {
    const response = await axios.post(
      `${getApiUrl()}/patrimoine/subcategories/${subcategoryId}/fields`,
      fieldData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating field:', error);
    throw error;
  }
};

export const updateField = async (subcategoryId, fieldId, fieldData) => {
  try {
    const response = await axios.put(
      `${getApiUrl()}/patrimoine/subcategories/${subcategoryId}/fields/${fieldId}`,
      fieldData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating field:', error);
    throw error;
  }
};

export const deleteField = async (subcategoryId, fieldId) => {
  try {
    await axios.delete(
      `${getApiUrl()}/patrimoine/subcategories/${subcategoryId}/fields/${fieldId}`
    );
  } catch (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
};
