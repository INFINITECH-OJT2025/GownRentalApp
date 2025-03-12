<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'discounted_price')) { // ✅ Prevent duplicate error
                $table->decimal('discounted_price', 10, 2)->nullable()->after('product_id');
            }
        });
    }

    public function down() {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('discounted_price');
        });
    }
};
