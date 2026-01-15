export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Mínimo de 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Pelo menos uma letra maiúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Pelo menos uma letra minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("Pelo menos um número");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;:,.<>/?)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

