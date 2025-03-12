<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'price', 'category', 'stock', 'description',
        'start_date', 'end_date', 'image', 'is_hidden', 'discounted_price'
    ];

    public function applyDiscount($percentage)
    {
        if ($percentage > 0) {
            $discountAmount = ($this->price * $percentage) / 100;
            $this->discounted_price = $this->price - $discountAmount;
        } else {
            $this->discounted_price = null; // No discount
        }
        $this->save();
    }

    public function getStockStatusAttribute()
{
    return $this->stock > 0 ? 'Available' : 'Out of Stock';
}
    
}
    
