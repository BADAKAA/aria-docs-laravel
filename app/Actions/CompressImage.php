<?php

namespace App\Actions;

use Exception;
class ImageCompressionException extends Exception { }

class CompressImage {

    const MAX_WIDTH = 1600;
    const MAX_HEIGHT = 1600;
    const DIRECTORY_SEPARATOR = '\\';

    private static function getResizedDimesions($path) {
        $imgsize = getimagesize($path);
        $width = $imgsize[0];
        $height = $imgsize[1];
        $maxWidth = max(1, self::MAX_WIDTH);  // prevent division by 0
        $maxHeight = max(1, self::MAX_HEIGHT);

        $heightAdjustment = min(1, $maxHeight / $height);
        $widthAdjustment = min(1, $maxWidth / $width);
        $adjustment = min($widthAdjustment, $heightAdjustment);

        return [$width * $adjustment, $height * $adjustment];
    }

    static public function replace_extension($filename, $new_extension) {
        $info = pathinfo($filename);
        return ($info['dirname'] ? $info['dirname'] . self::DIRECTORY_SEPARATOR : '')
            . $info['filename']
            . '.'
            . $new_extension;
    }

    
    /**
     * compresses and resizes an image to the given quality and target format. The original file is deleted unless a 'target_path' is specified.
     * 
     * https://polyetilen.lt/en/resize-and-crop-image-from-center-with-php
     * @throws Exception
     */
    static public function at(string $file_path, ?array $dimensions = null, int $quality = 80, string $target_format = 'webp', ?string $target_path = null) {
        $imgsize = getimagesize($file_path);
        $width = $imgsize[0];
        $height = $imgsize[1];
        $mime = $imgsize['mime'];

        $src_img = match ($mime) {
            'image/png' => @imagecreatefrompng($file_path),
            'image/gif' => @imagecreatefromgif($file_path),
            'image/avif' => @imagecreatefromavif($file_path),
            'image/webp' => @imagecreatefromwebp($file_path),
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($file_path),
            default => throw new ImageCompressionException('Filetype unsupported', 417)
        };

        [$w, $h] = $dimensions ?? self::getResizedDimesions($file_path);
        $dst_img = imagecreatetruecolor($w, $h);
        $width_new = $height * $w / $h;
        $height_new = $width * $h / $w;
        if ($width_new > $width) {
            $h_point = (($height - $height_new) / 2);
            imagecopyresampled($dst_img, $src_img, 0, 0, 0, $h_point, $w, $h, $width, $height_new);
        } else {
            $w_point = (($width - $width_new) / 2);
            imagecopyresampled($dst_img, $src_img, 0, 0, $w_point, 0, $w, $h, $width_new, $height);
        }

        $output = self::replace_extension($target_path ?? $file_path, $target_format);

        match ($target_format) {
            'webp' =>  imagewebp($dst_img, $output, $quality),
            'png' =>  imagepng($dst_img, $output, $quality),
            default => imagejpeg($dst_img, $output, $quality)
        };

        if ($dst_img) imagedestroy($dst_img);
        if ($src_img) imagedestroy($src_img);

        if (!$target_path && $file_path !== $output) unlink($file_path);

        return $output;
    }
}
