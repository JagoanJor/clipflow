import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GoogleDriveService } from 'src/app/services/google-drive.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit, OnDestroy {

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  videoUrl: string | null = null;

  isDragging = false;
  isUploading = false;
  isConnectingGoogleDrive = false;

  uploadProgress = 0;

  isGoogleDriveConnected = false;
  googleDriveUser: any = null;

  constructor(
    private googleDriveService: GoogleDriveService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.checkGoogleDriveConnection();
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }

  /**
   * Check whether Google Drive is currently connected.
   */
  async checkGoogleDriveConnection(): Promise<void> {
    try {

      this.isGoogleDriveConnected =
        await this.googleDriveService.checkConnection();

      if (this.isGoogleDriveConnected) {
        this.googleDriveUser =
          await this.googleDriveService.getGoogleDriveUser();
      }

    } catch (error) {

      console.error(
        'Google Drive connection check failed:',
        error
      );

      this.isGoogleDriveConnected = false;
      this.googleDriveUser = null;
    }
  }

  /**
   * Connect Google Drive.
   */
  async connectGoogleDrive(): Promise<void> {

    if (this.isConnectingGoogleDrive) {
      return;
    }

    this.isConnectingGoogleDrive = true;

    try {

      await this.googleDriveService.connect();

      const connected =
        await this.googleDriveService.checkConnection();

      this.isGoogleDriveConnected = connected;

      if (connected) {

        this.googleDriveUser =
          await this.googleDriveService.getGoogleDriveUser();

        console.log(
          'Google Drive connected:',
          this.googleDriveUser
        );

      }

    } catch (error) {

      console.error(
        'Google Drive connection failed:',
        error
      );

      this.isGoogleDriveConnected = false;
      this.googleDriveUser = null;

    } finally {

      this.isConnectingGoogleDrive = false;

    }
  }

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = false;

    const files =
      event.dataTransfer?.files;

    if (!files?.length) {
      return;
    }

    this.setFile(files[0]);
  }

  openFilePicker(): void {

    if (!this.isGoogleDriveConnected) {
      return;
    }

    this.fileInput.nativeElement.click();
  }

  setFile(file: File): void {

    if (!this.isGoogleDriveConnected) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      return;
    }

    this.clearPreview();

    this.selectedFile = file;

    this.videoUrl =
      URL.createObjectURL(file);
  }

  removeFile(): void {

    this.clearPreview();

    this.selectedFile = null;

    this.uploadProgress = 0;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async startUpload(): Promise<void> {

    if (
      !this.selectedFile ||
      this.isUploading ||
      !this.isGoogleDriveConnected
    ) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    try {

      const result =
        await this.googleDriveService.uploadFile(
          this.selectedFile,
          (progress) => {
            this.uploadProgress = progress;
          }
        );

      console.log(
        'Google Drive upload complete:',
        result
      );

      console.log(
        'Google Drive File ID:',
        result.id
      );

      this.uploadProgress = 100;

      this.isUploading = false;

    } catch (error) {

      console.error(
        'Google Drive upload failed:',
        error
      );

      this.isUploading = false;
      this.uploadProgress = 0;
    }
  }

  getFileSize(): string {

    if (!this.selectedFile) {
      return '';
    }

    const bytes =
      this.selectedFile.size;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  private clearPreview(): void {

    if (this.videoUrl) {

      URL.revokeObjectURL(
        this.videoUrl
      );

      this.videoUrl = null;
    }
  }
}