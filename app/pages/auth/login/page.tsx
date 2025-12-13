// /components/auth/LoginForm.tsx
"use client";
import React, { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Google, Facebook, Instagram } from "@mui/icons-material";
import { loginUser } from "@/app/services/auth/authService";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import {
  initGoogleLogin,
  initFacebookLogin,
  initInstagramLogin,
} from "@/app/services/auth/authService";

// Definindo os tipos para os dados de login
interface LoginData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const loginData: LoginData = { email, password };
      const response = await loginUser(loginData);

      // Sucesso no login
      showToast("Login realizado com sucesso!", "success");
      console.log(response);

      // Agora, sabemos que 'response' é do tipo LoginResponse
      const { access_token, refresh_token } = response;

      // Armazenando access_token no localStorage
      localStorage.setItem("access_token", access_token);

      // Armazenando refresh_token no cookie HttpOnly
      document.cookie = `refresh_token=${refresh_token}; path=/; secure; HttpOnly`;

      // Redirecionando para a home
      router.push("/pages/user/home"); // Ou o caminho desejado para a home
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Verificando se o erro contém o código 401 e a mensagem "Credenciais inválidas"
        if (err.message.includes("401")) {
          showToast(
            "Credenciais inválidas. Verifique e tente novamente.",
            "error"
          );
        } else {
          showToast(`Erro ao fazer login: ${err.message}`, "error");
        }
      } else {
        showToast(
          "Erro desconhecido ao fazer login. Tente novamente!",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
   
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundImage: "url(/background/dashboard.png)",
        padding: "20px",
      }}
    >
      <Box
        sx={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: 3,
          width: "100%",
          maxWidth: "400px", // Ajusta a largura do formulário para telas pequenas
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ marginBottom: "20px", color: "black" }}>
          Login
        </Typography>
        <Typography
          variant="body2"
          sx={{ marginBottom: "20px", color: "black" }}
        >
          Bem-vindo de volta. Entre com suas credenciais para acessar sua conta.
        </Typography>

        {/* Formulário de login */}
        <TextField
          fullWidth
          label="Endereço de e-mail"
          variant="outlined"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          label="Senha"
          variant="outlined"
          margin="normal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Please enter correct password"
          error={password && password.length < 6 ? true : false}
        />

        {/* Checkbox para manter-me conectado */}
        <FormControlLabel
          control={
            <Checkbox
              checked={keepMeLoggedIn}
              onChange={(e) => setKeepMeLoggedIn(e.target.checked)}
            />
          }
          label="Mantenha-me conectado"
        />

        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ marginTop: "20px" }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Carregando..." : "Continuar"}
        </Button>

        {/* Exibição de erro */}
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Google />}
            onClick={async () => {
              try {
                const url = await initGoogleLogin();
                window.location.href = url; // redireciona
              } catch (error) {
                showToast("Erro ao iniciar login com Google", "error");
              }
            }}
          >
            Google
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<Facebook />}
            onClick={async () => {
              try {
                const url = await initFacebookLogin();
                window.location.href = url;
              } catch (error) {
                showToast("Erro ao iniciar login com Facebook", "error");
              }
            }}
          >
            Facebook
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Instagram />}
            onClick={async () => {
              try {
                const url = await initInstagramLogin();
                window.location.href = url;
              } catch (error) {
                showToast("Erro ao iniciar login com Instagram", "error");
              }
            }}
          >
            Instagram
          </Button>
        </Box>

        <Typography variant="body2" sx={{ marginTop: "20px" }}>
          Não tem uma conta?{" "}
          <a href="#" style={{ textDecoration: "none", color: "#1976d2" }}>
            Cadastre-se aqui
          </a>
        </Typography>
      </Box>
      
    </Box>
    
  );
};

export default LoginForm;
