<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class Media extends Model
{
    use HasUlids;

    protected $table = 'media';

    protected $fillable = [
        'id',
        'user_id',
        'original_name',
        'ext',
        'mime',
        'size',
        'path',
    ];

    protected $keyType = 'string';

    public $incrementing = false;
}
