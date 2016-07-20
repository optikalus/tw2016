<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTraderIdToFightersMines extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('fighters', function (Blueprint $table) {
            $table->integer('trader_id')->unsigned()->nullable()->after('user_id');
            $table->foreign('trader_id')->references('id')->on('traders')->onDelete('set null');
        });
        Schema::table('mines', function (Blueprint $table) {
            $table->integer('trader_id')->unsigned()->nullable()->after('user_id');
            $table->foreign('trader_id')->references('id')->on('traders')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('fighters', function (Blueprint $table) {
            //
        });
    }
}
