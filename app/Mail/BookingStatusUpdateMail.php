<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Booking;

class BookingStatusUpdateMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $statusMessage;

    /**
     * Create a new message instance.
     */
    public function __construct(Booking $booking, $statusMessage)
    {
        $this->booking = $booking->load('user', 'product');
        $this->statusMessage = $statusMessage;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from(env('MAIL_FROM_ADDRESS', 'no-reply@gownrental.com'), env('MAIL_FROM_NAME', 'Gown Rental App'))
            ->subject("Booking Status Update - Ref #{$this->booking->reference_number}")
            ->view('emails.booking_status_update')
            ->with([
                'booking' => $this->booking,
                'statusMessage' => $this->statusMessage,
            ]);
    }
}
