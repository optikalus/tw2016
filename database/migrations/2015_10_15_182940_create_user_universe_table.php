<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUserUniverseTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_universe', function (Blueprint $table) {
          $table->increments('id');
          $table->integer('user_id')->unsigned();
          $table->foreign('user_id')->references('id')->on('users');
          $table->integer('universe_id')->unsigned();
          $table->foreign('universe_id')->references('id')->on('universes');
          $table->integer('ship_id')->unsigned();
          $table->foreign('ship_id')->references('id')->on('ships');
          $table->integer('sector_id')->unsigned();
          $table->foreign('sector_id')->references('id')->on('sectors');
          $table->integer('planet_id')->unsigned()->nullable();
          $table->foreign('planet_id')->references('id')->on('planets');
          $table->string('name');
          $table->integer('credits')->unsigned();
          $table->mediumInteger('experience')->unsigned();
          $table->mediumInteger('alignment');
          $table->tinyInteger('deaths')->unsigned();
          $table->integer('bounty')->unsigned();
          $table->smallInteger('bounties')->unsigned();
          $table->integer('contract')->unsigned();
          $table->smallInteger('contracts')->unsigned();
          $table->mediumInteger('balance')->unsigned();
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
        Schema::table('user_universe', function (Blueprint $table) {
            //
        });
    }
}
