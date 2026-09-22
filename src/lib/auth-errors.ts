export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (normalized.includes('email not confirmed')) {
    return 'Esse e-mail ainda não foi confirmado. Fale com o administrador.'
  }
  if (normalized.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.'
  }

  return 'Não foi possível entrar agora. Tente novamente.'
}
