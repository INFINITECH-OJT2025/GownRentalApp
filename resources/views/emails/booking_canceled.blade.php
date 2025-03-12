<!DOCTYPE html>
<html>
<head>
    <title>Booking Canceled</title>
</head>
<body>
    <h3>Hello {{ $booking->user->name }},</h3>

    <p>We regret to inform you that your booking has been **canceled**.</p>

    <h4>Booking Details:</h4>
    <ul>
        <li><strong>Reference #:</strong> {{ $booking->reference_number }}</li>
        <li><strong>Product:</strong> {{ $booking->product->name }}</li>
        <li><strong>Total Price:</strong> ₱{{ number_format($booking->total_price, 2) }}</li>
        <li><strong>Start Date:</strong> {{ $booking->start_date }}</li>
        <li><strong>End Date:</strong> {{ $booking->end_date }}</li>
    </ul>

    <p>If you believe this was an error, please contact our support team.</p>

    <p>Thank you for choosing Gown Rental System.</p>

    <br>
    <strong>Gown Rental Team</strong>
</body>
</html>
