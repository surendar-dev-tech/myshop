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
import { ShopUser, UserService } from '../core/services/user.service';
import { EmployeeDialogComponent } from './employee-dialog.component';

@Component({
  selector: 'app-employees',
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
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {
  dataSource = new MatTableDataSource<ShopUser>([]);
  displayedColumns: string[] = ['username', 'fullName', 'phone', 'role', 'active', 'actions'];
  isLoading = false;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dataSource.data = response.data;
        } else {
          this.dataSource.data = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.showErrorMessage('Could not load employees. Are you logged in as admin?');
        this.dataSource.data = [];
        this.isLoading = false;
      }
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(EmployeeDialogComponent, {
      width: '520px',
      maxWidth: '90vw',
      data: null,
      disableClose: true
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: ShopUser): void {
    const ref = this.dialog.open(EmployeeDialogComponent, {
      width: '520px',
      maxWidth: '90vw',
      data: user,
      disableClose: true
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
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
