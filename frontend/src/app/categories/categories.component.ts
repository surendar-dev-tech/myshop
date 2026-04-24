import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService, Category } from '../core/services/category.service';
import { AuthService } from '../core/services/auth.service';
import { CategoryDialogComponent } from './category-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categoriesDataSource = new MatTableDataSource<Category>([]);
  displayedColumns: string[] = ['name', 'description', 'actions'];
  isLoading = false;
  isAdmin = false;
  canEditCategories = false;
  canDeleteCategories = false;

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.isAdmin = this.authService.hasRole('ADMIN');
    const isStaff = this.authService.hasRole('STAFF');
    this.canEditCategories = this.isAdmin || isStaff;
    this.canDeleteCategories = this.isAdmin;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categoriesDataSource.data = response.data;
        } else {
          this.categoriesDataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.showErrorMessage('Error loading categories. Please try again.');
        this.categoriesDataSource.data = [];
        this.isLoading = false;
      }
    });
  }

  openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: null,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openEditCategoryDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: category,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  deleteCategory(categoryId: number): void {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage('Category deleted successfully');
            this.loadCategories();
          } else {
            this.showErrorMessage('Failed to delete category');
          }
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.showErrorMessage('Error deleting category. Please try again.');
        }
      });
    }
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
}









