import { Component, Inject, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService, Product } from '../../core/services/product.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface ProductSearchData {
  initialSearchTerm: string;
}

@Component({
  selector: 'app-product-search-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './product-search-dialog.component.html',
  styleUrls: ['./product-search-dialog.component.scss']
})
export class ProductSearchDialogComponent implements OnInit, AfterViewInit {
  searchTerm: string = '';
  products: Product[] = [];
  isLoading = false;
  selectedIndex = 0;
  
  private searchSubject = new Subject<string>();
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<ProductSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductSearchData,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchTerm = data?.initialSearchTerm || '';
  }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(50),
      distinctUntilChanged()
    ).subscribe(term => {
      this.executeSearch(term);
    });
    
    if (this.searchTerm) {
      this.executeSearch(this.searchTerm);
    } else {
      this.executeSearch('');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.searchInput) {
        const el = this.searchInput.nativeElement;
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }, 100);
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  executeSearch(term: string): void {
    this.isLoading = true;
    this.selectedIndex = 0;
    this.cdr.detectChanges();
    
    if (!term || term.trim() === '') {
      // Just load active products if empty
      this.productService.getActiveProducts().subscribe({
        next: (res) => {
          this.products = res.data || [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.products = [];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
      return;
    }
    
    this.productService.searchProducts(term).subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.products = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectProduct(product: Product): void {
    this.dialogRef.close(product);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isLoading || this.products.length === 0) {
      if (event.key === 'Escape') {
        this.dialogRef.close();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.selectedIndex < this.products.length - 1) {
        this.selectedIndex++;
        this.scrollToSelected();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
        this.scrollToSelected();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.selectProduct(this.products[this.selectedIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.dialogRef.close();
    }
  }
  
  private scrollToSelected(): void {
    setTimeout(() => {
      const selectedEl = document.querySelector('.product-row.selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }
}
