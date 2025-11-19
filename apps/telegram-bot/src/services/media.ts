import axios from 'axios';
import { environment } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError } from '../utils/errors.js';

export class MediaService {
  private readonly telegramApiUrl = `https://api.telegram.org/bot${environment.TELEGRAM_BOT_TOKEN}`;

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      logger.debug('Starting file download', { fileId });

      // Get file info from Telegram
      const fileInfoResponse = await axios.get(`${this.telegramApiUrl}/getFile`, {
        params: { file_id: fileId }
      });

      if (!fileInfoResponse.data.ok) {
        throw new Error('Failed to get file info from Telegram');
      }

      const filePath = fileInfoResponse.data.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${environment.TELEGRAM_BOT_TOKEN}/${filePath}`;

      // Download the actual file
      const fileResponse = await axios.get(fileUrl, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(fileResponse.data);
      logger.info('File downloaded successfully', { fileId, size: buffer.length });
      
      return buffer;
    } catch (error) {
      logger.error('File download failed', { fileId, error: error instanceof Error ? error.message : error });
      throw new ExternalServiceError('Failed to download file from Telegram', 'Telegram API');
    }
  }

  async getFileUrl(fileId: string): Promise<string> {
    try {
      const fileInfoResponse = await axios.get(`${this.telegramApiUrl}/getFile`, {
        params: { file_id: fileId }
      });

      if (!fileInfoResponse.data.ok) {
        throw new Error('Failed to get file info from Telegram');
      }

      const filePath = fileInfoResponse.data.result.file_path;
      return `https://api.telegram.org/file/bot${environment.TELEGRAM_BOT_TOKEN}/${filePath}`;
    } catch (error) {
      logger.error('Failed to get file URL', { fileId, error: error instanceof Error ? error.message : error });
      throw new ExternalServiceError('Failed to get file URL from Telegram', 'Telegram API');
    }
  }
}

export const mediaService = new MediaService();