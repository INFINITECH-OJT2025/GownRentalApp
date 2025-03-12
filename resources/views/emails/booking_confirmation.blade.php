<!DOCTYPE html>
<html>
<head>
    <title>Booking Confirmation</title>
</head>
<body>
    <h2>Thank you for your booking, {{ $booking->user->name }}!</h2>

    <p>Your booking has been successfully confirmed. Below are the details:</p>

    <ul>
        <li><strong>Reference Number:</strong> {{ $booking->reference_number }}</li>
        <li><strong>Product:</strong> {{ $booking->product->name }}</li>
        <li><strong>Start Date:</strong> {{ \Carbon\Carbon::parse($booking->start_date)->format('F j, Y') }}</li>
        <li><strong>End Date:</strong> {{ \Carbon\Carbon::parse($booking->end_date)->format('F j, Y') }}</li>
        <li><strong>Total Price:</strong> ₱{{ number_format($booking->total_price, 2) }}</li>
    </ul>

    <p><strong>Important:</strong> To complete your booking, please ensure you upload your payment receipt. Your booking will not be approved unless the payment receipt is submitted and verified by the admin.</p>

    <p>If you have any questions, please contact us at <strong>{{ env('MAIL_FROM_ADDRESS') }}</strong>.</p>

    <p>Best Regards,</p>
    <p><strong>Gown Rental Team</strong></p>
</body>
</html>
