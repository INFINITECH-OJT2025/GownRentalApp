<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'start_date',
        'end_date',
        'added_price',
        'total_price',
        'gcash_receipt',
        'status',
        'reference_number'
    ];

    // Relationship: A booking belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relationship: A booking belongs to a product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
