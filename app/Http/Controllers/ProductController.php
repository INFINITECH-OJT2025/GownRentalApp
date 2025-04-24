<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

use App\Models\Booking;

use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
{
    $products = Product::where('is_hidden', 0)
        ->leftJoin('bookings', function ($join) {
            $join->on('products.id', '=', 'bookings.product_id')
                ->where('bookings.status', 'returned');
        })
        ->select('products.*', DB::raw('COUNT(bookings.id) as returned_count'))
        ->groupBy(
            'products.id',
            'products.name',
            'products.price',
            'products.discounted_price',
            'products.stock',
            'products.category',
            'products.description',
            'products.image',
            'products.start_date',
            'products.end_date',
            'products.created_at',
            'products.updated_at',
            'products.is_hidden',
            'products.sizes'
        )        
        ->orderBy('created_at', 'desc') // default sort
        ->get();

    $products->transform(function ($product) {
        $product->image_url = asset('storage/' . ltrim($product->image, 'storage/'));

        // Blocked Dates
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
        $product->stock_status = $product->stock > 0 ? 'Available' : 'Out of Stock';

        return $product;
    });

    return response()->json([
        'success' => true,
        'data' => $products
    ]);
}


public function getReturnCounts()
{
    $returnedBookings = Booking::where('status', 'returned')
        ->with('product:id,name')
        ->get();

    $counts = [];

    foreach ($returnedBookings as $booking) {
        if ($booking->product) {
            $name = $booking->product->name;
            if (!isset($counts[$name])) {
                $counts[$name] = 0;
            }
            $counts[$name]++;
        }
    }

    return response()->json([
        'success' => true,
        'data' => $counts
    ]);
}

    
    public function adminIndex()
{
    // ✅ Fetch ALL products (including hidden ones)
    $products = Product::all();

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
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }
    
        // Find grouped items (same gown, different sizes/variants)
        $groupedProducts = Product::where('name', $product->name)
            ->where('price', $product->price)
            ->where('category', $product->category)
            ->where('description', $product->description)
            ->where('image', $product->image)
            ->get();
    
        // 🔍 Build detailed stock map with product_id per size
        $sizeStockMap = $groupedProducts->flatMap(function ($variant) {
            $sizes = array_map('trim', explode(',', $variant->sizes));
            return collect($sizes)->map(function ($size) use ($variant) {
                return [
                    'size' => $size,
                    'stock' => $variant->stock,
                    'product_id' => $variant->id,
                ];
            });
        })->values();
    
        $uniqueSizes = $sizeStockMap->pluck('size')->unique()->values();
        $totalStock = $groupedProducts->sum('stock');
        $startDate = $groupedProducts->min('start_date');
        $endDate = $groupedProducts->max('end_date');
    
        return response()->json([
            'success' => true,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'image_url' => asset('storage/' . $product->image),
                'price' => $product->price,
                'discounted_price' => $product->discounted_price,
                'stock' => $product->stock,
                'totalStock' => $totalStock,
                'stock_status' => $totalStock > 0 ? 'Available' : 'Out of Stock',
                'description' => $product->description,
                'category' => $product->category,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'sizes' => $uniqueSizes,
                'size_stock' => $sizeStockMap, // ✅ structured as list of {size, stock, product_id}
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


