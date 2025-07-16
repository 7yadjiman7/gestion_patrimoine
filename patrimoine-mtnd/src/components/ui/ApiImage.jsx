import React from 'react'
import { API_BASE_URL } from '@/config/api'

function ApiImage({ src, ...props }) {
  const resolvedSrc = src && src.startsWith('/') ? `${API_BASE_URL}${src}` : src
  return <img src={resolvedSrc} {...props} />
}

export default ApiImage
