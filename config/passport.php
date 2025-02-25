<?php

return [

    'guard' => 'web',

    // ✅ Load keys from storage/oauth/ instead of .env
    'private_key' => file_exists(storage_path('oauth/oauth-private.key')) 
        ? storage_path('oauth/oauth-private.key') 
        : null,

    'public_key' => file_exists(storage_path('oauth/oauth-public.key')) 
        ? storage_path('oauth/oauth-public.key') 
        : null,

    'connection' => env('PASSPORT_CONNECTION'),

    'client_uuids' => false,

    'personal_access_client' => [
        'id' => env('PASSPORT_PERSONAL_ACCESS_CLIENT_ID'),
        'secret' => env('PASSPORT_PERSONAL_ACCESS_CLIENT_SECRET'),
    ],

];
