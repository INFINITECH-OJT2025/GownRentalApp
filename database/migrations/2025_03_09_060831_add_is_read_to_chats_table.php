<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up() {
        Schema::table('chats', function (Blueprint $table) {
            $table->boolean('is_read')->default(false)->after('message'); // ✅ Add is_read column
        });
    }

    public function down() {
        Schema::table('chats', function (Blueprint $table) {
            $table->dropColumn('is_read');
        });
    }
};