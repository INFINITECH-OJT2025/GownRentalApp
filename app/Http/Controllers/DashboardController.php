<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Product;
use App\Models\Booking;
use App\Models\StockAdjustments;

class DashboardController extends Controller
{
    /**
     * Fetch dashboard statistics.
     */
    public function getStats(Request $request)
    {
        // Ensure the user is authenticated
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        try {
            Log::info('Fetching dashboard statistics.');

            $usersCount = User::count();
            $productsCount = Product::count();
            $bookingsCount = Booking::count();
            $totalRevenue = Booking::where('status', 'approved')->sum('total_price');
            $pendingBookings = Booking::where('status', 'pending')->count();
            $completedBookings = Booking::where('status', 'approved')->count();

            // Group bookings per month for a bar chart
            $monthlyBookings = Booking::selectRaw('MONTH(created_at) as month, COUNT(id) as count')
                ->groupBy('month')
                ->orderBy('month', 'asc')
                ->get();

            Log::info('Dashboard statistics fetched successfully.');

            return response()->json([
                'success' => true,
                'stats' => [
                    'users' => $usersCount,
                    'products' => $productsCount,
                    'bookings' => $bookingsCount,
                    'totalRevenue' => $totalRevenue,
                    'pendingBookings' => $pendingBookings,
                    'completedBookings' => $completedBookings,
                    'monthlyBookings' => $monthlyBookings
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching analytics: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch all products.
     */
    public function getProducts()
    {
        try {
            Log::info('Fetching visible products.');
            $products = Product::where('is_hidden', false)->get();
    
            return response()->json([
                'success' => true,
                'products' => $products
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching products: ' . $e->getMessage());
    
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addStock(Request $request, $id) {
        $validated = $request->validate(['stock' => 'required|integer|min:1']);
    
        try {
            $product = Product::findOrFail($id);
            $product->increment('stock', $validated['stock']);
    
            // ✅ Log stock adjustment using StockAdjustment
            StockAdjustment::create([
                'product_id' => $product->id,
                'stock_added' => $validated['stock'],
                'remarks' => 'Stock manually adjusted' // Optional remarks
            ]);
    
            return response()->json(['success' => true, 'message' => 'Stock updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    
    public function getStockLogs()
{
    try {
        $logs = StockAdjustment::with('product:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'product_name' => $log->product->name ?? 'Unknown Product',
                    'stock_added' => $log->stock_added,
                    'remarks' => $log->remarks ?? 'No remarks',
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json(['success' => true, 'data' => $logs]);
    } catch (\Exception $e) {
        \Log::error('Error fetching stock logs: ' . $e->getMessage());
        return response()->json(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
    }
}

    public function getInventory()
    {
        try {
            Log::info('Fetching inventory list.');

            $inventory = Product::select('id', 'name', 'image', 'price', 'stock', 'description', 'category', 'start_date', 'end_date')->get();

            return response()->json([
                'success' => true,
                'data' => $inventory
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching inventory: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch a single inventory item.
     */
    public function getInventoryItem($id)
    {
        try {
            $item = Product::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $item
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching inventory item: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function toggleProductVisibility($id)
    {
        try {
            $product = Product::find($id);
    
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }
    
            // ✅ Explicitly unhide if hidden (is_hidden = 1 -> 0)
            if ($product->is_hidden) {
                $product->is_hidden = 0; // 🔹 Unhide the product
                $message = "Product is now visible!";
            } else {
                $product->is_hidden = 1; // 🔹 Hide the product
                $message = "Product is now hidden!";
            }
    
            $product->save();
    
            return response()->json([
                'success' => true,
                'message' => $message,
                'product' => $product
            ]);
        } catch (\Exception $e) {
            \Log::error('Error toggling product visibility: ' . $e->getMessage());
    
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }    

    public function storeProduct(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'price' => 'required|numeric',
        'category' => 'required|string',
        'stock' => 'required|integer|min:0',
        'description' => 'nullable|string',
        'start_date' => 'nullable|date_format:Y-m-d', // ✅ Ensure correct date format
        'end_date' => 'nullable|date_format:Y-m-d',
        'image_url' => 'nullable|string', // ✅ Accept image URL instead of file
    ]);

    try {
        $product = Product::create([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'category' => $validated['category'],
            'stock' => $validated['stock'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'image' => $validated['image_url'] ?? null, // ✅ Save processed image URL
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product added successfully!',
            'product' => $product
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error adding product: ' . $e->getMessage()
        ], 500);
    }
}

public function updateProduct(Request $request, $id)
{
    $validated = $request->validate([
        'name' => 'nullable|string|max:255',
        'price' => 'nullable|numeric',
        'description' => 'nullable|string',
        'category' => 'nullable|string',
        'start_date' => 'nullable|date_format:Y-m-d',
        'end_date' => 'nullable|date_format:Y-m-d',
        'stock' => 'nullable|integer|min:0',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        'image_url' => 'nullable|string', // ✅ Allow updating with URL instead of file
    ]);

    try {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        // ✅ Handle Image Upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = str_replace("public/", "", $imagePath); // ✅ Ensure it saves as `products/filename.png`
        } elseif ($request->filled('image_url')) {
            $validated['image'] = str_replace("http://127.0.0.1:8000/storage/", "", $request->image_url); // ✅ Ensure correct format
        }

        // ✅ Update only provided fields
        $product->update(array_filter($validated));

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'product' => $product
        ]);
    } catch (\Exception $e) {
        \Log::error('Error updating product: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ], 500);
    }
}

    public function addInventory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric',
            'description' => 'nullable|string',
            'category' => 'required|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'image' => 'nullable|string',
        ]);

        try {
            $item = Product::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item added successfully',
                'data' => $item
            ]);
        } catch (\Exception $e) {
            Log::error('Error adding inventory item: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateInventory(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'image' => 'nullable|string',
        ]);

        try {
            $item = Product::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not found'
                ], 404);
            }

            $item->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item updated successfully',
                'data' => $item
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating inventory item: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an inventory item.
     */
    public function deleteInventory($id)
    {
        try {
            $item = Product::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not found'
                ], 404);
            }

            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inventory item deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting inventory item: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
            
    public function index()
    {
        $orders = Booking::all(); // Fetch all orders from the `bookings` table
        return response()->json(['success' => true, 'data' => $orders]);
    }

    public function updateStatus(Request $request, $id)
    {
        $booking = Booking::find($id);
    
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Booking not found'], 404);
        }
    
        $validated = $request->validate([
            'status' => 'required|in:pending,approved,canceled'
        ]);
    
        $product = Product::find($booking->product_id);
    
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }
    
        // ✅ Deduct stock only when changing status to "approved"
        if ($validated['status'] === 'approved' && $booking->status !== 'approved') {
            if ($product->stock <= 0) {
                return response()->json(['success' => false, 'message' => 'Not enough stock to approve this booking'], 400);
            }
    
            $product->decrement('stock', 1); // ✅ Reduce stock count
    
            $startDate = new \DateTime($booking->start_date);
            $endDate = new \DateTime($booking->end_date);
    
            while ($startDate <= $endDate) {
                $startDate->modify('+1 day');
            }

            $product->save();
        }
    
        if ($validated['status'] === 'canceled' && $booking->status === 'approved') {
            $product->increment('stock', 1); // ✅ Restore stock

            $startDate = new \DateTime($booking->start_date);
            $endDate = new \DateTime($booking->end_date);
    
            while ($startDate <= $endDate) {
                $dateStr = $startDate->format('Y-m-d');
                $startDate->modify('+1 day');
            }
            $product->save();
        }
    
        // ✅ Update status in database
        $booking->status = $validated['status'];
        $booking->save();
    
        return response()->json([
            'success' => true,
            'message' => "Booking status updated to {$validated['status']}",
            'booking' => $booking
        ]);
    }
    
    
}
