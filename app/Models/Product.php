<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    protected $fillable = [
        'name',
        'image',
        'price',
        'description',
        'availability',
        'category',
        'start_date',  
        'end_date'   
    ];

    // Ensure the image URL is correct
    public function getImageUrlAttribute()
    {
        return asset('storage/' . $this->image);
    }

    protected $appends = ['image_url']; // Append the computed image_url attribute
}

