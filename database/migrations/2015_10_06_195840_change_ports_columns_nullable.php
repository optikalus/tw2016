<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ChangePortsColumnsNullable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('ports', function (Blueprint $table) {
          $table->dropColumn('class');
        });
        Schema::table('ports', function (Blueprint $table) {
          $table->tinyInteger('class')->unsigned()->after('name');
          $table->string('last_ship')->nullable()->change();
          $table->dateTime('last_time')->nullable()->change();
          $table->smallInteger('firepower')->default(100)->change();
          $table->integer('credits')->nullable()->change();
          $table->smallInteger('fuel')->nullable()->change();
          $table->smallInteger('organics')->nullable()->change();
          $table->smallInteger('equipment')->nullable()->change();
          $table->smallInteger('fuel_prod')->nullable()->change();
          $table->smallInteger('organics_prod')->nullable()->change();
          $table->smallInteger('equipment_prod')->nullable()->change();
          //$table->tinyInteger('fuel_mcic')->nullable()->change();
          //$table->tinyInteger('organics_mcic')->nullable()->change();
          //$table->tinyInteger('equipment_mcic')->nullable()->change();
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
