<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddSpecificsToPorts extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('ports', function (Blueprint $table) {
          $table->dropColumn('fuel');
          $table->dropColumn('fuel_max');
          $table->dropColumn('organics');
          $table->dropColumn('organics_max');
          $table->dropColumn('equipment');
          $table->dropColumn('equipment_max');
        });
        Schema::table('ports', function (Blueprint $table) {
          $table->smallInteger('firepower')->unsigned();
          $table->integer('credits')->unsigned();
          $table->smallInteger('fuel')->unsigned();
          $table->smallInteger('organics')->unsigned();
          $table->smallInteger('equipment')->unsigned();
          $table->smallInteger('fuel_prod')->unsigned();
          $table->smallInteger('organics_prod')->unsigned();
          $table->smallInteger('equipment_prod')->unsigned();
          $table->tinyInteger('fuel_mcic')->nullable();
          $table->tinyInteger('organics_mcic')->nullable();
          $table->tinyInteger('equipment_mcic')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('ports', function (Blueprint $table) {
            //
        });
    }
}
