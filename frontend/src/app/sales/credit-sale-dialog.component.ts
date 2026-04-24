import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface CreditSaleDialogData {
  grandTotal: number;
  partialPayment: number;
  previousBalance: number;
  customerName?: string;
}

export interface CreditSaleDialogResult {
  partialPayment: number;
}

@Component({
  selector: 'app-credit-sale-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './credit-sale-dialog.component.html',
  styleUrls: ['./credit-sale-dialog.component.scss']
})
export class CreditSaleDialogComponent {
  partialCtrl = new FormControl<number>(0, [Validators.min(0)]);

  constructor(
    public dialogRef: MatDialogRef<CreditSaleDialogComponent, CreditSaleDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: CreditSaleDialogData
  ) {
    this.partialCtrl.setValue(
      data.partialPayment != null && data.partialPayment > 0 ? data.partialPayment : 0
    );
  }

  get maxPartial(): number {
    return Math.max(0, this.data.grandTotal);
  }

  get onAccount(): number {
    const p = Number(this.partialCtrl.value) || 0;
    return Math.max(0, this.data.grandTotal - p);
  }

  exceedsMaxPartial(): boolean {
    const p = Number(this.partialCtrl.value);
    if (Number.isNaN(p)) {
      return false;
    }
    return p > this.maxPartial;
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    const p = Number(this.partialCtrl.value) || 0;
    if (p > this.data.grandTotal) {
      return;
    }
    this.dialogRef.close({ partialPayment: p });
  }
}
