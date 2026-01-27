// Google OAuth Configuration
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const CINEPET_FOLDER_NAME = 'CinePet Studio';

export interface GoogleAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export interface CloudUploadResult {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

export class CloudService {
  private static cinepetFolderId: string | null = null;

  /**
   * Get Google Client ID from environment
   */
  static getGoogleClientId(): string | null {
    return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || null;
  }

  /**
   * Check if Google OAuth is configured
   */
  static isGoogleConfigured(): boolean {
    return !!this.getGoogleClientId();
  }

  /**
   * Initiates Google OAuth 2.0 flow via popup
   */
  static async initiateGoogleOAuth(): Promise<GoogleAuthResult> {
    const clientId = this.getGoogleClientId();
    if (!clientId) {
      throw new Error('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.');
    }

    return new Promise((resolve, reject) => {
      const redirectUri = window.location.origin;
      const state = Math.random().toString(36).substring(2);

      // Store state for verification
      sessionStorage.setItem('google_oauth_state', state);

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', GOOGLE_SCOPES);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('include_granted_scopes', 'true');

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl.toString(),
        'Google Sign In',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Poll for the OAuth response
      const pollTimer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            reject(new Error('Authentication cancelled'));
            return;
          }

          // Check if we're back on our origin with hash params
          if (popup.location.origin === window.location.origin) {
            const hash = popup.location.hash.substring(1);
            const params = new URLSearchParams(hash);

            const accessToken = params.get('access_token');
            const returnedState = params.get('state');
            const expiresIn = params.get('expires_in');

            if (accessToken) {
              clearInterval(pollTimer);
              popup.close();

              // Verify state
              const savedState = sessionStorage.getItem('google_oauth_state');
              if (returnedState !== savedState) {
                reject(new Error('OAuth state mismatch. Possible CSRF attack.'));
                return;
              }
              sessionStorage.removeItem('google_oauth_state');

              // Fetch user info
              const userInfo = await this.fetchGoogleUserInfo(accessToken);

              resolve({
                accessToken,
                expiresAt: Date.now() + (parseInt(expiresIn || '3600') * 1000),
                user: userInfo
              });
            }

            const error = params.get('error');
            if (error) {
              clearInterval(pollTimer);
              popup.close();
              reject(new Error(`OAuth error: ${error}`));
            }
          }
        } catch (e) {
          // Cross-origin access error is expected while on Google's domain
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
        if (!popup.closed) popup.close();
        reject(new Error('Authentication timed out'));
      }, 300000);
    });
  }

  /**
   * Fetch Google user profile information
   */
  private static async fetchGoogleUserInfo(accessToken: string): Promise<GoogleAuthResult['user']> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  }

  /**
   * Validate if an access token is still valid
   */
  static async validateGoogleToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Find or create the CinePet Studio folder in Google Drive
   */
  private static async getOrCreateCinePetFolder(accessToken: string): Promise<string> {
    if (this.cinepetFolderId) {
      return this.cinepetFolderId;
    }

    // Search for existing folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${CINEPET_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.files && searchResult.files.length > 0) {
        this.cinepetFolderId = searchResult.files[0].id;
        return this.cinepetFolderId;
      }
    }

    // Create new folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: CINEPET_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create CinePet folder');
    }

    const folder = await createResponse.json();
    this.cinepetFolderId = folder.id;
    return this.cinepetFolderId;
  }

  /**
   * Uploads a base64 or blob URL to Google Drive.
   */
  static async uploadToGoogleDrive(
    accessToken: string,
    fileDataUrl: string,
    fileName: string,
    mimeType: string
  ): Promise<CloudUploadResult> {
    try {
      // Validate token first
      const isValid = await this.validateGoogleToken(accessToken);
      if (!isValid) {
        return { success: false, error: 'Access token expired. Please reconnect Google Drive.' };
      }

      // Get or create CinePet folder
      const folderId = await this.getOrCreateCinePetFolder(accessToken);

      // Convert Data URL to Blob
      const response = await fetch(fileDataUrl);
      const blob = await response.blob();

      // Metadata for the file
      const metadata = {
        name: fileName,
        mimeType: mimeType,
        parents: [folderId]
      };

      // Multipart upload form
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      // Request to Google Drive API
      const driveResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form
        }
      );

      if (!driveResponse.ok) {
        const errorData = await driveResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to upload to Google Drive');
      }

      const result = await driveResponse.json();

      // Make file publicly viewable
      await this.makeFilePublic(accessToken, result.id);

      return {
        success: true,
        fileId: result.id,
        url: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`
      };
    } catch (error) {
      console.error('Google Drive Upload Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Make a file publicly viewable (anyone with link)
   */
  private static async makeFilePublic(accessToken: string, fileId: string): Promise<void> {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });
    } catch (e) {
      // Permission setting is optional, don't fail the upload
      console.warn('Could not set public permissions:', e);
    }
  }

  /**
   * Disconnect Google Drive (clear cached folder ID)
   */
  static disconnectGoogleDrive(): void {
    this.cinepetFolderId = null;
  }

  /**
   * Check if device supports native sharing (for iOS/Apple fallback)
   */
  static supportsNativeShare(): boolean {
    return 'share' in navigator && 'canShare' in navigator;
  }

  /**
   * Check if running on iOS/iPadOS
   */
  static isAppleDevice(): boolean {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /**
   * Share file using native Share Sheet (iOS saves to Files app / iCloud Drive)
   * This is the Apple fallback since CloudKit requires developer account
   */
  static async shareViaShareSheet(
    fileDataUrl: string,
    fileName: string,
    mimeType: string,
    title?: string
  ): Promise<CloudUploadResult> {
    try {
      if (!this.supportsNativeShare()) {
        // Fallback to download
        return this.downloadFile(fileDataUrl, fileName);
      }

      // Convert data URL to File
      const response = await fetch(fileDataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: mimeType });

      // Check if we can share this file type
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        return this.downloadFile(fileDataUrl, fileName);
      }

      await navigator.share({
        files: [file],
        title: title || 'CinePet Studio Creation',
        text: 'Created with The Secret Life Of Your Pet'
      });

      return {
        success: true,
        url: 'shared-via-share-sheet'
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share
        return { success: false, error: 'Share cancelled' };
      }
      console.error('Share Sheet Error:', error);
      return this.downloadFile(fileDataUrl, fileName);
    }
  }

  /**
   * Fallback: Download file directly
   */
  static downloadFile(fileDataUrl: string, fileName: string): CloudUploadResult {
    try {
      const link = document.createElement('a');
      link.href = fileDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, url: 'downloaded-locally' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Universal upload method - routes to appropriate service based on provider
   */
  static async uploadToCloud(
    provider: 'google' | 'icloud' | 'none',
    accessToken: string | undefined,
    fileDataUrl: string,
    fileName: string,
    mimeType: string
  ): Promise<CloudUploadResult> {
    switch (provider) {
      case 'google':
        if (!accessToken) {
          return { success: false, error: 'No access token for Google Drive' };
        }
        return this.uploadToGoogleDrive(accessToken, fileDataUrl, fileName, mimeType);

      case 'icloud':
        // Use Share Sheet for Apple devices (saves to Files/iCloud Drive)
        return this.shareViaShareSheet(fileDataUrl, fileName, mimeType);

      default:
        return { success: false, error: 'No cloud provider configured' };
    }
  }
}
