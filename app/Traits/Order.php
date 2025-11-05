<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Exception;

class Order {
    
    const MIN_POSITION = 1;

    // If this value is set to false, a request with a position that is too large will simply be corrected to the largest allowed position
    const THROW_POSITION_TOO_LARGE_EXCEPTION = false;

    /**
     * Swaps the order of two models.
     * @param string $table valid database table name
     * @param int|string $id1 ID of the first element
     * @param int|string $id2 ID of the second element
     * @param string $orderColumnName Name of the numeric column storing the order
     * @throws Exception 
     */
    public static function swap(string $table, $id1, $id2, string $orderColumnName = 'position') {
        $a = DB::table($table)->whereId($id1)->first();
        $b = DB::table($table)->whereId($id2)->first();
        if (!$a || !$b) throw new Exception("Element to swap not found", 400);
        $oldPositionA = $a->$orderColumnName;
        $oldPositionB = $b->$orderColumnName;
        $b->update([$orderColumnName => 0]);
        $a->update([$orderColumnName => $oldPositionB]);
        $b->update([$orderColumnName => $oldPositionA]);
    }
    /**
     * Changes the position of a model. The element will be moved to the end if $newPosition == -1.
     * @param string $table valid database table name
     * @param int|string $id1 ID of the first element
     * @param int $newPosition New position of the element.
     * @param string $orderColumnName Name of the numeric column storing the order
     * @param array $where A single where condition
     * @throws Exception 
     */
    public static function moveTo(string $table, $id, int $newPosition, $where = null, string $orderColumnName = 'position') {
        $target = DB::table($table)->whereId($id)->first();
        if (!$target) throw new Exception("Element to move not found", 404);
        if (!is_numeric($newPosition)) throw new Exception("Position parameter is not a number", 400);

        $query = DB::table($table);
        if ($where) $query = $query->where(...$where);
        $maxPosition = $query->max($orderColumnName);
        
        if ($newPosition > $maxPosition) {
            if (self::THROW_POSITION_TOO_LARGE_EXCEPTION) throw new Exception("Position too large", 400);
            $newPosition = $maxPosition;
        }
        if ($newPosition === -1) $newPosition = $maxPosition;
        $currentPosition = $target->$orderColumnName ?? $maxPosition + 1;
        if ($newPosition < self::MIN_POSITION) throw new Exception("Position too small", 400);
        if ($newPosition === $currentPosition) return;

        if ($newPosition < $currentPosition) {
            $query->where([
                [$orderColumnName, '<', $currentPosition],
                [$orderColumnName, '>=', $newPosition]
            ])->increment($orderColumnName);
        } else {
            $query->where([
                [$orderColumnName, '>', $currentPosition],
                [$orderColumnName, '<=', $newPosition]
            ])->decrement($orderColumnName);
        }
        DB::table($table)->whereId($id)->update([$orderColumnName => $newPosition]);
    }

    public static function moveUp(string $table, $id,array $where = null,$orderColumnName = 'position') {
        $target = DB::table($table)->whereId($id)->first();
        if (!$target) throw new Exception("Element to move not found", 400);
        self::moveTo($table, $id, $target->$orderColumnName - 1, $where,$orderColumnName);
    }
    public static function moveDown(string $table, $id, array $where = null, $orderColumnName = 'position') {
        $target = DB::table($table)->whereId($id)->first();
        if (!$target) throw new Exception("Element to move not found", 400);
        self::moveTo($table, $id, $target->$orderColumnName + 1,  $where,$orderColumnName);
    }

    public static function remove(string $table, $id, array $where=null, $orderColumnName = 'position') {
        $target = DB::table($table)->whereId($id)->first();
        if (!$target) throw new Exception("Element to move not found", 400);
        self::moveTo($table, $id, -1, $where, $orderColumnName);
    }
    /**
     * Assigns a unique position to each element.
     * @param string $table valid database table name
     * @param string $orderColumnName Name of the numeric column storing the order
     * @param string $sort asc|desc The desired sort direction before reassignment.
     * @param int $start The order assigned to the first element.
     * @throws Exception 
     */
    public static function normalize(string $table, array|null $where = null, string $sort = 'asc', int $start = 1,string $orderColumnName='position') {
        if (!is_numeric($start)) throw new Exception("Start index is not a number", 400);
        if ($sort !== 'asc') $sort = 'desc';
        $index = $start;
        DB::beginTransaction();
        $elements = DB::table($table)->orderBy($orderColumnName, $sort)->orderBy('created_at', 'desc');
        if ($where) $elements = $elements->where(...$where);
        $elements = $elements->get();
        foreach ($elements as &$element) {
            DB::table($table)
                ->where('id', '=', $element->id)
                ->update([$orderColumnName => $index]);
            $index++;
        }
        unset($element);
        DB::commit();
    }
}
