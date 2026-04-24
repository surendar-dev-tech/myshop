import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { SupplierService, Supplier } from '../core/services/supplier.service';

@Component({
  selector: 'app-supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './supplier-dialog.component.html',
  styleUrls: ['./supplier-dialog.component.scss']
})
export class SupplierDialogComponent implements OnInit {
  supplierForm!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Supplier | null,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar
  ) {
    this.isEditMode = !!data;
  }

  ngOnInit(): void {
    this.supplierForm = this.fb.group({
      name: [this.data?.name || '', [Validators.required]],
      contactPerson: [this.data?.contactPerson || ''],
      phone: [this.data?.phone || ''],
      email: [this.data?.email || '', [Validators.email]],
      address: [this.data?.address || ''],
      gstNumber: [this.data?.gstNumber || ''],
      panNumber: [this.data?.panNumber || ''],
      active: [this.data?.active !== undefined ? this.data.active : true]
    });
  }

  onSave(): void {
    if (this.supplierForm.valid) {
      const supplierData: Supplier = this.supplierForm.value;
      
      if (this.isEditMode && this.data?.id) {
        this.supplierService.updateSupplier(this.data.id, supplierData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Supplier updated successfully', 'Close', { duration: 3000 });
              this.dialogRef.close(true);
            } else {
              this.snackBar.open('Failed to update supplier', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error updating supplier:', error);
            this.snackBar.open('Error updating supplier: ' + (error.error?.message || 'Unknown error'), 'Close', { duration: 5000 });
          }
        });
      } else {
        this.supplierService.createSupplier(supplierData).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Supplier created successfully', 'Close', { duration: 3000 });
              this.dialogRef.close(true);
            } else {
              this.snackBar.open('Failed to create supplier', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error creating supplier:', error);
            this.snackBar.open('Error creating supplier: ' + (error.error?.message || 'Unknown error'), 'Close', { duration: 5000 });
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

