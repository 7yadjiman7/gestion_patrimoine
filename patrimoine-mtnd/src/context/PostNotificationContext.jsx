import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react"
import useOdooBus from "@/hooks/useOdooBus"
import postsService from "@/services/postsService"

const Context = createContext({ count: 0, setCount: () => {} })

export function PostNotificationProvider({ children }) {
    const [count, setCount] = useState(0)

    // Charge le nombre initial de messages non lus
    useEffect(() => {
        postsService
            .fetchUnreadCount()
            .then(setCount)
            .catch(() => {})
    }, [])

    // Crée une fonction de rappel stable avec useCallback
    const handlePostNotification = useCallback(notification => {
        if (notification.type === "new_post") {
            // Met à jour le compteur en se basant sur la valeur précédente
            setCount(prevCount => prevCount + 1)
        }
    }, []) // Cette fonction ne sera créée qu'une seule fois

    // **LA CORRECTION EST ICI**
    // On définit le ou les canaux à écouter pour les notifications de posts.
    // Ce nom de canal doit correspondre à celui que vous utilisez dans votre backend Odoo.
    const postChannels = ["new_post_channel"]

    // On appelle le hook avec les arguments dans le bon ordre :
    // 1. Le tableau des canaux
    // 2. La fonction de rappel
    useOdooBus(postChannels, handlePostNotification)

    return (
        <Context.Provider value={{ count, setCount }}>
            {children}
        </Context.Provider>
    )
}

export function usePostNotifications() {
    return useContext(Context)
}
