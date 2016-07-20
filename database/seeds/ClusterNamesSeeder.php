<?php

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

class ClusterNamesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
      DB::table('clusternames')->insert([
      ['name' => 'Actacon'],
      ['name' => 'Aegyptus'],
      ['name' => 'Ahmat Gragn'],
      ['name' => 'Alba Longa'],
      ['name' => 'Andromeda'],
      ['name' => 'Antares Nebulae'],
      ['name' => 'Anzu-Eagle'],
      ['name' => 'Arfderydd'],
      ['name' => 'Aurelia'],
      ['name' => 'Baarlaam'],
      ['name' => 'Bagratid'],
      ['name' => 'Barlaam'],
      ['name' => 'Beal-deig'],
      ['name' => 'Bellerophon'],
      ['name' => 'Benkei'],
      ['name' => 'Birdoswald'],
      ['name' => 'Charlemagne'],
      ['name' => 'Clontarf'],
      ['name' => 'Cygnia System'],
      ['name' => 'Cymbeline'],
      ['name' => 'Devanarda'],
      ['name' => 'Diomedes'],
      ['name' => 'DragonStar'],
      ['name' => 'Dysenni'],
      ['name' => 'Elffin'],
      ['name' => 'Evander'],
      ['name' => 'Excalibur'],
      ['name' => 'Freyfaxi'],
      ['name' => 'Gastonbury'],
      ['name' => 'Halos Array'],
      ['name' => 'Honalee'],
      ['name' => 'Inanna'],
      ['name' => 'Lough Corrib'],
      ['name' => 'Mul Temb'],
      ['name' => 'Orion System'],
      ['name' => 'Polloxian Nebulae'],
      ['name' => 'Polyxena'],
      ['name' => 'Prilep'],
      ['name' => 'Seven Sages'],
      ['name' => 'Stygian Nebulae'],
      ['name' => 'Tarterus'],
      ['name' => 'The Draconian Galaxy'],
      ['name' => 'The Ghengis Empire'],
      ['name' => 'The Gwailor Array'],
      ['name' => 'The Lodi System'],
      ['name' => 'The Maxentian Empire'],
      ['name' => 'The Palembang System'],
      ['name' => 'The Queensland Province'],
      ['name' => 'The Rovine Nebulae'],
      ['name' => 'The Simurgh Zone'],
      ['name' => 'The Slogovian Estates'],
      ['name' => 'The Ulysses Cluster'],
      ['name' => 'The Valdemarian Limits'],
      ['name' => 'Titus'],
      ['name' => 'Triskelion Spur'],
      ['name' => 'Tszarnth Spur'],
      ['name' => 'Vedala Erandi'],
      ['name' => 'Vesta'],
      ['name' => 'The Khas Cluster'],
      ['name' => 'The Tycho Expanse'],
      ]);
    }
}
