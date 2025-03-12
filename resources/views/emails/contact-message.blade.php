<!DOCTYPE html>
<html>
<head>
    <title>New Contact Message</title>
</head>
<body>
    <h2>New Contact Message from Gown Rental</h2>

    <p><strong>Full Name:</strong> {{ $details['name'] }}</p>
    <p><strong>Email Address:</strong> {{ $details['email'] }}</p>
    <p><strong>Message:</strong></p>
    <p>{{ $details['message'] }}</p>

    <p>Regards,<br>Gown Rental App</p>
</body>
</html>
