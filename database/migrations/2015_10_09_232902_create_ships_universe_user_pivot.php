<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateShipsUniverseUserPivot extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('ship', function (Blueprint $table) {
          $table->increments('id');
          $table->integer('ship_id')->unsigned();
          $table->foreign('ship_id')->references('id')->on('ships');
          $table->integer('universe_id')->unsigned();
          $table->foreign('universe_id')->references('id')->on('universes');
          $table->integer('sector_id')->unsigned();
          $table->foreign('sector_id')->references('id')->on('sectors');
          $table->integer('user_id')->unsigned()->nullable();
          $table->foreign('user_id')->references('id')->on('users');
          $table->integer('planet_id')->unsigned();
          $table->foreign('planet_id')->references('id')->on('planets');
          $table->string('name');
          $table->string('password', 60);
          $table->integer('ports')->unsigned();
          $table->integer('kills')->unsigned();
          $table->boolean('cloaked');
          $table->boolean('interdicting');
          $table->mediumInteger('fighters')->unsigned();
          $table->smallInteger('shields')->unsigned();
          $table->tinyInteger('holds')->unsigned();
          $table->tinyInteger('fuel')->unsigned();
          $table->tinyInteger('organics')->unsigned();
          $table->tinyInteger('equipment')->unsigned();
          $table->tinyInteger('colonists')->unsigned();
          $table->tinyInteger('genesis')->unsigned();
          $table->tinyInteger('class_1_mines')->unsigned();
          $table->tinyInteger('class_2_mines')->unsigned();
          $table->smallInteger('beacons')->unsigned();
          $table->tinyInteger('scanner')->unsigned();
          $table->tinyInteger('detonators')->unsigned();
          $table->smallInteger('corbomite')->unsigned();
          $table->tinyInteger('probes')->unsigned();
          $table->tinyInteger('disruptors')->unsigned();
          $table->tinyInteger('photons')->unsigned();
          $table->boolean('psychic');
          $table->boolean('planetscan');
          $table->tinyInteger('transwarp')->unsigned();
          $table->tinyInteger('cloaks')->unsigned();
          $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('ships_universe', function (Blueprint $table) {
            //
        });
    }
}
