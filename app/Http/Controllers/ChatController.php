<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\NewChatMessage;

class ChatController extends Controller {
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
