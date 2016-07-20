<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddCascadeOnDeleteTraderNullable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('traders', function (Blueprint $table) {
          $table->dropForeign('traders_ship_id_foreign');
          $table->foreign('ship_id')->references('id')->on('ships')->onDelete('cascade')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('traders', function (Blueprint $table) {
            //
        });
    }
}
