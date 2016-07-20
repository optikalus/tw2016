<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreatePlanetsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
      Schema::create('planets', function (Blueprint $table) {
        $table->increments('id');
        $table->string('name');
        $table->tinyInteger('class')->unsigned();
        $table->integer('sector_id')->unsigned();
        $table->foreign('sector_id')->references('id')->on('sectors');
        $table->integer('user_id')->unsigned()->nullable();
        $table->foreign('user_id')->references('id')->on('users');
        $table->mediumInteger('fuel')->unsigned();
        $table->mediumInteger('organics')->unsigned();
        $table->mediumInteger('equipment')->unsigned();
        $table->mediumInteger('fighters')->unsigned();
        $table->smallInteger('fuel_cols')->unsigned();
        $table->smallInteger('organics_cols')->unsigned();
        $table->smallInteger('equipment_cols')->unsigned();
        $table->tinyInteger('citadel')->unsigned();
        $table->dateTime('upgrade_completion')->nullable();
        $table->bigInteger('treasury')->unsigned();
        $table->smallInteger('transporter')->unsigned();
        $table->tinyInteger('military_reaction')->unsigned();
        $table->tinyInteger('quasar_sector')->unsigned();
        $table->tinyInteger('quasar_atmos')->unsigned();
        $table->smallInteger('shields')->unsigned();
        $table->boolean('interdictor');
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
