<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Error;

trait Orderable {

    private static function tableName() {
        return with(new static)->getTable();
    }

    private static function orderColumn() {
        return with(new static)->orderColumnName ?? 'position';
    }


    /**
     * Override this method if you wish to use a custom where query for the order.
     * For Example: If you have a one-to-many relationship mapping tracks to albums, you would override this method like so:
     * return ['album_id', '=', $this->album_id];
     * 
     * Notice that the $where parameter is spread into the eloquent ->where() function.
     * 
     * This means that if you want to provide multiple where conditions, you have to wrap them in another array like so:
     * return [[['album_id', '=', $this->album_id],['genre_id', '=', $this->genre_id]]];
     * @return array|null An eloquent where clause. Is spread before being passed to query!
     */
    abstract protected function orderWhere(): array|null;
    protected function assignOrderOnCreation(): bool {
        return true;
    }
    /**
     * Override this method if you wish to implement a custom permission check.
     * @return bool 
     */
    abstract protected function orderingIsAllowed(): bool;

    protected static function unauthorizedException() {
        return abort('Unauthorised', 403);
    }

    // https://stackoverflow.com/a/59978392
    protected static function bootOrderable() {

        static::creating(function ($model) {
            if (!$model->assignOrderOnCreation()) return;
            $where = $model->orderWhere();
            $maxPosQuery = with(new static);
            if ($where) $maxPosQuery = $maxPosQuery->where(...$where);
            $maxPos = $maxPosQuery->max(self::orderColumn()) ?? (Order::MIN_POSITION - 1);
            $model->{self::orderColumn()} = $maxPos + 1;
        });

        static::deleting(function (\Illuminate\Database\Eloquent\Model $model) {
            Order::remove(self::tableName(), $model->id, $model->orderWhere(), self::orderColumn());
        });
    }

    public function moveTo(int $position) {
        if (!$this->orderingIsAllowed()) throw self::unauthorizedException();
        Order::moveTo($this->tableName(), $this->id, $position, $this->orderWhere(), self::orderColumn());
    }
    public function moveUp() {
        if (!$this->orderingIsAllowed()) throw self::unauthorizedException();
        Order::moveUp($this->tableName(), $this->id, $this->orderWhere(), self::orderColumn());
    }
    public function moveDown() {
        if (!$this->orderingIsAllowed()) throw self::unauthorizedException();
        Order::moveDown($this->tableName(), $this->id, $this->orderWhere(), self::orderColumn());
    }
}
