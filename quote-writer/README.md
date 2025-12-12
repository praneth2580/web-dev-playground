
# STEPS TO ADD NODE PACKAGES TO BROWSER

  

1. INSTALL BROWSERIFY GLOBALLY

  

```npm install -g browserify```

  

2. THEN INSTALL SENTIMENT INSIDE BUFFER

  

```npm install sentiment install buffer```

  

3. CREATE A ```main.js``` file with this contents

  

```var sentiment = require('sentiment');```

```global.window.sentiment = sentiment;```

  

4. NOW RUN THE COMMAND TO BUNDLE THIS FILE

  

```browserify main.js -o bundle.js```