<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSectormapTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sectormap', function (Blueprint $table) {
            $table->integer('universe_id')->unsigned();
            $table->foreign('universe_id')->references('id')->on('universe');
            $table->integer('sector_id')->unsigned();
            $table->text('sectors');
            $table->primary(['universe_id','sector_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('sectormap');
    }
}
