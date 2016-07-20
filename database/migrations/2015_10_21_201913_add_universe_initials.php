<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddUniverseInitials extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('universes', function (Blueprint $table) {
          $table->integer('sectors')->unsigned()->default(1000)->change();
          $table->integer('terra_cols')->unsigned()->default(30000)->change();
          $table->integer('terra_cols_max')->unsigned()->default(100000)->change();
          $table->decimal('terra_cols_regen', 5, 2)->default(.75)->change();
          $table->smallInteger('standard_port_firepower_pct')->unsigned()->default(100);
          $table->smallInteger('special_port_firepower_pct')->unsigned()->default(100);
          $table->boolean('special_port_invincible')->default(false);
          $table->smallInteger('turns_per_day')->unsigned()->default(250);
          $table->smallInteger('initial_fighters')->unsigned()->default(30);
          $table->integer('initial_credits')->unsigned()->default(300);
          $table->tinyInteger('initial_holds')->unsigned()->default(20);
          $table->tinyInteger('inactive_days')->unsigned()->default(30);
          $table->smallInteger('max_players')->unsigned()->default(200);
          $table->smallInteger('max_ships')->unsigned()->default(800);
          $table->smallInteger('max_ports')->unsigned()->default(400);
          $table->smallInteger('max_planets')->unsigned()->default(200);
          $table->tinyInteger('max_planets_per_sector')->unsigned()->default(5);
          $table->tinyInteger('max_traders_per_corp')->unsigned()->default(5);
          $table->tinyInteger('ferrengi_regen_pct')->unsigned()->default(20);
          $table->smallInteger('ferrengi_regen_max')->unsigned()->default(800);
          $table->string('underground_password')->default('BEWARE OF KAL DURAK');
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
