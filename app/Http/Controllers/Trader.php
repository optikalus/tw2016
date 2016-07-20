<?php

namespace Tradewars\Http\Controllers;

use Auth;
use Illuminate\Http\Request;
use Tradewars\Http\Requests;
use Tradewars\Http\Controllers\Controller;

class Trader extends Controller
{

    public function __construct(Request $request)
    {
        $this->middleware('auth');
        $this->user_id = Auth::user()->id;
        $this->universe_id = $request->session()->get('universe');
    } 

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {

        $sector_id = $request->input('sector_id');
        $ship_id = $request->input('ship_id');
        $task = $request->input('task');

        $this->validate($request, [
            'ship_id' => 'required|integer|exists:ships,id',
            'task' => 'required'
        ]);

        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        if (!$trader = $universe->traders()->where('user_id', $this->user_id)->first())
            return response()->json(['error' => 'Trader Not Found'], 404);

        if (!$ship = $trader->ship()->where('id', $ship_id)->first())
            return response()->json(['error' => 'Ship Not Found'], 404);

        if (!$sector = $universe->sectors()->where('id', $sector_id)->first())
            return response()->json(['error' => 'Sector Not Found'], 404);

        if ($task == 'bankDeposit' || $task == 'bankWithdraw')
        {

            $amount = $request->input('amount');
            $this->validate($request, [
                'amount' => 'required|integer'
            ]);

            switch ($task)
            {
                case 'bankDeposit':

                    if ($amount > $trader->credits)
                        return response()->json(['error' => 'You do not have that many credits!'], 422);

                    if ($amount + $trader->balance > 500000)
                        return response()->json(['error' => 'Sorry, you may not have more than <span class="ansi-bright-yellow-fg">500,000</span> credits in your account.'], 422);

                    $trader->credits -= $amount;
                    $trader->balance += $amount;

                    break;

                case 'bankWithdraw':
                    if ($amount > $trader->balance)
                        return response()->json(['error' => 'You do not have that many credits in your account!'], 422);

                    $trader->credits += $amount;
                    $trader->balance -= $amount;

                    break;
            }

            $trader->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'bankTransfer')
        {

            $amount = $request->input('amount');
            $trader_id = $request->input('trader');
            $this->validate($request, [
                'amount' => 'required|integer',
                'trader' => 'required|integer|exists:traders,id'
            ]);

            if (!$recipient = $universe->traders()->where('id', $trader_id)->first())
                return response()->json(['error' => 'Trader Not Found'], 404);

            if ($amount > $trader->balance)
                return response()->json(['error' => 'You do not have that many credits in your account!'], 422);

            if ($amount + $recipient->balance > 500000)
                return response()->json(['error' => 'Sorry, no one may have more than <span class="ansi-bright-yellow-fg">500,000</span> credits on deposit.'], 422);

            $recipient->balance += $amount;
            $trader->balance -= $amount;

            $recipient->save();
            $trader->save();

            return response()->json(['status' => 'ok'], 200);

        }
        else if ($task == 'commission')
        {

            if ($trader->alignment >= 500 && $trader->alignment < 1000)
            {
                $trader->alignment = 1000;
                $trader->save();
            }

            return response()->json(['status' => 'ok'], 200);

        }

    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id, Request $request)
    {
        if (!$universe = \Tradewars\Universe::find($this->universe_id))
            return response()->json(['error' => 'Invalid Universe ID'], 422);

        if ($id == 'search')
        {
            $q = $request->input('q');
            return $universe->traders()->where('name', 'like', '%'.$q.'%')->get(['id', 'name', 'balance', 'bounty']);
        }

    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
