import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource, MatTable } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService, Product } from '../core/services/product.service';
import { ApiResponse } from '../core/models/auth.model';
import { AuthService } from '../core/services/auth.service';
import { ProductDialogComponent } from './product-dialog.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  @ViewChild(MatTable) table!: MatTable<Product>;
  productsDataSource = new MatTableDataSource<Product>([]);
  displayedColumns: string[] = ['name', 'barcode', 'category', 'sellingPrice', 'currentStock', 'actions'];
  isLoading = false;
  isAdmin = false;
  /** Staff and admin can add/edit products; only admin can delete */
  canEditProducts = false;
  canDeleteProducts = false;

  searchTerm = '';
  filterCategory = '';
  filterLowStock = false;
  categories: any[] = [];

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.isAdmin = this.authService.hasRole('ADMIN');
    const isStaff = this.authService.hasRole('STAFF');
    this.canEditProducts = this.isAdmin || isStaff;
    this.canDeleteProducts = this.isAdmin;
    this.setupFilter();
  }

  setupFilter(): void {
    this.productsDataSource.filterPredicate = (data: Product, filter: string): boolean => {
      const searchStr = filter.toLowerCase();
      const matchesSearch: boolean =
        !searchStr ||
        data.name.toLowerCase().includes(searchStr) ||
        data.barcode.toLowerCase().includes(searchStr) ||
        (data.description ? data.description.toLowerCase().includes(searchStr) : false);

      const matchesCategory: boolean =
        !this.filterCategory || (data.categoryId ? data.categoryId.toString() === this.filterCategory : false);

      const stock = data.currentStock ?? 0;
      const matchesLowStock: boolean = !this.filterLowStock || stock <= 10;

      return matchesSearch && matchesCategory && matchesLowStock;
    };
  }

  ngOnInit(): void {
    this.loadPageData();
  }

  /** Single round-trip: categories + products in parallel. Stock is on each product from API. */
  loadPageData(): void {
    this.isLoading = true;
    forkJoin({
      categories: this.productService.getCategories().pipe(
        catchError((err) => {
          console.error('Error loading categories:', err);
          return of({ success: false, message: '', data: [] } as ApiResponse<any[]>);
        })
      ),
      products: this.productService.getAllProducts().pipe(
        catchError((err) => {
          console.error('Error loading products:', err);
          this.showErrorMessage('Error loading products. Please try again.');
          return of({ success: false, message: '', data: [] } as ApiResponse<Product[]>);
        })
      )
    }).subscribe({
      next: ({ categories, products }) => {
        if (categories.success && categories.data) {
          this.categories = categories.data;
        }
        if (products.success && products.data) {
          this.productsDataSource.data = products.data;
        } else {
          this.productsDataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products page:', err);
        this.showErrorMessage('Error loading products. Please try again.');
        this.productsDataSource.data = [];
        this.isLoading = false;
      }
    });
  }

  /** @deprecated use loadPageData */
  loadProducts(): void {
    this.loadPageData();
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = response.data;
        }
      }
    });
  }

  applyFilter(): void {
    this.productsDataSource.filter = this.searchTerm;
  }

  onCategoryFilterChange(): void {
    this.applyFilter();
  }

  onLowStockFilterChange(): void {
    this.applyFilter();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterCategory = '';
    this.filterLowStock = false;
    this.applyFilter();
  }

  openAddProductDialog(): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: null,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPageData();
      }
    });
  }

  openEditProductDialog(product: Product): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: product,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPageData();
      }
    });
  }

  deleteProduct(productId: number): void {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      this.productService.deleteProduct(productId).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccessMessage('Product deleted successfully');
            this.loadPageData();
          } else {
            this.showErrorMessage('Failed to delete product');
          }
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.showErrorMessage('Error deleting product. Please try again.');
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
