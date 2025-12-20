<?php

namespace App\Enums;

enum Role: int {
    case ADMIN = 0;
    case VIEWER = 1;
    case EDITOR = 2;

    public static function toArray(): array {
        return [
            self::ADMIN->value => 'Admin',
            self::VIEWER->value => 'Viewer',
            self::EDITOR->value => 'Editor',
        ];
    }
}

