# Bug Life

Project available at [9-volt.github.io/bug-life](http://9-volt.github.io/bug-life/).

## For Developers

### GitHub authorization

GitHub authorization is based on [MrSwitch/hello.js](https://github.com/MrSwitch/hello.js). This project requires token only when API rate limit is exceeded. Required tokens give access only to public repositories.

For visualizing private repositories manual generation of token is required.

### Structure

Application relies on 2 main parts:
* parser.js - module that does the communication with server and parses issues and events
* visuals.js - module that visualizes parsed data

### Screenshoots

![textract vizualization](http://9-volt.github.io/bug-life/screenshots/screenshot-1.png)
![backbone vizualization](http://9-volt.github.io/bug-life/screenshots/screenshot-2.png)
