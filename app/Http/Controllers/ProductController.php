<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::all();

        // Ensure images return full URLs and decode availability properly
        $products->transform(function ($product) {
            $product->image_url = asset('storage/' . $product->image);
            $product->availability = json_decode($product->availability); // Convert JSON string to array
            return $product;
        });

        return response()->json([
            'success' => true,
            'data' => $products, // ✅ Wrap products inside "data"
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
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        return response()->json([
            'success' => true,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'image_url' => asset('storage/' . $product->image), // ✅ Ensure full URL
                'price' => $product->price,
                'description' => $product->description,
                'category' => $product->category,
                'start_date' => $product->start_date,
                'end_date' => $product->end_date,
            ]
        ]);
    }

}


