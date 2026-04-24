import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PurchaseService, PurchaseRequest, Purchase } from '../core/services/purchase.service';
import { SupplierService, Supplier } from '../core/services/supplier.service';
import { ProductService, Product } from '../core/services/product.service';

@Component({
  selector: 'app-purchase-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './purchase-dialog.component.html',
  styleUrls: ['./purchase-dialog.component.scss']
})
export class PurchaseDialogComponent implements OnInit {
  purchaseForm!: FormGroup;
  isViewMode = false;
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  products: Product[] = [];
  productSearchFilters = new Map<number, string>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PurchaseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Purchase | null,
    private purchaseService: PurchaseService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {
    this.isViewMode = !!data;
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProducts();

    this.purchaseForm = this.fb.group({
      supplierSearch: [''],
      supplierId: [null],
      purchaseDate: [this.data?.purchaseDate ? new Date(this.data.purchaseDate) : new Date()],
      items: this.fb.array([]),
      discount: [this.data?.discount || 0],
      paymentStatus: [this.data?.paymentStatus || 'PENDING', Validators.required],
      notes: [this.data?.notes || '']
    });

    if (this.isViewMode && this.data) {
      this.purchaseForm.disable();
      // Populate items if viewing
      if (this.data.items) {
        this.data.items.forEach((item: any) => {
          this.addItem(item);
        });
      }
    } else {
      this.addItem();
    }
  }

  get items() {
    return this.purchaseForm.get('items') as FormArray;
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suppliers = response.data.filter(s => s.active !== false);
          this.filteredSuppliers = this.suppliers;
        }
      }
    });
  }

  loadProducts(): void {
    this.productService.getActiveProducts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products = response.data || [];
        }
      }
    });
  }

  onSupplierSearch(): void {
    const searchTerm = this.purchaseForm.get('supplierSearch')?.value || '';
    this.filterSuppliers(searchTerm);
  }

  filterSuppliers(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredSuppliers = this.suppliers;
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(term) ||
      (supplier.phone && supplier.phone.includes(term))
    );
  }

  onSupplierSelected(event: any): void {
    const supplier = event.option.value;
    this.purchaseForm.patchValue({ supplierId: supplier?.id || null });
  }

  displaySupplier(supplier: Supplier | null): string {
    return supplier ? `${supplier.name}${supplier.phone ? ' - ' + supplier.phone : ''}` : '';
  }

  addItem(itemData?: any): void {
    const item = this.fb.group({
      productSearch: [itemData ? `${itemData.product?.name || ''} (${itemData.product?.barcode || ''})` : ''],
      productId: [itemData?.productId || null, Validators.required],
      quantity: [itemData?.quantity || 1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [itemData?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      discount: [itemData?.discount || 0],
      batchNumber: [itemData?.batchNumber || ''],
      expiryDate: [itemData?.expiryDate ? new Date(itemData.expiryDate) : null]
    });
    this.items.push(item);
    const index = this.items.length - 1;
    this.productSearchFilters.set(index, '');
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.productSearchFilters.delete(index);
    this.calculateTotal();
  }

  onProductSearch(index: number): void {
    const control = this.getProductControl(index);
    const searchTerm = control.value || '';
    this.productSearchFilters.set(index, typeof searchTerm === 'string' ? searchTerm : '');
  }

  getProductControl(index: number): any {
    return this.items.at(index).get('productSearch');
  }

  getFilteredProducts(index: number): Product[] {
    const searchTerm = this.productSearchFilters.get(index) || '';
    if (!searchTerm) {
      return this.products;
    }
    const term = searchTerm.toLowerCase();
    return this.products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.barcode.toLowerCase().includes(term)
    );
  }

  displayProduct(product: Product | null): string {
    return product ? `${product.name} (${product.barcode})` : '';
  }

  onProductSelected(index: number, event: any): void {
    const product = event.option.value;
    if (product) {
      const item = this.items.at(index);
      item.patchValue({
        productId: product.id,
        productSearch: `${product.name} (${product.barcode})`,
        unitPrice: product.purchasePrice || 0
      });
      this.calculateItemTotal(index);
    }
  }

  calculateItemTotal(index: number): void {
    this.calculateTotal();
  }

  calculateTotal(): void {
    // Total is calculated in getGrandTotal()
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    const discount = item.get('discount')?.value || 0;
    return (quantity * unitPrice) - discount;
  }

  getGrandTotal(): number {
    const itemsTotal = this.items.controls.reduce((sum, item) => {
      return sum + this.getItemTotal(this.items.controls.indexOf(item));
    }, 0);
    const discount = this.purchaseForm.get('discount')?.value || 0;
    return itemsTotal - discount;
  }

  onSave(): void {
    if (this.purchaseForm.valid && !this.isViewMode) {
      const formValue = this.purchaseForm.value;
      const purchaseRequest: PurchaseRequest = {
        supplierId: formValue.supplierId,
        purchaseDate: formValue.purchaseDate ? new Date(formValue.purchaseDate).toISOString().split('T')[0] : undefined,
        items: formValue.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          batchNumber: item.batchNumber || undefined,
          expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : undefined
        })),
        discount: formValue.discount || 0,
        paymentStatus: formValue.paymentStatus,
        notes: formValue.notes || undefined
      };

      this.purchaseService.createPurchase(purchaseRequest).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Purchase order created successfully!', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open('Failed to create purchase order', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error creating purchase:', error);
          this.snackBar.open('Error creating purchase: ' + (error.error?.message || 'Unknown error'), 'Close', { duration: 5000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

