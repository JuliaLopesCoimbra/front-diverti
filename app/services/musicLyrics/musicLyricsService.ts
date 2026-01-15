import api from "../auth/axiosConfig";

export interface MusicLyricsResponse {
  id: number;
  song_name: string;
  singer?: string;
  lyrics: string;
  image_url?: string;
  event_id: number;
  created_at: string;
  deleted_at?: string;
  deleted_by_id?: number;
}

export interface CreateMusicLyricsData {
  song_name: string;
  singer?: string;
  lyrics: string;
  image?: File;
}

export interface UpdateMusicLyricsData {
  song_name: string;
  singer?: string;
  lyrics: string;
  image?: File;
}

export const getMusicLyricsByEvent = async (
  eventId: number
): Promise<MusicLyricsResponse[]> => {
  const response = await api.get<MusicLyricsResponse[]>(
    `/admin/events/${eventId}/music-lyrics`
  );
  return response.data;
};

export const createMusicLyrics = async (
  eventId: number,
  data: CreateMusicLyricsData
): Promise<MusicLyricsResponse> => {
  const formData = new FormData();
  formData.append("song_name", data.song_name);
  if (data.singer) formData.append("singer", data.singer);
  formData.append("lyrics", data.lyrics);
  if (data.image) formData.append("image", data.image);

  const response = await api.post<MusicLyricsResponse>(
    `/admin/events/${eventId}/music-lyrics`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const getMusicLyricsById = async (
  eventId: number,
  musicId: number
): Promise<MusicLyricsResponse> => {
  const response = await api.get<MusicLyricsResponse>(
    `/admin/events/${eventId}/music-lyrics/${musicId}`
  );
  return response.data;
};

export const updateMusicLyrics = async (
  eventId: number,
  musicId: number,
  data: UpdateMusicLyricsData
): Promise<MusicLyricsResponse> => {
  const formData = new FormData();
  formData.append("song_name", data.song_name);
  if (data.singer) formData.append("singer", data.singer);
  formData.append("lyrics", data.lyrics);
  if (data.image) formData.append("image", data.image);

  const response = await api.put<MusicLyricsResponse>(
    `/admin/events/${eventId}/music-lyrics/${musicId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteMusicLyrics = async (
  eventId: number,
  musicId: number
): Promise<void> => {
  await api.delete(`/admin/events/${eventId}/music-lyrics/${musicId}`);
};
