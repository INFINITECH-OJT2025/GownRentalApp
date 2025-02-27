<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Booking;

class BookingConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking; // ✅ Public property for email template

    /**
     * Create a new message instance.
     */
    public function __construct(Booking $booking)
    {
        $this->booking = $booking->load('user', 'product'); // ✅ Load related models
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from(env('MAIL_FROM_ADDRESS', 'no-reply@gownrental.com'), env('MAIL_FROM_NAME', 'Gown Rental App'))
            ->subject("Booking Confirmation - Ref #{$this->booking->reference_number}")
            ->view('emails.booking_confirmation') // ✅ Correct way to pass data
            ->with(['booking' => $this->booking]);
    }
}
