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
import {
  PurchaseReturnService,
  PurchaseReturnRequest,
  PurchaseReturn
} from '../core/services/purchase-return.service';
import { SupplierService, Supplier } from '../core/services/supplier.service';
import { ProductService, Product } from '../core/services/product.service';

@Component({
  selector: 'app-purchase-return-dialog',
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
  templateUrl: './purchase-return-dialog.component.html',
  styleUrls: ['../purchases/purchase-dialog.component.scss']
})
export class PurchaseReturnDialogComponent implements OnInit {
  form!: FormGroup;
  isViewMode = false;
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  products: Product[] = [];
  productSearchFilters = new Map<number, string>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PurchaseReturnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PurchaseReturn | null,
    private purchaseReturnService: PurchaseReturnService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {
    this.isViewMode = !!data;
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProducts();

    this.form = this.fb.group({
      supplierSearch: [''],
      supplierId: [null],
      referencePurchaseId: [null],
      returnDate: [this.data?.returnDate ? new Date(this.data.returnDate) : new Date()],
      items: this.fb.array([]),
      discount: [this.data?.discount || 0],
      notes: [this.data?.notes || '']
    });

    if (this.isViewMode && this.data?.items) {
      this.form.disable();
      this.data.items.forEach((item: any) => this.addItem(item));
    } else {
      this.addItem();
    }
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suppliers = response.data.filter((s) => s.active !== false);
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
    const searchTerm = this.form.get('supplierSearch')?.value || '';
    if (!searchTerm) {
      this.filteredSuppliers = this.suppliers;
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) || (s.phone && s.phone.includes(term))
    );
  }

  onSupplierSelected(event: any): void {
    const supplier = event.option.value;
    this.form.patchValue({ supplierId: supplier?.id || null });
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
      discount: [itemData?.discount || 0]
    });
    this.items.push(item);
    const index = this.items.length - 1;
    this.productSearchFilters.set(index, '');
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.productSearchFilters.delete(index);
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
    return this.products.filter(
      (p) => p.name.toLowerCase().includes(term) || p.barcode.toLowerCase().includes(term)
    );
  }

  displayProduct(product: Product | null): string {
    return product ? `${product.name} (${product.barcode})` : '';
  }

  onProductSelected(index: number, event: any): void {
    const product = event.option.value;
    if (product) {
      const row = this.items.at(index);
      row.patchValue({
        productId: product.id,
        productSearch: `${product.name} (${product.barcode})`,
        unitPrice: product.purchasePrice || 0
      });
    }
  }

  getItemTotal(index: number): number {
    const row = this.items.at(index);
    const quantity = row.get('quantity')?.value || 0;
    const unitPrice = row.get('unitPrice')?.value || 0;
    const discount = row.get('discount')?.value || 0;
    return quantity * unitPrice - discount;
  }

  getGrandTotal(): number {
    const itemsTotal = this.items.controls.reduce((sum, _, i) => sum + this.getItemTotal(i), 0);
    const discount = this.form.get('discount')?.value || 0;
    return itemsTotal - discount;
  }

  onSave(): void {
    if (this.form.invalid || this.isViewMode || this.items.length === 0) {
      return;
    }
    const v = this.form.value;
    const rawRef = v.referencePurchaseId;
    const refId =
      rawRef != null && rawRef !== '' ? Number(rawRef) : undefined;
    const req: PurchaseReturnRequest = {
      supplierId: v.supplierId || undefined,
      referencePurchaseId: refId != null && !Number.isNaN(refId) ? refId : undefined,
      returnDate: v.returnDate ? new Date(v.returnDate).toISOString().split('T')[0] : undefined,
      items: v.items.map((x: any) => ({
        productId: x.productId,
        quantity: x.quantity,
        unitPrice: x.unitPrice,
        discount: x.discount || 0
      })),
      discount: v.discount || 0,
      notes: v.notes || undefined
    };

    this.purchaseReturnService.createPurchaseReturn(req).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Purchase return recorded', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open('Failed to save', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error(error);
        this.snackBar.open(
          'Error: ' + (error.error?.message || 'Unknown error'),
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
