<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        // ✅ Fetch only visible products (`is_hidden = 0`)
        $products = Product::where('is_hidden', 0)->get();  
    
        $products->transform(function ($product) {
            $product->image_url = asset('storage/' . ltrim($product->image, 'storage/'));
    
            // ✅ Calculate blocked dates
            $blockedDates = [];
            if ($product->start_date && $product->end_date) {
                $start = new \DateTime($product->start_date);
                $end = new \DateTime($product->end_date);
                while ($start <= $end) {
                    $blockedDates[] = $start->format('Y-m-d');
                    $start->modify('+1 day');
                }
            }
            $product->blocked_dates = $blockedDates;
    
            // ✅ Include stock and stock status
            $product->stock_status = $product->stock > 0 ? 'Available' : 'Out of Stock';
    
            return $product;
        });
    
        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
    

public function updateDiscount(Request $request, $id)
{
    $validated = $request->validate([
        'discount_percentage' => 'nullable|numeric|min:0|max:100',
    ]);

    $product = Product::find($id);

    if (!$product) {
        return response()->json(['success' => false, 'message' => 'Product Loading'], 404);
    }

    if ($request->has('discount_percentage')) {
        $product->applyDiscount($request->discount_percentage);
    }

    return response()->json([
        'success' => true,
        'message' => 'Discount updated successfully',
        'product' => $product
    ]);
}


    public function getCategories()
    {
        $categories = Product::select('category')->distinct()->pluck('category');

        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    public function show($id)
{
    $product = Product::find($id);

    if (!$product) {
        return response()->json(['success' => false, 'message' => 'Product Loading'], 404);
    }

    return response()->json([
        'success' => true,
        'product' => [
            'id' => $product->id,
            'name' => $product->name,
            'image_url' => asset('storage/' . $product->image),
            'price' => $product->price,
            'discounted_price' => $product->discounted_price,
            'stock' => $product->stock,
            'stock_status' => $product->stock > 0 ? 'Available' : 'Out of Stock', // ✅ Add stock status
            'description' => $product->description,
            'category' => $product->category,
            'start_date' => $product->start_date,
            'end_date' => $product->end_date
        ]
    ]);
}


public function update(Request $request, $id)
{
    $product = Product::findOrFail($id);

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'price' => 'required|numeric',
        'category' => 'required|string|max:255',
        'stock' => 'required|integer|min:0',
        'description' => 'nullable|string',
        'start_date' => 'nullable|date',
        'end_date' => 'nullable|date',
        'image' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
    ]);

    if ($request->hasFile('image')) {
        $imagePath = $request->file('image')->store('products', 'public');
        $validated['image'] = str_replace('public/', '', $imagePath); // Remove 'public/' prefix
    }
    
    $product->update($validated);
    return response()->json(['success' => true, 'message' => 'Product updated successfully!']);
}




}


