import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, finalize } from 'rxjs';
import { SaleService, SaleRequest, Sale } from '../core/services/sale.service';
import { ProductService, Product } from '../core/services/product.service';
import { CustomerService, Customer } from '../core/services/customer.service';
import { CustomerProductPriceService } from '../core/services/customer-product-price.service';
import { StockService } from '../core/services/stock.service';
import { InvoiceData } from './invoice-data.model';
import { saleToInvoiceData } from './invoice-from-sale';
import { InvoicePrintDialogService } from './invoice-print-dialog.service';
import {
  SalePrefillFromOrderService,
  SalePrefillFromOrder
} from '../core/services/sale-prefill-from-order.service';
import type { CreditSaleDialogData, CreditSaleDialogResult } from './credit-sale-dialog.component';
import { ProductSearchDialogComponent, ProductSearchData } from './product-search-dialog/product-search-dialog.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatCardModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent implements OnInit, OnDestroy {
  today: Date = new Date();
  private timeInterval: any;
  shopName: string = '';
  nextBillNo: string = 'NEW';
  saleForm: FormGroup;
  products: Product[] = [];
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  selectedCustomerBalance: number = 0;
  customerBalanceLoading: boolean = false;
  productStockMap = new Map<number, number>();
  /** Custom unit prices for the selected customer (productId → price). */
  customerPriceMap = new Map<number, number>();
  
  // Product search filters per item
  productSearchFilters = new Map<number, string>();

  /** When opened from Online orders — sent on Complete sale to link the web order */
  pendingCustomerOrderId: number | null = null;
  prefillOrderLabel: string | null = null;

  /** Last completed sale invoice — allows re-opening print from the POS screen */
  lastInvoiceData: InvoiceData | null = null;

  /** After a successful sale, first End completed the bill; second End reprints the invoice. */
  expectingSecondEndForPrint = false;
  isDialogOpen = false;
  
  pendingSearchBuffer: string = '';

  private saleSubmitting = false;

  @ViewChildren('lineQtyInput') private lineQtyInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('lineProductInput') private lineProductInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('lineRateInput') private lineRateInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('lineDiscountInput') private lineDiscountInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private customerService: CustomerService,
    private stockService: StockService,
    private snackBar: MatSnackBar,
    private invoicePrintDialog: InvoicePrintDialogService,
    private salePrefillFromOrder: SalePrefillFromOrderService,
    private dialog: MatDialog,
    private customerProductPriceService: CustomerProductPriceService,
    private cdr: ChangeDetectorRef
  ) {
    this.saleForm = this.fb.group({
      customerSearch: [''],
      customerId: [null],
      items: this.fb.array([]),
      discount: [0],
      paymentMode: ['CASH', Validators.required],
      partialPaymentAmount: [0, [Validators.min(0)]]
    });

    this.saleForm.get('customerSearch')?.valueChanges.subscribe((searchTerm) => {
      this.filterCustomers(searchTerm || '');
    });

    this.saleForm.get('paymentMode')?.valueChanges.subscribe((paymentMode) => {
      if (paymentMode === 'CREDIT') {
        const customerId = this.saleForm.get('customerId')?.value;
        if (customerId) {
          this.loadCustomerBalance(customerId);
        }
      } else {
        this.saleForm.patchValue({ partialPaymentAmount: 0 }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.timeInterval = setInterval(() => {
      this.today = new Date();
      this.cdr.detectChanges();
    }, 1000);

    this.loadNextBillNo();

    forkJoin({
      products: this.productService.getActiveProducts(),
      customers: this.customerService.getActiveCustomers()
    }).subscribe({
      next: ({ products, customers }) => {
        if (products.success && products.data) {
          this.products = products.data;
          this.productStockMap.clear();
          for (const product of this.products) {
            if (product.id != null) {
              this.productStockMap.set(product.id, product.currentStock ?? 0);
            }
          }
        }
        if (customers.success && customers.data) {
          this.customers = customers.data;
          this.filteredCustomers = this.customers;
        }

        const draft = this.salePrefillFromOrder.consume();
        if (draft) {
          this.pendingCustomerOrderId = draft.customerOrderId;
          this.prefillOrderLabel = draft.orderNumber || `#${draft.customerOrderId}`;
          this.applyPrefillFromOrder(draft);
        } else {
          this.initializeEmptyRows(8);
        }
      },
      error: () => {
        this.loadProducts();
        this.loadCustomers();
        this.initializeEmptyRows(8);
      }
    });
  }

  loadNextBillNo(): void {
    this.saleService.getNextInvoiceNumber().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.nextBillNo = res.data;
        }
      }
    });
  }

  private applyPrefillFromOrder(draft: SalePrefillFromOrder): void {
    this.expectingSecondEndForPrint = false;
    while (this.items.length) {
      this.items.removeAt(0);
    }
    this.productSearchFilters.clear();

    for (const line of draft.items) {
      this.addItem();
      const idx = this.items.length - 1;
      const product = this.products.find((p) => p.id === line.productId);
      if (product && product.id != null) {
        this.items.at(idx).patchValue({
          productId: product.id,
          productSearch: product,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discount: line.lineDiscount || 0
        });
        this.productStockMap.set(product.id, product.currentStock ?? 0);
      }
    }

    if (this.items.length === 0) {
      this.initializeEmptyRows(8);
    }

    if (draft.customerId) {
      const c = this.customers.find((x) => x.id === draft.customerId);
      if (c) {
        this.selectedCustomer = c;
        this.saleForm.patchValue({
          customerId: c.id,
          customerSearch: c
        });
        if (draft.paymentMode === 'CREDIT') {
          this.loadCustomerBalance(c.id!);
        }
        this.loadCustomerPrices(c.id ?? null);
      }
    } else {
      this.loadCustomerPrices(null);
    }

    this.saleForm.patchValue({
      discount: draft.billDiscount || 0,
      paymentMode: draft.paymentMode || 'CASH',
      partialPaymentAmount: 0
    });
  }

  displayCustomer(customer: Customer | null): string {
    return customer ? `${customer.name} - ${customer.phone || 'No phone'}` : '';
  }
  
  displayProduct(product: Product | string | null | undefined): string {
    if (!product) return '';
    if (typeof product === 'string') return product;
    // Handle Product object
    const name = product.name || 'Unknown';
    const barcode = product.barcode || 'N/A';
    return `${name} (${barcode})`;
  }
  
  onCustomerSearch(): void {
    const searchTerm = this.saleForm.get('customerSearch')?.value || '';
    this.filterCustomers(searchTerm);
  }
  
  filterCustomers(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredCustomers = this.customers;
      return;
    }
    
    const term = searchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      (customer.phone && customer.phone.includes(term))
    );
  }
  
  onCustomerSelected(event: any): void {
    this.expectingSecondEndForPrint = false;
    const customer = event.option.value;
    this.selectedCustomer = customer;
    this.saleForm.patchValue({ customerId: customer?.id || null });
    if (customer) {
      this.loadCustomerBalance(customer.id!);
      this.loadCustomerPrices(customer.id);
    } else {
      this.selectedCustomerBalance = 0;
      this.loadCustomerPrices(null);
    }
  }

  private loadCustomerPrices(customerId: number | null): void {
    this.customerPriceMap.clear();
    if (customerId == null) {
      this.refreshLineUnitPricesForCustomer();
      return;
    }
    this.customerProductPriceService.listByCustomer(customerId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          for (const row of res.data) {
            this.customerPriceMap.set(row.productId, Number(row.unitPrice));
          }
        }
        this.refreshLineUnitPricesForCustomer();
      },
      error: () => this.refreshLineUnitPricesForCustomer()
    });
  }

  private refreshLineUnitPricesForCustomer(): void {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items.at(i);
      const pid = item.get('productId')?.value as number | null;
      if (pid == null) {
        continue;
      }
      const product = this.products.find((p) => p.id === pid);
      const unitPrice = this.resolveUnitPriceForProduct(product, pid);
      item.patchValue({ unitPrice }, { emitEvent: false });
      this.calculateItemTotal(i);
    }
  }

  private resolveUnitPriceForProduct(product: Product | undefined, productId: number): number {
    const cid = this.saleForm.get('customerId')?.value;
    if (cid != null && this.customerPriceMap.has(productId)) {
      return this.customerPriceMap.get(productId)!;
    }
    return product?.sellingPrice ?? 0;
  }

  /** Price shown in product autocomplete (customer override when set). */
  getEffectiveCatalogDisplayPrice(product: Product): number {
    const cid = this.saleForm.get('customerId')?.value;
    if (cid != null && product.id != null && this.customerPriceMap.has(product.id)) {
      return this.customerPriceMap.get(product.id)!;
    }
    return product.sellingPrice ?? 0;
  }
  
  onProductSearch(index: number): void {
    const control = this.getProductControl(index);
    const value = control.value;
    let searchTerm = '';
    
    if (typeof value === 'string') {
      searchTerm = value;
    } else if (value && typeof value === 'object' && value.name) {
      // If it's a product object, extract the name for filtering
      searchTerm = value.name;
    }
    
    this.productSearchFilters.set(index, searchTerm);
  }
  
  getFilteredProducts(index: number): Product[] {
    const searchTerm = this.productSearchFilters.get(index) || '';
    if (!searchTerm) {
      return this.products;
    }
    
    const term = searchTerm.toLowerCase();
    return this.products.filter(product => {
      const name = product.name?.toLowerCase() || '';
      const barcode = product.barcode?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      return name.includes(term) || barcode.includes(term) || description.includes(term);
    });
  }
  
  getProductControl(index: number): any {
    return this.items.at(index).get('productSearch');
  }
  
  onProductSelected(index: number, event: any): void {
    this.expectingSecondEndForPrint = false;
    const product = event.option.value;
    if (product && product.id) {
      const item = this.items.at(index);
      const unitPrice = this.resolveUnitPriceForProduct(product, product.id);
      item.patchValue({
        productId: product.id,
        productSearch: product,
        unitPrice
      });
      this.productStockMap.set(product.id, product.currentStock ?? 0);
      this.calculateItemTotal(index);
      this.focusQtyForLine(index);
    }
  }
  focusQtyForLine(index: number): void {

  setTimeout(() => {

    const qtyInputs =
      this.lineQtyInputs.toArray();

    const input =
      qtyInputs[index]?.nativeElement;

    if (input) {

      input.focus();

      input.select();

    }

  });

}

  focusField(index: number, field: string): void {
    setTimeout(() => {
      let list;
      if (field === 'product') list = this.lineProductInputs;
      else if (field === 'qty') list = this.lineQtyInputs;
      else if (field === 'rate') list = this.lineRateInputs;
      else if (field === 'discount') list = this.lineDiscountInputs;

      const el = list?.toArray()[index]?.nativeElement;
      if (el) {
        el.focus();
        el.select();
      }
    });
  }

  onInputKeydown(index: number, field: string, event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index > 0) this.focusField(index - 1, field);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (index < this.items.length - 1) this.focusField(index + 1, field);
    } else if (event.key === 'ArrowLeft') {
      const input = event.target as HTMLInputElement;
      const supportsSelection = input.type === 'text' || input.type === 'search';
      const atStart = !supportsSelection || (input.selectionStart === 0 && input.selectionEnd === 0);
      if (atStart) {
        event.preventDefault();
        if (field === 'discount') this.focusField(index, 'rate');
        else if (field === 'rate') this.focusField(index, 'qty');
        else if (field === 'qty') this.focusField(index, 'product');
      }
    } else if (event.key === 'ArrowRight') {
      const input = event.target as HTMLInputElement;
      const supportsSelection = input.type === 'text' || input.type === 'search';
      const atEnd = !supportsSelection || (input.selectionStart === input.value.length && input.selectionEnd === input.value.length);
      if (atEnd) {
        event.preventDefault();
        if (field === 'product') this.focusField(index, 'qty');
        else if (field === 'qty') this.focusField(index, 'rate');
        else if (field === 'rate') this.focusField(index, 'discount');
      }
    } else if (event.key === 'Delete') {
      event.preventDefault();
      this.clearOrRemoveItem(index);
    }
  }

  clearOrRemoveItem(index: number): void {
    if (this.items.length > 1) {
      this.removeItem(index);
      this.focusField(Math.max(0, index - 1), 'product');
    } else {
      this.items.at(index).reset({ quantity: null, unitPrice: null, discount: null, productSearch: '' });
    }
  }

  onProductKeydown(index: number, event: KeyboardEvent): void {
    this.onInputKeydown(index, 'product', event);
    if (event.key === 'Enter') {
      event.preventDefault();
      const row = this.items.at(index);
      if (row.get('productId')?.value) {
        this.focusField(index, 'qty');
      } else {
        const inputVal = (event.target as HTMLInputElement).value;
        if (inputVal && inputVal.trim().length > 0) {
          const isNumeric = /^\d+$/.test(inputVal.trim());
          
          if (isNumeric) {
            // Check for exact barcode match
            const exactMatch = this.products.find(p => p.barcode === inputVal.trim());
            if (exactMatch) {
              this.applySelectedProduct(index, exactMatch);
              return;
            } else {
              // Incorrect barcode
              this.snackBar.open('Product not found for barcode: ' + inputVal, 'Close', { duration: 3000 });
              this.getProductControl(index).setValue('');
              return;
            }
          } else {
            // It's a word, but somehow Enter was pressed before dialog opened
            if (!this.isDialogOpen) {
              this.isDialogOpen = true;
              this.getProductControl(index).setValue('');
              this.openProductSearchDialog(index, inputVal);
            }
          }
        }
      }
    }
  }

  onProductInput(index: number, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!val || val.trim().length === 0) return;

    // Check if it's purely numeric (barcode)
    const isNumeric = /^\d+$/.test(val.trim());

    if (!isNumeric) {
      // It's a word. Open popup immediately.
      this.pendingSearchBuffer = val;
      if (!this.isDialogOpen) {
        this.isDialogOpen = true;
        setTimeout(() => {
          this.getProductControl(index).setValue('');
          this.openProductSearchDialog(index, this.pendingSearchBuffer);
          this.pendingSearchBuffer = '';
        }, 150);
      }
    }
  }

  openProductSearchDialog(index: number, initialTerm: string = ''): void {
    this.isDialogOpen = true;
    const dialogRef = this.dialog.open(ProductSearchDialogComponent, {
      width: '80vw',
      maxWidth: '900px',
      height: '70vh',
      disableClose: true,
      panelClass: 'terminal-dialog-panel',
      data: { initialSearchTerm: initialTerm } as ProductSearchData
    });

    dialogRef.afterClosed().subscribe((selectedProduct: Product | undefined) => {
      this.isDialogOpen = false;
      if (selectedProduct && selectedProduct.id) {
        this.applySelectedProduct(index, selectedProduct);
      } else {
        this.focusField(index, 'product');
      }
      this.cdr.detectChanges();
    });
  }

  private applySelectedProduct(index: number, selectedProduct: Product): void {
    const item = this.items.at(index);
    const unitPrice = this.resolveUnitPriceForProduct(selectedProduct, selectedProduct.id!);
    item.patchValue({
      productId: selectedProduct.id,
      productSearch: selectedProduct.name,
      unitPrice
    });
    this.productStockMap.set(selectedProduct.id!, selectedProduct.currentStock ?? 0);
    this.calculateItemTotal(index);
    this.focusQtyForLine(index);
    this.cdr.detectChanges();
  }

  onQtyKeydown(index: number, event: KeyboardEvent): void {
    this.onInputKeydown(index, 'qty', event);
    if (event.key === 'Enter') {
      event.preventDefault();
      const row = this.items.at(index);
      if (!row.get('productId')?.value) {
        this.snackBar.open('Select a product on this line first', 'Close', { duration: 3000 });
        return;
      }
      const qty = row.get('quantity')?.value;
      if (qty == null || qty === '' || Number(qty) <= 0) {
        this.snackBar.open('Please enter a valid Quantity first', 'Close', { duration: 3000 });
        return;
      }
      if (index === this.items.length - 1) {
        this.addItem();
      }
      this.focusField(index + 1, 'product');
    }
  }

  onRateKeydown(index: number, event: KeyboardEvent): void {
    this.onInputKeydown(index, 'rate', event);
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusField(index, 'discount');
    }
  }

  onDiscountKeydown(index: number, event: KeyboardEvent): void {
    this.onInputKeydown(index, 'discount', event);
    if (event.key === 'Enter') {
      event.preventDefault();
      if (index === this.items.length - 1) {
        this.addItem();
      }
      this.focusField(index + 1, 'product');
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'End') {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('.cdk-overlay-container')) {
      return;
    }
    event.preventDefault();
    if (this.expectingSecondEndForPrint && this.lastInvoiceData) {
      this.expectingSecondEndForPrint = false;
      this.reprintLastInvoice();
      return;
    }
    if (!this.saleForm.valid || this.items.length === 0 || this.saleSubmitting) {
      return;
    }
    this.onSubmitSale();
  }
  
  getProductStock(productId: number | undefined): number {
    if (!productId) return 0;
    const cached = this.productStockMap.get(productId);
    if (cached !== undefined) {
      return cached;
    }
    const fromList = this.products.find((p) => p.id === productId)?.currentStock;
    return fromList ?? 0;
  }

  /** Only used if stock is missing on the product (edge case). */
  loadProductStock(productId: number): void {
    if (this.productStockMap.has(productId)) {
      return;
    }
    this.stockService.getCurrentStock(productId).subscribe({
      next: (response) => {
        if (response.success && response.data !== undefined) {
          this.productStockMap.set(productId, response.data);
        }
      },
      error: () => {
        this.productStockMap.set(productId, 0);
      }
    });
  }

  get items() {
    return this.saleForm.get('items') as FormArray;
  }


  loadCustomers(): void {
    this.customerService.getActiveCustomers().subscribe({
      next: (response) => {
        if (response.success) {
          this.customers = response.data || [];
          this.filteredCustomers = this.customers;
        }
      }
    });
  }
  
  loadProducts(): void {
    this.productService.getActiveProducts().subscribe({
      next: (response) => {
        if (response.success) {
          this.products = response.data || [];
          this.productStockMap.clear();
          for (const product of this.products) {
            if (product.id != null) {
              this.productStockMap.set(product.id, product.currentStock ?? 0);
            }
          }
        }
      }
    });
  }
  
  loadCustomerBalance(customerId: number | null): void {
    if (!customerId) {
      this.selectedCustomerBalance = 0;
      return;
    }
    
    this.customerBalanceLoading = true;
    this.customerService.getCustomerBalance(customerId).subscribe({
      next: (response) => {
        if (response.success && response.data !== undefined) {
          this.selectedCustomerBalance = response.data;
        } else {
          this.selectedCustomerBalance = 0;
        }
        this.customerBalanceLoading = false;
      },
      error: () => {
        this.selectedCustomerBalance = 0;
        this.customerBalanceLoading = false;
      }
    });
  }
  
  getRemainingBalance(): number {
    const grandTotal = this.getGrandTotal();
    const partialPayment = this.saleForm.get('partialPaymentAmount')?.value || 0;
    return grandTotal - partialPayment;
  }

  /** True when this sale is on account (credit), not paid in full at counter. */
  isCreditSaleForm(): boolean {
    return this.saleForm.get('paymentMode')?.value === 'CREDIT';
  }

  /**
   * Cash/UPI/card: full amount due now.
   * Credit: only what you collect at the counter (partial payment, often 0) — not the full invoice.
   */
  getPayNowAmount(): number {
    if (!this.isCreditSaleForm()) {
      return this.getGrandTotal();
    }
    return Number(this.saleForm.get('partialPaymentAmount')?.value ?? 0);
  }
  
  getMaxPartialPayment(): number {
    return this.getGrandTotal();
  }
  
  onPaymentModeSelect(ev: MatSelectChange): void {
    const mode = ev.value as string;
    if (mode === 'CREDIT') {
      if (!this.saleForm.get('customerId')?.value) {
        this.snackBar.open('Select a customer for credit sales', 'Close', { duration: 4000 });
        this.saleForm.patchValue({ paymentMode: 'CASH' }, { emitEvent: false });
        return;
      }
      if (this.getGrandTotal() <= 0) {
        this.snackBar.open('Add line items with an amount before credit sale', 'Close', { duration: 4000 });
        this.saleForm.patchValue({ paymentMode: 'CASH' }, { emitEvent: false });
        return;
      }
      this.openCreditSaleDialog();
    }
  }

  private openCreditSaleDialog(): void {
    void import('./credit-sale-dialog.component').then(({ CreditSaleDialogComponent }) => {
      const ref = this.dialog.open(CreditSaleDialogComponent, {
        width: '440px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          grandTotal: this.getGrandTotal(),
          partialPayment: this.saleForm.get('partialPaymentAmount')?.value || 0,
          previousBalance: this.selectedCustomerBalance,
          customerName: this.selectedCustomer?.name
        } as CreditSaleDialogData
      });
      ref.afterClosed().subscribe((result: CreditSaleDialogResult | null) => {
        if (result == null) {
          this.saleForm.patchValue({ paymentMode: 'CASH', partialPaymentAmount: 0 }, { emitEvent: false });
        } else {
          this.saleForm.patchValue({ partialPaymentAmount: result.partialPayment }, { emitEvent: false });
        }
      });
    });
  }

  initializeEmptyRows(count: number): void {
    for (let i = 0; i < count; i++) {
      this.addItem({ skipClearSecondEnd: true });
    }
    this.cdr.detectChanges();
    setTimeout(() => this.focusField(0, 'product'), 100);
  }

  addItem(options?: { skipClearSecondEnd?: boolean }): void {
    if (!options?.skipClearSecondEnd) {
      this.expectingSecondEndForPrint = false;
    }
    const item = this.fb.group({
      productSearch: [''],
      productId: [null],
      quantity: [null, [Validators.min(0.01)]],
      unitPrice: [null],
      discount: [null]
    });
    this.items.push(item);
    const index = this.items.length - 1;
    this.productSearchFilters.set(index, '');
  }

  removeItem(index: number): void {
    this.expectingSecondEndForPrint = false;
    this.items.removeAt(index);
    this.productSearchFilters.delete(index);
    this.calculateTotal();
  }
  
  calculateRemainingBalance(): void {
    // This function is called when partial payment or total changes
    // The getter `getRemainingBalance()` will automatically reflect changes
  }

  calculateItemTotal(index: number): void {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    if (!productId) return;
    const quantity = Number(item.get('quantity')?.value) || 0;
    const unitPrice = Number(item.get('unitPrice')?.value) || 0;
    const discount = Number(item.get('discount')?.value) || 0;
    const total = (quantity * unitPrice) - discount;
    // Store total in form if needed
  }

  getItemTotal(index: number): number {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    if (!productId) return 0;
    const quantity = Number(item.get('quantity')?.value) || 0;
    const unitPrice = Number(item.get('unitPrice')?.value) || 0;
    const discount = Number(item.get('discount')?.value) || 0;
    return (quantity * unitPrice) - discount;
  }

  calculateTotal(): void {
    // Recalculate all item totals
    for (let i = 0; i < this.items.length; i++) {
      this.calculateItemTotal(i);
    }
  }

  getGrandTotal(): number {
    const itemsTotal = this.items.controls.reduce((sum, item) => {
      const productId = item.get('productId')?.value;
      if (!productId) return sum;
      const quantity = Number(item.get('quantity')?.value) || 0;
      const unitPrice = Number(item.get('unitPrice')?.value) || 0;
      const discount = Number(item.get('discount')?.value) || 0;
      return sum + (quantity * unitPrice - discount);
    }, 0);
    const discount = Number(this.saleForm.get('discount')?.value) || 0;
    return itemsTotal - discount;
  }

  getRoundedTotal(): number {
    return Math.round(this.getGrandTotal());
  }

  getActiveItemsCount(): number {
    return this.items.controls.filter(c => c.get('productId')?.value).length;
  }

  isQtyInvalid(index: number): boolean {
    const row = this.items.at(index);
    const productId = row.get('productId')?.value;
    if (!productId) {
      return false; // Row is empty, no error
    }
    const qty = row.get('quantity')?.value;
    return qty == null || qty === '' || Number(qty) <= 0 || isNaN(Number(qty));
  }

  onNumericInput(controlName: string, index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    
    // Remove any character that is not a digit or dot
    val = val.replace(/[^0-9.]/g, '');
    
    // Ensure only one dot exists
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (input.value !== val) {
      input.value = val;
    }
    
    // Patch form control value silently
    const item = this.items.at(index);
    item.get(controlName)?.setValue(val, { emitEvent: false });
    
    this.calculateItemTotal(index);
    this.calculateTotal();
  }

  onSubmitSale(): void {
    if (!this.saleForm.valid || this.saleSubmitting) {
      return;
    }
    
    // Validate that all items with a product selected have a valid quantity (> 0)
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items.at(i);
      const productId = item.get('productId')?.value;
      if (productId) {
        const qty = item.get('quantity')?.value;
        if (qty == null || qty === '' || Number(qty) <= 0) {
          const prodName = item.get('productSearch')?.value || 'this line';
          this.snackBar.open(`Please enter a valid Quantity for "${prodName}"`, 'Close', { duration: 4000 });
          this.focusField(i, 'qty');
          return;
        }
      }
    }
    
    const formValue = this.saleForm.value;
    const validItems = formValue.items.filter((item: any) => item.productId != null);
    
    if (validItems.length === 0) {
      this.snackBar.open('Add at least one product to complete the sale.', 'Close', { duration: 3000 });
      return;
    }

    // Blur any active element (e.g. autocomplete input) so dropdown overlay closes instantly
    (document.activeElement as HTMLElement)?.blur();

    // Open Payment Mode selection dialog dynamically
    void import('./payment-checkout-dialog.component').then(({ PaymentCheckoutDialogComponent }) => {
      const dialogRef = this.dialog.open(PaymentCheckoutDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          grandTotal: this.getGrandTotal(),
          customers: this.customers,
          selectedCustomerId: this.saleForm.get('customerId')?.value,
          selectedCustomer: this.selectedCustomer
        }
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (!res) {
          // User closed/cancelled - return to billing screen with values intact
          return;
        }

        if (res.paymentMode === 'CREDIT') {
          // If customer was selected inside the dialog, update the main form!
          if (res.customerId) {
            const customer = this.customers.find(c => c.id === res.customerId);
            if (customer) {
              this.selectedCustomer = customer;
              this.saleForm.patchValue({
                customerId: customer.id,
                customerSearch: customer
              });
              this.loadCustomerBalance(customer.id!);
              this.loadCustomerPrices(customer.id ?? null);
            }
          }
          this.createSale('CREDIT', res.printInvoice, res.partialPayment || 0);
        } else {
          // Cash or UPI sale with printInvoice choice from dialog step 2
          this.createSale(res.paymentMode, res.printInvoice, 0);
        }
      });
    });
  }

  createSale(paymentMode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT', printInvoice: boolean, partialPaymentAmount: number = 0): void {
    if (this.saleSubmitting) {
      return;
    }
    
    const formValue = this.saleForm.value;
    const validItems = formValue.items.filter((item: any) => item.productId != null);
    
    this.saleSubmitting = true;
    const isCredit = paymentMode === 'CREDIT';
    const saleRequest: SaleRequest = {
      customerId: formValue.customerId,
      items: validItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        discount: item.discount || 0,
        unitPrice: item.unitPrice != null && item.unitPrice !== '' ? Number(item.unitPrice) : undefined
      })),
      discount: formValue.discount || 0,
      paymentMode: paymentMode,
      isCredit,
      partialPaymentAmount: partialPaymentAmount,
      sourceCustomerOrderId: this.pendingCustomerOrderId ?? undefined
    };

    this.saleService
      .createSale(saleRequest)
      .pipe(finalize(() => (this.saleSubmitting = false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.snackBar.open('Sale completed successfully!', 'Close', { duration: 3000 });

            if (printInvoice) {
              const invoiceData: InvoiceData = {
                ...saleToInvoiceData(response.data as Sale),
                autoPrintAfterOpen: true,
                oldBalance:
                  paymentMode === 'CREDIT' && formValue.customerId
                    ? this.selectedCustomerBalance
                    : undefined
              };

              this.lastInvoiceData = {
                ...invoiceData,
                items: invoiceData.items.map((row) => ({ ...row }))
              };
              this.expectingSecondEndForPrint = true;
              this.invoicePrintDialog.open(invoiceData);
            }

            this.saleForm.reset();
            this.items.clear();
            this.productSearchFilters.clear();
            this.customerPriceMap.clear();
            this.selectedCustomer = null;
            this.saleForm.patchValue({
              customerSearch: '',
              paymentMode: 'CASH',
              discount: 0,
              partialPaymentAmount: 0
            });
            this.selectedCustomerBalance = 0;
            this.loadNextBillNo();
            this.pendingCustomerOrderId = null;
            this.prefillOrderLabel = null;
            this.initializeEmptyRows(8);
            this.loadProducts();
          }
        },
        error: (error) => {
          this.snackBar.open(
            'Error creating sale: ' + (error.error?.message || 'Unknown error'),
            'Close',
            { duration: 5000 }
          );
        }
      });
  }

  /** Re-open the last completed invoice for printing (same dialog as after Complete sale). */
  reprintLastInvoice(): void {
    if (!this.lastInvoiceData) {
      return;
    }
    this.invoicePrintDialog.open({
      ...this.lastInvoiceData,
      autoPrintAfterOpen: true,
      items: this.lastInvoiceData.items.map((row) => ({ ...row }))
    });
  }

  toggleSidebar(): void {
    const btn = document.querySelector('.menu-button') as HTMLButtonElement;
    if (btn) btn.click();
  }

  ngOnDestroy(): void {

  if (this.timeInterval) {

    clearInterval(this.timeInterval);

  }

}
}

