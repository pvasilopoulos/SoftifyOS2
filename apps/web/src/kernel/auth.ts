export const DEMO_LOGIN = {
  username: 'info@softify.gr',
  password: 'prodromos',
} as const

export function verifyLogin(username: string, password: string) {
  return (
    username.trim().toLowerCase() === DEMO_LOGIN.username && password === DEMO_LOGIN.password
  )
}
