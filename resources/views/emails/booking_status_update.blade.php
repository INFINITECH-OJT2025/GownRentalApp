<!DOCTYPE html>
<html>
<head>
    <title>Booking Status Update</title>
</head>
<body>
    <h3>Hello {{ $booking->user->name }},</h3>
    
    <p>Your booking status has been updated to: <strong>{{ ucfirst($booking->status) }}</strong></p>

    <p>{{ $statusMessage }}</p>

    <h4>Booking Details:</h4>
    <ul>
        <li><strong>Reference #:</strong> {{ $booking->reference_number }}</li>
        <li><strong>Product:</strong> {{ $booking->product->name }}</li>
        <li><strong>Total Price:</strong> ₱{{ number_format($booking->total_price, 2) }}</li>
        <li><strong>Start Date:</strong> {{ $booking->start_date }}</li>
        <li><strong>End Date:</strong> {{ $booking->end_date }}</li>
    </ul>

    <p>Thank you for using Gown Rental System!</p>
</body>
</html>
