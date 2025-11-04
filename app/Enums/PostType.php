<?php

namespace App\Enums;

enum PostType: int {
    case DOC = 0;
    case BLOG = 1;

    public static function toArray(): array {
        return [
            self::DOC => 'Documentation',
            self::BLOG => 'Blog',
        ];
    }
}

