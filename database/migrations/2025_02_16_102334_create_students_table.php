<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id('student_id');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('year_level');
            $table->timestamps(); // Automatically create created_at and updated_at columns
        });        
    }

    public function down()
    {
        Schema::dropIfExists('students');
    }
};
