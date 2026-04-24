import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ShopProfileService, ShopProfile } from '../core/services/shop-profile.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  invoiceForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  profilePicturePreview: string | null = null;
  selectedFile: File | null = null;
  /** Only admins see Employees in the sidebar and can add staff accounts */
  isAdmin = false;
  accountRoleLabel = '';

  invoiceTemplates = [
    { value: 'DEFAULT', label: 'Default' },
    { value: 'MODERN', label: 'Modern' },
    { value: 'MINIMAL', label: 'Minimal' },
    { value: 'CLASSIC', label: 'Classic' }
  ];

  printModes = [
    { value: 'POS', label: 'POS Receipt (80mm)' },
    { value: 'A5', label: 'A5 (Half A4)' },
    { value: 'A4', label: 'A4 (Full Page)' }
  ];

  constructor(
    private fb: FormBuilder,
    private shopProfileService: ShopProfileService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {
    this.initializeForms();
    this.isAdmin = this.authService.hasRole('ADMIN');
    const r = this.authService.getCurrentUser()?.role;
    this.accountRoleLabel =
      r === 'ADMIN' ? 'Administrator' : r === 'STAFF' ? 'Staff' : r ? String(r) : '';
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      shopName: ['', [Validators.required]],
      address: [''],
      phone: [''],
      email: ['', [Validators.email]],
      gstNumber: [''],
      gstStateCode: [''],
      panNumber: [''],
      website: ['']
    });

    this.invoiceForm = this.fb.group({
      footerMessage: [''],
      termsAndConditions: [''],
      invoiceHeader: [''],
      invoiceFooter: [''],
      showLogo: [false],
      logoUrl: [''],
      invoiceTemplate: ['DEFAULT'],
      printMode: ['POS']
    });
  }

  loadProfile(): void {
    this.isLoading = true;
    this.shopProfileService.getShopProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const profile = response.data;
          this.profileForm.patchValue({
            shopName: profile.shopName || '',
            address: profile.address || '',
            phone: profile.phone || '',
            email: profile.email || '',
            gstNumber: profile.gstNumber || '',
            gstStateCode: profile.gstStateCode || '',
            panNumber: profile.panNumber || '',
            website: profile.website || ''
          });

          this.invoiceForm.patchValue({
            footerMessage: profile.footerMessage || '',
            termsAndConditions: profile.termsAndConditions || '',
            invoiceHeader: profile.invoiceHeader || '',
            invoiceFooter: profile.invoiceFooter || '',
            showLogo: profile.showLogo || false,
            logoUrl: profile.logoUrl || '',
            invoiceTemplate: profile.invoiceTemplate || 'DEFAULT',
            printMode: profile.printMode || 'POS'
          });

          // Load profile picture if exists
          if (profile.profilePicture) {
            this.profilePicturePreview = profile.profilePicture;
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Error loading shop profile', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        this.snackBar.open('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'Close', { duration: 3000 });
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.snackBar.open('Image size should be less than 2MB', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicturePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeProfilePicture(): void {
    this.profilePicturePreview = null;
    this.selectedFile = null;
    // Clear file input
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  triggerFileInput(): void {
    document.getElementById('profilePictureInput')?.click();
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isSaving = true;
      const profileData: ShopProfile = {
        ...this.profileForm.value,
        ...this.invoiceForm.value,
        profilePicture: this.profilePicturePreview || undefined
      };

      this.shopProfileService.saveShopProfile(profileData).subscribe({
        next: (response) => {
          if (response.success) {
            this.shopProfileService.clearCache();
            this.selectedFile = null; // Clear selected file after successful save
            this.snackBar.open('Shop profile saved successfully!', 'Close', { duration: 3000 });
          } else {
            this.snackBar.open('Failed to save profile', 'Close', { duration: 3000 });
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error saving profile:', error);
          this.snackBar.open('Error saving profile: ' + (error.error?.message || 'Unknown error'), 'Close', { duration: 5000 });
          this.isSaving = false;
        }
      });
    }
  }
}

