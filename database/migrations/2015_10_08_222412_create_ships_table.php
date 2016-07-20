<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateShipsTable extends Migration
{
    /**
    * Run the migrations.
    *
    * @return void
    */
    public function up()
    {
        Schema::create('ships', function (Blueprint $table) {
          $table->increments('id');
          $table->string('name');
          $table->boolean('active');
          $table->tinyInteger('turns_per_warp')->unsigned();
          $table->decimal('offensive_odds', 3, 2);
          $table->decimal('defensive_odds', 3, 2);
          $table->tinyInteger('transport_range')->unsigned();
          $table->integer('exp_req')->unsigned();
          $table->tinyInteger('max_holds')->unsigned();
          $table->tinyInteger('init_holds')->unsigned();
          $table->mediumInteger('max_fighters')->unsigned();
          $table->mediumInteger('max_fighters_per_attack')->unsigned();
          $table->smallInteger('max_shields')->unsigned();
          $table->tinyInteger('max_mines')->unsigned();
          $table->smallInteger('max_beacons')->unsigned();
          $table->tinyInteger('max_genesis')->unsigned();
          $table->tinyInteger('max_cloak')->unsigned();
          $table->tinyInteger('max_detonaters')->unsigned();
          $table->smallInteger('max_corbomite')->unsigned();
          $table->tinyInteger('max_probes')->unsigned();
          $table->tinyInteger('max_disruptors')->unsigned();
          $table->tinyInteger('max_photons')->unsigned();
          $table->boolean('allow_densityscan');
          $table->boolean('allow_holographicscan');
          $table->boolean('allow_planetscan');
          $table->boolean('allow_combatscan');
          $table->boolean('allow_transwarp');
          $table->boolean('allow_interdictor');
          $table->boolean('is_escapepod');
          $table->boolean('can_land');
          $table->boolean('defensive_bonus');
          $table->boolean('fusion_drive');
          $table->boolean('swappable');
          $table->boolean('require_commission');
          $table->boolean('require_corporate');
          $table->boolean('require_corporate_ceo');
          $table->boolean('has_escapepod');
          $table->integer('escapepod_id')->unsigned();
          $table->foreign('escapepod_id')->references('id')->on('ships');
          $table->mediumInteger('cost_hold')->unsigned();
          $table->mediumInteger('cost_drive')->unsigned();
          $table->mediumInteger('cost_computer')->unsigned();
          $table->mediumInteger('cost_hull')->unsigned();
          $table->tinyInteger('deployment')->unsigned();
          $table->tinyInteger('target_race')->unsigned()->nullable();
          $table->boolean('functional')->nullable();
          $table->boolean('unique')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('ships', function (Blueprint $table) {
            //
        });
    }
}
