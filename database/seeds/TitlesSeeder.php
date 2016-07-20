<?php

use Illuminate\Database\Seeder;

class TitlesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('titles')->insert([
            [ 'title' => 'Civilian', 'alignment' => 'positive', 'experience' => 0 ],
            [ 'title' => 'Private', 'alignment' => 'positive', 'experience' => 2 ],
            [ 'title' => 'Private 1st Class', 'alignment' => 'positive', 'experience' => 4 ],
            [ 'title' => 'Lance Corporal', 'alignment' => 'positive', 'experience' => 8 ],
            [ 'title' => 'Corporal', 'alignment' => 'positive', 'experience' => 16 ],
            [ 'title' => 'Sergeant', 'alignment' => 'positive', 'experience' => 32 ],
            [ 'title' => 'Staff Sergeant', 'alignment' => 'positive', 'experience' => 64 ],
            [ 'title' => 'Gunnery Sergeant', 'alignment' => 'positive', 'experience' => 128 ],
            [ 'title' => '1st Sergeant', 'alignment' => 'positive', 'experience' => 256 ],
            [ 'title' => 'Sergeant Major', 'alignment' => 'positive', 'experience' => 512 ],
            [ 'title' => 'Warrant Officer', 'alignment' => 'positive', 'experience' => 1024 ],
            [ 'title' => 'Chief Warrant Officer', 'alignment' => 'positive', 'experience' => 2048 ],
            [ 'title' => 'Ensign', 'alignment' => 'positive', 'experience' => 4096 ],
            [ 'title' => 'Lieutenant J.G.', 'alignment' => 'positive', 'experience' => 8192 ],
            [ 'title' => 'Lieutenant', 'alignment' => 'positive', 'experience' => 16384 ],
            [ 'title' => 'Lieutenant Commander', 'alignment' => 'positive', 'experience' => 32768 ],
            [ 'title' => 'Commander', 'alignment' => 'positive', 'experience' => 65536 ],
            [ 'title' => 'Captain', 'alignment' => 'positive', 'experience' => 131072 ],
            [ 'title' => 'Commodore', 'alignment' => 'positive', 'experience' => 262144 ],
            [ 'title' => 'Rear Admiral', 'alignment' => 'positive', 'experience' => 524288 ],
            [ 'title' => 'Vice Admiral', 'alignment' => 'positive', 'experience' => 1048576 ],
            [ 'title' => 'Admiral', 'alignment' => 'positive', 'experience' => 2097152 ],
            [ 'title' => 'Fleet Admiral', 'alignment' => 'positive', 'experience' => 4194304 ],
            [ 'title' => 'Annoyance', 'alignment' => 'negative', 'experience' => 0 ],
            [ 'title' => 'Nuisance 3rd Class', 'alignment' => 'negative', 'experience' => 2 ],
            [ 'title' => 'Nuisance 2nd Class', 'alignment' => 'negative', 'experience' => 4 ],
            [ 'title' => 'Nuisance 1st Class', 'alignment' => 'negative', 'experience' => 8 ],
            [ 'title' => 'Menance 3rd Class', 'alignment' => 'negative', 'experience' => 16 ],
            [ 'title' => 'Menance 2nd Class', 'alignment' => 'negative', 'experience' => 32 ],
            [ 'title' => 'Menance 1st Class', 'alignment' => 'negative', 'experience' => 64 ],
            [ 'title' => 'Smuggler 3rd Class', 'alignment' => 'negative', 'experience' => 128 ],
            [ 'title' => 'Smuggler 2nd Class', 'alignment' => 'negative', 'experience' => 256 ],
            [ 'title' => 'Smuggler 1st Class', 'alignment' => 'negative', 'experience' => 512 ],
            [ 'title' => 'Smuggler Savant', 'alignment' => 'negative', 'experience' => 1024 ],
            [ 'title' => 'Robber', 'alignment' => 'negative', 'experience' => 2048 ],
            [ 'title' => 'Terrorist', 'alignment' => 'negative', 'experience' => 4096 ],
            [ 'title' => 'Pirate', 'alignment' => 'negative', 'experience' => 8192 ],
            [ 'title' => 'Infamous Pirate', 'alignment' => 'negative', 'experience' => 16384 ],
            [ 'title' => 'Notorious Pirate', 'alignment' => 'negative', 'experience' => 32768 ],
            [ 'title' => 'Dread Pirate', 'alignment' => 'negative', 'experience' => 65536 ],
            [ 'title' => 'Galactic Scourge', 'alignment' => 'negative', 'experience' => 131072 ],
            [ 'title' => 'Enemy of the State', 'alignment' => 'negative', 'experience' => 262144 ],
            [ 'title' => 'Enemy of the People', 'alignment' => 'negative', 'experience' => 524288 ],
            [ 'title' => 'Enemy of Humankind', 'alignment' => 'negative', 'experience' => 1048576 ],
            [ 'title' => 'Heinous Overlord', 'alignment' => 'negative', 'experience' => 2097152 ],
            [ 'title' => 'Prime Evil', 'alignment' => 'negative', 'experience' => 4194304 ]
        ]);
    }
}
