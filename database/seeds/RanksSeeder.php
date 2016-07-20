<?php

use Illuminate\Database\Seeder;

class RanksSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('ranks')->insert([
            [ 'rank' => 'Neutral', 'alignment' => 0 ],
            [ 'rank' => 'Tolerant', 'alignment' => 1 ],
            [ 'rank' => 'Polite', 'alignment' => 101  ],
            [ 'rank' => 'Nice', 'alignment' => 301 ],
            [ 'rank' => 'Unselfish', 'alignment' => 901 ],
            [ 'rank' => 'Giving', 'alignment' => 2701 ],
            [ 'rank' => 'Forgiving', 'alignment' => 8101 ],
            [ 'rank' => 'Gallant', 'alignment' =>  24301 ],
            [ 'rank' => 'Knightly', 'alignment' => 72901 ],
            [ 'rank' => 'Princely', 'alignment' => 218701 ],
            [ 'rank' => 'Saintly', 'alignment' => 656101 ],
            [ 'rank' => 'Rude', 'alignment' => -1 ],
            [ 'rank' => 'Crass', 'alignment' => -101 ],
            [ 'rank' => 'Harsh', 'alignment' => -301 ],
            [ 'rank' => 'Mean', 'alignment' => -901 ],
            [ 'rank' => 'Dastardly', 'alignment' => -2701 ],
            [ 'rank' => 'Conniving', 'alignment' => -8101 ],
            [ 'rank' => 'Loathsome', 'alignment' => -24301 ],
            [ 'rank' => 'Brutal', 'alignment' => -72901 ],
            [ 'rank' => 'Evil', 'alignment' => -218701 ],
            [ 'rank' => 'Demonic', 'alignment' => -656101 ],
        ]);
    }
}
