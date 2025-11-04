<?php

namespace App\Enums;

enum PostStatus: int {
    case DRAFT = 0;
    case PUBLIC = 1;
    case PRIVATE = 2;

    public static function toArray(): array {
        return [
            self::DRAFT => 'Draft',
            self::PUBLIC => 'Public',
            self::PRIVATE => 'Private',
        ];
    }
}
