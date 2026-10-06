import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  videoUrl: string | null = null;

  isDragging = false;
  isUploading = false;
  uploadProgress = 0;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

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

    const files = event.dataTransfer?.files;

    if (!files?.length) {
      return;
    }

    this.setFile(files[0]);
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  setFile(file: File): void {
    if (!file.type.startsWith('video/')) {
      return;
    }

    this.clearPreview();

    this.selectedFile = file;
    this.videoUrl = URL.createObjectURL(file);
  }

  removeFile(): void {
    this.clearPreview();

    this.selectedFile = null;
    this.uploadProgress = 0;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  startUpload(): void {
    if (!this.selectedFile || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    // Temporary demo upload progress.
    // Replace this with your actual API upload later.
    const interval = setInterval(() => {

      this.uploadProgress += 5;

      if (this.uploadProgress >= 100) {
        clearInterval(interval);

        this.uploadProgress = 100;
        this.isUploading = false;

        console.log('Upload complete:', this.selectedFile);
      }

    }, 150);
  }

  getFileSize(): string {
    if (!this.selectedFile) {
      return '';
    }

    const bytes = this.selectedFile.size;

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
      URL.revokeObjectURL(this.videoUrl);
      this.videoUrl = null;
    }
  }
}