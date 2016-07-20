<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreatePortSectorPivotTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
      Schema::create('port_sector', function (Blueprint $table) {
        $table->increments('id');
        $table->integer('port_id')->unsigned();
        $table->foreign('port_id')->references('id')->on('ports');
        $table->integer('sector_id')->unsigned();
        $table->foreign('sector_id')->references('id')->on('sectors');
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
