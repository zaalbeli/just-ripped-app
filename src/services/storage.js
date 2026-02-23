import { supabase } from '../config/supabase';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

class StorageService {
  async uploadCardImage(userId, imageUri, side = 'front') {
    console.log('📸 [Storage] Starting upload, imageUri:', imageUri);

    // Step 1: Convert HEIC (or any format) to JPEG
    const converted = await manipulateAsync(
      imageUri,
      [],
      { compress: 0.85, format: SaveFormat.JPEG }
    );
    console.log('✅ [Storage] Converted to JPEG:', converted.uri);

    // Step 2: Read the converted file as ArrayBuffer
    // (Blob uploads in React Native upload empty files via supabase-js — use ArrayBuffer instead)
    const response = await fetch(converted.uri);
    const arrayBuffer = await response.arrayBuffer();
    console.log('📦 [Storage] ArrayBuffer byteLength:', arrayBuffer.byteLength);

    if (arrayBuffer.byteLength === 0) {
      throw new Error('Converted image is empty — cannot upload');
    }

    // Step 3: Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}_${side}.jpg`;
    const { error } = await supabase.storage
      .from('card-images')
      .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      console.error('❌ [Storage] Upload error:', error);
      throw error;
    }

    // Step 4: Get permanent public URL
    const { data: { publicUrl } } = supabase.storage
      .from('card-images')
      .getPublicUrl(fileName);

    console.log('🌐 [Storage] Public URL:', publicUrl);
    return publicUrl;
  }
}

export default new StorageService();
