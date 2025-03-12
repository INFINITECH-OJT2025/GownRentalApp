<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use App\Models\Chat;

class MessageSent implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public $message;
    public $receiverId;
    public $senderId;
    public $senderName;
    public $notification;
    public $unreadCount;

    public function __construct(User $sender, Chat $message)
    {
        $this->senderId = $sender->id;
        $this->receiverId = $message->receiver_id;
        $this->message = $message;
        $this->senderName = $sender->name;

        // ✅ Count unread messages for the receiver
        $this->unreadCount = Chat::where('receiver_id', $this->receiverId)
            ->where('is_read', false)
            ->count();
    }

    public function broadcastOn()
    {
        return [
            new PrivateChannel('private-chat-' . $this->receiverId),
            new PrivateChannel('private-chat-' . $this->senderId), // ✅ Sender also listens
        ];
    }

    public function broadcastAs()
    {
        return 'message-sent';
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message->toArray(), // ✅ Full message data
            'receiver_id' => $this->receiverId,
            'sender_id' => $this->senderId,
            'sender_name' => $this->senderName,
            'unread_count' => $this->unreadCount, // ✅ Update unread count
        ];
    }
}
