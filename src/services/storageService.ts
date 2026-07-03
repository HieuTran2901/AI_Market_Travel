import api from './api';
import { ApiResponse } from '@/types';

export const storageService = {
  uploadImage: async (file: File, folder: string = 'listings') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post<ApiResponse<string>>('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
};
