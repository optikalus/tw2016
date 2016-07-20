<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTerraDataToUniverses extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('universes', function (Blueprint $table) {
          $table->integer('terra_cols')->unsigned();
          $table->integer('terra_cols_max')->unsigned();
          $table->decimal('terra_cols_regen', 5, 2);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('universes', function (Blueprint $table) {
            //
        });
    }
}
