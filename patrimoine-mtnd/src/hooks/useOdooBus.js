import { useEffect } from 'react'
import axios from 'axios'

export default function useOdooBus(onNotification) {
  useEffect(() => {
    let active = true
    let last = 0

    const poll = async () => {
      try {
        const response = await axios.post('/longpolling/poll', {
          channels: [['mail.channel', 'private', 0]],
          last,
          timeout: 50,
        })
        if (!active) return
        const result = response.data.result
        if (result) {
          last = result.last
          if (Array.isArray(result.notifications)) {
            result.notifications.forEach(n => onNotification(n[1]))
          }
        }
        poll()
      } catch (error) {
        if (active) setTimeout(poll, 3000)
      }
    }

    poll()
    return () => {
      active = false
    }
  }, [onNotification])
}
