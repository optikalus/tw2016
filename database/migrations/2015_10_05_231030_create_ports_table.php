<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreatePortsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
      Schema::create('ports', function (Blueprint $table) {
        $table->increments('id');
        $table->string('name');
        $table->enum('class', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        $table->integer('fuel')->unsigned();
        $table->integer('fuel_max')->unsigned();
        $table->integer('organics')->unsigned();
        $table->integer('organics_max')->unsigned();
        $table->integer('equipment')->unsigned();
        $table->integer('equipment_max')->unsigned();
        $table->string('last_ship');
        $table->dateTime('last_time');
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
