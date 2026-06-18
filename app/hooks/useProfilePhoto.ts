"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "diverti_profile_photo";

export function useProfilePhoto(defaultUrl?: string) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setPhotoUrl(saved ?? defaultUrl ?? null);
  }, [defaultUrl]);

  const savePhoto = useCallback((dataUrl: string) => {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    setPhotoUrl(dataUrl);
  }, []);

  const removePhoto = useCallback((defaultUrl?: string) => {
    localStorage.removeItem(STORAGE_KEY);
    setPhotoUrl(defaultUrl ?? null);
  }, []);

  return { photoUrl, savePhoto, removePhoto };
}
