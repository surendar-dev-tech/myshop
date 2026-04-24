import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService, Category } from '../core/services/category.service';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './category-dialog.component.html',
  styleUrls: ['./category-dialog.component.scss']
})
export class CategoryDialogComponent implements OnInit {
  categoryForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<CategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public categoryData: Category | null,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = !!categoryData;
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.categoryData) {
      this.populateFormWithCategoryData();
    }
  }

  private initializeForm(): void {
    this.categoryForm = this.formBuilder.group({
      categoryName: ['', [Validators.required]],
      description: ['']
    });
  }

  private populateFormWithCategoryData(): void {
    if (this.categoryData) {
      this.categoryForm.patchValue({
        categoryName: this.categoryData.name || '',
        description: this.categoryData.description || ''
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.categoryForm.value;

    const categoryPayload: Category = {
      name: formValue.categoryName.trim(),
      description: formValue.description?.trim() || null
    };

    if (this.isEditMode && this.categoryData?.id) {
      this.updateCategory(this.categoryData.id, categoryPayload);
    } else {
      this.createCategory(categoryPayload);
    }
  }

  private createCategory(categoryPayload: Category): void {
    this.categoryService.createCategory(categoryPayload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.showSuccessMessage('Category created successfully');
          this.dialogRef.close(response.data);
        } else if (response.success) {
          this.showSuccessMessage('Category created successfully');
          this.dialogRef.close(true);
        } else {
          this.showErrorMessage('Failed to create category');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error creating category', error);
        this.isLoading = false;
      }
    });
  }

  private updateCategory(categoryId: number, categoryPayload: Category): void {
    this.categoryService.updateCategory(categoryId, categoryPayload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.showSuccessMessage('Category updated successfully');
          this.dialogRef.close(response.data);
        } else if (response.success) {
          this.showSuccessMessage('Category updated successfully');
          this.dialogRef.close(true);
        } else {
          this.showErrorMessage('Failed to update category');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error updating category', error);
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  private handleError(operation: string, error: any): void {
    const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
    this.showErrorMessage(`${operation}: ${errorMessage}`);
    console.error(`${operation}:`, error);
  }
}









