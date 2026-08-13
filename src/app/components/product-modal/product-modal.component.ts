import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { MaterialModule } from '../../shared/AngularMaterial';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, FormsModule,
    MaterialModule
  ],
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.css'
})
export class ProductModalComponent {
  quantity: number = 1;

  constructor(
    public dialogRef: MatDialogRef<ProductModalComponent>,
    @Inject(MAT_DIALOG_DATA) public product: Product,
    private cartService: CartService
  ) {}

  addToCart(): void {
    this.cartService.addToCart(this.product, this.quantity);
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
