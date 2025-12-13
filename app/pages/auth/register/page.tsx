// /pages/register.tsx
'use client';
import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { registerUser } from '@/app/services/auth/authService';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await registerUser({ name, email, password });
      // Redirecionar ou exibir mensagem de sucesso
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Erro ao registrar:', err.message); // Aqui você pode acessar propriedades específicas de `Error`
      } else {
        console.error('Erro desconhecido:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Cadastro
      </Typography>
      <TextField
        fullWidth
        label="Nome"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        fullWidth
        label="E-mail"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        fullWidth
        label="Senha"
        variant="outlined"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        variant="contained"
        fullWidth
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? 'Carregando...' : 'Cadastrar'}
      </Button>
    </Box>
  );
};

export default RegisterPage;
