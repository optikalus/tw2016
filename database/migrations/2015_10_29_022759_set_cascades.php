<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class SetCascades extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('fighters', function (Blueprint $table) {
            $table->dropForeign('fighters_user_id_foreign');
            $table->dropForeign('fighters_sector_id_foreign');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('sector_id')->references('id')->on('sectors')->onDelete('cascade');
        });
        Schema::table('logs', function(Blueprint $table) {
            $table->dropForeign('logs_universe_id_foreign');
            $table->foreign('universe_id')->references('id')->on('universes')->onDelete('cascade');
        });
        Schema::table('mines', function(Blueprint $table) {
            $table->dropForeign('mines_user_id_foreign');
            $table->dropForeign('mines_sector_id_foreign');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('sector_id')->references('id')->on('sectors')->onDelete('cascade');
        });
        Schema::table('planets', function(Blueprint $table) {
            $table->dropForeign('planets_user_id_foreign');
            $table->dropForeign('planets_sector_id_foreign');
            $table->dropForeign('planets_universe_id_foreign');
            $table->dropForeign('planets_trader_id_foreign');
            $table->dropForeign('planets_class_id_foreign');
            $table->integer('universe_id')->unsigned()->change();
            $table->foreign('universe_id')->references('id')->on('universes')->onDelete('cascade');
            $table->foreign('sector_id')->references('id')->on('sectors')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('trader_id')->references('id')->on('traders')->onDelete('set null');
            $table->foreign('class_id')->references('id')->on('planet_types')->onDelete('cascade');
        });
        Schema::table('ports', function(Blueprint $table) {
            $table->dropForeign('ports_universe_id_foreign');
            $table->dropForeign('ports_sector_id_foreign');
            //$table->integer('universe_id')->unsigned()->after('id')->change();
            $table->foreign('universe_id')->references('id')->on('universes')->onDelete('cascade');
            $table->foreign('sector_id')->references('id')->on('sectors')->onDelete('cascade');
        });
        Schema::table('sector_sector', function(Blueprint $table) {
            $table->dropForeign('sector_sector_sector_id_foreign');
            $table->dropForeign('sector_sector_sector_id_warp_foreign');
            $table->foreign('sector_id')->references('id')->on('sectors')->onDelete('cascade');
            $table->foreign('sector_id_warp')->references('id')->on('sectors')->onDelete('cascade');
        });
        Schema::table('sectors', function(Blueprint $table) {
            $table->dropForeign('sectors_universe_id_foreign');
            $table->foreign('universe_id')->references('id')->on('universes')->onDelete('cascade');
        });
        Schema::table('sectorseen', function(Blueprint $table) {
            $table->dropForeign('sectorseen_user_id_foreign');
            $table->dropForeign('sectorseen_universe_id_foreign');
            $table->foreign('universe_id')->references('id')->on('universes')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
        Schema::table('ships', function(Blueprint $table) {
            $table->dropForeign('ships_ship_id_foreign');
            $table->dropForeign('ships_user_id_foreign');
            $table->dropForeign('ships_universe_id_foreign');
            $table->dropForeign('ships_sector_id_foreign');
            $table->dropForeign('ships_trader_id_foreign');
            $table->dropForeign('ships_planet_id_foreign');
            $table->dropForeign('ships_manufacturer_id_foreign');
            $table->foreign('ship_id')->references('id')->on('ship_types')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('universe_id')->references('id')->on('universes')->onDelete('cascade');
            $table->foreign('sector_id')->references('id')->on('sectors')->onDelete('cascade');
            $table->foreign('trader_id')->references('id')->on('traders')->onDelete('set null');
            $table->foreign('planet_id')->references('id')->on('planets')->onDelete('set null');
            $table->foreign('manufacturer_id')->references('id')->on('manufacturers')->onDelete('set null');
        });
        Schema::table('traders', function(Blueprint $table) {
            //$table->dropForeign('traders_user_id_foreign');
            //$table->dropForeign('traders_universe_id_foreign');
            //$table->dropForeign('traders_ship_id_foreign');
            //$table->dropForeign('traders_sector_id_foreign');
            //$table->dropForeign('traders_planet_id_foreign');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('universe_id')->references('id')->on('universes')->onDelete('cascade');
            $table->foreign('ship_id')->references('id')->on('ships')->onDelete('set null');
            $table->foreign('planet_id')->references('id')->on('planets')->onDelete('set null');
            $table->foreign('sector_id')->references('id')->on('sectors')->onDelete('cascade');
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
