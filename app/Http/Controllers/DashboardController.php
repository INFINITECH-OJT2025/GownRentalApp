<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Product;
use App\Models\Booking;
use App\Models\StockAdjustment;
use App\Mail\BookingStatusUpdateMail;
use Illuminate\Support\Facades\Mail;
use App\Models\Wishlist;
use App\Models\Favorite;

class DashboardController extends Controller
{
    /**
     * Fetch dashboard statistics.
     * 
     * 
     */

//      public function getBookingDates(Request $request)
// {
//     try {
//         // Fetch bookings with start date and status
//         $bookings = Booking::select('start_date', 'status')
//             ->whereIn('status', ['pending', 'approved', 'picked up', 'returned']) // Filter valid statuses
//             ->get();

//         // Return the start dates of bookings
//         $bookingDates = $bookings->map(function ($booking) {
//             return [
//                 'start_date' => $booking->start_date->format('Y-m-d'), // Format date for consistency
//                 'status' => $booking->status
//             ];
//         });

//         return response()->json([
//             'success' => true,
//             'bookingDates' => $bookingDates,
//         ]);
//     } catch (\Exception $e) {
//         // Log any errors
//         Log::error('Error fetching booking dates: ' . $e->getMessage());

//         return response()->json([
//             'success' => false,
//             'message' => 'Server error: ' . $e->getMessage()
//         ], 500);
//     }
// }

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
            // ✅ Total revenue from "approved", "picked up", and "returned" bookings
            $totalRevenue = Booking::whereIn('status', ['approved', 'picked up', 'returned'])->sum('total_price');
            $pendingBookings = Booking::where('status', 'pending')->count();
            $completedBookings = Booking::whereIn('status', ['returned'])->count(); // ✅ Adjusted to include all successful bookings
            // Group bookings per month for a bar chart
            $monthlyBookings = Booking::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(id) as count')
            ->whereIn('status', ['approved', 'picked up', 'returned']) // ✅ Filter relevant statuses
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
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

    public function getProducts()
{
    try {
        Log::info('Fetching visible products.');
        
        $products = Product::where('is_hidden', false)->get();

        // ✅ Ensure each product includes wishlist, favorite & approved bookings count
        $products->transform(function ($product) {
            $product->image_url = asset("storage/{$product->image}");

            // ✅ Count all users who added this product to wishlist & favorites
            $product->wishlist_count = Wishlist::where('product_id', $product->id)->count() ?? 0;
            $product->favorite_count = Favorite::where('product_id', $product->id)->count() ?? 0;

            // ✅ Count approved bookings for this product
            $product->approved_bookings = Booking::where('product_id', $product->id)
                ->whereIn('status', ['approved', 'picked up', 'returned'])
                ->count() ?? 0;

            return $product;
        });

        return response()->json([
            'success' => true,
            'data' => $products
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
        // ✅ Log the incoming request
        \Log::info('addStock Request:', $request->all());
    
        // ✅ Validate the stock field
        $validated = $request->validate(['stock' => 'required|integer|min:1']);
    
        try {
            $product = Product::findOrFail($id);
            
            // ✅ Ensure stock is a valid number
            if (!is_numeric($validated['stock']) || $validated['stock'] < 1) {
                return response()->json(['success' => false, 'message' => 'Invalid stock quantity'], 400);
            }
    
            $product->increment('stock', $validated['stock']);
    
            // ✅ Log stock adjustment
            StockAdjustment::create([
                'product_id' => $product->id,
                'stock_added' => $validated['stock'],
                'remarks' => 'Stock manually adjusted'
            ]);
    
            return response()->json(['success' => true, 'message' => 'Stock updated successfully']);
        } catch (\Exception $e) {
            \Log::error('Error updating stock: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
    
    
    public function getStockLogs() {
        try {
            $logs = StockAdjustment::with('product:id,name')->get();
    
            return response()->json([
                'success' => true,
                'data' => $logs->map(function ($log) {
                    return [
                        'product_name' => optional($log->product)->name ?? 'Unknown Product',
                        'stock_added' => $log->stock_added,
                        'remarks' => $log->remarks ?? 'No remarks',
                        'created_at' => $log->created_at ? $log->created_at->format('Y-m-d H:i:s') : 'N/A',
                    ];
                }),
            ]);
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
        'start_date' => 'nullable|date_format:Y-m-d',
        'end_date' => 'nullable|date_format:Y-m-d',
        'image_url' => 'nullable|string',
        'sizes' => 'nullable|string', // ✅ Accept comma-separated string
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
            'image' => $validated['image_url'] ?? null,
            'sizes' => $validated['sizes'] ?? '', // ✅ Store sizes
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
        'image_url' => 'nullable|string',
        'sizes' => 'nullable|string', // ✅ Ensure sizes is a string, not an array
    ]);

    try {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = str_replace("storage/", "", $imagePath);
        } elseif ($request->filled('image_url')) {
            $validated['image'] = str_replace(["/storage/", "http://127.0.0.1:8000/storage/"], "", $request->image_url);
        }  

        // ✅ Convert array to a proper comma-separated string
        if ($request->filled('sizes') && is_array($request->sizes)) {
            $validated['sizes'] = implode(", ", $request->sizes);
        }

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
        $orders = Booking::with(['user:id,name,address', 'product:id,name'])
            ->select('id', 'reference_number', 'user_id', 'product_id', 'start_date', 'end_date', 'total_price', 
                     'added_price', 'voucher_fee', 'discounted_price', 'gcash_receipt', 'status', 'created_at', 'sizes')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'reference_number' => $order->reference_number,
                    'user_name' => optional($order->user)->name ?? 'Unknown User',
                    'user_address' => optional($order->user)->address ?? 'No Address Provided',
                    'product_name' => optional($order->product)->name ?? 'Unknown Product',
                    'sizes' => $order->sizes,
                    'start_date' => $order->start_date,
                    'end_date' => $order->end_date,
                    'total_price' => $order->total_price,
                    'added_price' => $order->added_price ?? 0.00,
                    'voucher_fee' => $order->voucher_fee ?? 0.00,
                    'discounted_price' => $order->discounted_price ?? 0.00,
                    'gcash_receipt' => $order->gcash_receipt ? asset('storage/' . $order->gcash_receipt) : null,
                    'status' => $order->status,
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                ];
            });
    
        \Log::info('Orders API Response:', $orders->toArray()); // ✅ Log output to check
    
        return response()->json(['success' => true, 'data' => $orders]);
    }
    

    public function updateStatus(Request $request, $id)
{
    $booking = Booking::find($id);

    if (!$booking) {
        return response()->json(['success' => false, 'message' => 'Booking not found'], 404);
    }

    // ✅ Validate incoming status
    $validated = $request->validate([
        'status' => 'required|in:pending,approved,picked up,canceled,returned'
    ]);

    $product = Product::find($booking->product_id);

    if (!$product) {
        return response()->json(['success' => false, 'message' => 'Product not found'], 404);
    }

    // ✅ "Picked Up" should only come after "Approved"
    if ($validated['status'] === 'picked up' && $booking->status !== 'approved') {
        return response()->json(['success' => false, 'message' => 'Booking must be approved before it can be marked as picked up'], 400);
    }

    // ✅ Restore stock if canceled AFTER being approved
    if ($validated['status'] === 'canceled' && $booking->status === 'approved') {
        $product->increment('stock', 1);
        $product->save();
    }

    // ✅ Restore stock if returned
    if ($validated['status'] === 'returned' && $booking->status === 'approved') {
        $product->increment('stock', 1);
        $product->save();
    }

    // ✅ Update booking status
    $booking->status = $validated['status'];
    $booking->save();

    // ✅ Define status messages for the email
    $statusMessages = [
        'pending' => "Your booking is currently pending. We will process it soon.",
        'approved' => "Your booking has been approved. You can now proceed to pick up your gown.",
        'picked up' => "Your booking has been marked as 'Picked Up'. Enjoy your gown!",
        'canceled' => "Your booking has been canceled. If this was an error, please contact support.",
        'returned' => "Thank you for returning the gown! We hope to see you again soon.",
    ];

    $statusMessage = $statusMessages[$validated['status']] ?? "Your booking status has been updated.";

    // ✅ Send Email Notification using Laravel Mail
    Mail::to($booking->user->email)->send(new BookingStatusUpdateMail($booking, $statusMessage));

    return response()->json([
        'success' => true,
        'message' => "Booking status updated to {$validated['status']} and email sent successfully!",
        'booking' => [
            'id' => $booking->id,
            'reference_number' => $booking->reference_number,
            'status' => $booking->status,
            'gcash_receipt' => $booking->gcash_receipt ? asset('storage/' . $booking->gcash_receipt) : null,
        ],
    ]);
}



    
}
