<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class SetFkNullable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('traders', function (Blueprint $table) {
          $table->integer('user_id')->unsigned()->nullable()->change();
          $table->integer('universe_id')->unsigned()->nullable()->change();
          $table->integer('sector_id')->unsigned()->nullable()->change();
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
