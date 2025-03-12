<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('stock_added');
            $table->string('remarks')->nullable();
            $table->timestamps(); // ✅ Add timestamps
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
