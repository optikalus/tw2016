<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddMorePlanetTypeValues extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('planet_types', function (Blueprint $table) {
          $table->mediumInteger('max_cols_fuel')->unsigned();
          $table->mediumInteger('max_cols_organics')->unsigned();
          $table->mediumInteger('max_cols_equipment')->unsigned();
          $table->mediumInteger('max_units_fuel')->unsigned();
          $table->mediumInteger('max_units_organics')->unsigned();
          $table->mediumInteger('max_units_equipment')->unsigned();
          $table->mediumInteger('max_fighters')->unsigned();
          $table->smallInteger('max_shields')->unsigned();
          $table->tinyInteger('max_citadel_level')->unsigned();
          $table->smallInteger('citadel_level_1_fuel')->unsigned();
          $table->smallInteger('citadel_level_1_organics')->unsigned();
          $table->smallInteger('citadel_level_1_equipment')->unsigned();
          $table->tinyInteger('citadel_level_1_days')->unsigned();
          $table->smallInteger('citadel_level_1_cols')->unsigned();
          $table->smallInteger('citadel_level_2_fuel')->unsigned();
          $table->smallInteger('citadel_level_2_organics')->unsigned();
          $table->smallInteger('citadel_level_2_equipment')->unsigned();
          $table->tinyInteger('citadel_level_2_days')->unsigned();
          $table->smallInteger('citadel_level_2_cols')->unsigned();
          $table->smallInteger('citadel_level_3_fuel')->unsigned();
          $table->smallInteger('citadel_level_3_organics')->unsigned();
          $table->smallInteger('citadel_level_3_equipment')->unsigned();
          $table->tinyInteger('citadel_level_3_days')->unsigned();
          $table->smallInteger('citadel_level_3_cols')->unsigned();
          $table->smallInteger('citadel_level_4_fuel')->unsigned();
          $table->smallInteger('citadel_level_4_organics')->unsigned();
          $table->smallInteger('citadel_level_4_equipment')->unsigned();
          $table->tinyInteger('citadel_level_4_days')->unsigned();
          $table->smallInteger('citadel_level_4_cols')->unsigned();
          $table->smallInteger('citadel_level_5_fuel')->unsigned();
          $table->smallInteger('citadel_level_5_organics')->unsigned();
          $table->smallInteger('citadel_level_5_equipment')->unsigned();
          $table->tinyInteger('citadel_level_5_days')->unsigned();
          $table->smallInteger('citadel_level_5_cols')->unsigned();
          $table->smallInteger('citadel_level_6_fuel')->unsigned();
          $table->smallInteger('citadel_level_6_organics')->unsigned();
          $table->smallInteger('citadel_level_6_equipment')->unsigned();
          $table->tinyInteger('citadel_level_6_days')->unsigned();
          $table->smallInteger('citadel_level_6_cols')->unsigned();
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
