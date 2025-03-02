<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    Schema::table('users', function (Blueprint $table) {
        $table->integer('total_bookings')->default(0)->after('id'); // Track total approved bookings
        $table->integer('loyalty_points')->default(0)->after('total_bookings'); // Track loyalty points
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['total_bookings', 'loyalty_points']);
    });
}

};
