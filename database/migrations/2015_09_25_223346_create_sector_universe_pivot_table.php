<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSectorUniversePivotTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sector_universe', function (Blueprint $table) {
          $table->increments('id');
          $table->integer('sector_id')->unsigned();
          $table->foreign('sector_id')->references('id')->on('sectors');
          $table->integer('universe_id')->unsigned();
          $table->foreign('universe_id')->references('id')->on('universes');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('sector_universe', function (Blueprint $table) {
            //
        });
    }
}
