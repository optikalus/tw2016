<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSectorSectorPivotTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sector_sector', function (Blueprint $table) {
          $table->increments('id');
          $table->integer('sector_id')->unsigned();
          $table->foreign('sector_id')->references('id')->on('sectors');
          $table->integer('sector_id_warp')->unsigned();
          $table->foreign('sector_id_warp')->references('id')->on('sectors');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('sector_sector', function (Blueprint $table) {
            //
        });
    }
}
