<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\NewChatMessage;
use App\Events\MessageSent;
use App\Models\User;
use App\Events\NewChatNotification;

class ChatController extends Controller {

    public function getCustomerMessages($customerId, $adminId)
    {
        // ✅ Fetch messages between customer and admin
        $messages = Chat::where(function ($query) use ($customerId, $adminId) {
            $query->where('user_id', $customerId)->where('receiver_id', $adminId);
        })->orWhere(function ($query) use ($customerId, $adminId) {
            $query->where('user_id', $adminId)->where('receiver_id', $customerId);
        })->orderBy('created_at', 'asc')->get();
    
        // ✅ Mark messages as read when they are fetched
        Chat::where('receiver_id', $customerId)
            ->where('user_id', $adminId) // Admin sent the message
            ->where('is_read', 0) // Only unread messages
            ->update(['is_read' => 1]);
    
        return response()->json($messages);
    }
    

    public function getMessages($customerId)
{
    $admin = User::where('role', 'admin')->first(); // ✅ Ensure getting only first admin
    
    if (!$admin) {
        return response()->json(['error' => 'No admin found'], 404);
    }

    // ✅ Fetch messages between customer and admin only
    $messages = Chat::where(function ($query) use ($customerId, $admin) {
        $query->where('user_id', $admin->id)->where('receiver_id', $customerId);
    })->orWhere(function ($query) use ($customerId, $admin) {
        $query->where('user_id', $customerId)->where('receiver_id', $admin->id);
    })->orderBy('created_at', 'asc')->get();

    return response()->json($messages);
}

public function getAdminsWithUnreadMessages(Request $request)
{
    try {
        // ✅ Get authenticated user using token
        $user = Auth::guard('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized - Invalid Token'], 401);
        }

        // ✅ Retrieve all admins and check if unread messages exist
        $admins = User::where('role', 'admin')->get()->map(function ($admin) use ($user) {
            $hasUnreadMessages = Chat::where('receiver_id', $user->id)
                ->where('user_id', $admin->id)
                ->where('is_read', 0)
                ->exists();

            return [
                'id' => $admin->id,
                'name' => $admin->name,
                'unread_status' => $hasUnreadMessages ? "New message" : "", // ✅ Ensure "New message" appears
            ];
        });

        return response()->json(['admins' => $admins], 200);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to fetch admins',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function getCustomersWithUnreadMessages(Request $request)
{
    try {
        // ✅ Authenticate using API token
        $admin = Auth::guard('api')->user();

        if (!$admin) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // ✅ Fetch customers who sent unread messages to this admin
        $customers = User::whereIn('id', function ($query) use ($admin) {
            $query->select('user_id')
                ->from('chats')
                ->where('receiver_id', $admin->id)
                ->where('is_read', false);
        })->get();

        // ✅ Count unread messages for each customer
        $customerUnreadCounts = $customers->map(function ($customer) use ($admin) {
            $unreadCount = Chat::where('user_id', $customer->id)
                ->where('receiver_id', $admin->id)
                ->where('is_read', false)
                ->count();

            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'unread_status' => $unreadCount > 0 ? "New Messages" : "", // ✅ Show "New Messages" if unread messages exist
            ];
        });

        return response()->json([
            'success' => true,
            'customers' => $customerUnreadCounts,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to fetch customers',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function getChatSenders($receiverId)
{
    // ✅ Get distinct users who sent messages to `receiver_id`
    $senders = Chat::where('receiver_id', $receiverId)
        ->select('user_id', 'created_at') // ✅ Use created_at directly
        ->groupBy('user_id', 'created_at')
        ->orderByDesc('created_at') // ✅ Order by latest message time
        ->get();

    // ✅ Fetch sender details
    $senderUsers = $senders->map(function ($sender) {
        $user = \App\Models\User::find($sender->user_id);
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'created_at' => $sender->created_at, // ✅ Include created_at timestamp
        ];
    });

    return response()->json([
        'success' => true,
        'senders' => $senderUsers,
    ]);
}


    // ✅ Fetch messages for an admin (Admin ↔ Customers)
    public function getAdminMessages($adminId)
    {
        $messages = Chat::where('receiver_id', $adminId)
            ->orWhere('user_id', $adminId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }
    
    public function sendMessage(Request $request)
    {
        \Log::info('📩 Chat Request Data:', $request->all());
    
        try {
            $request->validate([
                'message' => 'required|string',
                'recipient_id' => 'required|exists:users,id',
                'user_id' => 'required|exists:users,id',
            ]);
    
            $sender = User::find($request->user_id);
            $recipient = User::find($request->recipient_id);
    
            if (!$recipient) {
                \Log::error('❌ Error: Recipient not found');
                return response()->json(['error' => 'Recipient not found'], 404);
            }
    
            $message = Chat::create([
                'user_id' => $sender->id,
                'receiver_id' => $recipient->id,
                'message' => $request->message,
            ]);
    
            \Log::info('✅ Message Sent:', $message->toArray());
    
            // ✅ Broadcast message for frontend sync
            broadcast(new NewChatMessage($message))->toOthers();
    
            // ✅ 🔔 Broadcast notification for badge
            event(new \App\Events\NewChatNotification($message, $recipient->id));
    
            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => $message,
            ]);
    
        } catch (\Exception $e) {
            \Log::error('❌ Chat Send Error: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error', 'details' => $e->getMessage()], 500);
        }
    }
    

public function getLastMessage($receiverId)
{
    try {
        // ✅ Fetch the most recent message received by this user
        $lastMessage = Chat::where('receiver_id', $receiverId)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$lastMessage) {
            return response()->json(['message' => 'No messages found', 'last_message_id' => null], 200);
        }

        return response()->json([
            'success' => true,
            'last_message_id' => $lastMessage->id
        ], 200);

    } catch (\Exception $e) {
        return response()->json(['error' => 'Failed to fetch last message', 'message' => $e->getMessage()], 500);
    }
}


    
    // ✅ Fetch chat messages
    public function index($receiverId) {
        return Chat::where(function ($query) use ($receiverId) {
            $query->where('user_id', Auth::id())->where('receiver_id', $receiverId);
        })->orWhere(function ($query) use ($receiverId) {
            $query->where('user_id', $receiverId)->where('receiver_id', Auth::id());
        })->orderBy('created_at')->get();
    }

    // ✅ Send message
    public function store(Request $request) {
        $message = Chat::create([
            'user_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'message' => $request->message,
        ]);

        broadcast(new NewChatMessage($message))->toOthers(); // ✅ Send via WebSocket

        return response()->json($message);
    }

    
    

}
