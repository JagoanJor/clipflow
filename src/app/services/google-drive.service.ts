import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
    providedIn: 'root'
})
export class GoogleDriveService {

    private clientId = '267662789419-1jac01bcdj4teb734gd8k5oekq4pop2m.apps.googleusercontent.com';

    private scope = 'https://www.googleapis.com/auth/drive.file';

    private accessToken: string | null = null;

    private tokenClient: any;

    constructor() {
        this.initializeGoogleAuth();
    }

    private initializeGoogleAuth(): void {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.clientId,
            scope: this.scope,

            callback: (response: any) => {
                if (response.access_token) {
                    this.accessToken = response.access_token;
                }
            }
        });
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {

            this.tokenClient.callback = (response: any) => {

                if (response.error) {
                    reject(response);
                    return;
                }

                this.accessToken = response.access_token;

                resolve();
            };

            this.tokenClient.requestAccessToken({
                prompt: 'consent'
            });

        });
    }

    async checkConnection(): Promise<boolean> {

        if (!this.accessToken) {
            return false;
        }

        try {

            const response = await fetch(
                'https://www.googleapis.com/drive/v3/about?fields=user',
                {
                    method: 'GET',

                    headers: {
                        Authorization:
                            `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {

                this.accessToken = null;

                return false;
            }

            return true;

        } catch (error) {

            console.error(
                'Google Drive connection check failed:',
                error
            );

            this.accessToken = null;

            return false;
        }
    }

    async getGoogleDriveUser(): Promise<any> {

        if (!this.accessToken) {
            return null;
        }

        try {

            const response = await fetch(
                'https://www.googleapis.com/drive/v3/about?fields=user',
                {
                    method: 'GET',

                    headers: {
                        Authorization:
                            `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {

                this.accessToken = null;

                return null;
            }

            const data =
                await response.json();

            return data.user ?? null;

        } catch (error) {

            console.error(
                'Failed to get Google Drive user:',
                error
            );

            return null;
        }
    }

    async uploadFile(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<any> {

        if (!this.accessToken) {
            await this.connect();
        }

        const metadata = {
            name: file.name,
            mimeType: file.type
        };

        // Start resumable upload
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
            {
                method: 'POST',

                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Type': file.type,
                    'X-Upload-Content-Length': file.size.toString()
                },

                body: JSON.stringify(metadata)
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to initialize upload: ${response.status}`
            );
        }

        const uploadUrl = response.headers.get('Location');

        if (!uploadUrl) {
            throw new Error('Google Drive did not return upload URL');
        }

        return this.uploadFileContent(
            uploadUrl,
            file,
            onProgress
        );
    }

    private uploadFileContent(
        uploadUrl: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<any> {

        return new Promise((resolve, reject) => {

            const xhr = new XMLHttpRequest();

            xhr.open('PUT', uploadUrl, true);

            xhr.setRequestHeader(
                'Content-Type',
                file.type
            );

            xhr.upload.onprogress = (event) => {

                if (!event.lengthComputable) {
                    return;
                }

                const progress =
                    Math.round(
                        (event.loaded / event.total) * 100
                    );

                onProgress?.(progress);
            };

            xhr.onload = () => {

                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    const result = JSON.parse(xhr.responseText);

                    resolve(result);

                } else {

                    reject(
                        new Error(
                            `Google Drive upload failed: ${xhr.status}`
                        )
                    );

                }

            };

            xhr.onerror = () => {
                reject(
                    new Error('Network error while uploading')
                );
            };

            xhr.send(file);
        });
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }
}