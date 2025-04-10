<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'user_id', 'booking_id', 'rating', 'comment', 'admin_reply', 'created_at', 'edit_count'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->select('id', 'name');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function booking() // default and primary relation
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'id');
    }
    
    
}
