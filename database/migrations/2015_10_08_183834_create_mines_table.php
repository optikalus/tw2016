<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateMinesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('mines', function (Blueprint $table) {
          $table->increments('id');
          $table->integer('sector_id')->unsigned();
          $table->foreign('sector_id')->references('id')->on('sectors');
          $table->integer('user_id')->unsigned()->nullable();
          $table->foreign('user_id')->references('id')->on('users');
          $table->tinyInteger('quantity')->unsigned();
          $table->tinyInteger('type')->unsigned();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('mines', function (Blueprint $table) {
            //
        });
    }
}
