<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport; // ✅ ADD THIS LINE

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Passport::loadKeysFrom(storage_path('oauth')); 
    
        // Hash client secrets for security
        Passport::hashClientSecrets();
    
        // Set token expiration times
        Passport::tokensExpireIn(now()->addDays(15)); // Access Token: 15 days
        Passport::refreshTokensExpireIn(now()->addDays(30)); // Refresh Token: 30 days
        Passport::personalAccessTokensExpireIn(now()->addMonths(6)); // PAT: 6 months
    }
    
}
