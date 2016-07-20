<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreatePortUniversePivotTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
      Schema::create('port_universe', function (Blueprint $table) {
        $table->increments('id');
        $table->integer('port_id')->unsigned();
        $table->foreign('port_id')->references('id')->on('ports');
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
        //
    }
}
