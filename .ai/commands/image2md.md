---
description: "Extract the text of an image"
---

Get the image path as a parameter and write down what can be read

If not image is passed, just use the latest image in ~/Downloads using `ls -t ~/Downloads/ | grep -E '\.(png|jpg|jpeg|gif|bmp|tiff|webp)$' | head -1`


## Output format

Return the whole text you found as a copyable markdown text
remove leading spaces at beginning of lines
