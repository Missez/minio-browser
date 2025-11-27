import { jwtDecode } from 'jwt-decode'

interface UserPayload {
    id: number
    username: string
    role: string
    exp: number
}

export const useAuth = () => {
    const token = useCookie('auth_token')
    const user = useState<UserPayload | null>('auth_user', () => null)

    const decodeToken = () => {
        if (token.value) {
            try {
                user.value = jwtDecode<UserPayload>(token.value)
            } catch (e) {
                user.value = null
            }
        } else {
            user.value = null
        }
    }

    // Initial decode
    if (!user.value) {
        decodeToken()
    }

    // Watch for token changes
    watch(token, () => {
        decodeToken()
    })

    const isAdmin = computed(() => user.value?.role === 'admin')
    const isAuthenticated = computed(() => !!user.value)

    return {
        user,
        isAdmin,
        isAuthenticated
    }
}
