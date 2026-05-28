"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import {
  Autocomplete as GoogleAutocomplete,
  CircleF,
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";

export interface GoogleMapsLocation {
  lat: number;
  lng: number;
}

interface GoogleMapsRadiusPickerProps {
  address: string;
  onAddressChange: (value: string) => void;
  location: GoogleMapsLocation | null;
  onLocationChange: (value: GoogleMapsLocation | null) => void;
  radiusKm: number;
  onRadiusChange: (value: number) => void;
}

const GOOGLE_MAPS_LIBRARIES: ["places"] = ["places"];
const defaultMapCenter: GoogleMapsLocation = { lat: -22.9068, lng: -43.1729 };

export default function GoogleMapsRadiusPicker({
  address,
  onAddressChange,
  location,
  onLocationChange,
  radiusKm,
  onRadiusChange,
}: GoogleMapsRadiusPickerProps) {
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const center = location || defaultMapCenter;
  const shouldShowMockMap = !googleMapsApiKey || Boolean(loadError);

  const handlePlaceChanged = () => {
    if (!autocomplete) {
      return;
    }

    const place = autocomplete.getPlace();
    const geoLocation = place.geometry?.location;

    if (!geoLocation) {
      return;
    }

    const nextLocation = {
      lat: geoLocation.lat(),
      lng: geoLocation.lng(),
    };

    onLocationChange(nextLocation);
    onAddressChange(place.formatted_address || place.name || address);
  };

  return (
    <Paper
      sx={{
        p: 2,
        mt: 1,
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
            Localizacao do publico
          </Typography>
          <Typography
            sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.84rem", mb: 1.5 }}
          >
            Digite um endereco, selecione na busca e ajuste o raio da campanha.
          </Typography>

          {googleMapsApiKey ? (
            <>
              {loadError ? (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 2,
                    backgroundColor: "rgba(255,193,7,0.08)",
                    color: "#fff",
                    border: "1px solid rgba(255,193,7,0.2)",
                  }}
                >
                  Nao foi possivel carregar o Google Maps. Verifique a chave e as APIs ativas.
                </Alert>
              ) : null}

              {isLoaded ? (
                <GoogleAutocomplete
                  onLoad={setAutocomplete}
                  onPlaceChanged={handlePlaceChanged}
                >
                  <TextField
                    label="Endereco"
                    value={address}
                    onChange={(e) => onAddressChange(e.target.value)}
                    fullWidth
                    sx={textFieldSx}
                  />
                </GoogleAutocomplete>
              ) : (
                <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={24} sx={{ color: "#ffcc01" }} />
                </Box>
              )}
            </>
          ) : null}

          {!googleMapsApiKey ? (
            <TextField
              label="Endereco"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              fullWidth
              sx={textFieldSx}
            />
          ) : null}
        </Box>

        <Box>
          <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
            Raio da campanha
          </Typography>
          <Slider
            value={radiusKm}
            min={1}
            max={100}
            step={1}
            valueLabelDisplay="auto"
            onChange={(_, value) => onRadiusChange(value as number)}
            sx={{ color: "#ffffff" }}
          />
          <Typography sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
            Raio selecionado: {radiusKm} km
          </Typography>
        </Box>

        {googleMapsApiKey && isLoaded && !loadError ? (
          <Box
            sx={{
              overflow: "hidden",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "360px" }}
              center={center}
              zoom={location ? 12 : 5}
              onClick={(event) => {
                const lat = event.latLng?.lat();
                const lng = event.latLng?.lng();

                if (typeof lat === "number" && typeof lng === "number") {
                  onLocationChange({ lat, lng });
                }
              }}
              options={{
                disableDefaultUI: false,
                streetViewControl: false,
                mapTypeControl: false,
              }}
            >
              {location ? (
                <>
                  <MarkerF position={location} />
                  <CircleF
                    center={location}
                    radius={radiusKm * 1000}
                    options={{
                      fillColor: "#ffffff",
                      fillOpacity: 0.18,
                      strokeColor: "#ffffff",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                    }}
                  />
                </>
              ) : null}
            </GoogleMap>
          </Box>
        ) : null}

        {shouldShowMockMap ? (
          <Box
            sx={{
              position: "relative",
              height: 360,
              overflow: "hidden",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(135deg, rgba(25,25,25,0.95) 0%, rgba(44,44,46,0.95) 100%)",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                opacity: 0.5,
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${Math.min(220, Math.max(70, radiusKm * 5))}px`,
                height: `${Math.min(220, Math.max(70, radiusKm * 5))}px`,
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(255, 31, 33, 0.15)",
                border: "2px solid rgba(255, 31, 33, 0.65)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, calc(-50% - 14px))",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <PlaceIcon sx={{ color: "#ffffff", fontSize: 34, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }} />
              <Box
                sx={{
                  mt: -0.8,
                  px: 1.2,
                  py: 0.4,
                  borderRadius: 999,
                  backgroundColor: "rgba(17,24,39,0.82)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
               
              </Box>
            </Box>

            <Box
              sx={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 16,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "rgba(17,24,39,0.82)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 600, mb: 0.4 }}>
                {address || "Endereco mockado da campanha"}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.68)", fontSize: "0.82rem" }}>
                Centro em {center.lat.toFixed(5)}, {center.lng.toFixed(5)} com raio de {radiusKm} km.
              </Typography>
            </Box>
          </Box>
        ) : null}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PlaceIcon sx={{ color: "rgba(255,255,255,0.65)", fontSize: 18 }} />
          <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.84rem" }}>
            {location
              ? `Centro do raio definido em ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
              : "Selecione um endereco ou clique no mapa para definir o centro"}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.05)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.16)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.35)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#ffffff",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.65)",
  },
} as const;
