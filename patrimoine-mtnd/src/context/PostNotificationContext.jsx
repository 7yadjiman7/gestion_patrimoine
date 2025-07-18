import React, { createContext, useContext, useEffect, useState } from 'react'
import useOdooBus from '@/hooks/useOdooBus'
import postsService from '@/services/postsService'

const Context = createContext({ count: 0, setCount: () => {} })

export function PostNotificationProvider({ children }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    postsService.fetchUnreadCount().then(setCount).catch(() => {})
  }, [])

  useOdooBus(notification => {
    if (notification.type === 'new_post') {
      setCount(c => c + 1)
    }
  })

  return (
    <Context.Provider value={{ count, setCount }}>
      {children}
    </Context.Provider>
  )
}

export function usePostNotifications() {
  return useContext(Context)
}
