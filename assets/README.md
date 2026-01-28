# Quick reminders to self
If ever hosting any images to the site, logo, or github etc

## Optimize image

Serve all images using the https://wsrv.nl cdn

### Example

```bash
<p align="center">
<img src="https://wsrv.nl/?url=raw.githubusercontent.com/Sethispr/image-compressor/main/assets/IMG_7503.jpeg" alt="img-compress web preview" height="500">
</p>
```

## Upscale images using [waifu2x](https://www.waifu2x.net)

Artwork/Scans, x1.6, Highest, PNG

> [!NOTE]
> Also use the webp format if not using jpeg images. Wsrv.nl cdn link can be manually changed to set quality to 80% and convert to webp using their libvips integration
