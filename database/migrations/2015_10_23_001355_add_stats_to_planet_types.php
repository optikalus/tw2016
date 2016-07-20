<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddStatsToPlanetTypes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('planet_types', function (Blueprint $table) {
          $table->smallInteger('col_to_fuel_ratio')->unsigned();
          $table->smallInteger('col_to_organics_ratio')->unsigned();
          $table->smallInteger('col_to_equipment_ratio')->unsigned();
          $table->smallInteger('col_to_fighter_ratio')->unsigned();
          $table->mediumInteger('starting_fuel')->unsigned()->default(0);
          $table->mediumInteger('starting_organics')->unsigned()->default(0);
          $table->mediumInteger('starting_equipment')->unsigned()->default(0);
          $table->tinyInteger('hazard_level')->unsigned();
          $table->tinyInteger('habitability_rating')->unsigned();
          $table->tinyInteger('citadel_interest');
          $table->boolean('restrict_starting_products');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('planet_types', function (Blueprint $table) {
            //
        });
    }
}
