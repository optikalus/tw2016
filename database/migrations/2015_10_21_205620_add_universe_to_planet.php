<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddUniverseToPlanet extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('planets', function (Blueprint $table) {
          $table->integer('universe_id')->unsigned()->nullable()->after('id');
          $table->foreign('universe_id')->references('id')->on('universes');
          $table->dropColumn('class');
          $table->integer('class_id')->unsigned()->nullable()->after('user_id');
          $table->foreign('class_id')->references('id')->on('planet_types');
          $table->integer('trader_id')->unsigned()->nullable()->after('user_id');
          $table->foreign('trader_id')->references('id')->on('traders');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('planets', function (Blueprint $table) {
            //
        });
    }
}
