<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Product;
use App\Models\Booking;

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
            Log::info('Fetching products.');
    
            $products = Product::all();
    
            return response()->json([
                'success' => true,
                'products' => $products // ✅ Fix: Ensure the key is 'products'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching products: ' . $e->getMessage());
    
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getInventory()
    {
        try {
            Log::info('Fetching inventory list.');

            $inventory = Product::select('id', 'name', 'image', 'price', 'description', 'category', 'availability', 'start_date', 'end_date')
                ->get();

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

    /**
     * Add a new inventory item.
     */
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

    /**
     * Update an inventory item.
     */
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

    // Update order status
    public function updateStatus(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $booking->status = $request->status;
        $booking->save();

        return response()->json(['success' => true, 'message' => 'Booking status updated successfully.']);
    }
    
}
