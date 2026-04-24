import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, forkJoin } from 'rxjs';
import { ProductService, Product } from '../core/services/product.service';
import { StockService } from '../core/services/stock.service';
import { CategoryService, Category } from '../core/services/category.service';
import { AuthService } from '../core/services/auth.service';
import { CategoryDialogComponent } from '../categories/category-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss']
})
export class ProductDialogComponent implements OnInit {
  productForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isEditMode = false;
  /** Same as products list: staff can create categories */
  canAddCategory = false;

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public productData: Product | null,
    private productService: ProductService,
    private stockService: StockService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.isEditMode = !!productData;
    this.canAddCategory =
      this.authService.hasRole('ADMIN') || this.authService.hasRole('STAFF');
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.isEditMode && this.productData) {
      this.populateFormWithProductData();
    }
  }

  private initializeForm(): void {
    this.productForm = this.formBuilder.group({
      productName: ['', [Validators.required]],
      barcode: ['', [Validators.required]],
      description: [''],
      categoryId: [null],
      purchasePrice: [null, [Validators.required, Validators.min(0)]],
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      unit: ['piece', [Validators.required]],
      hsnCode: [''],
      gstRatePercent: [null as number | null],
      initialStock: [0, [Validators.min(0)]],
      active: [true]
    });
  }

  private populateFormWithProductData(): void {
    if (this.productData) {
      this.productForm.patchValue({
        productName: this.productData.name || '',
        barcode: this.productData.barcode || '',
        description: this.productData.description || '',
        categoryId: this.productData.categoryId || null,
        purchasePrice: this.productData.purchasePrice || 0,
        sellingPrice: this.productData.sellingPrice || 0,
        unit: this.productData.unit || 'piece',
        hsnCode: this.productData.hsnCode || '',
        gstRatePercent: this.productData.gstRatePercent ?? null,
        active: this.productData.active !== false
      });
    }
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  /** Opens category dialog; on success selects the new category */
  openAddCategoryDialog(): void {
    const ref = this.dialog.open(CategoryDialogComponent, {
      width: '480px',
      maxWidth: '90vw',
      data: null,
      disableClose: true,
      autoFocus: true
    });
    ref.afterClosed().subscribe((result: Category | boolean | null) => {
      if (result && typeof result === 'object' && result.id != null) {
        this.categories = [...this.categories, result].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
        );
        this.productForm.patchValue({ categoryId: result.id });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSave(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.productForm.value;
    const initialStock = formValue.initialStock || 0;

    // Prepare product data (remove initialStock as it's not part of product entity)
    const productPayload: Product = {
      name: formValue.productName.trim(),
      barcode: formValue.barcode.trim(),
      description: formValue.description?.trim() || null,
      categoryId: formValue.categoryId || null,
      purchasePrice: Number(formValue.purchasePrice),
      sellingPrice: Number(formValue.sellingPrice),
      unit: formValue.unit,
      hsnCode: formValue.hsnCode?.trim() || undefined,
      gstRatePercent:
        formValue.gstRatePercent != null && formValue.gstRatePercent !== ''
          ? Number(formValue.gstRatePercent)
          : undefined,
      active: formValue.active !== false
    };

    if (this.isEditMode && this.productData?.id) {
      this.updateProduct(this.productData.id, productPayload);
    } else {
      this.createProduct(productPayload, initialStock, formValue.purchasePrice);
    }
  }

  private createProduct(productPayload: Product, initialStock: number, purchasePrice: number): void {
    this.productService.createProduct(productPayload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const createdProductId = response.data.id;
          
          if (createdProductId && initialStock > 0) {
            // Add initial stock after product creation
            this.addInitialStock(createdProductId, Number(initialStock), Number(purchasePrice)).subscribe({
              next: (stockResponse) => {
                if (stockResponse.success) {
                  this.showSuccessMessage('Product created successfully with initial stock');
                } else {
                  this.showErrorMessage('Product created but failed to add initial stock: ' + (stockResponse.message || 'Unknown error'));
                }
                this.dialogRef.close(true);
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Error adding initial stock:', error);
                const errorMsg = error?.error?.message || error?.message || 'Unknown error';
                this.showErrorMessage(`Product created but failed to add initial stock: ${errorMsg}`);
                this.dialogRef.close(true);
                this.isLoading = false;
              }
            });
          } else {
            this.showSuccessMessage('Product created successfully');
            this.dialogRef.close(true);
            this.isLoading = false;
          }
        } else {
          this.showErrorMessage('Failed to create product');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.handleError('Error creating product', error);
        this.isLoading = false;
      }
    });
  }

  private updateProduct(productId: number, productPayload: Product): void {
    this.productService.updateProduct(productId, productPayload).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccessMessage('Product updated successfully');
          this.dialogRef.close(true);
        } else {
          this.showErrorMessage('Failed to update product');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error updating product', error);
        this.isLoading = false;
      }
    });
  }

  private addInitialStock(productId: number, quantity: number, unitPrice: number): Observable<any> {
    return this.stockService.addStockIn(productId, quantity, unitPrice, 'Initial stock on product creation');
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
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
