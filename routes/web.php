<?php

use Illuminate\Support\Facades\Route;
use App\Events\MessageSent;

Route::get('/test-broadcast', function () {
    event(new MessageSent(auth()->user(), 'Hello, this is a test message!'));
    return 'Event has been sent!';
});
