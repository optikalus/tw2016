<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPricing extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('universes', function (Blueprint $table) {
            $table->mediumInteger('transport_unit_cost')->unsigned()->default(50000);
            $table->mediumInteger('transport_upgrade_cost')->unsigned()->default(25000);
            $table->smallInteger('tavern_announcement_cost')->unsigned()->default(100);
            $table->smallInteger('limpet_removal_cost')->unsigned()->default(5000);
            $table->smallInteger('ship_registration_cost')->unsigned()->default(5000);
            $table->smallInteger('genesis_cost')->unsigned()->default(20000);
            $table->smallInteger('armid_cost')->unsigned()->default(1000);
            $table->smallInteger('limpet_cost')->unsigned()->default(10000);
            $table->smallInteger('beacon_cost')->unsigned()->default(100);
            $table->mediumInteger('transwarp_1_cost')->unsigned()->default(50000);
            $table->mediumInteger('transwarp_2_cost')->unsigned()->default(80000);
            $table->smallInteger('transwarp_upgrade_cost')->unsigned()->default(10000);
            $table->smallInteger('psychic_cost')->unsigned()->default(10000);
            $table->mediumInteger('planetscan_cost')->unsigned()->default(30000);
            $table->smallInteger('detonator_cost')->unsigned()->default(15000);
            $table->smallInteger('corbomite_cost')->unsigned()->default(1000);
            $table->smallInteger('probe_cost')->unsigned()->default(3000);
            $table->mediumInteger('photon_cost')->unsigned()->default(40000);
            $table->smallInteger('cloak_cost')->unsigned()->default(25000);
            $table->smallInteger('disruptor_cost')->unsigned()->default(6000);
            $table->mediumInteger('holoscan_cost')->unsigned()->default(25000);
            $table->smallInteger('densityscan_cost')->unsigned()->default(2000);
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
