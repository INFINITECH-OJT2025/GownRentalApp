<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Favorite;
use App\Models\User;
use App\Models\Product;

class FavoritesSeeder extends Seeder {
    public function run() {
        $users = User::all();
        $products = Product::all();

        foreach ($users as $user) {
            Favorite::create([
                'user_id' => $user->id,
                'product_id' => $products->random()->id,
            ]);
        }
    }
}
