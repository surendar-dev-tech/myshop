import { Component, Inject, ElementRef, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Customer, CustomerService } from '../core/services/customer.service';
import { finalize } from 'rxjs';

export interface PaymentCheckoutResult {
  paymentMode: 'CASH' | 'UPI' | 'CREDIT';
  printInvoice: boolean;
  customerId?: number;
  partialPayment?: number;
}

export interface PaymentCheckoutData {
  grandTotal: number;
  customers: Customer[];
  selectedCustomerId?: number | null;
  selectedCustomer?: Customer | null;
}

@Component({
  selector: 'app-payment-checkout-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="checkout-dialog-container" tabindex="0" #dialogContainer (keydown)="handleKeyDown($event)">
      <!-- Step 1: Select Payment Mode -->
      <div *ngIf="currentStep === 1" class="dialog-step">
        <h2 class="dialog-title">
          <mat-icon class="title-icon">account_balance_wallet</mat-icon>
          Choose Payment Mode
        </h2>
        <p class="dialog-subtitle">Select the payment method to complete the bill of ₹{{ data.grandTotal | number:'1.2-2' }}.</p>
        
        <div class="button-group-vertical">
          <button mat-flat-button class="checkout-btn cash-btn" [class.btn-active]="activeOption === 'CASH'" (click)="selectMode('CASH')">
            <mat-icon class="btn-icon">payments</mat-icon>
            <span>CASH SALE</span>
          </button>

          <button mat-flat-button class="checkout-btn upi-btn" [class.btn-active]="activeOption === 'UPI'" (click)="selectMode('UPI')">
            <mat-icon class="btn-icon">qr_code_2</mat-icon>
            <span>UPI SALE</span>
          </button>
          
          <button mat-flat-button class="checkout-btn credit-btn" [class.btn-active]="activeOption === 'CREDIT'" (click)="selectMode('CREDIT')">
            <mat-icon class="btn-icon">assignment_ind</mat-icon>
            <span>CREDIT SALE</span>
          </button>
        </div>
        
        <p class="keyboard-tip">Use <span class="key">↑</span> <span class="key">↓</span> arrows & <span class="key">Enter</span> to select</p>
        
        <div class="dialog-actions">
          <button mat-button class="cancel-btn" (click)="closeDialog()">CANCEL</button>
        </div>
      </div>

      <!-- Step 2: Print Invoice Confirmation -->
      <div *ngIf="currentStep === 2" class="dialog-step animate-step">
        <h2 class="dialog-title">
          <mat-icon class="title-icon text-success">print</mat-icon>
          Print Invoice?
        </h2>
        <p class="dialog-subtitle text-highlight">Would you like to print the receipt for this {{ activeOption }} sale?</p>
        
        <div class="button-group-vertical">
          <button mat-flat-button class="checkout-btn print-yes-btn" [class.btn-active]="activePrintOption === 'PRINT'" (click)="confirmCashSale(true)">
            <mat-icon class="btn-icon">print</mat-icon>
            <span>YES, PRINT INVOICE</span>
          </button>
          
          <button mat-flat-button class="checkout-btn print-no-btn" [class.btn-active]="activePrintOption === 'SAVE'" (click)="confirmCashSale(false)">
            <mat-icon class="btn-icon">save</mat-icon>
            <span>NO, SAVE ONLY</span>
          </button>
        </div>
        
        <p class="keyboard-tip">Use <span class="key">Backspace</span> to go back</p>
        
        <div class="dialog-actions-split">
          <button mat-button class="back-btn" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> BACK
          </button>
          <button mat-button class="cancel-btn" (click)="closeDialog()">CANCEL</button>
        </div>
      </div>

      <!-- Step 3: Select Customer (for CREDIT sales) -->
      <div *ngIf="currentStep === 3" class="dialog-step animate-step">
        <h2 class="dialog-title">
          <mat-icon class="title-icon">person_search</mat-icon>
          Select Credit Customer
        </h2>
        <p class="dialog-subtitle">This is a credit sale. Please select a customer to record the balance.</p>
        
        <div class="search-container">
          <input
            #customerSearchInput
            type="text"
            class="dialog-search-input"
            placeholder="Type customer name / phone..."
            [value]="customerSearchQuery"
            (input)="onCustomerSearchInput($event)">
            
          <div class="customer-results-list" #customerResultsList *ngIf="filteredCustomers.length > 0">
            <div
              *ngFor="let c of filteredCustomers; let idx = index"
              class="customer-result-item"
              [class.item-active]="idx === activeCustomerIndex"
              (click)="selectCustomerItem(c)">
              <div class="customer-details">
                <span class="customer-name">{{ c.name }}</span>
                <span class="customer-phone" *ngIf="c.phone">{{ c.phone }}</span>
              </div>
              <mat-icon *ngIf="idx === activeCustomerIndex" class="select-check-icon">chevron_right</mat-icon>
            </div>
          </div>
          
          <div class="no-results-msg" *ngIf="filteredCustomers.length === 0">
            No active customers found
          </div>
        </div>
        
        <p class="keyboard-tip">Use <span class="key">↑</span> <span class="key">↓</span> arrows & <span class="key">Enter</span> to select. <span class="key">Backspace</span> to go back.</p>

        <div class="dialog-actions-split">
          <button mat-button class="back-btn" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> BACK
          </button>
          <button mat-button class="cancel-btn" (click)="closeDialog()">CANCEL</button>
        </div>
      </div>

      <!-- Step 4: Credit Sale Details & Cash Received -->
      <div *ngIf="currentStep === 4" class="dialog-step animate-step">
        <h2 class="dialog-title">
          <mat-icon class="title-icon">assignment_ind</mat-icon>
          Credit Sale Details
        </h2>
        
        <div class="credit-details-card">
          <div class="details-row header-row">
            <span class="label">Customer</span>
            <span class="val highlighted-text">{{ selectedCustomer?.name }}</span>
          </div>
          <div class="details-row">
            <span class="label">Previous Balance</span>
            <span class="val font-bold">₹{{ previousBalance | number:'1.2-2' }}</span>
          </div>
          <div class="details-row">
            <span class="label">This Bill Total</span>
            <span class="val font-bold text-primary">₹{{ data.grandTotal | number:'1.2-2' }}</span>
          </div>
          <div class="details-row divider"></div>
          <div class="details-row">
            <span class="label">New Total Balance</span>
            <span class="val font-extra-bold">₹{{ (previousBalance + data.grandTotal) | number:'1.2-2' }}</span>
          </div>
        </div>

        <div class="received-input-container">
          <label class="input-label">Cash Received / Paid Now (if any):</label>
          <input
            #cashReceivedInput
            type="text"
            inputmode="decimal"
            class="cash-received-field"
            [value]="cashReceivedValue"
            (input)="onCashReceivedChange($event)"
            (keydown.enter)="submitCreditSale()">
            
          <div class="calculations-box" *ngIf="cashReceivedAmount > 0">
            <div class="calc-row">
              <span>Total Balance:</span>
              <strong>₹{{ (previousBalance + data.grandTotal) | number:'1.2-2' }}</strong>
            </div>
            <div class="calc-row">
              <span>Remaining Balance:</span>
              <strong>₹{{ (previousBalance + data.grandTotal - cashReceivedAmount) | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>

        <div class="button-group-vertical pt-10">
          <button mat-flat-button class="checkout-btn print-yes-btn" [class.btn-active]="activeCreditPrintOption === 'PRINT'" (click)="submitCreditSaleWithPrint(true)">
            <mat-icon class="btn-icon">print</mat-icon>
            <span>YES, PRINT & COMPLETE</span>
          </button>
          
          <button mat-flat-button class="checkout-btn print-no-btn" [class.btn-active]="activeCreditPrintOption === 'SAVE'" (click)="submitCreditSaleWithPrint(false)">
            <mat-icon class="btn-icon">save</mat-icon>
            <span>NO, SAVE ONLY</span>
          </button>
        </div>
        
        <p class="keyboard-tip">Press <span class="key">Enter</span> inside Cash Received to complete instantly!</p>

        <div class="dialog-actions-split">
          <button mat-button class="back-btn" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> BACK
          </button>
          <button mat-button class="cancel-btn" (click)="closeDialog()">CANCEL</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-dialog-container {
      padding: 24px;
      font-family: 'Outfit', 'Inter', sans-serif;
      background: #ffffff;
      border-radius: 16px;
      min-width: 480px;
    }
    .dialog-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .dialog-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: #0f766e;
    }
    .text-success {
      color: #10b981 !important;
    }
    .dialog-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 20px 0;
      max-width: 440px;
      line-height: 1.5;
    }
    .text-highlight {
      font-weight: 600;
      color: #334155;
    }
    .button-group-vertical {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      max-width: 460px;
      margin-bottom: 12px;
    }
    .checkout-btn {
      height: 50px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: all 0.15s ease-in-out;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 2px solid transparent !important;
    }
    .checkout-btn.btn-active {
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35) !important;
      border: 2px solid #2563eb !important;
      transform: scale(1.02);
    }
    .checkout-btn .btn-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .cash-btn {
      background: #0f766e !important;
      color: #ffffff !important;
    }
    .upi-btn {
      background: #2563eb !important;
      color: #ffffff !important;
    }
    .credit-btn {
      background: #ea580c !important;
      color: #ffffff !important;
    }
    .print-yes-btn {
      background: #10b981 !important;
      color: #ffffff !important;
    }
    .print-no-btn {
      background: #64748b !important;
      color: #ffffff !important;
    }
    .dialog-actions {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }
    .dialog-actions-split {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 10px;
      margin-top: 14px;
    }
    .cancel-btn {
      color: #64748b !important;
      font-weight: 700 !important;
    }
    .back-btn {
      color: #0f766e !important;
      font-weight: 700 !important;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .keyboard-tip {
      font-size: 11px;
      color: #94a3b8;
      margin: 8px 0;
    }
    .keyboard-tip .key {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 700;
      color: #475569;
    }
    .search-container {
      width: 100%;
      max-width: 460px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dialog-search-input {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      outline: none;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }
    .dialog-search-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .customer-results-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      width: 100%;
      box-sizing: border-box;
    }
    .customer-result-item {
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.1s ease;
    }
    .customer-result-item:last-child {
      border-bottom: none;
    }
    .customer-result-item.item-active {
      background: #eff6ff;
    }
    .customer-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .customer-name {
      font-weight: 700;
      font-size: 14px;
      color: #0f172a;
    }
    .customer-result-item.item-active .customer-name {
      color: #1d4ed8;
    }
    .customer-phone {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .select-check-icon {
      color: #2563eb;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .no-results-msg {
      padding: 12px;
      font-size: 13px;
      color: #94a3b8;
      font-style: italic;
    }
    .credit-details-card {
      width: 100%;
      max-width: 460px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-sizing: border-box;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .details-row.header-row {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .details-row.divider {
      height: 1px;
      background: #e2e8f0;
      margin: 4px 0;
    }
    .details-row .label {
      color: #64748b;
      font-weight: 600;
    }
    .details-row .val {
      color: #334155;
      font-weight: 700;
    }
    .details-row .highlighted-text {
      color: #0f172a;
      font-weight: 800;
      font-size: 15px;
    }
    .text-primary {
      color: #2563eb !important;
    }
    .font-bold {
      font-weight: 700 !important;
    }
    .font-extra-bold {
      font-weight: 800 !important;
      font-size: 16px;
      color: #0f172a !important;
    }
    .received-input-container {
      width: 100%;
      max-width: 460px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 14px;
      box-sizing: border-box;
    }
    .input-label {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    .cash-received-field {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      outline: none;
      transition: all 0.15s ease;
      background: #eff6ff;
      box-sizing: border-box;
    }
    .cash-received-field:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
    }
    .calculations-box {
      width: 100%;
      margin-top: 8px;
      background: #eff6ff;
      border: 1px dashed #bfdbfe;
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-sizing: border-box;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #1e40af;
    }
    .calc-row strong {
      color: #1e3a8a;
    }
    .pt-10 {
      padding-top: 10px;
    }
    .animate-step {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PaymentCheckoutDialogComponent implements AfterViewInit {
  currentStep = 1;
  activeOption: 'CASH' | 'UPI' | 'CREDIT' = 'CASH';
  activePrintOption: 'PRINT' | 'SAVE' = 'PRINT';
  activeCreditPrintOption: 'PRINT' | 'SAVE' = 'PRINT';
  private ignoreNextEnter = false;

  // Customer selection variables (Step 3)
  customerSearchQuery = '';
  filteredCustomers: Customer[] = [];
  activeCustomerIndex = 0;

  // Credit details variables (Step 4)
  selectedCustomer: Customer | null = null;
  previousBalance = 0;
  cashReceivedValue = '0';
  cashReceivedAmount = 0;
  balanceLoading = false;

  get remainingCredit(): number {
    return Math.max(0, this.data.grandTotal - this.cashReceivedAmount);
  }

  get appliedToOldBalance(): number {
    return Math.max(0, this.cashReceivedAmount - this.data.grandTotal);
  }

  get updatedTotalBalance(): number {
    return Math.max(0, this.previousBalance + this.data.grandTotal - this.cashReceivedAmount);
  }

  @ViewChild('customerSearchInput') customerSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cashReceivedInput') cashReceivedInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dialogContainer') dialogContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('customerResultsList') customerResultsList?: ElementRef<HTMLDivElement>;

  constructor(
    public dialogRef: MatDialogRef<PaymentCheckoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentCheckoutData,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef
  ) {
    this.filteredCustomers = data.customers || [];
    if (data.selectedCustomer) {
      this.selectedCustomer = data.selectedCustomer;
    }
  }

  ngAfterViewInit(): void {
    // Auto-focus the container when dialog opens so Step 1 arrow keys work immediately
    this.focusElement('dialogContainer');
  }

  selectMode(mode: 'CASH' | 'UPI' | 'CREDIT'): void {
    this.activeOption = mode;
    if (mode === 'CREDIT') {
      // Always show Step 3 customer search so cashier can confirm / change customer
      this.currentStep = 3;
      this.filteredCustomers = this.data.customers || [];
      
      if (this.selectedCustomer) {
        this.customerSearchQuery = this.selectedCustomer.name;
        const term = this.customerSearchQuery.toLowerCase().trim();
        this.filteredCustomers = (this.data.customers || []).filter(c => 
          c.name.toLowerCase().includes(term) ||
          (c.phone && c.phone.includes(term))
        );
        this.activeCustomerIndex = 0;
      } else {
        this.activeCustomerIndex = 0;
        this.customerSearchQuery = '';
      }
      // Block Enter for the very next keydown so the same Enter that
      // triggered CREDIT SALE does not immediately auto-select the customer
      this.ignoreNextEnter = true;
      setTimeout(() => { this.ignoreNextEnter = false; }, 300);
      this.focusElement('customerSearchInput');
      this.cdr.detectChanges();
    } else {
      // Cash/UPI - go to print confirmation (Step 2)
      this.currentStep = 2;
      this.focusElement('dialogContainer');
      this.cdr.detectChanges();
    }
  }

  confirmCashSale(printInvoice: boolean): void {
    this.dialogRef.close({
      paymentMode: this.activeOption,
      printInvoice
    } as PaymentCheckoutResult);
  }

  // Step 3 actions
  onCustomerSearchInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value || '';
    this.customerSearchQuery = q;
    const term = q.toLowerCase().trim();
    if (!term) {
      this.filteredCustomers = this.data.customers || [];
    } else {
      this.filteredCustomers = (this.data.customers || []).filter(c => 
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
      );
    }
    this.activeCustomerIndex = 0;
    this.cdr.detectChanges();
  }

  selectCustomerItem(customer: Customer): void {
    this.selectedCustomer = customer;
    this.fetchCustomerBalanceAndGoToStep4(customer);
  }

  private fetchCustomerBalanceAndGoToStep4(customer: Customer): void {
    this.balanceLoading = true;
    this.previousBalance = customer.outstandingBalance ?? 0;
    this.cdr.detectChanges();
    
    if (customer.id) {
      this.customerService.getCustomerBalance(customer.id)
        .pipe(finalize(() => {
          this.balanceLoading = false;
          this.currentStep = 4;
          this.cashReceivedValue = '0';
          this.cashReceivedAmount = 0;
          this.activeCreditPrintOption = 'PRINT';
          this.cdr.detectChanges();
          this.focusElement('cashReceivedInput');
        }))
        .subscribe({
          next: (res) => {
            if (res.success && res.data !== undefined) {
              this.previousBalance = res.data;
              this.cdr.detectChanges();
            }
          },
          error: () => {
            this.previousBalance = 0;
            this.cdr.detectChanges();
          }
        });
    } else {
      this.balanceLoading = false;
      this.currentStep = 4;
      this.cashReceivedValue = '0';
      this.cashReceivedAmount = 0;
      this.activeCreditPrintOption = 'PRINT';
      this.cdr.detectChanges();
      this.focusElement('cashReceivedInput');
    }
  }

  // Step 4 actions
  onCashReceivedChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    
    // Remove any character that is not a digit or dot
    val = val.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (input.value !== val) {
      input.value = val;
    }
    this.cashReceivedValue = val;
    this.cashReceivedAmount = Number(val) || 0;
    this.cdr.detectChanges();
  }

  submitCreditSale(): void {
    this.submitCreditSaleWithPrint(this.activeCreditPrintOption === 'PRINT');
  }

  submitCreditSaleWithPrint(printInvoice: boolean): void {
    if (!this.selectedCustomer || !this.selectedCustomer.id) return;
    this.dialogRef.close({
      paymentMode: 'CREDIT',
      printInvoice,
      customerId: this.selectedCustomer.id,
      partialPayment: this.cashReceivedAmount
    } as PaymentCheckoutResult);
  }

  goBack(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      this.focusElement('dialogContainer');
    } else if (this.currentStep === 3) {
      this.currentStep = 1;
      this.focusElement('dialogContainer');
    } else if (this.currentStep === 4) {
      if (this.data.selectedCustomerId) {
        this.currentStep = 1;
        this.focusElement('dialogContainer');
      } else {
        this.currentStep = 3;
        this.focusElement('customerSearchInput');
      }
    }
    this.cdr.detectChanges();
  }

  closeDialog(): void {
    this.dialogRef.close(null);
  }

  private focusElement(elementId: 'customerSearchInput' | 'cashReceivedInput' | 'dialogContainer'): void {
    setTimeout(() => {
      if (elementId === 'customerSearchInput' && this.customerSearchInput) {
        this.customerSearchInput.nativeElement.focus();
      } else if (elementId === 'cashReceivedInput' && this.cashReceivedInput) {
        this.cashReceivedInput.nativeElement.focus();
        this.cashReceivedInput.nativeElement.select();
      } else if (elementId === 'dialogContainer' && this.dialogContainer) {
        this.dialogContainer.nativeElement.focus();
      }
    }, 50);
  }

  private scrollActiveCustomerIntoView(): void {
    // Use setTimeout to let Angular render the updated [class.item-active] first
    setTimeout(() => {
      if (!this.customerResultsList) return;
      const list = this.customerResultsList.nativeElement;
      const activeItem = list.querySelector<HTMLElement>('.customer-result-item.item-active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (this.currentStep === 1) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (this.activeOption === 'CREDIT') this.activeOption = 'UPI';
        else if (this.activeOption === 'UPI') this.activeOption = 'CASH';
        else this.activeOption = 'CREDIT';
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (this.activeOption === 'CASH') this.activeOption = 'UPI';
        else if (this.activeOption === 'UPI') this.activeOption = 'CREDIT';
        else this.activeOption = 'CASH';
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.selectMode(this.activeOption);
      } else if (event.key === 'Escape') {
        this.closeDialog();
      }
    } else if (this.currentStep === 2) {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.activePrintOption = this.activePrintOption === 'PRINT' ? 'SAVE' : 'PRINT';
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.confirmCashSale(this.activePrintOption === 'PRINT');
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        this.goBack();
      } else if (event.key === 'Escape') {
        this.closeDialog();
      }
    } else if (this.currentStep === 3) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (this.activeCustomerIndex > 0) {
          this.activeCustomerIndex--;
        } else {
          this.activeCustomerIndex = this.filteredCustomers.length - 1;
        }
        this.scrollActiveCustomerIntoView();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (this.activeCustomerIndex < this.filteredCustomers.length - 1) {
          this.activeCustomerIndex++;
        } else {
          this.activeCustomerIndex = 0;
        }
        this.scrollActiveCustomerIntoView();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.ignoreNextEnter) {
          // The Enter that triggered CREDIT SALE — skip it so the cashier sees Step 3 first
          this.ignoreNextEnter = false;
          return;
        }
        if (this.filteredCustomers.length > 0) {
          this.selectCustomerItem(this.filteredCustomers[this.activeCustomerIndex]);
        }
      } else if (event.key === 'Backspace' && this.customerSearchQuery === '') {
        event.preventDefault();
        this.goBack();
      } else if (event.key === 'Escape') {
        this.closeDialog();
      }
    } else if (this.currentStep === 4) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeCreditPrintOption = 'SAVE';
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeCreditPrintOption = 'PRINT';
      } else if (event.key === 'Backspace' && this.cashReceivedValue === '') {
        event.preventDefault();
        this.goBack();
      } else if (event.key === 'Escape') {
        this.closeDialog();
      }
    }
    this.cdr.detectChanges();
  }
}
