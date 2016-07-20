<?php

use Illuminate\Database\Seeder;

class ManufacturerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
      DB::table('manufacturers')->insert([
      ['name' => 'Markham Space Tech'],
      ['name' => 'High Velocity Ltd'],
      ['name' => 'Mainstay Ltd'],
      ['name' => 'Martel Matra'],
      ['name' => 'Pescador'],
      ['name' => 'Mammongam'],
      ['name' => 'IonStream'],
      ['name' => 'AldenShrike'],
      ['name' => 'QuadStar'],
      ['name' => 'Antarian'],
      ['name' => 'Bitubo'],
      ['name' => '4 Dragons Ltd'],
      ['name' => 'Seeschlange'],
      ['name' => 'Bofors'],
      ['name' => 'Murene'],
      ['name' => 'Talos'],
      ['name' => 'Axis Industries'],
      ['name' => 'Provornyy'],
      ['name' => 'Dzerhinsky'],
      ['name' => 'Sovremenny'],
      ['name' => 'Sverdlov'],
      ['name' => 'Impetuoso'],
      ['name' => 'Animoso'],
      ['name' => 'Le Richelieu'],
      ['name' => 'Yokotosaki'],
      ['name' => 'Martin Ind'],
      ['name' => 'Kvertoo'],
      ]);
    }
}
