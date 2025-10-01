# Optimization Module

This module provides various optimization tools and scripts to improve the performance and efficiency of the application.

## Features

### Image Optimization

Automated image optimization for the public directory:

- Optimizes JPEG and PNG images using ImageMagick
- Tracks optimization history to avoid re-processing unchanged images
- Only replaces images when size reduction is achieved
- Provides colored, user-friendly CLI output
- Automatic cleanup of temporary files

## Prerequisites

### Image Optimization
**ImageMagick** is required:
- macOS: `brew install imagemagick`
- Linux: `apt-get install imagemagick`

## Usage

### Image Optimization

```bash
pnpm cli optimize images
```

This command will:
1. Find all JPEG and PNG images in the `public/` directory
2. Only process images modified since last optimization
3. Create optimized versions and replace originals if smaller
4. Update timestamp file `src/modules/optimization/commands/image-optimize-last-date.txt`

#### How it works

The script:
- Uses `mogrify` from ImageMagick to optimize images
- JPEG: quality 92, strip metadata, progressive encoding
- PNG: compression level 9, strip metadata
- Creates temporary files to compare sizes before replacing
- Updates file modification times to track processed images
- Stores last optimization timestamp in `src/modules/optimization/commands/image-optimize-last-date.txt`

#### Output

The script provides:
- Color-coded progress messages
- File-by-file savings report
- Total space saved summary
- Timestamp tracking

## Structure

```
optimization/
├── CLAUDE.md
├── commands.ts                        # CLI commands (pnpm cli optimize)
└── commands/
    ├── image-optimize.sh              # Image optimization script
    └── image-optimize-last-date.txt   # Timestamp tracking file
```

## Future Enhancements

This module may be extended with additional optimization features:
- Bundle size optimization
- Database query optimization
- Asset compression and minification
- Performance monitoring and profiling