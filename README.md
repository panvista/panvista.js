![Panvista Mobile](http://panvistamobile.com/static/git/panvista.png)

panvista.js
===========

## Overview
The panvista.js api allows developers to interact with the Panvista platform that hooks into native calls on the device.

## Installation

```html
<script src="https://raw.githubusercontent.com/panvista/panvista.js/master/panvista.js"></script>
```

## Documentation

You can view our API documentation [here](https://panvista.atlassian.net/wiki/display/PM/Javascript+API).


## Usage

### List Top-Level Sections

```js
Panvista.Sections.list(function(sections) {
    Panvista.Util.each(sections, function(section) {
        document.write('<p><a href="' + section.url + '">' + section.label + '</a></p>');
    });
});
```

### List All Sections

```js
var html = '';
parseSection = function(section) {
    html += '<li><a href="' + section.url + '">' + section.label;

    if (section.children.length > 0) {
        html += '<ul>';
        Panvista.Util.each(section.children, parseSection);
        html += '</ul>';
    }

    html += '</li>';
}

Panvista.Sections.list(function(sections) {
    Panvista.Util.each(sections, parseSection);
    document.write('<ul>' + html + '</ul>');
});
```