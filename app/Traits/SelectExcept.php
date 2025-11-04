<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait SelectExcept {
    public function scopeSelectExcept(Builder $query, array $columns) {
        return $query->select(array_diff($this->fillable, $columns));
    }
}
